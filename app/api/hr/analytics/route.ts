// app/api/hr/analytics/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as any

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")

    const db = await getDb()

    const jobs = await db.collection("jobs")
      .find({ postedBy: user.id })
      .toArray()

    const hrJobIds = jobs.map((j: any) => j._id.toString())

    const applications = hrJobIds.length > 0
      ? await db.collection("applications").find({ jobId: { $in: hrJobIds } }).toArray()
      : []

    const interviews = await db.collection("interviews")
      .find({ hrId: user.id })
      .toArray()

    const totalViews = jobs.reduce((sum: number, j: any) => sum + (j.views || 0), 0)

    const topJobs = jobs.map((j: any) => ({
      title: j.title,
      applications: applications.filter((a: any) => a.jobId === j._id.toString()).length,
      views: j.views || 0,
    })).sort((a: any, b: any) => b.applications - a.applications).slice(0, 5)

    return NextResponse.json({
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j: any) => j.isActive !== false).length,
      totalApplications: applications.length,
      totalViews,
      shortlisted: applications.filter((a: any) => a.status === "shortlisted").length,
      interviewed: applications.filter((a: any) => a.status === "interview").length,
      hired: applications.filter((a: any) => a.status === "hired").length,
      rejected: applications.filter((a: any) => a.status === "rejected").length,
      topJobs,
      recentActivity: [],
    })
  } catch (e) {
    console.error("Analytics error:", e)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}