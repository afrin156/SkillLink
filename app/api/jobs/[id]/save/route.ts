// app/api/jobs/[id]/save/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ await params
    const { id } = await params

    const userId = (session.user as any).id
    const jobId = id // store as string

    const db = await getDb()

    const existing = await db.collection("savedJobs").findOne({ userId, jobId })

    if (existing) {
      await db.collection("savedJobs").deleteOne({ userId, jobId })
      return NextResponse.json({ saved: false, message: "Job unsaved" })
    }

    await db.collection("savedJobs").insertOne({
      userId,
      jobId,
      createdAt: new Date(),
    })

    return NextResponse.json({ saved: true, message: "Job saved" })
  } catch (e) {
    console.error("SAVE JOB ERROR:", e)
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ saved: false })
    }

    // ✅ await params
    const { id } = await params

    const userId = (session.user as any).id
    const jobId = id

    const db = await getDb()
    const existing = await db.collection("savedJobs").findOne({ userId, jobId })

    return NextResponse.json({ saved: !!existing })
  } catch (e) {
    console.error("CHECK SAVE ERROR:", e)
    return NextResponse.json({ saved: false })
  }
}