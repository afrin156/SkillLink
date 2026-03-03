"use client"

import { useState, useEffect } from "react"
import {
  Bookmark, MapPin, Building2, BadgeCheck,
  Clock, ExternalLink, Trash2, Briefcase,
  Globe, Send,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface SavedJob {
  _id: string
  jobId: string
  title: string
  company: string
  location: string
  salary?: string
  skills: string[]
  isVerified?: boolean
  description?: string
  externalUrl?: string
  deadline?: string
  jobExists: boolean
  createdAt: string
}

function formatDeadline(date?: string) {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: "Expired", color: "text-red-500" }
  if (days <= 3) return { label: `${days}d left`, color: "text-red-500" }
  if (days <= 7) return { label: `${days}d left`, color: "text-yellow-600" }
  return { label: `${days}d left`, color: "text-muted-foreground" }
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/saved")
      if (res.ok) {
        const data = await res.json()
        setSavedJobs(data.savedJobs || [])
      }
    } catch { toast.error("Failed to load saved jobs") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSaved() }, [])

  const removeJob = async (jobId: string) => {
    try {
      const res = await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      if (res.ok) {
        setSavedJobs(prev => prev.filter(j => j.jobId !== jobId))
        toast.success("Job removed from saved")
      }
    } catch { toast.error("Failed to remove") }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Saved Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading..." : `${savedJobs.length} saved job${savedJobs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/jobs">
          <Button variant="outline" className="gap-2">
            <Briefcase className="h-4 w-4" /> Browse More Jobs
          </Button>
        </Link>
      </div>

      {/* Jobs */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : savedJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Bookmark className="h-12 w-12 opacity-20" />
            <p className="font-medium">No saved jobs yet</p>
            <p className="text-sm text-center max-w-xs">
              Browse job listings and click the bookmark icon to save jobs you're interested in
            </p>
            <Link href="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedJobs.map(job => {
            const deadline = formatDeadline(job.deadline)
            return (
              <Card key={job._id} className={cn(!job.jobExists && "opacity-60")}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Company logo */}
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg shrink-0">
                      {job.company?.[0]?.toUpperCase() || "J"}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base">{job.title}</h3>
                            {job.isVerified && (
                              <Badge className="text-xs bg-green-100 text-green-700 border-green-200 gap-1">
                                <BadgeCheck className="h-3 w-3" /> Verified
                              </Badge>
                            )}
                            {!job.jobExists && (
                              <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                                No longer available
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {job.company}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {job.location}
                              </span>
                            )}
                            {job.salary && (
                              <span className="font-semibold text-green-600">
                                💰 {job.salary}
                              </span>
                            )}
                            {deadline && (
                              <span className={cn("flex items-center gap-1", deadline.color)}>
                                <Clock className="h-3 w-3" /> {deadline.label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeJob(job.jobId)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          title="Remove from saved"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Skills */}
                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {job.skills.slice(0, 5).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              +{job.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {job.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      )}

                      {/* Saved date */}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Saved {new Date(job.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>

                      {/* Action buttons */}
                      {job.jobExists && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Link href="/jobs">
                            <Button size="sm" className="gap-1.5 text-xs h-8">
                              <Send className="h-3.5 w-3.5" /> Apply Now
                            </Button>
                          </Link>
                          {job.externalUrl && (
                            <a href={job.externalUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                                <ExternalLink className="h-3.5 w-3.5" /> Company Site
                              </Button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
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