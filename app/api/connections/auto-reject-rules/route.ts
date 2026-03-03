import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

// GET — fetch HR's current rules
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = await getDb()
  const rules = await db.collection("hrAutoRejectRules").findOne({ userId: user?.id })
  return NextResponse.json({ rules: rules || null })
}

// POST — HR saves their auto-reject rules
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { minExperience, requiredLocation } = await req.json()
  const db = await getDb()

  await db.collection("hrAutoRejectRules").updateOne(
    { userId: user?.id },
    {
      $set: {
        userId: user?.id,
        minExperience: minExperience || null,
        requiredLocation: requiredLocation || null,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}