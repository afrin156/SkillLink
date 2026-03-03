import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const events = await db
      .collection("events")
      .find({ verificationStatus: "verified" })
      .sort({ date: -1 })
      .toArray()
    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== "hr" && user.role !== "admin") {
      return NextResponse.json({ error: "Only HR/Admin can create events" }, { status: 403 })
    }

    const body = await req.json()
    const { title, organizer, date, mode, officialUrl, certificateInfo } = body

    if (!title || !organizer || !date || !mode || !officialUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDb()
    await db.collection("events").insertOne({
      title,
      organizer,
      date,
      mode,
      officialUrl,
      certificateInfo: certificateInfo || "",
      createdByUserId: user.id,
      verificationStatus: user.role === "admin" ? "verified" : "pending",
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Event created" })
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
