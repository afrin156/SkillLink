// app/api/hr/jobs/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function getUserId(session: any): string {
  return session?.user?.id || session?.user?.email || ""
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = getUserId(session)
    const db = await getDb()

    const jobs = await db.collection("jobs")
      .find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .toArray()

    const jobsWithCount = await Promise.all(jobs.map(async (job: any) => {
      const count = await db.collection("applications").countDocuments({ jobId: job._id.toString() })
      return { ...job, applicantCount: count }
    }))

    return NextResponse.json({ jobs: jobsWithCount })
  } catch (e) {
    console.error("Get jobs error:", e)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = getUserId(session)
    const body = await req.json()
    const { title, company, location, description } = body

    if (!title || !company || !location || !description) {
      return NextResponse.json({ error: "Title, company, location and description are required" }, { status: 400 })
    }

    const db = await getDb()
    const job = {
      ...body,
      postedBy: userId,
      postedByName: session.user.name,
      postedByEmail: session.user.email,
      isActive: true,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("jobs").insertOne(job)
    return NextResponse.json({ success: true, jobId: result.insertedId })
  } catch (e) {
    console.error("Post job error:", e)
    return NextResponse.json({ error: "Failed to post job" }, { status: 500 })
  }
}