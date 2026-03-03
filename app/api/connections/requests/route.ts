// app/api/connections/requests/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET — fetch incoming and sent requests
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const user = await db.collection("users").findOne({ email: session.user?.email })
  const userId = user?._id.toString()

  const incoming = await db.collection("connectionRequests")
    .find({ toUserId: userId, status: "pending" })
    .sort({ createdAt: -1 })
    .toArray()

  const sent = await db.collection("connectionRequests")
    .find({ fromUserId: userId })
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json({ incoming, sent })
}

// POST — send a connection request
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { toUserEmail, note } = await req.json()
  const db = await getDb()

  const toUser = await db.collection("users").findOne({ email: toUserEmail })
  if (!toUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const fromUser = await db.collection("users").findOne({ email: session.user?.email })

  // Check if request already exists
  const existing = await db.collection("connectionRequests").findOne({
    fromUserId: fromUser?._id.toString(),
    toUserId: toUser._id.toString(),
  })
  if (existing) return NextResponse.json({ error: "Request already sent" }, { status: 400 })

  await db.collection("connectionRequests").insertOne({
    fromUserId: fromUser?._id.toString(),
    fromUserName: fromUser?.name,
    fromUserEmail: fromUser?.email,
    fromUserRole: fromUser?.role,
    toUserId: toUser._id.toString(),
    toUserName: toUser.name,
    toUserEmail: toUser.email,
    note: note || "",
    status: "pending",
    createdAt: new Date(),
  })

  return NextResponse.json({ success: true })
}

// PATCH — accept or decline a request
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { requestId, action, declineReason } = await req.json()

  if (!requestId || !action) {
    return NextResponse.json({ error: "requestId and action required" }, { status: 400 })
  }

  const db = await getDb()
  const user = await db.collection("users").findOne({ email: session.user?.email })
  const userId = user?._id.toString()

  // Find the request
  let oid: ObjectId | null = null
  try { oid = new ObjectId(requestId) } catch {}

  const request = oid
    ? await db.collection("connectionRequests").findOne({ _id: oid })
    : null

  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  // Only the recipient can accept/decline
  if (request.toUserId !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  if (action === "accept") {
    // Update request status
    await db.collection("connectionRequests").updateOne(
      { _id: oid as ObjectId },
      { $set: { status: "accepted", respondedAt: new Date() } }
    )

    // ✅ Create a mutual connection
    await db.collection("connections").insertOne({
      user1Id: request.fromUserId,
      user1Name: request.fromUserName,
      user1Email: request.fromUserEmail,
      user2Id: userId,
      user2Name: user?.name,
      user2Email: user?.email,
      connectedAt: new Date(),
    })

    // Notify sender
    await db.collection("notifications").insertOne({
      userId: request.fromUserId,
      type: "connection_accepted",
      message: `${user?.name} accepted your connection request`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Connection accepted!" })
  }

  if (action === "decline") {
    await db.collection("connectionRequests").updateOne(
      { _id: oid as ObjectId },
      {
        $set: {
          status: "declined",
          declineReason: declineReason || "",
          respondedAt: new Date(),
        }
      }
    )

    return NextResponse.json({ success: true, message: "Request declined" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}