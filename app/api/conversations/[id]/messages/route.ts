import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = session.user as any
    const db = await getDb()

    const conv = await db.collection("conversations").findOne({ _id: new ObjectId(params.id) })
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!conv.participants.includes(me.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const messages = await db.collection("messages")
      .find({ conversationId: params.id })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = session.user as any
    const { text } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: "text required" }, { status: 400 })

    const db = await getDb()
    const conv = await db.collection("conversations").findOne({ _id: new ObjectId(params.id) })
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!conv.participants.includes(me.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await db.collection("messages").insertOne({
      conversationId: params.id,
      senderId: me.id,
      text: text.trim(),
      createdAt: new Date(),
      readBy: [me.id],
    })

    await db.collection("conversations").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { lastMessageAt: new Date(), lastMessageText: text.trim() } }
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
