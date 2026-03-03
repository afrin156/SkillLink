// app/api/feed/smart/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const userId = user?.id

  // Get student profile for personalisation
  const student = await db.collection("users").findOne({ email: user?.email })
  const studentSkills: string[] = (student?.skills || []).map((s: string) => s.toLowerCase())
  const studentLocation = (student?.location || "").toLowerCase()

  // Get viewed/saved job IDs to avoid repeating
  const [savedJobs, viewedJobs, connections] = await Promise.all([
    db.collection("savedJobs").find({ userId }).toArray(),
    db.collection("jobViews").find({ userId }).sort({ viewedAt: -1 }).limit(50).toArray(),
    db.collection("connectionRequests")
      .find({ fromUserId: userId, status: "accepted" }).toArray(),
  ])

  const savedJobIds = savedJobs.map(s => s.jobId)
  const viewedJobIds = viewedJobs.map(v => v.jobId)
  const connectedUserIds = connections.map(c => c.toUserId)

  // ── Score every job ──
  const allJobs = await db.collection("jobs")
    .find({ isActive: { $ne: false } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  const scoredJobs = allJobs.map(job => {
    let feedScore = 0
    const reasons: string[] = []
    const jobText = `${job.title} ${job.description} ${(job.skills || []).join(" ")}`.toLowerCase()
    const jobSkills: string[] = (job.skills || []).map((s: string) => s.toLowerCase())

    // Skill match boost (+40)
    const matchedSkills = studentSkills.filter(s =>
      jobSkills.some(js => js.includes(s) || s.includes(js)) || jobText.includes(s)
    )
    if (matchedSkills.length > 0) {
      feedScore += Math.min(40, matchedSkills.length * 12)
      reasons.push(`Matches your skill: ${matchedSkills[0]}`)
    }

    // Location match boost (+15)
    if (studentLocation && job.location?.toLowerCase().includes(studentLocation)) {
      feedScore += 15
      reasons.push("In your location")
    }

    // Verified job boost (+10)
    if (job.isVerified) {
      feedScore += 10
      reasons.push("Verified job")
    }

    // Posted by connection boost (+10)
    if (connectedUserIds.includes(job.postedBy)) {
      feedScore += 10
      reasons.push("Posted by your connection")
    }

    // Recency boost (up to +20, decays over 7 days)
    const ageMs = Date.now() - new Date(job.createdAt).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0, 20 - ageDays * 3)
    feedScore += recencyScore

    // Penalty for already viewed (-15)
    if (viewedJobIds.includes(job._id.toString())) {
      feedScore -= 15
    }

    // Penalty for already saved (-5, still show but lower)
    if (savedJobIds.includes(job._id.toString())) {
      feedScore -= 5
    }

    return {
      ...job,
      feedScore: Math.round(feedScore),
      matchReasons: reasons.slice(0, 2),
      matchedSkills,
    }
  })

  // Sort by feedScore descending
  const sorted = scoredJobs
    .sort((a, b) => b.feedScore - a.feedScore)
    .slice(0, 30)

  // Track that user loaded feed
  await db.collection("feedViews").insertOne({
    userId,
    loadedAt: new Date(),
  })

  return NextResponse.json({ jobs: sorted, personalised: studentSkills.length > 0 })
}

// POST — track job view for feed learning
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId, action } = await req.json()
  // action: "view" | "save" | "apply" | "skip"
  const db = await getDb()

  await db.collection("jobViews").updateOne(
    { userId: user?.id, jobId },
    {
      $set: {
        userId: user?.id,
        jobId,
        action,
        viewedAt: new Date(),
      },
    },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}