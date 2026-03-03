import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const db = await getDb()
    const me = session.user as any
    const myId = me.id

    const other = await db.collection("users").findOne({ email })
    if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (other._id.toString() === myId) return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 })

    const otherId = other._id.toString()

    // OPTIONAL (recommended): allow chat only if connection is accepted
    const accepted = await db.collection("connections").findOne({
      status: "accepted",
      $or: [
        { fromUserId: myId, toUserId: otherId },
        { fromUserId: otherId, toUserId: myId },
      ],
    })
    if (!accepted) {
      return NextResponse.json({ error: "Connection not accepted yet" }, { status: 403 })
    }

    // Find existing conversation with same 2 participants
    const existing = await db.collection("conversations").findOne({
      participants: { $all: [myId, otherId] },
    })

    if (existing) {
      return NextResponse.json({ conversationId: existing._id.toString() })
    }

    const created = await db.collection("conversations").insertOne({
      participants: [myId, otherId],
      createdAt: new Date(),
      lastMessageAt: new Date(),
    })

    return NextResponse.json({ conversationId: created.insertedId.toString() })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDb()
    const me = session.user as any
    const myId = me.id

    const convs = await db
      .collection("conversations")
      .find({ participants: myId })
      .sort({ lastMessageAt: -1 })
      .toArray()

    const otherIds = convs
      .map((c: any) => c.participants.find((p: string) => p !== myId))
      .filter(Boolean)

    const users = await db
      .collection("users")
      .find({ _id: { $in: otherIds.map((id: string) => new ObjectId(id)) } })
      .toArray()

    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]))

    const result = convs.map((c: any) => {
      const otherId = c.participants.find((p: string) => p !== myId)
      const other = userMap.get(otherId)
      return {
        _id: c._id.toString(),
        otherUser: other
          ? { id: other._id.toString(), name: other.name, email: other.email, role: other.role }
          : { id: otherId, name: "Unknown", email: "", role: "" },
        lastMessageAt: c.lastMessageAt,
      }
    })

    return NextResponse.json({ conversations: result })
  } catch {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

