"use client"

import { useState } from "react"
import {
  Video, MapPin, Calendar, Link2, Users,
  Clock, FileText, Plus, CheckCircle, Loader2,
  Mic, Globe, Building2, Trophy,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIES = ["Tech Talk", "Career Guidance", "Skill Building", "Industry Insights", "Hackathon", "Workshop", "AMA Session"]

export default function HRWebinarsPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    mode: "online",
    location: "",
    url: "",
    totalSeats: "100",
    category: "Tech Talk",
    isHackathon: false,
    maxTeamSize: "4",
    duration: "60",
    tags: "",
  })
  const [loading, setLoading] = useState(false)
  const [posted, setPosted] = useState(false)

  const set = (key: string, val: string | boolean) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.date || !form.time) {
      toast.error("Please fill all required fields")
      return
    }
    if (form.mode === "online" && !form.url.trim()) {
      toast.error("Meeting URL is required for online events")
      return
    }
    if (form.mode === "offline" && !form.location.trim()) {
      toast.error("Location is required for offline events")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/webinars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalSeats: parseInt(form.totalSeats) || 100,
          maxTeamSize: parseInt(form.maxTeamSize) || 4,
          duration: parseInt(form.duration) || 60,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          scheduledAt: new Date(`${form.date}T${form.time}`),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPosted(true)
        toast.success("Webinar posted successfully! 🎉")
      } else {
        toast.error(data.error || "Failed to post webinar")
      }
    } catch { toast.error("Failed to post") }
    finally { setLoading(false) }
  }

  if (posted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Webinar Posted!</h2>
        <p className="text-muted-foreground">Your webinar is now live. Students can register and you'll get notified.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setPosted(false); setForm({ title: "", description: "", date: "", time: "", mode: "online", location: "", url: "", totalSeats: "100", category: "Tech Talk", isHackathon: false, maxTeamSize: "4", duration: "60", tags: "" }) }}>
            <Plus className="h-4 w-4 mr-2" /> Post Another
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/webinars"}>
            View All Webinars
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Post a Webinar / Event</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Host a session for students — tech talks, workshops, hackathons & more
        </p>
      </div>

      {/* Event Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" /> Event Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          <div>
            <Label className="mb-2 block">Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => set("category", cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    form.category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  )}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Hackathon toggle */}
          <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-semibold text-orange-800">This is a Hackathon</p>
                <p className="text-xs text-orange-600">Enables team formation for participants</p>
              </div>
            </div>
            <button type="button"
              onClick={() => set("isHackathon", !form.isHackathon)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                form.isHackathon ? "bg-orange-500" : "bg-muted"
              )}>
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                form.isHackathon ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>

          {form.isHackathon && (
            <div className="space-y-1">
              <Label>Max Team Size</Label>
              <div className="flex gap-2">
                {["2", "3", "4", "5", "6"].map(n => (
                  <button key={n} type="button" onClick={() => set("maxTeamSize", n)}
                    className={cn(
                      "h-9 w-9 rounded-lg border text-sm font-medium transition-all",
                      form.maxTeamSize === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                    )}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input className="mt-1" placeholder="e.g. Introduction to Machine Learning"
              value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div>
            <Label>Description <span className="text-red-500">*</span></Label>
            <Textarea className="mt-1 resize-none" rows={4}
              placeholder="What will students learn? Who should attend? What topics will be covered?"
              value={form.description} onChange={e => set("description", e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.description.length} chars</p>
          </div>

          <div>
            <Label>Tags <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input className="mt-1" placeholder="Python, AI, Beginners (comma separated)"
              value={form.tags} onChange={e => set("tags", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Date, Time & Duration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" className="mt-1" value={form.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <Label>Time <span className="text-red-500">*</span></Label>
              <Input type="time" className="mt-1" value={form.time}
                onChange={e => set("time", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Duration (minutes)
            </Label>
            <div className="flex gap-2 mt-1">
              {["30", "45", "60", "90", "120"].map(d => (
                <button key={d} type="button" onClick={() => set("duration", d)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    form.duration === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                  )}>
                  {d === "60" ? "1h" : d === "90" ? "1.5h" : d === "120" ? "2h" : `${d}m`}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode & Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Mode & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "online", label: "Online", icon: Video, desc: "Virtual event" },
              { value: "offline", label: "Offline", icon: Building2, desc: "In-person event" },
            ].map(m => (
              <button key={m.value} type="button" onClick={() => set("mode", m.value)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                  form.mode === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}>
                <m.icon className={cn("h-5 w-5", form.mode === m.value ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className={cn("text-sm font-semibold", form.mode === m.value && "text-primary")}>{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {form.mode === "online" && (
            <div>
              <Label className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Meeting URL <span className="text-red-500">*</span>
              </Label>
              <Input className="mt-1" placeholder="https://meet.google.com/xxx or zoom link"
                value={form.url} onChange={e => set("url", e.target.value)} />
            </div>
          )}

          {form.mode === "offline" && (
            <div>
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Venue <span className="text-red-500">*</span>
              </Label>
              <Input className="mt-1" placeholder="e.g. Hall A, Tech Park, Bangalore"
                value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Capacity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Total Seats</Label>
            <div className="flex gap-2 mt-1">
              {["50", "100", "200", "500", "1000"].map(n => (
                <button key={n} type="button" onClick={() => set("totalSeats", n)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    form.totalSeats === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                  )}>
                  {n}
                </button>
              ))}
              <Input className="w-24 h-8 text-xs" placeholder="Custom"
                value={!["50","100","200","500","1000"].includes(form.totalSeats) ? form.totalSeats : ""}
                onChange={e => set("totalSeats", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview & Submit */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-3">Preview</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{form.category}</Badge>
              {form.isHackathon && <Badge className="bg-orange-100 text-orange-700 border-orange-200">🏆 Hackathon</Badge>}
              <Badge variant="outline">{form.mode === "online" ? "🌐 Online" : "📍 Offline"}</Badge>
            </div>
            <p className="font-semibold text-base">{form.title || "Event title..."}</p>
            {form.date && form.time && (
              <p className="text-muted-foreground text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(`${form.date}T${form.time}`).toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })} at {new Date(`${form.date}T${form.time}`).toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
            <p className="text-muted-foreground text-xs flex items-center gap-1">
              <Users className="h-3 w-3" /> {form.totalSeats} seats
              {form.isHackathon && ` · Teams of ${form.maxTeamSize}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-12 text-base gap-2" onClick={handleSubmit} disabled={loading}>
        {loading
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Posting...</>
          : <><Video className="h-5 w-5" /> Post Webinar</>
        }
      </Button>
    </div>
  )
}