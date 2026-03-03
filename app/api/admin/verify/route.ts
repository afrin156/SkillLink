import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { type, id, action } = await req.json()
    const db = await getDb()

    if (type === "hr") {
      await db.collection("users").updateOne(
        { _id: new ObjectId(id) },
        { $set: { isVerifiedHR: action === "verify" } }
      )
    } else if (type === "student") {
      await db.collection("users").updateOne(
        { _id: new ObjectId(id) },
        { $set: { isVerifiedStudent: action === "verify" } }
      )
    } else if (type === "job") {
      await db.collection("jobs").updateOne(
        { _id: new ObjectId(id) },
        { $set: { verificationStatus: action === "verify" ? "verified" : "rejected" } }
      )
    } else if (type === "event") {
      await db.collection("events").updateOne(
        { _id: new ObjectId(id) },
        { $set: { verificationStatus: action === "verify" ? "verified" : "rejected" } }
      )
    }

    return NextResponse.json({ message: `${type} ${action}d successfully` })
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const db = await getDb()
    const [pendingHR, pendingStudents, pendingJobs, pendingEvents] = await Promise.all([
      db.collection("users").find({ role: "hr", isVerifiedHR: false }).toArray(),
      db.collection("users").find({ role: "student", isVerifiedStudent: false }).toArray(),
      db.collection("jobs").find({ verificationStatus: "pending" }).toArray(),
      db.collection("events").find({ verificationStatus: "pending" }).toArray(),
    ])

    return NextResponse.json({ pendingHR, pendingStudents, pendingJobs, pendingEvents })
  } catch {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
