"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Video, Plus, Calendar, Clock, Users,
  CheckCircle, XCircle, BookOpen, Link,
  Loader2, ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

interface MockSlot {
  _id: string
  hostId: string
  hostName: string
  hostEmail: string
  guestId?: string
  guestName?: string
  scheduledAt: string
  domain: string
  notes: string
  meetLink: string
  status: "open" | "booked" | "cancelled"
}

const DOMAINS = ["DSA", "Java", "Python", "System Design", "Frontend", "Backend",
  "DBMS", "OS", "Networks", "HR Round", "Behavioural", "Aptitude"]

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

export default function PeerMockInterviewPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [slots, setSlots] = useState<MockSlot[]>([])
  const [mySlots, setMySlots] = useState<MockSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const [form, setForm] = useState({
    scheduledAt: "", domain: "DSA", notes: "", meetLink: "",
  })

  const fetchSlots = async () => {
    try {
      const res = await fetch("/api/mock-interviews")
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots || [])
        setMySlots(data.myBooked || [])
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSlots() }, [])

  const createSlot = async () => {
    if (!form.scheduledAt || !form.domain) {
      toast.error("Date and domain are required")
      return
    }
    setActing("create")
    try {
      const res = await fetch("/api/mock-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setCreateOpen(false)
        setForm({ scheduledAt: "", domain: "DSA", notes: "", meetLink: "" })
        fetchSlots()
      } else toast.error(data.error)
    } catch { toast.error("Failed to create slot") }
    finally { setActing(null) }
  }

  const bookSlot = async (slotId: string) => {
    setActing(slotId)
    try {
      const res = await fetch("/api/mock-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "book", slotId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchSlots()
      } else toast.error(data.error)
    } catch { toast.error("Failed to book slot") }
    finally { setActing(null) }
  }

  const cancelSlot = async (slotId: string) => {
    setActing(slotId)
    try {
      const res = await fetch("/api/mock-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", slotId }),
      })
      if (res.ok) {
        toast.success("Slot cancelled")
        fetchSlots()
      }
    } catch { toast.error("Failed to cancel") }
    finally { setActing(null) }
  }

  const SlotCard = ({ slot, isMySlot }: { slot: MockSlot; isMySlot?: boolean }) => {
    const isHost = slot.hostId === user?.id
    const isBooked = slot.status === "booked"

    return (
      <Card className={cn(
        "transition-all",
        isBooked && "border-green-200 bg-green-50/30",
        slot.status === "cancelled" && "opacity-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              isBooked ? "bg-green-100" : "bg-primary/10"
            )}>
              <Video className={cn(
                "h-5 w-5",
                isBooked ? "text-green-600" : "text-primary"
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-semibold">
                  {slot.domain}
                </Badge>
                {isBooked && (
                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                    ✓ Booked
                  </Badge>
                )}
                {isHost && (
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                    Your slot
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateTime(slot.scheduledAt)}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {isHost
                    ? isBooked ? `With: ${slot.guestName}` : "Waiting for a partner"
                    : `Host: ${slot.hostName}`}
                </span>
              </div>

              {slot.notes && (
                <p className="text-xs text-muted-foreground mt-1.5 bg-muted rounded px-2 py-1 italic">
                  {slot.notes}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* Meet link */}
                {slot.meetLink && isBooked && (
                  <a href={slot.meetLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="gap-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" /> Join Meeting
                    </Button>
                  </a>
                )}

                {/* Book button (for non-host, open slots) */}
                {!isHost && !isBooked && slot.status === "open" && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={acting === slot._id}
                    onClick={() => bookSlot(slot._id)}
                  >
                    {acting === slot._id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <CheckCircle className="h-3.5 w-3.5" />
                    }
                    Book This Slot
                  </Button>
                )}

                {/* Cancel button for host */}
                {isHost && !isBooked && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    disabled={acting === slot._id}
                    onClick={() => cancelSlot(slot._id)}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Peer Mock Interviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Practice with fellow students — offer or book free mock sessions
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Offer a Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" /> Create Interview Slot
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <p className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-3">
                💡 You interview the other person first, then they interview you.
                Both benefit from practice!
              </p>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Domain *
                </label>
                <Select value={form.domain} onValueChange={v => setForm(p => ({ ...p, domain: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  Google Meet / Zoom Link
                </label>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={form.meetLink}
                  onChange={e => setForm(p => ({ ...p, meetLink: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Notes (optional)
                </label>
                <Input
                  placeholder="e.g. Beginner friendly, focusing on arrays"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={createSlot}
                disabled={acting === "create"}
              >
                {acting === "create" ? "Creating..." : "Create Slot"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> How Peer Mock Interviews Work
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { step: "1", label: "Offer a slot", desc: "Pick your domain & time" },
              { step: "2", label: "Get matched", desc: "Another student books it" },
              { step: "3", label: "Both practice", desc: "Take turns interviewing" },
            ].map(s => (
              <div key={s.step} className="space-y-1">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <p className="text-xs font-semibold">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available" className="gap-2">
            <Video className="h-4 w-4" /> Available Slots
            {slots.length > 0 && (
              <Badge className="ml-1 text-xs">{slots.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mine" className="gap-2">
            <Calendar className="h-4 w-4" /> My Sessions
            {mySlots.length > 0 && (
              <Badge className="ml-1 text-xs">{mySlots.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-3 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading slots...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Video className="h-12 w-12 opacity-20" />
              <p className="font-medium">No open slots right now</p>
              <p className="text-sm text-center max-w-xs">
                Be the first! Offer a slot and get matched with a practice partner.
              </p>
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Offer a Slot
              </Button>
            </div>
          ) : (
            slots.map(slot => <SlotCard key={slot._id} slot={slot} />)
          )}
        </TabsContent>

        <TabsContent value="mine" className="space-y-3 mt-4">
          {mySlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Calendar className="h-12 w-12 opacity-20" />
              <p className="font-medium">No upcoming sessions</p>
              <p className="text-sm">Book an available slot or offer your own!</p>
            </div>
          ) : (
            mySlots.map(slot => <SlotCard key={slot._id} slot={slot} isMySlot />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}