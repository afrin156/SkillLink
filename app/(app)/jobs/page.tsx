"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Search, Briefcase, MapPin, Building2,
  BookmarkPlus, BookmarkCheck, ExternalLink,
  BadgeCheck, Clock, Sparkles, ChevronDown,
  ChevronUp, Globe, Send, CheckCircle,
  Loader2, User, Award, Filter,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Job {
  _id: string
  title: string
  company: string
  location: string
  description: string
  skills: string[]
  salary?: string
  deadline?: string
  isVerified?: boolean
  verificationStatus?: string
  externalUrl?: string
  hrEmail?: string
  postedByEmail?: string
  createdAt: string
  feedScore?: number
  matchReasons?: string[]
  matchedSkills?: string[]
}

interface MatchResult {
  score: number
  level: "green" | "yellow" | "red"
  label: string
  breakdown: { label: string; points: number; max: number; reason: string }[]
  matchedSkills: string[]
}

const matchColors = {
  green: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", bar: "[&>div]:bg-emerald-500" },
  yellow: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", bar: "[&>div]:bg-amber-500" },
  red: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", bar: "[&>div]:bg-red-500" },
}

const COMPANY_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
]

function formatDeadline(date?: string) {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: "Expired", color: "text-red-400" }
  if (days <= 3) return { label: `${days}d left`, color: "text-red-400" }
  if (days <= 7) return { label: `${days}d left`, color: "text-amber-400" }
  return { label: `${days}d left`, color: "text-white/40" }
}

// ══════════════════════════════════
// APPLY DIALOG — dark theme
// ══════════════════════════════════
function ApplyDialog({ job, open, onClose }: { job: Job; open: boolean; onClose: () => void }) {
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [profile, setProfile] = useState<any>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [applyResult, setApplyResult] = useState<{ externalUrl?: string; hrEmail?: string } | null>(null)

  useEffect(() => {
    if (!open) return
    fetch(`/api/jobs/${job._id}/apply`).then(r => r.json()).then(d => setApplied(d.applied)).catch(() => {})
    fetch("/api/profile").then(r => r.json()).then(d => setProfile(d.user)).catch(() => {})
    fetch("/api/jobs/match-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job._id, jobTitle: job.title, jobDescription: job.description, requiredSkills: job.skills || [] }),
    }).then(r => r.json()).then(d => setMatchResult(d)).catch(() => {})
  }, [open])

  const handleApply = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${job._id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter, resumeData: profile?.resume || null }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Application submitted! 🎉")
        setApplied(true)
        setApplyResult({ externalUrl: data.externalUrl || job.externalUrl, hrEmail: data.hrEmail || job.hrEmail || job.postedByEmail })
      } else toast.error(data.error || "Failed to apply")
    } catch { toast.error("Failed to submit") }
    finally { setLoading(false) }
  }

  const skills: string[] = profile?.skills || []
  const certs: any[] = profile?.certificates || []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0d1117] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            Apply — {job.title}
          </DialogTitle>
          <p className="text-sm text-white/40">{job.company} · {job.location}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Success state */}
          {applied && applyResult && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle className="h-5 w-5" /> Application Submitted!
              </div>
              <p className="text-sm text-emerald-400/70">Your profile and cover letter have been sent to HR.</p>
              {applyResult.externalUrl && (
                <div>
                  <p className="text-xs font-semibold text-white/30 uppercase mb-1">Also apply on company website:</p>
                  <a href={applyResult.externalUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 font-medium hover:underline">
                    <ExternalLink className="h-4 w-4" />
                    {applyResult.externalUrl.slice(0, 50)}{applyResult.externalUrl.length > 50 ? "..." : ""}
                  </a>
                </div>
              )}
              {applyResult.hrEmail && (
                <div>
                  <p className="text-xs font-semibold text-white/30 uppercase mb-1">HR Contact:</p>
                  <a href={`mailto:${applyResult.hrEmail}`} className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                    <Send className="h-4 w-4" /> {applyResult.hrEmail}
                  </a>
                </div>
              )}
            </div>
          )}

          {!applied && (
            <>
              {/* Match score */}
              {matchResult && (() => {
                const cfg = matchColors[matchResult.level]
                return (
                  <div className={cn("rounded-xl border p-3 space-y-2", cfg.bg)}>
                    <span className={cn("text-sm font-bold", cfg.color)}>
                      Your Match: {matchResult.score}% — {matchResult.label}
                    </span>
                    <Progress value={matchResult.score} className={cn("h-1.5 bg-white/10", cfg.bar)} />
                    <p className="text-xs text-white/40">
                      {matchResult.score >= 75 ? "Great fit! Apply with confidence." :
                       matchResult.score >= 50 ? "Decent match. Highlight relevant skills." :
                       "Low match. Update your profile skills first."}
                    </p>
                  </div>
                )
              })()}

              {/* External URL notice */}
              {job.externalUrl && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                  <Globe className="h-4 w-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-300">Company has an external application portal</p>
                    <a href={job.externalUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400/70 hover:underline truncate block mt-0.5">{job.externalUrl}</a>
                  </div>
                  <a href={job.externalUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1 text-xs shrink-0 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 bg-transparent">
                      <ExternalLink className="h-3 w-3" /> Open
                    </Button>
                  </a>
                </div>
              )}

              {/* Profile preview */}
              <div className="rounded-xl border border-white/8 overflow-hidden">
                <button className="w-full px-4 py-3 flex items-center justify-between bg-white/3 hover:bg-white/5 transition-colors"
                  onClick={() => setShowProfile(!showProfile)}>
                  <span className="text-sm font-semibold flex items-center gap-2 text-white/70">
                    <User className="h-4 w-4 text-blue-400" /> Profile Being Submitted
                  </span>
                  {showProfile ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
                </button>
                {showProfile && (
                  <div className="p-4 space-y-3 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-2">
                      {[{ label: "Name", value: profile?.name }, { label: "Email", value: profile?.email },
                        { label: "Phone", value: profile?.phone }, { label: "Location", value: profile?.location }]
                        .map(f => f.value && (
                          <div key={f.label}>
                            <p className="text-[10px] text-white/30 uppercase">{f.label}</p>
                            <p className="text-xs font-medium text-white/70 truncate">{f.value}</p>
                          </div>
                        ))}
                    </div>
                    {skills.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/30 uppercase mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.map(s => (
                            <Badge key={s} className={cn("text-xs border-0",
                              job.skills?.map(js => js.toLowerCase()).includes(s.toLowerCase())
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-white/8 text-white/50"
                            )}>{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {certs.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/30 uppercase mb-1">Certificates ({certs.length})</p>
                        {certs.slice(0, 3).map((c, i) => (
                          <p key={i} className="text-xs text-white/40">• {c.name || c.certName}</p>
                        ))}
                      </div>
                    )}
                    {!skills.length && (
                      <p className="text-xs text-amber-400 bg-amber-500/8 rounded-lg p-2 border border-amber-500/20">
                        ⚠ Add skills to your Profile to improve your match score
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Cover letter */}
              <div>
                <label className="text-sm font-medium mb-1.5 block text-white/70">
                  Cover Letter <span className="text-white/30 font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder={`Hi, I'm interested in the ${job.title} role at ${job.company}. I believe my skills in...`}
                  value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                  rows={4} className="resize-none text-sm bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-blue-500/40"
                  maxLength={1000} />
                <p className="text-[10px] text-white/30 mt-1 text-right">{coverLetter.length}/1000</p>
              </div>

              <Button
                className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-lg shadow-blue-500/25"
                onClick={handleApply} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit Application</>}
              </Button>
              <p className="text-xs text-center text-white/25">Your profile, skills, and certificates will be sent to HR</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════
// JOB DETAIL MODAL — dark theme
// ══════════════════════════════════
function JobDetailModal({ job, open, onClose, isSaved, onSave, onApply }: {
  job: Job; open: boolean; onClose: () => void
  isSaved: boolean; onSave: () => void; onApply: () => void
}) {
  const deadline = formatDeadline(job.deadline)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d1117] border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white text-xl shrink-0 shadow-lg shadow-blue-500/25">
              {job.company?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <DialogTitle className="text-xl text-white">{job.title}</DialogTitle>
                  <div className="flex items-center gap-3 mt-1 text-sm text-white/40 flex-wrap">
                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                    {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>}
                  </div>
                </div>
                <button onClick={onSave} className={cn("p-2 rounded-xl transition-colors shrink-0",
                  isSaved ? "text-blue-400 bg-blue-500/10" : "text-white/20 hover:text-blue-400 hover:bg-blue-500/10")}>
                  {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="flex flex-wrap gap-2">
            {job.isVerified && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified Job
              </Badge>
            )}
            {job.salary && <Badge className="bg-white/8 text-white/70 border-white/10 text-sm font-semibold">💰 {job.salary}</Badge>}
            {deadline && (
              <Badge className={cn("bg-white/5 border-white/10 gap-1", deadline.color)}>
                <Clock className="h-3 w-3" /> {deadline.label}
              </Badge>
            )}
          </div>

          {job.skills?.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 text-white/70">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(skill => (
                  <Badge key={skill} className="text-sm px-3 py-1 bg-white/8 text-white/60 border-white/10">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold mb-2 text-white/70">Job Description</p>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-white/50 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {job.externalUrl && (
            <div className="flex items-center gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
              <Globe className="h-5 w-5 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-300">Apply on Company Website</p>
                <p className="text-xs text-blue-400/60 truncate mt-0.5">{job.externalUrl}</p>
              </div>
              <a href={job.externalUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1.5 border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border">
                  <ExternalLink className="h-4 w-4" /> Open
                </Button>
              </a>
            </div>
          )}

          {(job.hrEmail || job.postedByEmail) && (
            <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/5">
              <Send className="h-5 w-5 text-white/30 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/60">HR Contact</p>
                <a href={`mailto:${job.hrEmail || job.postedByEmail}`} className="text-sm text-blue-400 hover:underline">
                  {job.hrEmail || job.postedByEmail}
                </a>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0" onClick={onApply}>
              <Send className="h-4 w-4" /> Apply via SkillLink
            </Button>
            {job.externalUrl && (
              <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full gap-2 border-white/10 text-white/60 hover:text-white hover:bg-white/5 bg-transparent">
                  <ExternalLink className="h-4 w-4" /> Company Site
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════
// MATCH SCORE BUTTON — dark theme
// ══════════════════════════════════
function MatchScoreButton({ job }: { job: Job }) {
  const [result, setResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const check = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/jobs/match-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job._id, jobTitle: job.title, jobDescription: job.description, requiredSkills: job.skills || [] }),
      })
      if (res.ok) setResult(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  if (!result) {
    return (
      <Button size="sm" variant="outline" onClick={check} disabled={loading}
        className="gap-1.5 text-xs h-8 border-white/10 text-white/40 hover:text-white hover:bg-white/5 bg-transparent mt-2">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        {loading ? "Checking..." : "Check My Match"}
      </Button>
    )
  }

  const cfg = matchColors[result.level]
  return (
    <div className={cn("rounded-xl border px-3 py-2 space-y-1.5 mt-2", cfg.bg)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-bold flex items-center gap-1", cfg.color)}>
          <Sparkles className="h-3 w-3" /> {result.score}% — {result.label}
        </span>
        <button onClick={() => setExpanded(!expanded)} className="text-white/30 hover:text-white/60">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
      <Progress value={result.score} className={cn("h-1 bg-white/10", cfg.bar)} />
      {result.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.matchedSkills.slice(0, 3).map(s => (
            <span key={s} className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", cfg.color, cfg.bg)}>✓ {s}</span>
          ))}
        </div>
      )}
      {expanded && (
        <div className="space-y-1.5 pt-1.5 border-t border-white/10">
          {result.breakdown?.map(b => (
            <div key={b.label} className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-white/30">{b.label}</span>
                <span className={cn("font-medium", cfg.color)}>{b.points}/{b.max}</span>
              </div>
              <Progress value={(b.points / b.max) * 100} className={cn("h-0.5 bg-white/10", cfg.bar)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════
export default function JobsPage() {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"smart" | "recent">("smart")
  const [detailJob, setDetailJob] = useState<Job | null>(null)
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const endpoint = sortBy === "smart" ? "/api/feed/smart" : "/api/jobs"
      const res = await fetch(endpoint)
      if (res.ok) { const data = await res.json(); setJobs(data.jobs || data || []) }
    } catch { toast.error("Failed to load jobs") }
    finally { setLoading(false) }
  }

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/saved")
      if (res.ok) {
        const data = await res.json()
        setSavedJobs(new Set<string>((data.savedJobs || []).map((s: any) => s.jobId || s._id)))
      }
    } catch {}
  }

  useEffect(() => { fetchJobs(); fetchSaved() }, [sortBy])

  const toggleSave = async (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setSavedJobs(prev => { const next = new Set(prev); data.saved ? next.add(jobId) : next.delete(jobId); return next })
        toast.success(data.saved ? "Job saved!" : "Job removed")
      }
    } catch { toast.error("Failed to save") }
  }

  const trackView = async (jobId: string) => {
    await fetch("/api/feed/smart", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, action: "view" }),
    }).catch(() => {})
  }

  const filteredJobs = jobs.filter(job => {
    const matchSearch = !searchTerm ||
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchLocation = locationFilter === "all" || job.location?.toLowerCase().includes(locationFilter.toLowerCase())
    return matchSearch && matchLocation
  })

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-600/10 via-cyan-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-1">
          <Briefcase className="h-5 w-5 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">Verified Jobs</span>
        </div>
        <h1 className="text-2xl font-bold text-white relative">Job Listings</h1>
        <p className="text-sm text-white/40 mt-1 relative">
          {sortBy === "smart" ? "✨ Personalised for your skills and profile" : "All jobs sorted by date"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <Input placeholder="Search jobs, companies, skills..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-blue-500/40" />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-36 h-9 bg-white/5 border-white/8 text-white/60 focus:border-blue-500/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1117] border-white/10 text-white">
            {["all", "remote", "bangalore", "mumbai", "delhi", "chennai", "hyderabad", "pune"].map(loc => (
              <SelectItem key={loc} value={loc} className="focus:bg-white/8 capitalize">
                {loc === "all" ? "All Locations" : loc.charAt(0).toUpperCase() + loc.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-xl border border-white/8 overflow-hidden">
          {(["smart", "recent"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={cn("px-3 h-9 text-xs font-medium flex items-center gap-1.5 transition-all",
                s !== "smart" && "border-l border-white/8",
                sortBy === s ? "bg-blue-600 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/60"
              )}>
              {s === "smart" ? <><Sparkles className="h-3.5 w-3.5" /> Smart Feed</> : <><Clock className="h-3.5 w-3.5" /> Latest</>}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/25">
        {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
        {sortBy === "smart" && " · ranked by profile match"}
      </p>

      {/* Job list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <Skeleton className="h-24 bg-white/5" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-white/20 gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
            <Briefcase className="h-10 w-10" />
          </div>
          <p className="font-medium text-white/40">No jobs found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job, idx) => {
            const isSaved = savedJobs.has(job._id)
            const deadline = formatDeadline(job.deadline)
            const gradient = COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length]

            return (
              <div key={job._id}
                className={cn("rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/20",
                  isSaved && "border-blue-500/20 bg-blue-500/[0.02]")}>

                {sortBy === "smart" && job.matchReasons?.[0] && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-violet-400">
                    <Sparkles className="h-3 w-3" /> {job.matchReasons[0]}
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shrink-0 text-lg shadow-lg`}>
                    {job.company?.[0]?.toUpperCase() || "J"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base text-white/90">{job.title}</h3>
                          {job.isVerified && (
                            <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1">
                              <BadgeCheck className="h-3 w-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-white/60">
                            <Building2 className="h-3 w-3 text-white/30" /> {job.company}
                          </span>
                          {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>}
                          {job.salary && <span className="font-semibold text-emerald-400">💰 {job.salary}</span>}
                          {deadline && <span className={cn("flex items-center gap-1", deadline.color)}><Clock className="h-3 w-3" /> {deadline.label}</span>}
                        </div>
                      </div>
                      <button onClick={e => toggleSave(job._id, e)}
                        className={cn("p-1.5 rounded-xl transition-colors shrink-0",
                          isSaved ? "text-blue-400 bg-blue-500/10" : "text-white/20 hover:text-blue-400 hover:bg-blue-500/10")}>
                        {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
                      </button>
                    </div>

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {job.skills.slice(0, 6).map(skill => (
                          <Badge key={skill} className={cn("text-xs border-0",
                            job.matchedSkills?.includes(skill.toLowerCase())
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-white/8 text-white/40")}>
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 6 && (
                          <Badge className="text-xs bg-white/5 text-white/30 border-0">+{job.skills.length - 6} more</Badge>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-white/35 mt-2.5 line-clamp-3 leading-relaxed">{job.description}</p>

                    {/* External URL indicator */}
                    {job.externalUrl && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Globe className="h-3 w-3 text-blue-400/60" />
                        <span className="text-xs text-blue-400/60">Has company application link</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm"
                          className="gap-1.5 text-xs h-8 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-md shadow-blue-500/20"
                          onClick={() => { setApplyJob(job); trackView(job._id) }}>
                          <Send className="h-3.5 w-3.5" /> Apply Now
                        </Button>

                        {job.externalUrl && (
                          <a href={job.externalUrl} target="_blank" rel="noopener noreferrer"
                            onClick={() => trackView(job._id)}>
                            <Button size="sm" variant="outline"
                              className="gap-1.5 text-xs h-8 border-white/10 text-white/40 hover:text-white hover:bg-white/5 bg-transparent">
                              <ExternalLink className="h-3.5 w-3.5" /> Company Site
                            </Button>
                          </a>
                        )}

                        <button onClick={() => { setDetailJob(job); trackView(job._id) }}
                          className="text-xs text-white/25 hover:text-blue-400 underline ml-auto transition-colors">
                          View details →
                        </button>
                      </div>

                      {/* External URL clickable link */}
                      {job.externalUrl && (
                        <div className="flex items-center gap-1.5">
                          <ExternalLink className="h-3 w-3 text-blue-400/40 shrink-0" />
                          <a href={job.externalUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-400/50 hover:text-blue-400 hover:underline truncate transition-colors">
                            {job.externalUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    <MatchScoreButton job={job} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detailJob && (
        <JobDetailModal job={detailJob} open={!!detailJob} onClose={() => setDetailJob(null)}
          isSaved={savedJobs.has(detailJob._id)} onSave={() => toggleSave(detailJob._id)}
          onApply={() => { setApplyJob(detailJob); setDetailJob(null) }} />
      )}
      {applyJob && <ApplyDialog job={applyJob} open={!!applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  )
}