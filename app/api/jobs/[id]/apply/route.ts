// app/api/jobs/[id]/apply/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function toObjectId(id: string) {
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

// GET — check if already applied
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ✅ await params first
  const { id } = await params

  const db = await getDb()
  const existing = await db.collection("applications").findOne({
    jobId: id,
    studentId: user?.id,
  })

  return NextResponse.json({ applied: !!existing, application: existing })
}

// POST — apply with resume
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ✅ await params first
  const { id: jobId } = await params

  const db = await getDb()

  // Check already applied
  const existing = await db.collection("applications").findOne({
    jobId,
    studentId: user?.id,
  })
  if (existing) {
    return NextResponse.json({ error: "Already applied to this job" }, { status: 400 })
  }

  // Try ObjectId first, fallback to string
  const oid = toObjectId(jobId)
  let finalJob = null

  if (oid) {
    finalJob = await db.collection("jobs").findOne({ _id: oid as any })
  }

  if (!finalJob) {
    finalJob = await db.collection("jobs").findOne({ _id: jobId as any })
  }

  if (!finalJob) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  // Get student profile
  const student = await db.collection("users").findOne({ email: user?.email })
  if (!student) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const { coverLetter, resumeData } = await req.json()

  // Save application
  await db.collection("applications").insertOne({
    jobId,
    jobTitle: finalJob.title,
    company: finalJob.company,
    externalUrl: finalJob.externalUrl || null,
    hrEmail: finalJob.hrEmail || finalJob.postedByEmail || null,
    studentId: user?.id,
    studentName: user?.name,
    studentEmail: user?.email,
    coverLetter: coverLetter || "",
    resume: resumeData || student.resume || null,
    status: "applied",
    appliedAt: new Date(),
    updatedAt: new Date(),
  })

  // Notify HR
  if (finalJob.postedBy) {
    await db.collection("notifications").insertOne({
      userId: finalJob.postedBy,
      type: "new_application",
      message: `${user?.name} applied for ${finalJob.title}`,
      jobId,
      read: false,
      createdAt: new Date(),
    })
  }

  // Increment applicant count
  if (oid) {
    await db.collection("jobs").updateOne(
      { _id: oid as any },
      { $inc: { applicantCount: 1 } }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Application submitted!",
    externalUrl: finalJob.externalUrl || null,
    hrEmail: finalJob.hrEmail || finalJob.postedByEmail || null,
  })
}