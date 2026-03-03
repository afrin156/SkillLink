"use client"

import { useState, useEffect } from "react"
import {
  FileText, Send, CheckCircle, Loader2,
  User, Briefcase, Award, ChevronDown, ChevronUp,
  ExternalLink, Mail, AlertCircle,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Job {
  _id: string
  title: string
  company: string
  location?: string
  skills?: string[]
  externalUrl?: string
  hrEmail?: string
  postedByEmail?: string
}

interface MatchResult {
  score: number
  level: "green" | "yellow" | "red"
  label: string
}

export function ApplyDialog({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [profile, setProfile] = useState<any>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [showResume, setShowResume] = useState(false)
  // ✅ After apply — show external link + HR email
  const [applyResult, setApplyResult] = useState<{
    externalUrl?: string
    hrEmail?: string
  } | null>(null)

  useEffect(() => {
    if (!open) return
    checkApplied()
    fetchProfile()
    checkMatch()
  }, [open])

  const checkApplied = async () => {
    try {
      const res = await fetch(`/api/jobs/${job._id}/apply`)
      if (res.ok) {
        const data = await res.json()
        setApplied(data.applied)
      }
    } catch {}
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
      }
    } catch {}
  }

  const checkMatch = async () => {
    try {
      const res = await fetch("/api/jobs/match-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job._id,
          jobTitle: job.title,
          jobDescription: "",
          requiredSkills: job.skills || [],
        }),
      })
      if (res.ok) setMatchResult(await res.json())
    } catch {}
  }

  const handleApply = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${job._id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetter,
          resumeData: profile?.resume || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Application submitted! 🎉")
        setApplied(true)
        // ✅ Save the external URL and HR email from response
        setApplyResult({
          externalUrl: data.externalUrl || job.externalUrl,
          hrEmail: data.hrEmail || job.hrEmail || job.postedByEmail,
        })
      } else {
        toast.error(data.error || "Failed to apply")
      }
    } catch {
      toast.error("Failed to submit application")
    } finally {
      setLoading(false)
    }
  }

  const matchColors = {
    green: { color: "text-green-600", bg: "bg-green-50 border-green-200", bar: "[&>div]:bg-green-500" },
    yellow: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", bar: "[&>div]:bg-yellow-500" },
    red: { color: "text-red-500", bg: "bg-red-50 border-red-200", bar: "[&>div]:bg-red-500" },
  }

  const skills: string[] = profile?.skills || []
  const certs: any[] = profile?.certificates || []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {applied ? (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3.5 w-3.5" /> Applied
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" /> Apply Now
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Apply — {job.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* ✅ SUCCESS STATE — shown after applying */}
          {applied && applyResult && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle className="h-5 w-5" />
                Application Submitted Successfully!
              </div>
              <p className="text-sm text-green-700">
                Your profile and cover letter have been sent to the HR team.
              </p>

              {/* External website link */}
              {applyResult.externalUrl && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Also apply on company website:
                  </p>
                  <a
                    href={applyResult.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {applyResult.externalUrl.length > 50
                      ? applyResult.externalUrl.slice(0, 50) + "..."
                      : applyResult.externalUrl}
                  </a>
                </div>
              )}

              {/* HR email */}
              {applyResult.hrEmail && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    HR Contact Email:
                  </p>
                  <a
                    href={`mailto:${applyResult.hrEmail}`}
                    className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {applyResult.hrEmail}
                  </a>
                </div>
              )}

              {!applyResult.externalUrl && !applyResult.hrEmail && (
                <p className="text-xs text-muted-foreground">
                  The HR team will contact you via your registered email.
                </p>
              )}
            </div>
          )}

          {/* BEFORE APPLYING — show form */}
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
                    <Progress value={matchResult.score} className={cn("h-1.5", cfg.bar)} />
                    <p className="text-xs text-muted-foreground">
                      {matchResult.score >= 75
                        ? "Great fit! Your profile matches this role well."
                        : matchResult.score >= 50
                        ? "Decent match. Highlight relevant skills in your cover letter."
                        : "Low match. Consider updating your profile skills first."}
                    </p>
                  </div>
                )
              })()}

              {/* External link notice */}
              {job.externalUrl && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Company also has an external application</p>
                    <a
                      href={job.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Apply on company website too
                    </a>
                  </div>
                </div>
              )}

              {/* Profile preview */}
              <div className="border rounded-xl overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between bg-muted/40 hover:bg-muted/60 transition-colors"
                  onClick={() => setShowResume(!showResume)}
                >
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Your Profile Being Submitted
                  </span>
                  {showResume
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </button>

                {showResume && (
                  <div className="p-4 space-y-3 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Name", value: profile?.name },
                        { label: "Email", value: profile?.email },
                        { label: "Phone", value: profile?.phone },
                        { label: "Location", value: profile?.location },
                      ].map(f => f.value && (
                        <div key={f.label}>
                          <p className="text-[10px] text-muted-foreground uppercase">{f.label}</p>
                          <p className="text-xs font-medium truncate">{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {skills.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.map(s => (
                            <Badge key={s} variant="secondary" className={cn(
                              "text-xs",
                              job.skills?.map(js => js.toLowerCase()).includes(s.toLowerCase()) &&
                              "bg-green-100 text-green-700"
                            )}>
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {certs.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase mb-1.5">
                          Certificates ({certs.length})
                        </p>
                        {certs.slice(0, 3).map((c, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {c.name}</p>
                        ))}
                      </div>
                    )}

                    {profile?.bio && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Bio</p>
                        <p className="text-xs text-muted-foreground line-clamp-3">{profile.bio}</p>
                      </div>
                    )}

                    {!skills.length && !profile?.bio && (
                      <p className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                        ⚠ Your profile is incomplete. Add skills and bio in Profile page first.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Cover letter */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Cover Letter <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder={`Hi, I'm interested in the ${job.title} role at ${job.company}. I believe my skills in...`}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                  maxLength={1000}
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {coverLetter.length}/1000
                </p>
              </div>

              {/* Submit */}
              <Button
                className="w-full gap-2"
                onClick={handleApply}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  : <><Send className="h-4 w-4" /> Submit Application</>
                }
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your profile, skills, and certificates will be sent to the HR team
              </p>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}