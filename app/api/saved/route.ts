// app/api/saved/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const userId = user?.id

  // Get all saved job records
  const savedRecords = await db.collection("savedJobs")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray()

  if (!savedRecords.length) {
    return NextResponse.json({ savedJobs: [] })
  }

  // Get job IDs — handle both string and ObjectId formats
  const jobIds = savedRecords.map(s => {
    try {
      return new ObjectId(s.jobId)
    } catch {
      return s.jobId
    }
  })

  // Fetch actual job details for each saved job
  // Fetch actual job details for each saved job
const jobIdStrings = savedRecords.map(s => s.jobId?.toString()).filter(Boolean)
const jobObjectIds = jobIdStrings.map(id => {
  try { return new ObjectId(id) } catch { return null }
}).filter(Boolean)

const jobs = await db.collection("jobs")
  .find({ _id: { $in: jobObjectIds as any } })
  .toArray()

  // Merge saved record with job details
  const savedJobs = savedRecords.map(record => {
    const job = jobs.find(j =>
      j._id.toString() === record.jobId?.toString()
    )
    return {
      ...record,
      jobId: record.jobId,
      title: job?.title || "Job no longer available",
      company: job?.company || "",
      location: job?.location || "",
      salary: job?.salary || "",
      skills: job?.skills || [],
      isVerified: job?.isVerified || false,
      description: job?.description || "",
      externalUrl: job?.externalUrl || null,
      deadline: job?.deadline || null,
      jobExists: !!job,
    }
  })

  return NextResponse.json({ savedJobs })
}

// DELETE — remove a saved job
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId } = await req.json()
  const db = await getDb()

  await db.collection("savedJobs").deleteOne({
    userId: user?.id,
    jobId,
  })

  return NextResponse.json({ success: true })
}