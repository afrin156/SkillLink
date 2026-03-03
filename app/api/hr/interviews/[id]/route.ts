// app/api/hr/interviews/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { status } = await req.json()

    const db = await getDb()
    await db.collection("interviews").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Interview update error:", e)
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 })
  }
}