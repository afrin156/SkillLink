// app/api/messages/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function toObjectId(id: string) {
  try { return new ObjectId(id) } catch { return null }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get("conversationId")
  const db = await getDb()
  const userId = user?.id

  // ── Fetch messages for a specific conversation ──
  if (conversationId) {
    const messages = await db.collection("messages")
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .toArray()
    return NextResponse.json({ messages })
  }

  // ── Fetch all conversations ──
  const convRecords = await db.collection("conversations")
    .find({ "participants.userId": userId })
    .sort({ lastMessageAt: -1 })
    .toArray()

  const conversations = await Promise.all(convRecords.map(async (conv) => {
    const other = conv.participants?.find((p: any) => p.userId !== userId)
    if (!other) return null

    // ✅ FIX: Try ObjectId first, then string match
    let otherUser = null
    const oid = toObjectId(other.userId)
    if (oid) {
      otherUser = await db.collection("users").findOne({ _id: oid })
    }
    // Fallback: try string match (email or direct _id string)
    if (!otherUser) {
      otherUser = await db.collection("users").findOne({ email: other.email })
    }

    const unreadCount = await db.collection("messages").countDocuments({
      conversationId: conv.conversationId,
      fromUserId: { $ne: userId },
      read: { $ne: true },
    })

    return {
      id: conv.conversationId,
      userId: other.userId,
      // ✅ FIX: Always use fresh data from users collection
      userName: otherUser?.name || other.name || "Unknown",
      userEmail: otherUser?.email || other.email || "",
      isVerifiedHR: otherUser?.isVerifiedHR || false,
      // ✅ FIX: Get real role from users collection
      role: otherUser?.role || other.role || "student",
      lastMessage: conv.lastMessage || "",
      lastMessageAt: conv.lastMessageAt,
      unreadCount,
    }
  }))

  return NextResponse.json({
    conversations: conversations.filter(Boolean),
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { toUserId, text } = await req.json()
  if (!toUserId || !text?.trim()) {
    return NextResponse.json({ error: "toUserId and text required" }, { status: 400 })
  }

  const db = await getDb()
  const fromUserId = user?.id
  const conversationId = [fromUserId, toUserId].sort().join("_")

  // ✅ FIX: Fetch other user properly with ObjectId
  let toUser = null
  const oid = toObjectId(toUserId)
  if (oid) {
    toUser = await db.collection("users").findOne({ _id: oid })
  }

  const existing = await db.collection("conversations").findOne({ conversationId })
  if (!existing) {
    await db.collection("conversations").insertOne({
      conversationId,
      participants: [
        {
          userId: fromUserId,
          name: user?.name,
          email: user?.email,
          role: user?.role,
        },
        {
          userId: toUserId,
          // ✅ FIX: Use real name/role from DB
          name: toUser?.name || "Unknown",
          email: toUser?.email || "",
          role: toUser?.role || "student",
        },
      ],
      lastMessage: text.trim(),
      lastMessageAt: new Date(),
      createdAt: new Date(),
    })
  } else {
    // ✅ FIX: Update participant info in case it was saved wrong before
    await db.collection("conversations").updateOne(
      { conversationId, "participants.userId": toUserId },
      {
        $set: {
          "participants.$.name": toUser?.name || existing.participants?.find((p: any) => p.userId === toUserId)?.name || "Unknown",
          "participants.$.role": toUser?.role || "student",
          lastMessage: text.trim(),
          lastMessageAt: new Date(),
        }
      }
    )
  }

  await db.collection("messages").insertOne({
    conversationId,
    fromUserId,
    toUserId,
    text: text.trim(),
    read: false,
    createdAt: new Date(),
  })

  return NextResponse.json({ success: true })
}