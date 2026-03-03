// app/api/hr/applicants/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("job")

    const db = await getDb()

    const hrJobs = await db.collection("jobs")
      .find({ postedBy: (session.user as any).id || (session.user as any)._id })
      .project({ _id: 1, title: 1 })
      .toArray()

    const hrJobIds = hrJobs.map((j: any) => j._id.toString())
    const jobTitleMap: Record<string, string> = {}
    hrJobs.forEach((j: any) => { jobTitleMap[j._id.toString()] = j.title })

    const query: any = { jobId: { $in: hrJobIds } }
    if (jobId) query.jobId = jobId

    const applications = await db.collection("applications")
      .find(query)
      .sort({ appliedAt: -1 })
      .toArray()

    const enriched = await Promise.all(applications.map(async (app: any) => {
      let user = null
      try {
        user = await db.collection("users").findOne(
          { _id: new ObjectId(app.userId) },
          { projection: { name: 1, email: 1, skills: 1, education: 1, experience: 1, location: 1 } }
        )
      } catch {}
      return {
        ...app,
        name: user?.name || app.applicantName || "Unknown",
        email: user?.email || app.applicantEmail || "",
        skills: user?.skills || [],
        education: user?.education || [],
        experience: user?.experience || [],
        location: user?.location || "",
        jobTitle: jobTitleMap[app.jobId] || app.jobTitle || "",
      }
    }))

    return NextResponse.json({ applicants: enriched })
  } catch (e) {
    console.error("Applicants error:", e)
    return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 })
  }
}