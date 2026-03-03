import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const user = session.user as any
    const db = await getDb()

    // Only allow deleting your own post
    const result = await db.collection("feedPosts").deleteOne({
      _id: new ObjectId(id),
      authorId: user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Post not found or not yours" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Delete post error:", e)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
