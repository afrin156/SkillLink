"use client"

import { useState, useEffect } from "react"
import {
  Briefcase, Clock, CheckCircle, XCircle,
  AlertCircle, ChevronDown, ChevronUp, FileText,
  Sparkles, TrendingUp, Award, Send,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Application {
  _id: string
  jobTitle: string
  company: string
  status: "applied" | "shortlisted" | "interview_scheduled" | "offered" | "rejected"
  appliedAt: string
  coverLetter?: string
}

const STATUS_CONFIG = {
  applied: {
    label: "Applied",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
    icon: Send,
  },
  shortlisted: {
    label: "Shortlisted ⭐",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
    icon: AlertCircle,
  },
  interview_scheduled: {
    label: "Interview 📅",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    dot: "bg-violet-400",
    icon: AlertCircle,
  },
  offered: {
    label: "Offered 🎉",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
    icon: CheckCircle,
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400",
    icon: XCircle,
  },
}

const COMPANY_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/applications")
      .then(r => r.json())
      .then(d => setApplications(d.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    interview: applications.filter(a => a.status === "interview_scheduled").length,
    offered: applications.filter(a => a.status === "offered").length,
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-violet-600/10 via-blue-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-violet-400 font-medium">Application Tracker</span>
          </div>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
          <p className="text-sm text-white/40 mt-1">Track all your job applications in one place</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Applied", value: counts.total, gradient: "from-blue-500 to-blue-700", glow: "shadow-blue-500/20", border: "border-blue-500/20" },
          { label: "Shortlisted", value: counts.shortlisted, gradient: "from-amber-500 to-amber-700", glow: "shadow-amber-500/20", border: "border-amber-500/20" },
          { label: "Interviews", value: counts.interview, gradient: "from-violet-500 to-violet-700", glow: "shadow-violet-500/20", border: "border-violet-500/20" },
          { label: "Offers 🎉", value: counts.offered, gradient: "from-emerald-500 to-emerald-700", glow: "shadow-emerald-500/20", border: "border-emerald-500/20" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border ${s.border} bg-white/[0.02] p-4 text-center hover:shadow-lg ${s.glow} transition-all`}>
            <p className={`text-3xl font-bold bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline view */}
      {applications.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Application Pipeline</h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { key: "applied", label: "Applied", color: "bg-blue-500" },
              { key: "shortlisted", label: "Shortlisted", color: "bg-amber-500" },
              { key: "interview_scheduled", label: "Interview", color: "bg-violet-500" },
              { key: "offered", label: "Offered", color: "bg-emerald-500" },
            ].map((stage, i) => {
              const count = applications.filter(a => a.status === stage.key).length
              const pct = applications.length > 0 ? Math.round((count / applications.length) * 100) : 0
              return (
                <div key={stage.key} className="flex items-center gap-2 shrink-0">
                  <div className="text-center">
                    <div className={`rounded-lg px-4 py-2 ${stage.color}/10 border border-${stage.color}/20`}>
                      <p className={`text-lg font-bold text-white`}>{count}</p>
                      <p className="text-xs text-white/40">{stage.label}</p>
                    </div>
                  </div>
                  {i < 3 && <div className="text-white/20 text-lg shrink-0">→</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Applications list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <Skeleton className="h-16 bg-white/5" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/20 gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
            <Briefcase className="h-10 w-10" />
          </div>
          <p className="font-medium text-white/40">No applications yet</p>
          <p className="text-sm">Go to Jobs page and click Apply Now!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app, idx) => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
            const isExpanded = expanded === app._id
            const gradient = COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length]

            return (
              <div key={app._id}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shrink-0 shadow-lg text-sm`}>
                    {app.company?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm text-white/90">{app.jobTitle}</p>
                        <p className="text-xs text-white/40 mt-0.5">{app.company}</p>
                      </div>
                      <Badge className={cn("text-xs shrink-0 border", cfg.color)}>
                        <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full inline-block", cfg.dot)} />
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-white/20" />
                      <p className="text-xs text-white/30">
                        Applied {new Date(app.appliedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>

                    {app.coverLetter && (
                      <button onClick={() => setExpanded(isExpanded ? null : app._id)}
                        className="flex items-center gap-1.5 text-xs text-blue-400 mt-2.5 hover:text-blue-300 transition-colors">
                        <FileText className="h-3 w-3" />
                        {isExpanded ? "Hide" : "View"} cover letter
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}

                    {isExpanded && app.coverLetter && (
                      <div className="mt-3 p-3 rounded-xl border border-white/5 bg-white/[0.03] text-xs text-white/50 leading-relaxed">
                        {app.coverLetter}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}