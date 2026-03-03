"use client"

import React from "react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import useSWR, { mutate } from "swr"
import {
  Briefcase, Plus, Users, BadgeCheck, Lock,
  ExternalLink, Clock, ShieldCheck, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ✅ Safe helper — always returns an array no matter what API sends
function toArray(data: any, key?: string): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (key && Array.isArray(data[key])) return data[key]
  // Try common keys
  for (const k of ["jobs", "applications", "applicants", "data", "items", "results"]) {
    if (Array.isArray(data[k])) return data[k]
  }
  return []
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified")
    return (
      <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <ShieldCheck className="h-3 w-3" /> Verified
      </Badge>
    )
  if (status === "rejected")
    return (
      <Badge className="gap-1 bg-red-500/10 text-red-400 border border-red-500/20">
        <AlertTriangle className="h-3 w-3" /> Rejected
      </Badge>
    )
  return (
    <Badge className="gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  )
}

export default function HRDashboard() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isVerified = user?.isVerifiedHR

  const { data: jobsData, isLoading } = useSWR(isVerified ? "/api/hr/jobs" : null, fetcher)
  const { data: applicantsData } = useSWR(isVerified ? "/api/hr/applicants" : null, fetcher)

  // ✅ Bulletproof — handles any API response shape
  const jobs = toArray(jobsData, "jobs")
  const applicants = toArray(applicantsData, "applications")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [posting, setPosting] = useState(false)

  const [form, setForm] = useState({
    title: "", company: "", location: "", jobType: "Full-time",
    skills: "", description: "", salary: "", officialCompanyUrl: "",
  })

  async function handlePostJob(e: React.FormEvent) {
    e.preventDefault()
    setPosting(true)
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to post job")
      } else {
        toast.success("Job posted successfully!")
        setDialogOpen(false)
        setForm({ title: "", company: "", location: "", jobType: "Full-time", skills: "", description: "", salary: "", officialCompanyUrl: "" })
        mutate("/api/hr/jobs")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setPosting(false)
    }
  }

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white">HR Dashboard Locked</h2>
        <p className="max-w-sm text-center text-sm text-white/40">
          Your HR account is pending verification. An admin will review and verify your account.
          Once verified, you can post jobs and manage applicants.
        </p>
        <Badge className="gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3" /> Pending Verification
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              HR Dashboard <BadgeCheck className="h-6 w-6 text-blue-400" />
            </h1>
            <p className="mt-1 text-white/40 text-sm">Manage your job postings and applicants</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 border-0">
                <Plus className="h-4 w-4" /> Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl bg-[#0d1117] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Post a New Job</DialogTitle>
                <DialogDescription className="text-white/40">
                  Job will be submitted for admin verification before appearing publicly.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePostJob} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white/60">Job Title *</Label>
                    <Input required className="bg-white/5 border-white/10 text-white placeholder:text-white/20" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Frontend Developer" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60">Company *</Label>
                    <Input required className="bg-white/5 border-white/10 text-white placeholder:text-white/20" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. TechCorp" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white/60">Location *</Label>
                    <Input required className="bg-white/5 border-white/10 text-white placeholder:text-white/20" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bangalore, India" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/60">Job Type *</Label>
                    <Select value={form.jobType} onValueChange={(v) => setForm({ ...form, jobType: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#0d1117] border-white/10 text-white">
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Skills (comma-separated)</Label>
                  <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/20" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, TypeScript" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Salary Range</Label>
                  <Input className="bg-white/5 border-white/10 text-white placeholder:text-white/20" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="e.g. 6-10 LPA" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Official Company Career Page URL *</Label>
                  <Input required type="url" className="bg-white/5 border-white/10 text-white placeholder:text-white/20" value={form.officialCompanyUrl} onChange={(e) => setForm({ ...form, officialCompanyUrl: e.target.value })} placeholder="https://careers.company.com/job/123" />
                  <p className="text-xs text-white/25">Must start with https://</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Job Description *</Label>
                  <Textarea required rows={5} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role, responsibilities, and requirements..." />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-violet-600 border-0" disabled={posting}>
                  {posting ? "Posting..." : "Submit for Verification"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Jobs Posted", value: jobs.length, icon: Briefcase, gradient: "from-blue-500 to-blue-700" },
          { label: "Active Jobs", value: jobs.filter((j: any) => j.isActive !== false).length, icon: ShieldCheck, gradient: "from-emerald-500 to-emerald-700" },
          { label: "Total Applicants", value: applicants.length, icon: Users, gradient: "from-violet-500 to-violet-700" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md shrink-0`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/30">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Jobs */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-base font-semibold text-white mb-1">My Job Postings</h2>
        <p className="text-xs text-white/30 mb-4">Jobs you have posted and their verification status</p>
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}</div>
        ) : jobs.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/30">No jobs posted yet</div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div key={job._id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 p-4 hover:bg-white/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white/80">{job.title}</span>
                    <StatusBadge status={job.verificationStatus} />
                  </div>
                  <p className="text-xs text-white/30">{job.company} — {job.location} — {job.jobType}</p>
                </div>
                {job.officialCompanyUrl && (
                  <a href={job.officialCompanyUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="text-white/30 hover:text-white">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applicants */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-base font-semibold text-white mb-1">Recent Applicants</h2>
        <p className="text-xs text-white/30 mb-4">Students who applied through SkillLink</p>
        {applicants.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/30">No applicants yet</div>
        ) : (
          <div className="space-y-3">
            {applicants.map((app: any) => (
              <div key={app._id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 p-4 hover:bg-white/5 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium text-white/80">{app.userName || "Student"}</p>
                  <p className="text-xs text-white/30">Applied for: {app.jobTitle} at {app.company}</p>
                </div>
                <Badge className="capitalize bg-white/8 text-white/40 border-white/10">{app.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}