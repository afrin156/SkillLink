import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const jobs = await db
      .collection("jobs")
      .find({ verificationStatus: "verified" })
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json(jobs)
  } catch {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "hr" || !user.isVerifiedHR) {
      return NextResponse.json({ error: "Only verified HR can post jobs" }, { status: 403 })
    }

    const body = await req.json()
    const { title, company, location, jobType, skills, description, salary, officialCompanyUrl } = body

    if (!title || !company || !location || !jobType || !description || !officialCompanyUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!officialCompanyUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Official URL must start with https://" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection("jobs").insertOne({
      title,
      company,
      location,
      jobType,
      skills: skills || [],
      description,
      salary: salary || "",
      officialCompanyUrl,
      postedByUserId: user.id,
      postedByName: user.name,
      verificationStatus: "pending",
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId.toString(), message: "Job posted, pending verification" })
  } catch {
    return NextResponse.json({ error: "Failed to post job" }, { status: 500 })
  }
}
