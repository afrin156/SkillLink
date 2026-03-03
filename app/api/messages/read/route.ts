import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

// PATCH — mark messages as read
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { conversationId } = await req.json()
  const db = await getDb()

  // Mark all messages sent TO me in this conversation as read
  await db.collection("messages").updateMany(
    {
      conversationId,
      toUserId: user?.id,
      read: { $ne: true },
    },
    { $set: { read: true, readAt: new Date() } }
  )

  return NextResponse.json({ success: true })
}