import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  const { postId, optionIndex } = await req.json()
  const db = await getDb()
  const already = await db.collection("feedVotes").findOne({ postId, userId: user.id })
  if (already) return NextResponse.json({ error: "Already voted" }, { status: 400 })
  await db.collection("feedVotes").insertOne({ postId, userId: user.id, optionIndex, createdAt: new Date() })
  await db.collection("feedPosts").updateOne({ _id: new ObjectId(postId) }, { $inc: { [`pollOptions.${optionIndex}.votes`]: 1 } })
  return NextResponse.json({ success: true })
}