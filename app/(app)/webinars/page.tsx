"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Video, Users, Award, Calendar, CheckCircle, XCircle, Plus, UserPlus, Loader2, Crown, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Webinar { _id: string; title: string; description: string; scheduledAt: string; totalSeats: number; registeredCount: number; isHackathon: boolean; maxTeamSize: number; hostedByName: string; status: "upcoming" | "live" | "completed" }
interface Team { _id: string; teamName: string; leaderId: string; members: { userId: string; userName: string; userEmail: string }[]; maxSize: number }

const formatDateTime = (d: string) => new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50"

function SeatBadge({ total, registered }: { total: number; registered: number }) {
  const left = total - registered; const pct = (registered / total) * 100
  const color = pct >= 90 ? "text-red-400 border-red-500/20 bg-red-500/10" : pct >= 70 ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className={cn("gap-1", color)}><Users className="h-3 w-3" />{left === 0 ? "Seats Full" : `${left} seat${left !== 1 ? "s" : ""} left`}</Badge>
        <span className="text-white/30">{registered}/{total}</span>
      </div>
      <Progress value={pct} className={cn("h-1.5 bg-white/10", pct >= 90 ? "[&>div]:bg-red-500" : pct >= 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500")} />
    </div>
  )
}

function TeamCard({ team, currentUserId, onJoin }: { team: Team; currentUserId: string; onJoin: (teamId: string) => void }) {
  const isMember = team.members.some(m => m.userId === currentUserId); const isFull = team.members.length >= team.maxSize
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white/80">{team.teamName}</span>
            {isMember && <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">Your Team</Badge>}
          </div>
          <p className="text-xs text-white/30 mt-0.5">{team.members.length}/{team.maxSize} members</p>
        </div>
        {!isMember && !isFull && <Button size="sm" className="gap-1.5 shrink-0 bg-white/5 border-white/10 text-white hover:bg-white/10 border" onClick={() => onJoin(team._id)}><UserPlus className="h-3.5 w-3.5" /> Join</Button>}
        {isFull && !isMember && <Badge variant="outline" className="text-xs text-white/30 border-white/10 shrink-0">Full</Badge>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {team.members.map(m => (
          <div key={m.userId} className="flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1">
            <div className="h-4 w-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-400">{m.userName?.[0]?.toUpperCase()}</div>
            <span className="text-xs text-white/60">{m.userName}</span>
            {m.userId === team.leaderId && <Crown className="h-3 w-3 text-amber-400" />}
          </div>
        ))}
        {Array.from({ length: team.maxSize - team.members.length }).map((_, i) => (
          <div key={i} className="flex items-center gap-1 bg-white/3 border border-dashed border-white/10 rounded-full px-2.5 py-1"><span className="text-xs text-white/20">Empty slot</span></div>
        ))}
      </div>
    </div>
  )
}

function WebinarDetailDialog({ webinar, registered, onRegister, onIssueCerts, isHR }: { webinar: Webinar; registered: boolean; onRegister: () => void; onIssueCerts: () => void; isHR: boolean }) {
  const { data: session } = useSession(); const user = session?.user as any
  const [open, setOpen] = useState(false); const [teams, setTeams] = useState<Team[]>([]); const [newTeamName, setNewTeamName] = useState(""); const [loadingTeams, setLoadingTeams] = useState(false); const [actioning, setActioning] = useState(false)
  const seatsLeft = webinar.totalSeats - webinar.registeredCount
  const fetchTeams = async () => { if (!webinar.isHackathon) return; setLoadingTeams(true); try { const res = await fetch(`/api/webinars/${webinar._id}/teams`); if (res.ok) { const data = await res.json(); setTeams(data.teams || []) } } catch {} finally { setLoadingTeams(false) } }
  useEffect(() => { if (open) fetchTeams() }, [open])
  const createTeam = async () => { if (!newTeamName.trim()) return; setActioning(true); try { const res = await fetch(`/api/webinars/${webinar._id}/teams`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", teamName: newTeamName }) }); const data = await res.json(); if (res.ok) { toast.success(data.message); setNewTeamName(""); fetchTeams() } else toast.error(data.error) } catch { toast.error("Failed to create team") } finally { setActioning(false) } }
  const joinTeam = async (teamId: string) => { setActioning(true); try { const res = await fetch(`/api/webinars/${webinar._id}/teams`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", teamId }) }); const data = await res.json(); if (res.ok) { toast.success(data.message); fetchTeams() } else toast.error(data.error) } catch { toast.error("Failed to join team") } finally { setActioning(false) } }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="shrink-0 bg-white/5 border-white/10 text-white hover:bg-white/10 border">View Details</Button></DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-[#0d1117] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap text-white">
            {webinar.isHackathon ? <><Users className="h-5 w-5 text-violet-400" /> {webinar.title}</> : <><Video className="h-5 w-5 text-blue-400" /> {webinar.title}</>}
            {webinar.status === "live" && <Badge className="bg-red-500 text-white gap-1 animate-pulse"><Wifi className="h-3 w-3" /> LIVE</Badge>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {webinar.description && <p className="text-sm text-white/40">{webinar.description}</p>}
          <div className="flex items-center gap-4 text-xs text-white/30 flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDateTime(webinar.scheduledAt)}</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Hosted by {webinar.hostedByName}</span>
          </div>
          <SeatBadge total={webinar.totalSeats} registered={webinar.registeredCount} />
          {!isHR && <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 border-0" disabled={registered || seatsLeft === 0 || webinar.status === "completed"} onClick={() => { onRegister(); setOpen(false) }}>{registered ? <><CheckCircle className="h-4 w-4" /> Registered</> : seatsLeft === 0 ? "No Seats Available" : webinar.status === "completed" ? "Webinar Ended" : "Register Now"}</Button>}
          {isHR && webinar.status !== "completed" && <Button className="w-full gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 border" onClick={() => { onIssueCerts(); setOpen(false) }}><Award className="h-4 w-4" /> Issue Certificates to All Participants</Button>}
          {webinar.isHackathon && registered && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2 text-white"><Users className="h-4 w-4" /> Hackathon Teams</p>
              <div className="flex gap-2"><Input className={inputClass} placeholder="New team name..." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => e.key === "Enter" && createTeam()} /><Button size="sm" onClick={createTeam} disabled={actioning} className="bg-gradient-to-r from-blue-600 to-violet-600 border-0"><Plus className="h-4 w-4" /></Button></div>
              {loadingTeams ? <div className="flex items-center gap-2 text-white/30 text-sm py-4 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading teams...</div> : teams.length === 0 ? <p className="text-sm text-white/30 text-center py-4">No teams yet. Create the first one!</p> : <div className="space-y-2">{teams.map(team => <TeamCard key={team._id} team={team} currentUserId={user?.id} onJoin={joinTeam} />)}</div>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function WebinarsPage() {
  const { data: session } = useSession(); const user = session?.user as any; const isHR = user?.role === "hr"
  const [webinars, setWebinars] = useState<Webinar[]>([]); const [registrations, setRegistrations] = useState<Set<string>>(new Set()); const [loading, setLoading] = useState(true); const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "", totalSeats: "50", isHackathon: false, maxTeamSize: "4" })

  const fetchWebinars = async () => { try { const res = await fetch("/api/webinars"); if (res.ok) { const data = await res.json(); setWebinars(data.webinars || []) } } catch {} finally { setLoading(false) } }
  useEffect(() => { fetchWebinars(); const interval = setInterval(fetchWebinars, 10000); return () => clearInterval(interval) }, [])

  const handleRegister = async (webinarId: string) => {
    try { const res = await fetch(`/api/webinars/${webinarId}/register`, { method: "POST" }); const data = await res.json(); if (res.ok) { toast.success(`Registered! ${data.seatsLeft} seat(s) remaining`); setRegistrations(prev => new Set([...prev, webinarId])); fetchWebinars() } else toast.error(data.error) } catch { toast.error("Registration failed") }
  }
  const handleIssueCerts = async (webinarId: string) => {
    try { const res = await fetch(`/api/webinars/${webinarId}/certificate`, { method: "POST" }); const data = await res.json(); if (res.ok) { toast.success(data.message); fetchWebinars() } else toast.error(data.error) } catch { toast.error("Failed to issue certificates") }
  }
  const createWebinar = async () => {
    if (!form.title || !form.scheduledAt || !form.totalSeats) { toast.error("Fill all required fields"); return }
    setCreating(true); try { const res = await fetch("/api/webinars", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, totalSeats: Number(form.totalSeats), maxTeamSize: Number(form.maxTeamSize) }) }); if (res.ok) { toast.success("Webinar created!"); setCreateOpen(false); setForm({ title: "", description: "", scheduledAt: "", totalSeats: "50", isHackathon: false, maxTeamSize: "4" }); fetchWebinars() } else { const d = await res.json(); toast.error(d.error) } } catch { toast.error("Failed to create") } finally { setCreating(false) }
  }

  const upcoming = webinars.filter(w => w.status !== "completed"); const completed = webinars.filter(w => w.status === "completed")

  const WebinarCard = ({ w }: { w: Webinar }) => {
    const seatsLeft = w.totalSeats - w.registeredCount; const isRegistered = registrations.has(w._id)
    return (
      <div className={cn("rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10", w.status === "completed" && "opacity-60")}>
        <div className="flex items-start gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", w.isHackathon ? "bg-violet-500/15" : "bg-blue-500/15")}>
            {w.isHackathon ? <Users className="h-5 w-5 text-violet-400" /> : <Video className="h-5 w-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-white/90">{w.title}</span>
              {w.isHackathon && <Badge className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20">Hackathon</Badge>}
              {w.status === "live" && <Badge className="text-xs bg-red-500 text-white gap-1 animate-pulse"><Wifi className="h-2.5 w-2.5" /> LIVE</Badge>}
              {w.status === "completed" && <Badge className="text-xs bg-white/5 text-white/30 border-white/10">Completed</Badge>}
              {isRegistered && <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Registered</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/30 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateTime(w.scheduledAt)}</span>
              <span>by {w.hostedByName}</span>
            </div>
            {w.description && <p className="text-xs text-white/25 mt-1.5 line-clamp-2">{w.description}</p>}
            <div className="mt-3"><SeatBadge total={w.totalSeats} registered={w.registeredCount} /></div>
            <div className="flex gap-2 mt-3">
              {!isHR && w.status !== "completed" && (
                <Button size="sm" disabled={isRegistered || seatsLeft === 0} onClick={() => handleRegister(w._id)} className="gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 border-0">
                  {isRegistered ? <><CheckCircle className="h-3.5 w-3.5" /> Registered</> : seatsLeft === 0 ? "Seats Full" : "Register"}
                </Button>
              )}
              <WebinarDetailDialog webinar={w} registered={isRegistered} onRegister={() => handleRegister(w._id)} onIssueCerts={() => handleIssueCerts(w._id)} isHR={isHR} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1"><Video className="h-4 w-4 text-blue-400" /><span className="text-xs text-blue-400 font-medium">Live Events</span></div>
            <h1 className="text-2xl font-bold text-white">Webinars & Hackathons</h1>
            <p className="text-sm text-white/40 mt-1">Join sessions, form teams, earn certificates</p>
          </div>
          {isHR && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 border-0"><Plus className="h-4 w-4" /> Create Webinar</Button></DialogTrigger>
              <DialogContent className="max-w-md bg-[#0d1117] border-white/10 text-white">
                <DialogHeader><DialogTitle className="text-white">Create Webinar / Hackathon</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input className={inputClass} placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                  <Textarea className={inputClass} placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
                  <Input type="datetime-local" className={inputClass} value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} min={new Date().toISOString().slice(0, 16)} />
                  <Input type="number" className={inputClass} placeholder="Total seats *" value={form.totalSeats} onChange={e => setForm(p => ({ ...p, totalSeats: e.target.value }))} min={1} />
                  <div className="flex items-center gap-3 p-3 border border-white/5 rounded-xl bg-white/3">
                    <button onClick={() => setForm(p => ({ ...p, isHackathon: !p.isHackathon }))} className={cn("h-5 w-9 rounded-full transition-colors relative", form.isHackathon ? "bg-blue-500" : "bg-white/10")}>
                      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", form.isHackathon ? "left-4" : "left-0.5")} />
                    </button>
                    <div><p className="text-sm font-medium text-white">Hackathon mode</p><p className="text-xs text-white/30">Enables team formation</p></div>
                  </div>
                  {form.isHackathon && <Input type="number" className={inputClass} placeholder="Max team size" value={form.maxTeamSize} onChange={e => setForm(p => ({ ...p, maxTeamSize: e.target.value }))} min={2} max={10} />}
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 border-0" onClick={createWebinar} disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-white/5 border-white/5 border">
          <TabsTrigger value="upcoming" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <Video className="h-4 w-4" /> Upcoming {upcoming.length > 0 && <Badge className="ml-1 text-xs bg-blue-500/20 text-blue-400 border-0">{upcoming.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <Award className="h-4 w-4" /> Completed
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {loading ? <div className="flex items-center justify-center py-16 text-white/20 gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading webinars...</span></div>
            : upcoming.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-white/20 gap-2"><Video className="h-12 w-12" /><p className="font-medium text-white/30">No upcoming webinars</p>{isHR && <Button size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 border mt-1 gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create one</Button>}</div>
            : upcoming.map(w => <WebinarCard key={w._id} w={w} />)}
        </TabsContent>
        <TabsContent value="completed" className="space-y-3 mt-4">
          {completed.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-white/20 gap-2"><Award className="h-12 w-12" /><p className="text-white/30">No completed webinars yet</p></div>
            : completed.map(w => <WebinarCard key={w._id} w={w} />)}
        </TabsContent>
      </Tabs>
    </div>
  )
}