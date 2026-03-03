"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface Connection {
  _id: string
  fromUserId: string
  toUserId: string
  status: string
  createdAt: string
}

export default function ConnectionsPage() {
  const [requests, setRequests] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  async function loadRequests() {
    try {
      const res = await fetch("/api/connections?type=incoming")
      const data = await res.json()
      setRequests(data.connections || [])
    } catch {
      toast.error("Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function accept(id: string) {
    const res = await fetch(`/api/connections/${id}/accept`, { method: "POST" })
    if (res.ok) {
      toast.success("Connection accepted")
      loadRequests()
    } else {
      toast.error("Failed to accept")
    }
  }

  async function reject(id: string) {
    const res = await fetch(`/api/connections/${id}/reject`, { method: "POST" })
    if (res.ok) {
      toast.success("Request rejected")
      loadRequests()
    } else {
      toast.error("Failed to reject")
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Connection Requests</h1>

      {requests.length === 0 ? (
        <p className="text-muted-foreground">No pending requests</p>
      ) : (
        requests.map((req) => (
          <Card key={req._id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Request from</p>
              <p className="text-sm text-muted-foreground">{req.fromUserId}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => accept(req._id)}>Accept</Button>
              <Button variant="outline" onClick={() => reject(req._id)}>
                Reject
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
