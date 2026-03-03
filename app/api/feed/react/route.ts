import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { postId, reaction } = await req.json()
  const db = await getDb()
  const existing = await db.collection("feedReactions").findOne({ postId, userId: user.id })
  if (existing) {
    if (existing.reaction === reaction) {
      await db.collection("feedReactions").deleteOne({ postId, userId: user.id })
      await db.collection("feedPosts").updateOne({ _id: new ObjectId(postId) }, { $inc: { [`reactions.${reaction}`]: -1 } })
    } else {
      await db.collection("feedReactions").updateOne({ postId, userId: user.id }, { $set: { reaction } })
      await db.collection("feedPosts").updateOne({ _id: new ObjectId(postId) }, { $inc: { [`reactions.${existing.reaction}`]: -1, [`reactions.${reaction}`]: 1 } })
    }
  } else {
    await db.collection("feedReactions").insertOne({ postId, userId: user.id, reaction, createdAt: new Date() })
    await db.collection("feedPosts").updateOne({ _id: new ObjectId(postId) }, { $inc: { [`reactions.${reaction}`]: 1 } })
  }
  return NextResponse.json({ success: true })
}