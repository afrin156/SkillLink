import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as any
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const db = await getDb()

    // ✅ change the filter depending on your schema
    const pendingJobs = await db
      .collection("jobs")
      .find({ isVerified: { $ne: true } }) // pending jobs
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ jobs: pendingJobs })
  } catch {
    return NextResponse.json({ error: "Failed to fetch pending jobs" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = session.user as any
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { jobId, isVerified } = await req.json()
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

    const db = await getDb()

    await db.collection("jobs").updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          isVerified: isVerified === false ? false : true, // default true
          verifiedAt: new Date(),
          verifiedBy: user.id,
        },
      }
    )

    return NextResponse.json({ message: "Updated" })
  } catch {
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 })
  }
}
