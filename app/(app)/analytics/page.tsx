"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  TrendingUp, Eye, Briefcase, Award,
  Users, Target, CheckCircle, XCircle,
  Clock, Star, BarChart2, Activity,
  ChevronUp, ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Analytics {
  applications: {
    total: number; shortlisted: number
    interviewed: number; offered: number
    rejected: number; successRate: number
  }
  profileViews: { total: number; last30Days: number; byDay: Record<string, number> }
  connections: { accepted: number; pending: number }
  tests: {
    taken: number; avgScore: number
    bestDomain: { domain: string; avg: number } | null
    recent: { domain: string; score: number; date: string }[]
  }
  certificates: number
  webinars: number
  profileScore: number
  activities: Record<string, number>
}

// ── Sparkline bar chart ──
function Sparkline({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  return (
    <div className="flex items-end gap-1 h-12">
      {entries.map(([label, value]) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-sm bg-primary/70 transition-all"
            style={{ height: `${Math.max(2, (value / max) * 44)}px` }}
          />
          <span className="text-[8px] text-muted-foreground rotate-45 origin-left">
            {label.split(" ")[1]}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Activity heatmap (12 weeks) ──
function ActivityHeatmap({ activities }: { activities: Record<string, number> }) {
  const weeks: string[][] = []
  const today = new Date()
  for (let w = 11; w >= 0; w--) {
    const week: string[] = []
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(today.getDate() - w * 7 - d)
      week.push(date.toISOString().split("T")[0])
    }
    weeks.push(week)
  }

  const maxActivity = Math.max(...Object.values(activities), 1)

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted"
    const intensity = count / maxActivity
    if (intensity > 0.75) return "bg-primary"
    if (intensity > 0.5) return "bg-primary/70"
    if (intensity > 0.25) return "bg-primary/40"
    return "bg-primary/20"
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(day => {
              const count = activities[day] || 0
              return (
                <div
                  key={day}
                  title={`${day}: ${count} activities`}
                  className={cn("h-3 w-3 rounded-sm", getColor(count))}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"].map(c => (
          <div key={c} className={cn("h-3 w-3 rounded-sm", c)} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ── Stat card ──
function StatCard({
  title, value, sub, icon: Icon, color = "text-primary", trend,
}: {
  title: string; value: string | number; sub?: string
  icon: any; color?: string; trend?: "up" | "down" | null
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn("h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs mt-2",
          trend === "up" ? "text-green-600" : "text-red-500"
        )}>
          {trend === "up" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {trend === "up" ? "Up this month" : "Down this month"}
        </div>
      )}
    </Card>
  )
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/analytics")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-48" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-16 text-muted-foreground">
      <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
      <p>No analytics data yet. Start applying to jobs!</p>
    </div>
  )

  const applicationFunnel = [
    { label: "Applied", value: data.applications.total, color: "bg-blue-500" },
    { label: "Shortlisted", value: data.applications.shortlisted, color: "bg-yellow-500" },
    { label: "Interview", value: data.applications.interviewed, color: "bg-orange-500" },
    { label: "Offered", value: data.applications.offered, color: "bg-green-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your job search progress and profile performance
        </p>
      </div>

      {/* Profile completeness */}
      <Card className={cn(
        "border-2",
        data.profileScore >= 80 ? "border-green-200 bg-green-50/40" :
        data.profileScore >= 50 ? "border-yellow-200 bg-yellow-50/40" :
        "border-red-200 bg-red-50/40"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Profile Completeness</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              data.profileScore >= 80 ? "text-green-600" :
              data.profileScore >= 50 ? "text-yellow-600" : "text-red-500"
            )}>
              {data.profileScore}%
            </span>
          </div>
          <Progress
            value={data.profileScore}
            className={cn(
              "h-2.5",
              data.profileScore >= 80 ? "[&>div]:bg-green-500" :
              data.profileScore >= 50 ? "[&>div]:bg-yellow-500" :
              "[&>div]:bg-red-500"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {data.profileScore < 100
              ? "Complete your profile to appear in more searches and get better job matches"
              : "🎉 Profile is fully complete!"}
          </p>
        </CardContent>
      </Card>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Profile Views" value={data.profileViews.last30Days}
          sub="Last 30 days" icon={Eye} color="text-blue-600" trend="up"
        />
        <StatCard
          title="Jobs Applied" value={data.applications.total}
          sub={`${data.applications.successRate}% success rate`} icon={Briefcase} color="text-purple-600"
        />
        <StatCard
          title="Connections" value={data.connections.accepted}
          sub={`${data.connections.pending} pending`} icon={Users} color="text-green-600"
        />
        <StatCard
          title="Certificates" value={data.certificates}
          sub={`${data.webinars} webinar(s)`} icon={Award} color="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Application funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Application Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applicationFunnel.map((step, i) => {
              const pct = data.applications.total > 0
                ? Math.round((step.value / data.applications.total) * 100) : 0
              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", step.color)} />
                      <span className="text-muted-foreground">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{step.value}</span>
                      <span className="text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", step.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {data.applications.offered > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 text-xs text-green-700 font-medium">
                🎉 {data.applications.offered} job offer(s) received!
              </div>
            )}
            {data.applications.total === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No applications yet. Start applying!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Profile views sparkline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" /> Profile Views (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-3xl font-bold">{data.profileViews.last30Days}</p>
                <p className="text-xs text-muted-foreground">views in 30 days</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{data.profileViews.total}</p>
                <p className="text-xs text-muted-foreground">all time</p>
              </div>
            </div>
            <Sparkline data={data.profileViews.byDay} />
          </CardContent>
        </Card>

        {/* Test performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" /> Test Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.tests.taken === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Take aptitude tests to see your performance here
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">{data.tests.avgScore}%</p>
                    <p className="text-xs text-muted-foreground">avg score</p>
                  </div>
                  {data.tests.bestDomain && (
                    <div className="border-l pl-4">
                      <p className="text-sm font-semibold">{data.tests.bestDomain.domain}</p>
                      <p className="text-xs text-muted-foreground">
                        Best domain ({data.tests.bestDomain.avg}%)
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {data.tests.recent.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t.domain}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              t.score >= 80 ? "bg-green-500" :
                              t.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${t.score}%` }}
                          />
                        </div>
                        <span className="font-medium w-8 text-right">{t.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity heatmap */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Activity (Last 12 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap activities={data.activities} />
            <p className="text-xs text-muted-foreground mt-3">
              Every application, save, and connection is tracked
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}