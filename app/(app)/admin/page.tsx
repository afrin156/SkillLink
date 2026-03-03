"use client"

import useSWR, { mutate } from "swr"
import {
  Shield,
  BadgeCheck,
  ShieldCheck,
  Briefcase,
  Calendar,
  UserCheck,
  GraduationCap,
  Check,
  X,
  Users,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminPanel() {
  const { data, isLoading } = useSWR("/api/admin/verify", fetcher)
  const [search, setSearch] = useState("")

  async function handleVerify(type: string, id: string, action: string) {
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${type} ${action}d successfully`)
      mutate("/api/admin/verify")
    } catch {
      toast.error("Action failed")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Shield className="h-6 w-6 text-primary" />
          Admin Panel
        </h1>
        <p className="mt-1 text-muted-foreground">Manage verifications and platform trust</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{data?.pendingHR?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pending HR</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <GraduationCap className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xl font-bold text-foreground">{data?.pendingStudents?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{data?.pendingJobs?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xl font-bold text-foreground">{data?.pendingEvents?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or title..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <Tabs defaultValue="hr">
          <TabsList>
            <TabsTrigger value="hr" className="gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> HR ({data?.pendingHR?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Students ({data?.pendingStudents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Jobs ({data?.pendingJobs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Events ({data?.pendingEvents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hr" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending HR Verifications</CardTitle>
                <CardDescription>Review and verify HR / recruiter accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.pendingHR?.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No pending HR verifications</div>
                ) : (
                  <div className="space-y-3">
                    {data?.pendingHR
                      ?.filter((u: any) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
                      .map((user: any) => (
                        <div key={user._id} className="flex items-center justify-between rounded-lg border border-border p-4">
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="gap-1" onClick={() => handleVerify("hr", user._id, "verify")}>
                              <Check className="h-3.5 w-3.5" /> Verify
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => handleVerify("hr", user._id, "reject")}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Student Verifications</CardTitle>
                <CardDescription>Review and verify student accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.pendingStudents?.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No pending student verifications</div>
                ) : (
                  <div className="space-y-3">
                    {data?.pendingStudents
                      ?.filter((u: any) => !search || u.name?.toLowerCase().includes(search.toLowerCase()))
                      .map((user: any) => (
                        <div key={user._id} className="flex items-center justify-between rounded-lg border border-border p-4">
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="gap-1" onClick={() => handleVerify("student", user._id, "verify")}>
                              <Check className="h-3.5 w-3.5" /> Verify
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => handleVerify("student", user._id, "reject")}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Job Verifications</CardTitle>
                <CardDescription>Review and approve job listings</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.pendingJobs?.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No pending jobs</div>
                ) : (
                  <div className="space-y-3">
                    {data?.pendingJobs
                      ?.filter((j: any) => !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.company?.toLowerCase().includes(search.toLowerCase()))
                      .map((job: any) => (
                        <div key={job._id} className="flex items-center justify-between rounded-lg border border-border p-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{job.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.company} - {job.location}
                            </p>
                            <a href={job.officialCompanyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              {job.officialCompanyUrl}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="gap-1" onClick={() => handleVerify("job", job._id, "verify")}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleVerify("job", job._id, "reject")}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Event Verifications</CardTitle>
                <CardDescription>Review and approve events / webinars</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.pendingEvents?.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No pending events</div>
                ) : (
                  <div className="space-y-3">
                    {data?.pendingEvents
                      ?.filter((e: any) => !search || e.title?.toLowerCase().includes(search.toLowerCase()))
                      .map((event: any) => (
                        <div key={event._id} className="flex items-center justify-between rounded-lg border border-border p-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.organizer} - {event.date} - {event.mode}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="gap-1" onClick={() => handleVerify("event", event._id, "verify")}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleVerify("event", event._id, "reject")}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
