import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

// PATCH — update status only (GET is handled by /api/saved)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ✅ same userId fix
  const userId = user?.id || user?._id?.toString()
  const { jobId, status } = await req.json()

  const validStatuses = ["saved", "applied", "interview_scheduled", "closed", "rejected"]
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const db = await getDb()
  await db.collection("savedJobs").updateOne(
    { userId, jobId },
    { $set: { status, updatedAt: new Date() } }
  )

  return NextResponse.json({ success: true })
}