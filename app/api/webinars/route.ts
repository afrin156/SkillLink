// app/api/webinars/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET — fetch all webinars
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const webinars = await db.collection("webinars")
    .find({})
    .sort({ scheduledAt: 1 })
    .toArray()

  return NextResponse.json({ webinars })
}

// POST — create a webinar (HR only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, description, scheduledAt, totalSeats, isHackathon, maxTeamSize } = await req.json()

  if (!title || !scheduledAt || !totalSeats) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const db = await getDb()
  const result = await db.collection("webinars").insertOne({
    title,
    description: description || "",
    scheduledAt: new Date(scheduledAt),
    totalSeats: Number(totalSeats),
    registeredCount: 0,
    isHackathon: isHackathon || false,
    maxTeamSize: maxTeamSize || 4,
    hostedBy: user?.id,
    hostedByName: user?.name,
    hostedByEmail: user?.email,
    status: "upcoming",
    createdAt: new Date(),
  })

  return NextResponse.json({ success: true, id: result.insertedId })
}