// app/api/student/analytics/route.ts
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

  // Run all queries in parallel
  const [
    applications,
    profileViews,
    savedJobs,
    connections,
    testResults,
    certificates,
    webinarRegs,
  ] = await Promise.all([
    db.collection("applications").find({ studentId: userId }).toArray(),
    db.collection("profileViews").find({ profileId: userId }).toArray(),
    db.collection("savedJobs").find({ userId }).toArray(),
    db.collection("connectionRequests")
      .find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
      .toArray(),
    db.collection("testResults").find({ userId }).sort({ takenAt: -1 }).limit(10).toArray(),
    db.collection("certificates").find({ userId }).toArray(),
    db.collection("webinarRegistrations").find({ userId }).toArray(),
  ])

  // Application funnel
  const totalApplied = applications.length
  const shortlisted = applications.filter(a => a.status === "shortlisted").length
  const interviewed = applications.filter(a => a.status === "interview_scheduled").length
  const offered = applications.filter(a => a.status === "offered").length
  const rejected = applications.filter(a => a.status === "rejected").length

  // Profile views last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentViews = profileViews.filter(v => new Date(v.viewedAt) > thirtyDaysAgo)

  // Views by day (last 7 days)
  const viewsByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    viewsByDay[key] = 0
  }
  recentViews.forEach(v => {
    const key = new Date(v.viewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (viewsByDay[key] !== undefined) viewsByDay[key]++
  })

  // Connection stats
  const acceptedConnections = connections.filter(c => c.status === "accepted").length
  const pendingConnections = connections.filter(c => c.status === "pending").length

  // Test performance
  const avgTestScore = testResults.length
    ? Math.round(testResults.reduce((acc, t) => acc + t.score, 0) / testResults.length)
    : 0

  const bestDomain = testResults.length
    ? (() => {
        const byDomain: Record<string, number[]> = {}
        testResults.forEach(t => {
          if (!byDomain[t.domain]) byDomain[t.domain] = []
          byDomain[t.domain].push(t.score)
        })
        return Object.entries(byDomain)
          .map(([domain, scores]) => ({
            domain,
            avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          }))
          .sort((a, b) => b.avg - a.avg)[0]
      })()
    : null

  // Activity heatmap — last 12 weeks
  const activities: Record<string, number> = {}
  const allActivity = [
    ...applications.map(a => a.appliedAt),
    ...savedJobs.map(s => s.savedAt || s.createdAt),
    ...connections.map(c => c.createdAt),
  ].filter(Boolean)

  allActivity.forEach(date => {
    const key = new Date(date).toISOString().split("T")[0]
    activities[key] = (activities[key] || 0) + 1
  })

  // Profile completeness score
  const userDoc = await db.collection("users").findOne({ email: user?.email })
  const fields = ["name", "bio", "skills", "location", "phone", "linkedin"]
  const filled = fields.filter(f => userDoc?.[f] && userDoc[f].length > 0).length
  const profileScore = Math.round((filled / fields.length) * 100)

  return NextResponse.json({
    applications: {
      total: totalApplied,
      shortlisted,
      interviewed,
      offered,
      rejected,
      successRate: totalApplied > 0 ? Math.round((offered / totalApplied) * 100) : 0,
    },
    profileViews: {
      total: profileViews.length,
      last30Days: recentViews.length,
      byDay: viewsByDay,
    },
    connections: {
      accepted: acceptedConnections,
      pending: pendingConnections,
    },
    tests: {
      taken: testResults.length,
      avgScore: avgTestScore,
      bestDomain,
      recent: testResults.slice(0, 5).map(t => ({
        domain: t.domain,
        score: t.score,
        date: t.takenAt,
      })),
    },
    certificates: certificates.length,
    webinars: webinarRegs.length,
    profileScore,
    activities,
  })
}