"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, Clock, MapPin } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function HRApplicantsPage() {
  const { data, isLoading } = useSWR("/api/hr/applicants", fetcher)

  // ✅ API returns { applicants: [...] } — fixed key!
  const applicants = data?.applicants || []

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">HR Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Applicants</h1>
        <p className="text-sm text-white/40 mt-1">
          {applicants.length} total applicant{applicants.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/20 gap-3">
          <Users className="h-12 w-12 opacity-20" />
          <p className="font-medium text-white/30">No applicants yet</p>
          <p className="text-sm text-white/20">Applications will appear here when students apply</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((app: any) => (
            <div key={app._id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center text-sm font-bold text-white border border-white/10 shrink-0">
                    {(app.name || app.userName)?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white/80">{app.name || app.userName || "Unknown"}</p>
                    <p className="text-xs text-white/40">{app.email || app.userEmail}</p>
                  </div>
                </div>

                {/* Status badge */}
                <Badge className={
                  app.status === "hired" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  app.status === "shortlisted" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                  app.status === "interview" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" :
                  app.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-white/8 text-white/40 border border-white/10"
                }>
                  {app.status || "pending"}
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-4 flex-wrap text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {app.jobTitle || "Unknown Job"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {app.appliedAt || app.createdAt
                    ? new Date(app.appliedAt || app.createdAt).toLocaleDateString()
                    : "Unknown date"}
                </span>
                {app.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {app.location}
                  </span>
                )}
              </div>

              {/* Skills */}
              {app.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {app.skills.slice(0, 5).map((s: string) => (
                    <Badge key={s} className="text-xs bg-white/5 text-white/30 border-white/8">
                      {s}
                    </Badge>
                  ))}
                  {app.skills.length > 5 && (
                    <Badge className="text-xs bg-white/5 text-white/30 border-white/8">
                      +{app.skills.length - 5}
                    </Badge>
                  )}
                </div>
              )}

              {app.coverLetter && (
                <p className="mt-2 text-xs text-white/30 bg-white/3 rounded-lg p-2 border border-white/5 line-clamp-2 italic">
                  "{app.coverLetter}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}