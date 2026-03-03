"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type Job = {
  _id: string
  title?: string
  company?: string
  location?: string
  jobType?: string
  isVerified?: boolean
  createdAt?: string
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch("/api/admin/jobs")
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to load jobs")
        return
      }
      setJobs(data.jobs || [])
    } catch {
      toast.error("Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const verifyJob = async (jobId: string) => {
    setVerifyingId(jobId)
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, isVerified: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to verify")
        return
      }
      toast.success("Job verified!")
      await load()
    } catch {
      toast.error("Failed to verify")
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin: Pending Jobs</h1>
        <p className="text-sm text-muted-foreground">Verify jobs before they appear as “Verified” to students.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No pending jobs 🎉</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job._id}>
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/jobs/${job._id}`} className="font-semibold hover:underline">
                      {job.title || "Untitled Job"}
                    </Link>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.company || "Company"} • {job.location || "Location"} • {job.jobType || "Type"}
                  </p>
                </div>

                <Button
                  onClick={() => verifyJob(job._id)}
                  disabled={verifyingId === job._id}
                >
                  {verifyingId === job._id ? "Verifying..." : "Verify"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
