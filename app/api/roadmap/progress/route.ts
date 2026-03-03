import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

// GET — fetch all skill progress for user
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const progress = await db.collection("skillProgress")
    .find({ userId: user?.id })
    .toArray()

  return NextResponse.json({ progress })
}

// PATCH — update skill progress %
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { skillId, percent } = await req.json()
  if (percent < 0 || percent > 100) {
    return NextResponse.json({ error: "Percent must be 0-100" }, { status: 400 })
  }

  const db = await getDb()
  await db.collection("skillProgress").updateOne(
    { userId: user?.id, skillId },
    {
      $set: {
        userId: user?.id,
        skillId,
        percent,
        updatedAt: new Date(),
        ...(percent === 100 ? { completedAt: new Date() } : {}),
      },
    },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}