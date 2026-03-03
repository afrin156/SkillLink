// app/api/webinars/[id]/register/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ✅ await params
  const { id: webinarId } = await params

  const db = await getDb()

  const webinar = await db.collection("webinars").findOne({
    _id: new ObjectId(webinarId),
  })

  if (!webinar) return NextResponse.json({ error: "Webinar not found" }, { status: 404 })

  if (webinar.registeredCount >= webinar.totalSeats) {
    return NextResponse.json({ error: "No seats available" }, { status: 400 })
  }

  const existing = await db.collection("webinarRegistrations").findOne({
    webinarId,
    userId: user?.id,
  })
  if (existing) {
    return NextResponse.json({ error: "Already registered" }, { status: 400 })
  }

  await db.collection("webinarRegistrations").insertOne({
    webinarId,
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email,
    registeredAt: new Date(),
  })

  await db.collection("webinars").updateOne(
    { _id: new ObjectId(webinarId) },
    { $inc: { registeredCount: 1 } }
  )

  const seatsLeft = webinar.totalSeats - webinar.registeredCount - 1

  return NextResponse.json({ success: true, seatsLeft })
}