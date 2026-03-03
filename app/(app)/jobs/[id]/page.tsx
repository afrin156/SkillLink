"use client"

import { useState, use } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Briefcase,
  MapPin,
  Clock,
  BadgeCheck,
  ShieldCheck,
  ExternalLink,
  Bookmark,
  Send,
  ArrowLeft,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: job, isLoading } = useSWR(`/api/jobs/${id}`, fetcher)
  const [applying, setApplying] = useState(false)

  async function handleApply() {
    setApplying(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to apply")
      } else {
        toast.success("Application submitted!")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setApplying(false)
    }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/jobs/${id}/save`, { method: "POST" })
      const data = await res.json()
      toast.success(data.saved ? "Job saved!" : "Job unsaved")
    } catch {
      toast.error("Failed to save")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!job || job.error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Briefcase className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="font-semibold text-foreground">Job not found</h3>
        <Link href="/jobs">
          <Button variant="outline" className="bg-transparent">Back to Jobs</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                {job.verificationStatus === "verified" && (
                  <Badge className="gap-1 bg-accent/10 text-accent-foreground hover:bg-accent/10">
                    <ShieldCheck className="h-3 w-3" /> Verified Job
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {job.jobType}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <DollarSign className="h-4 w-4" /> {job.salary}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Posted by</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span>{job.postedByName || "HR Professional"}</span>
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Verified HR</span>
                </div>
              </div>

              <Separator />

              {job.skills?.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 font-semibold text-foreground">Job Description</h3>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.description}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="space-y-3 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <ExternalLink className="h-4 w-4 text-primary" />
                Official Career Page
              </h3>
              <p className="text-xs text-muted-foreground">
                Verify this job on the company's official website
              </p>
              <a href={job.officialCompanyUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Apply on Official Website
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <Button className="w-full gap-1.5" onClick={handleApply} disabled={applying}>
                <Send className="h-4 w-4" />
                {applying ? "Submitting..." : "Apply in SkillLink"}
              </Button>
              <Button variant="outline" className="w-full gap-1.5 bg-transparent" onClick={handleSave}>
                <Bookmark className="h-4 w-4" />
                Save Job
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Job verified by SkillLink admin
                </div>
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  Posted by verified HR professional
                </div>
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Official company career link verified
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
