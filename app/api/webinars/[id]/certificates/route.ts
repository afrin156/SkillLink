// app/api/webinars/[id]/certificate/route.ts
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
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ✅ await params
  const { id: webinarId } = await params

  const db = await getDb()

  const webinar = await db.collection("webinars").findOne({
    _id: new ObjectId(webinarId),
  })
  if (!webinar) return NextResponse.json({ error: "Webinar not found" }, { status: 404 })

  // Get all registrants
  const registrants = await db.collection("webinarRegistrations")
    .find({ webinarId })
    .toArray()

  if (!registrants.length) {
    return NextResponse.json({ error: "No registrants found" }, { status: 400 })
  }

  // Auto-issue certificate to every registrant
  let issued = 0
  for (const reg of registrants) {
    // Avoid duplicate certs
    const alreadyIssued = await db.collection("certificates").findOne({
      userId: reg.userId,
      webinarId,
    })
    if (alreadyIssued) continue

    // Add to certificates collection
    await db.collection("certificates").insertOne({
      userId: reg.userId,
      webinarId,
      certName: `${webinar.title} — Completion Certificate`,
      issuer: webinar.hostedByName || "SkillLink",
      completionDate: new Date().toISOString().split("T")[0],
      source: "webinar",
      uploadedAt: new Date(),
    })

    // Also push to user profile
    await db.collection("users").updateOne(
      { _id: new ObjectId(reg.userId) },
      {
        $push: {
          certificates: {
            name: `${webinar.title} — Completion Certificate`,
            issuer: webinar.hostedByName || "SkillLink",
            completionDate: new Date().toISOString().split("T")[0],
            source: "webinar",
            addedAt: new Date(),
          },
        } as any,
      }
    )
    issued++
  }

  // Mark webinar as completed
  await db.collection("webinars").updateOne(
    { _id: new ObjectId(webinarId) },
    { $set: { status: "completed", completedAt: new Date() } }
  )

  return NextResponse.json({
    success: true,
    issued,
    message: `Certificates issued to ${issued} participant(s)`,
  })
}