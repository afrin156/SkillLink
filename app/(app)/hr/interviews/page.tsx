"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, User, Video, MapPin, Phone, CheckCircle, XCircle, Loader2, Plus, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MODE_ICON: Record<string, any> = {
  Online: Video, "In-Person": MapPin, Phone: Phone
}

export default function InterviewSchedulerPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("upcoming")

  useEffect(() => { fetchInterviews() }, [])

  async function fetchInterviews() {
    try {
      const res = await fetch("/api/hr/interviews")
      if (res.ok) { const data = await res.json(); setInterviews(data.interviews || []) }
    } catch { toast.error("Failed to load interviews") }
    finally { setLoading(false) }
  }

  async function updateInterviewStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/hr/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Interview marked as ${status}`)
        setInterviews(prev => prev.map(i => i._id === id ? { ...i, status } : i))
      }
    } catch { toast.error("Failed to update") }
  }

  // Demo data fallback
  const demoInterviews = [
    {
      _id: "1", applicantName: "Nisha", jobTitle: "SW Test Engineer",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      time: "10:00", mode: "Online", platform: "https://meet.google.com/abc-xyz",
      status: "scheduled", email: "nisha@example.com"
    },
    {
      _id: "2", applicantName: "Yasodha", jobTitle: "QA Tester",
      date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
      time: "14:30", mode: "In-Person", location: "123 MG Road, Chennai",
      status: "scheduled", email: "yasodha@example.com"
    },
    {
      _id: "3", applicantName: "AfrinNisha", jobTitle: "UI/UX Designer",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      time: "11:00", mode: "Online", platform: "https://zoom.us/j/123",
      status: "completed", email: "afrin@example.com"
    },
  ]

  const displayed = (interviews.length > 0 ? interviews : demoInterviews).filter(i => {
    const isPast = new Date(`${i.date} ${i.time}`) < new Date()
    if (filter === "upcoming") return !isPast && i.status === "scheduled"
    if (filter === "completed") return i.status === "completed"
    if (filter === "cancelled") return i.status === "cancelled"
    return true
  })

  const upcoming = (interviews.length > 0 ? interviews : demoInterviews).filter(i => {
    const isPast = new Date(`${i.date} ${i.time}`) < new Date()
    return !isPast && i.status === "scheduled"
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interview Scheduler</h1>
          <p className="text-sm text-muted-foreground">{upcoming.length} upcoming interview{upcoming.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="gap-2" onClick={() => window.location.href = "/hr/applicants"}>
          <Plus className="h-4 w-4" /> Schedule New
        </Button>
      </div>

      {/* Today's interviews highlight */}
      {(() => {
        const today = new Date().toISOString().split("T")[0]
        const todayInterviews = (interviews.length > 0 ? interviews : demoInterviews)
          .filter(i => i.date === today && i.status === "scheduled")
        if (todayInterviews.length === 0) return null
        return (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Interviews ({todayInterviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayInterviews.map(i => (
                <div key={i._id} className="flex items-center justify-between p-3 bg-background rounded-xl border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                      {i.applicantName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{i.applicantName}</p>
                      <p className="text-xs text-muted-foreground">{i.jobTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{i.time}</p>
                    <p className="text-xs text-muted-foreground">{i.mode}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })()}

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "upcoming", "completed", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-sm border transition-all capitalize",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40")}>
            {f}
          </button>
        ))}
      </div>

      {/* Interview List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Calendar className="h-14 w-14 text-muted-foreground/30 mx-auto" />
          <p className="text-lg font-medium text-muted-foreground">No interviews found</p>
          <p className="text-sm text-muted-foreground">Schedule interviews from the Applicants page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(interview => {
            const ModeIcon = MODE_ICON[interview.mode] || Video
            const isPast = new Date(`${interview.date} ${interview.time}`) < new Date()
            return (
              <Card key={interview._id} className={cn("transition-all",
                interview.status === "completed" && "opacity-60",
                interview.status === "cancelled" && "opacity-40")}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                        {interview.applicantName?.[0]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{interview.applicantName}</p>
                          <Badge variant="outline" className={cn("text-xs",
                            interview.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                            interview.status === "cancelled" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                            "bg-blue-500/10 text-blue-600 border-blue-500/20")}>
                            {interview.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(interview.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />{interview.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <ModeIcon className="h-3.5 w-3.5" />{interview.mode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />{interview.email}
                          </span>
                        </div>
                        {interview.platform && (
                          <a href={interview.platform} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline">
                            {interview.platform}
                          </a>
                        )}
                        {interview.location && (
                          <p className="text-xs text-muted-foreground">{interview.location}</p>
                        )}
                        {interview.notes && (
                          <p className="text-xs text-muted-foreground italic">Note: {interview.notes}</p>
                        )}
                      </div>
                    </div>

                    {interview.status === "scheduled" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="gap-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => updateInterviewStatus(interview._id, "completed")}>
                          <CheckCircle className="h-3.5 w-3.5" /> Done
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => updateInterviewStatus(interview._id, "cancelled")}>
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}