"use client"

import { useState, useEffect } from "react"
import {
  Plus, Briefcase, MapPin, DollarSign, Clock, Users, Trash2,
  Edit, Eye, ChevronDown, ChevronUp, Loader2, CheckCircle,
  XCircle, AlertTriangle, Building2, Tag, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"]
const LOCATIONS = ["Remote", "Hybrid", "On-site"]
const EXPERIENCE = ["Fresher", "0-1 years", "1-2 years", "2-5 years", "5+ years"]
const DOMAINS = ["Engineering", "Design", "Marketing", "Finance", "HR", "Sales", "Operations", "Data Science", "Product"]

export default function PostedJobsPage() {
  const [showForm, setShowForm] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [skillInput, setSkillInput] = useState("")

  const [form, setForm] = useState({
    title: "",
    company: "",
    domain: "",
    location: "",
    locationType: "Remote",
    jobType: "Full-time",
    experience: "Fresher",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requirements: "",
    skills: [] as string[],
    deadline: "",
    openings: "1",
  })

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    try {
      const res = await fetch("/api/hr/jobs")
      if (res.ok) { const data = await res.json(); setJobs(data.jobs || []) }
    } catch { toast.error("Failed to load jobs") }
    finally { setLoading(false) }
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) {
      setForm(p => ({ ...p, skills: [...p.skills, s] }))
      setSkillInput("")
    }
  }

  function removeSkill(skill: string) {
    setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))
  }

  async function handleSubmit() {
    if (!form.title || !form.company || !form.description || !form.location) {
      toast.error("Please fill all required fields"); return
    }
    if (form.skills.length === 0) { toast.error("Add at least one required skill"); return }

    setSubmitting(true)
    try {
      const res = await fetch("/api/hr/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Job posted successfully!")
        setShowForm(false)
        setForm({
          title: "", company: "", domain: "", location: "", locationType: "Remote",
          jobType: "Full-time", experience: "Fresher", salaryMin: "", salaryMax: "",
          description: "", requirements: "", skills: [], deadline: "", openings: "1",
        })
        fetchJobs()
      } else {
        toast.error(data.error || "Failed to post job")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSubmitting(false) }
  }

  async function deleteJob(jobId: string) {
    if (!confirm("Delete this job posting?")) return
    try {
      const res = await fetch(`/api/hr/jobs/${jobId}`, { method: "DELETE" })
      if (res.ok) { toast.success("Job deleted"); fetchJobs() }
      else toast.error("Failed to delete")
    } catch { toast.error("Something went wrong") }
  }

  const f = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posted Jobs</h1>
          <p className="text-muted-foreground text-sm">{jobs.length} active listing{jobs.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Post New Job"}
        </Button>
      </div>

      {/* ── JOB POSTING FORM ── */}
      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              New Job Posting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Row 1: Title + Company */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Job Title <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Frontend Developer" value={form.title} onChange={e => f("title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Company Name <span className="text-red-500">*</span></label>
                <Input placeholder="Your company name" value={form.company} onChange={e => f("company", e.target.value)} />
              </div>
            </div>

            {/* Row 2: Domain + Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Domain / Department</label>
                <div className="flex flex-wrap gap-1.5">
                  {DOMAINS.map(d => (
                    <button key={d} type="button" onClick={() => f("domain", d)}
                      className={cn("px-2.5 py-1 rounded-lg text-xs border transition-all",
                        form.domain === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">City / Location <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Chennai, Bangalore" value={form.location} onChange={e => f("location", e.target.value)} />
              </div>
            </div>

            {/* Row 3: Type selectors */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Work Mode</label>
                <div className="flex gap-1.5">
                  {LOCATIONS.map(l => (
                    <button key={l} type="button" onClick={() => f("locationType", l)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs border transition-all",
                        form.locationType === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Job Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {JOB_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => f("jobType", t)}
                      className={cn("px-2.5 py-1 rounded-lg text-xs border transition-all",
                        form.jobType === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Experience Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCE.map(exp => (
  <button key={exp} type="button" onClick={() => f("experience", exp)}
    className={cn("px-2.5 py-1 rounded-lg text-xs border transition-all",
      form.experience === exp ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
    {exp}
  </button>
))}
                </div>
              </div>
            </div>

            {/* Row 4: Salary + Deadline + Openings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Salary Range (₹/month)</label>
                <div className="flex gap-2 items-center">
                  <Input placeholder="Min" value={form.salaryMin} onChange={e => f("salaryMin", e.target.value)} />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input placeholder="Max" value={form.salaryMax} onChange={e => f("salaryMax", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Application Deadline</label>
                <Input type="date" value={form.deadline} onChange={e => f("deadline", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">No. of Openings</label>
                <Input type="number" min="1" placeholder="1" value={form.openings} onChange={e => f("openings", e.target.value)} />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Required Skills <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <Input placeholder="e.g. React, Python, Figma..."
                  value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.skills.map(s => (
                    <Badge key={s} variant="secondary" className="gap-1 cursor-pointer hover:bg-red-100"
                      onClick={() => removeSkill(s)}>
                      {s} <XCircle className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Job Description <span className="text-red-500">*</span></label>
              <Textarea placeholder="Describe the role, responsibilities, what the candidate will be doing..."
                rows={4} value={form.description} onChange={e => f("description", e.target.value)} />
            </div>

            {/* Requirements */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Requirements / Qualifications</label>
              <Textarea placeholder="List educational qualifications, certifications, or specific requirements..."
                rows={3} value={form.requirements} onChange={e => f("requirements", e.target.value)} />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting...</> : "Post Job"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── JOB LIST ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Briefcase className="h-14 w-14 text-muted-foreground/30 mx-auto" />
          <p className="text-lg font-medium text-muted-foreground">No jobs posted yet</p>
          <p className="text-sm text-muted-foreground">Click "Post New Job" to create your first listing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <Card key={job._id} className="hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{job.title}</h3>
                      <Badge variant="outline" className="text-xs">{job.jobType}</Badge>
                      <Badge variant="outline" className="text-xs">{job.locationType}</Badge>
                      {job.experience && <Badge variant="secondary" className="text-xs">{job.experience}</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                      {job.salaryMin && <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />₹{job.salaryMin}–{job.salaryMax}</span>}
                      {job.deadline && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.applicantCount || 0} applicants</span>
                    </div>
                    {job.skills?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {job.skills.slice(0, 5).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {job.skills.length > 5 && <Badge variant="secondary" className="text-xs">+{job.skills.length - 5}</Badge>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => window.location.href = `/hr/applicants?job=${job._id}`}>
                      <Eye className="h-3.5 w-3.5" /> View Applicants
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteJob(job._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}