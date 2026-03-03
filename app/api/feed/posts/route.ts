import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as any
    const userId = user.id
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") || "all"
    const db = await getDb()

    // Get connected user IDs — try both field name patterns
    const connections = await db.collection("connections").find({
      $or: [
        { userId1: userId, status: "accepted" },
        { userId2: userId, status: "accepted" },
        { fromUserId: userId, status: "accepted" },
        { toUserId: userId, status: "accepted" },
      ]
    }).toArray()

    const connectedIds: string[] = connections.map((c: any) => {
      if (c.userId1 && c.userId2) return c.userId1 === userId ? c.userId2 : c.userId1
      if (c.fromUserId && c.toUserId) return c.fromUserId === userId ? c.toUserId : c.fromUserId
      return null
    }).filter(Boolean) as string[]

    // Build query
    const query: any = {
      $or: [
        { authorId: userId },
        { authorId: { $in: connectedIds } },
        { visibility: "public" },
      ]
    }

    // Apply filter
    const typeMap: Record<string, string> = {
      wins: "win", skills: "skill",
      jobs: "job", polls: "poll", culture: "culture"
    }
    if (filter !== "all" && typeMap[filter]) {
      query.type = typeMap[filter]
    }

    const posts = await db.collection("feedPosts")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray()

    const result = await Promise.all(posts.map(async (post: any) => {
      const reaction = await db.collection("feedReactions").findOne({
        postId: post._id.toString(),
        userId,
      })
      return { ...post, userReaction: reaction?.reaction || null }
    }))

    return NextResponse.json({ posts: result })
  } catch (e) {
    console.error("Feed GET error:", e)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as any
    const body = await req.json()

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 })
    }

    const db = await getDb()

    let userDoc: any = null
    try {
      userDoc = await db.collection("users").findOne({ _id: new ObjectId(user.id) })
    } catch {}

    await db.collection("feedPosts").insertOne({
      authorId: user.id,
      authorName: user.name || "Unknown",
      authorRole: user.role || "student",
      authorCompany: userDoc?.company || null,
      isVerifiedHR: userDoc?.isVerifiedHR || false,
      type: body.type || "regular",
      content: body.content.trim(),
      winType: body.winType || null,
      skillBadge: body.skillBadge || null,
      pollOptions: body.pollOptions || null,
      jobTitle: body.jobTitle || null,
      jobLocation: body.jobLocation || null,
      visibility: body.visibility || "connections",
      reactions: { like: 0, helpful: 0, relatable: 0, inspiring: 0 },
      mediaUrl: body.mediaUrl || null,
      mediaType: body.mediaType || null,
      commentCount: 0,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Feed POST error:", e)
    return NextResponse.json({ error: "Failed to post" }, { status: 500 })
  }
}