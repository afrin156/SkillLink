"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  MessageSquare, Plus, Trash2, Calendar,
  Clock, User, Briefcase, CheckCircle,
  ChevronRight, FileText, Send,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// =====================
// TYPES
// =====================
interface Template {
  _id?: string
  id?: string
  label: string
  text: string
  isDefault?: boolean
}

interface Interview {
  _id: string
  studentName: string
  studentEmail: string
  jobTitle: string
  scheduledAt: string
  notes: string
  status: "scheduled" | "completed" | "cancelled" | "no_show"
}

// =====================
// STATUS CONFIG
// =====================
const INTERVIEW_STATUS = {
  scheduled: { label: "Scheduled", color: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-gray-50 text-gray-600 border-gray-200" },
  no_show: { label: "No Show", color: "bg-red-50 text-red-600 border-red-200" },
}

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

// =====================
// MAIN PAGE
// =====================
export default function HRMessagingPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  // Templates
  const [defaultTemplates, setDefaultTemplates] = useState<Template[]>([])
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [newLabel, setNewLabel] = useState("")
  const [newText, setNewText] = useState("")
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Interviews
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loadingInterviews, setLoadingInterviews] = useState(true)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  // Schedule form
  const [form, setForm] = useState({
    studentName: "",
    studentEmail: "",
    studentId: "",
    jobTitle: "",
    scheduledAt: "",
    notes: "",
  })
  const [scheduling, setScheduling] = useState(false)

  // Copied template text
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Fetch templates ──
  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/hr/message-templates")
      if (res.ok) {
        const data = await res.json()
        setDefaultTemplates(data.defaults || [])
        setCustomTemplates(data.custom || [])
      }
    } catch { toast.error("Failed to load templates") }
    finally { setLoadingTemplates(false) }
  }

  // ── Fetch interviews ──
  const fetchInterviews = async () => {
    try {
      const res = await fetch("/api/hr/interviews")
      if (res.ok) {
        const data = await res.json()
        setInterviews(data.interviews || [])
      }
    } catch { toast.error("Failed to load interviews") }
    finally { setLoadingInterviews(false) }
  }

  useEffect(() => {
    fetchTemplates()
    fetchInterviews()
  }, [])

  // ── Save custom template ──
  const saveTemplate = async () => {
    if (!newLabel.trim() || !newText.trim()) {
      toast.error("Label and message text are required")
      return
    }
    setSavingTemplate(true)
    try {
      const res = await fetch("/api/hr/message-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, text: newText }),
      })
      if (res.ok) {
        toast.success("Template saved!")
        setNewLabel("")
        setNewText("")
        fetchTemplates()
      }
    } catch { toast.error("Failed to save template") }
    finally { setSavingTemplate(false) }
  }

  // ── Delete custom template ──
  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch("/api/hr/message-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        toast.success("Template deleted")
        fetchTemplates()
      }
    } catch { toast.error("Failed to delete") }
  }

  // ── Copy template text ──
  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.text)
    setCopiedId(template.id || template._id || template.label)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Schedule interview ──
  const scheduleInterview = async () => {
    if (!form.studentEmail || !form.jobTitle || !form.scheduledAt) {
      toast.error("Please fill in all required fields")
      return
    }
    setScheduling(true)
    try {
      const res = await fetch("/api/hr/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Interview scheduled!")
        setScheduleOpen(false)
        setForm({
          studentName: "", studentEmail: "", studentId: "",
          jobTitle: "", scheduledAt: "", notes: "",
        })
        fetchInterviews()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to schedule")
      }
    } catch { toast.error("Failed to schedule interview") }
    finally { setScheduling(false) }
  }

  // ── Update interview status ──
  const updateStatus = async (interviewId: string, status: string) => {
    try {
      const res = await fetch("/api/hr/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, status }),
      })
      if (res.ok) {
        setInterviews(prev =>
          prev.map(i => i._id === interviewId ? { ...i, status: status as Interview["status"] } : i)
        )
        toast.success("Status updated!")
      }
    } catch { toast.error("Failed to update") }
  }

  const upcomingInterviews = interviews.filter(i => i.status === "scheduled")
  const pastInterviews = interviews.filter(i => i.status !== "scheduled")

  // =====================
  // RENDER
  // =====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">HR Messaging & Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Manage message templates and schedule interviews
          </p>
        </div>
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Calendar className="h-4 w-4" /> Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Student Name
                </label>
                <Input
                  placeholder="Full name..."
                  value={form.studentName}
                  onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Student Email *
                </label>
                <Input
                  placeholder="student@email.com"
                  type="email"
                  value={form.studentEmail}
                  onChange={e => setForm(p => ({ ...p, studentEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Job Title *
                </label>
                <Input
                  placeholder="e.g. Frontend Developer"
                  value={form.jobTitle}
                  onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Notes / Meeting Link
                </label>
                <Textarea
                  placeholder="Add Zoom/Meet link or any notes..."
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                onClick={scheduleInterview}
                disabled={scheduling}
              >
                {scheduling ? "Scheduling..." : "Confirm Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" /> Message Templates
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" /> Interview Calendar
            {upcomingInterviews.length > 0 && (
              <Badge className="ml-1 text-xs bg-primary text-primary-foreground">
                {upcomingInterviews.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ══ TEMPLATES TAB ══ */}
        <TabsContent value="templates" className="space-y-4">

          {/* Default templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Default Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingTemplates ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : (
                defaultTemplates.map(t => (
                  <div
                    key={t.id}
                    className="rounded-xl border p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="secondary" className="text-xs">{t.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t.text}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Variables: {"{name}"}, {"{role}"}, {"{company}"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5"
                        onClick={() => copyTemplate(t)}
                      >
                        {copiedId === t.id ? (
                          <><CheckCircle className="h-3.5 w-3.5 text-green-600" /> Copied</>
                        ) : (
                          <><Send className="h-3.5 w-3.5" /> Copy</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Custom templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Your Custom Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customTemplates.length === 0 && !loadingTemplates ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom templates yet. Create one below.
                </p>
              ) : (
                customTemplates.map(t => (
                  <div key={t._id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs mb-1.5">{t.label}</Badge>
                        <p className="text-sm text-muted-foreground">{t.text}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm" variant="outline"
                          className="gap-1"
                          onClick={() => copyTemplate(t)}
                        >
                          {copiedId === t._id ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive gap-1"
                          onClick={() => deleteTemplate(t._id!)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Create new template form */}
              <div className="border-t pt-4 mt-4 space-y-3">
                <p className="text-sm font-medium">Create New Template</p>
                <Input
                  placeholder="Template label (e.g. 'Background Check')"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                />
                <Textarea
                  placeholder="Message text... use {name}, {role}, {company} as variables"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={saveTemplate}
                  disabled={savingTemplate}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {savingTemplate ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ CALENDAR TAB ══ */}
        <TabsContent value="calendar" className="space-y-4">

          {/* Upcoming */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Upcoming Interviews ({upcomingInterviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInterviews ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : upcomingInterviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Calendar className="h-10 w-10 opacity-20" />
                  <p>No upcoming interviews</p>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setScheduleOpen(true)}
                    className="gap-2 mt-1"
                  >
                    <Plus className="h-4 w-4" /> Schedule one
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingInterviews.map(interview => (
                    <div
                      key={interview._id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/40"
                    >
                      {/* Date block */}
                      <div className="shrink-0 text-center bg-white border rounded-lg px-3 py-2 min-w-14">
                        <p className="text-xs text-muted-foreground">
                          {new Date(interview.scheduledAt).toLocaleDateString([], { month: "short" })}
                        </p>
                        <p className="text-2xl font-bold leading-tight">
                          {new Date(interview.scheduledAt).getDate()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{interview.studentName || "Student"}</span>
                          <Badge variant="outline" className="text-xs">{interview.jobTitle}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{interview.studentEmail}</p>
                        {interview.notes && (
                          <p className="text-xs text-foreground/70 mt-1.5 bg-white rounded px-2 py-1 border">
                            📎 {interview.notes}
                          </p>
                        )}
                      </div>

                      {/* Status updater */}
                      <Select
                        value={interview.status}
                        onValueChange={val => updateStatus(interview._id, val)}
                      >
                        <SelectTrigger className="h-7 text-xs w-36 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">📅 Scheduled</SelectItem>
                          <SelectItem value="completed">✅ Completed</SelectItem>
                          <SelectItem value="cancelled">🚫 Cancelled</SelectItem>
                          <SelectItem value="no_show">❌ No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past interviews */}
          {pastInterviews.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Past Interviews ({pastInterviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pastInterviews.map(interview => {
                    const config = INTERVIEW_STATUS[interview.status] || INTERVIEW_STATUS.scheduled
                    return (
                      <div
                        key={interview._id}
                        className="flex items-center gap-4 p-3 rounded-xl border opacity-80"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{interview.studentName || "Student"}</span>
                            <Badge variant="outline" className="text-xs">{interview.jobTitle}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(interview.scheduledAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("text-xs shrink-0", config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}