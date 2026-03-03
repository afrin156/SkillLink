"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function HRJobDetails() {
  const params = useParams()
  const { data: job } = useSWR(`/api/hr/jobs/${params.id}`, fetcher)

  if (!job) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{job.title}</h1>
      <p>Company: {job.company}</p>
      <p>Location: {job.location}</p>
      <p>Job Type: {job.jobType}</p>
      <p>Salary: {job.salary}</p>
      <p>Description:</p>
      <div className="text-sm text-muted-foreground">{job.description}</div>
      <p className="text-xs">
        Posted on: {new Date(job.createdAt).toLocaleString()}
      </p>
    </div>
  )
}
