import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ connected: false }, { status: 200 })

    const { otherUserId } = await req.json()
    const userId = (session.user as any).id
    if (!otherUserId) return NextResponse.json({ connected: false }, { status: 200 })

    const db = await getDb()

    const existing = await db.collection("connections").findOne({
      status: "accepted",
      $or: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    })

    return NextResponse.json({ connected: !!existing })
  } catch {
    return NextResponse.json({ connected: false }, { status: 200 })
  }
}
