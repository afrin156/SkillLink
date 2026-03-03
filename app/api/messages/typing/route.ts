import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

// POST — broadcast typing status
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { conversationId, isTyping } = await req.json()
  const db = await getDb()

  await db.collection("typingStatus").updateOne(
    { conversationId, userId: user?.id },
    {
      $set: {
        conversationId,
        userId: user?.id,
        isTyping,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}

// GET — check if other person is typing
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get("conversationId")
  const otherUserId = searchParams.get("otherUserId")

  if (!conversationId || !otherUserId) {
    return NextResponse.json({ isTyping: false })
  }

  const db = await getDb()
  const status = await db.collection("typingStatus").findOne({
    conversationId,
    userId: otherUserId,
  })

  // Expire after 3 seconds
  const isTyping =
    status?.isTyping &&
    status.updatedAt &&
    Date.now() - new Date(status.updatedAt).getTime() < 3000

  return NextResponse.json({ isTyping: !!isTyping })
}