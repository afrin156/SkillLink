// app/api/mock-interviews/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET — list all open mock interview slots
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const slots = await db.collection("mockInterviewSlots")
    .find({
      status: "open",
      scheduledAt: { $gte: new Date() },
      hostId: { $ne: user?.id }, // Don't show own slots
    })
    .sort({ scheduledAt: 1 })
    .toArray()

  // Also get slots this user is booked in
  const myBooked = await db.collection("mockInterviewSlots")
    .find({
      $or: [
        { hostId: user?.id },
        { guestId: user?.id },
      ],
      scheduledAt: { $gte: new Date() },
    })
    .sort({ scheduledAt: 1 })
    .toArray()

  return NextResponse.json({ slots, myBooked })
}

// POST — create a slot OR book a slot
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, slotId, scheduledAt, domain, notes, meetLink } = await req.json()
  const db = await getDb()

  if (action === "create") {
    if (!scheduledAt || !domain) {
      return NextResponse.json({ error: "Date and domain required" }, { status: 400 })
    }

    await db.collection("mockInterviewSlots").insertOne({
      hostId: user?.id,
      hostName: user?.name,
      hostEmail: user?.email,
      scheduledAt: new Date(scheduledAt),
      domain,
      notes: notes || "",
      meetLink: meetLink || "",
      status: "open",
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Slot created! Others can now book it." })
  }

  if (action === "book") {
    if (!slotId) return NextResponse.json({ error: "Slot ID required" }, { status: 400 })

    const slot = await db.collection("mockInterviewSlots").findOne({
      _id: new ObjectId(slotId),
    })

    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 })
    if (slot.status !== "open") return NextResponse.json({ error: "Slot already booked" }, { status: 400 })
    if (slot.hostId === user?.id) return NextResponse.json({ error: "Cannot book your own slot" }, { status: 400 })

    await db.collection("mockInterviewSlots").updateOne(
      { _id: new ObjectId(slotId) },
      {
        $set: {
          guestId: user?.id,
          guestName: user?.name,
          guestEmail: user?.email,
          status: "booked",
          bookedAt: new Date(),
        },
      }
    )

    // Notify host
    await db.collection("notifications").insertOne({
      userId: slot.hostId,
      type: "mock_interview_booked",
      message: `${user?.name} booked your mock interview slot for ${new Date(slot.scheduledAt).toLocaleString()}`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Interview booked! Check your upcoming sessions." })
  }

  if (action === "cancel") {
    await db.collection("mockInterviewSlots").updateOne(
      { _id: new ObjectId(slotId) },
      { $set: { status: "cancelled", cancelledAt: new Date() } }
    )
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}