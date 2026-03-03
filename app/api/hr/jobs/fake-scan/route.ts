// app/api/jobs/fake-scan/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { scanJobForFraud } from "@/lib/fake-job-scanner"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId, title, description, salary, company } = await req.json()

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 })
  }

  const result = scanJobForFraud(title, description, salary, company)

  // If jobId provided, save scan result to DB
  if (jobId) {
    const db = await getDb()
    await db.collection("jobs").updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          fraudScan: {
            riskScore: result.riskScore,
            level: result.level,
            passed: result.passed,
            flags: result.flags,
            scannedAt: new Date(),
          },
          isVerified: result.passed,
          verificationStatus: result.passed ? "verified" : "flagged",
        },
      }
    )
  }

  return NextResponse.json(result)
}