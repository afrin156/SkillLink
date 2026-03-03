"use client"

import { useState, useEffect } from "react"
import { BarChart2, Users, Briefcase, Eye, TrendingUp, TrendingDown, Calendar, Award, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function HRAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => { fetchStats() }, [period])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/hr/analytics?days=${period}`)
      if (res.ok) { const data = await res.json(); setStats(data) }
    } catch { toast.error("Failed to load analytics") }
    finally { setLoading(false) }
  }

  // Fallback demo data if API not ready
  const data = stats || {
    totalJobs: 8,
    activeJobs: 5,
    totalApplications: 47,
    totalViews: 312,
    shortlisted: 12,
    interviewed: 6,
    hired: 2,
    rejected: 18,
    topJobs: [
      { title: "Frontend Developer", applications: 18, views: 120 },
      { title: "QA Tester", applications: 14, views: 98 },
      { title: "UI/UX Designer", applications: 9, views: 62 },
      { title: "Backend Developer", applications: 6, views: 32 },
    ],
    recentActivity: [
      { type: "application", text: "Nisha applied for SW Test Engineer", time: "2h ago" },
      { type: "view", text: "Your Frontend Developer post got 12 views", time: "5h ago" },
      { type: "shortlist", text: "You shortlisted Yasodha", time: "1d ago" },
      { type: "interview", text: "Interview scheduled with AfrinNisha", time: "2d ago" },
    ]
  }

  const statCards = [
    { label: "Total Jobs Posted", value: data.totalJobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Total Applications", value: data.totalApplications, icon: Users, color: "text-violet-600", bg: "bg-violet-500/10" },
    { label: "Total Job Views", value: data.totalViews, icon: Eye, color: "text-cyan-600", bg: "bg-cyan-500/10" },
    { label: "Hired", value: data.hired, icon: Award, color: "text-green-600", bg: "bg-green-500/10" },
  ]

  const pipeline = [
    { label: "Applied", value: data.totalApplications, color: "bg-blue-500" },
    { label: "Shortlisted", value: data.shortlisted, color: "bg-yellow-500" },
    { label: "Interviewed", value: data.interviewed, color: "bg-purple-500" },
    { label: "Hired", value: data.hired, color: "bg-green-500" },
    { label: "Rejected", value: data.rejected, color: "bg-red-400" },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your hiring performance</p>
        </div>
        <div className="flex gap-2">
          {["7", "30", "90"].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={cn("px-3 py-1.5 rounded-lg text-sm border transition-all",
                period === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Hiring Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Hiring Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipeline.map(p => (
              <div key={p.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="font-medium">{p.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", p.color)}
                    style={{ width: data.totalApplications > 0 ? `${(p.value / data.totalApplications) * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Conversion rate: <span className="font-semibold text-foreground">
                  {data.totalApplications > 0 ? Math.round((data.hired / data.totalApplications) * 100) : 0}%
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Performing Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topJobs?.map((job: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <p className="text-sm font-medium truncate">{job.title}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentActivity?.map((a: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn("h-2 w-2 rounded-full mt-2 shrink-0",
                a.type === "application" ? "bg-blue-500" :
                a.type === "view" ? "bg-cyan-500" :
                a.type === "shortlist" ? "bg-yellow-500" : "bg-purple-500")} />
              <div className="flex-1">
                <p className="text-sm">{a.text}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}