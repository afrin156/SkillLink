import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// 🔍 Simple AI-like scan using keyword rules
function scanJobForFraud(job: {
  title: string
  description: string
  salary?: string
  company: string
}): { passed: boolean; riskScore: number; flags: string[] } {
  const flags: string[] = []
  let riskScore = 0

  const desc = job.description.toLowerCase()
  const title = job.title.toLowerCase()

  // 🚩 Scam keyword check
  const scamKeywords = [
    "no experience required", "work from home guaranteed",
    "make money fast", "unlimited earning", "part time easy money",
    "no interview", "immediate joining", "pay registration fee",
    "send money", "western union", "mlm", "multi level"
  ]
  scamKeywords.forEach(kw => {
    if (desc.includes(kw) || title.includes(kw)) {
      flags.push(`Suspicious phrase detected: "${kw}"`)
      riskScore += 20
    }
  })

  // 🚩 Salary anomaly check
  if (job.salary) {
    const salaryNum = parseInt(job.salary.replace(/\D/g, ""))
    if (salaryNum > 5000000) {
      flags.push("Unrealistic salary for entry-level position")
      riskScore += 30
    }
  }

  // 🚩 Too short description
  if (job.description.length < 100) {
    flags.push("Job description is too short (less than 100 characters)")
    riskScore += 15
  }

  // 🚩 ALL CAPS title
  if (job.title === job.title.toUpperCase() && job.title.length > 5) {
    flags.push("Job title is in all caps — common in spam posts")
    riskScore += 10
  }

  // 🚩 Urgency pressure words
  const urgencyWords = ["apply immediately", "urgent hiring", "last chance", "only today"]
  urgencyWords.forEach(kw => {
    if (desc.includes(kw)) {
      flags.push(`Urgency pressure tactic: "${kw}"`)
      riskScore += 15
    }
  })

  const passed = riskScore < 40 // under 40 = safe
  return { passed, riskScore: Math.min(riskScore, 100), flags }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { jobId } = await req.json()
  const db = await getDb()

  const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) })
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  const result = scanJobForFraud({
    title: job.title,
    description: job.description,
    salary: job.salary,
    company: job.company,
  })

  // Update job with verification result
  await db.collection("jobs").updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        isVerified: result.passed,
        verificationStatus: result.passed ? "verified" : "flagged",
        verificationRiskScore: result.riskScore,
        verificationFlags: result.flags,
        verifiedAt: result.passed ? new Date() : null,
      },
    }
  )

  return NextResponse.json(result)
}