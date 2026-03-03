import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

// GET — fetch certificates for user
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const certs = await db.collection("certificates")
    .find({ userId: user?.id })
    .sort({ uploadedAt: -1 })
    .toArray()

  return NextResponse.json({ certificates: certs })
}

// POST — upload certificate linked to a skill
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { skillId, skillName, certName, issuer, fileUrl, completionDate } = await req.json()

  if (!certName || !fileUrl) {
    return NextResponse.json({ error: "Certificate name and file required" }, { status: 400 })
  }

  const db = await getDb()

  // Save certificate
  await db.collection("certificates").insertOne({
    userId: user?.id,
    skillId: skillId || null,
    skillName: skillName || null,
    certName,
    issuer: issuer || "",
    fileUrl,
    completionDate: completionDate || null,
    uploadedAt: new Date(),
    source: "roadmap",
  })

  // If linked to a skill, auto-update progress to 100%
  if (skillId) {
    await db.collection("skillProgress").updateOne(
      { userId: user?.id, skillId },
      {
        $set: {
          userId: user?.id,
          skillId,
          percent: 100,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )
  }

  // Also add to user profile certificates
  await db.collection("users").updateOne(
    { email: user?.email },
    {
      $push: {
        certificates: {
          name: certName,
          issuer,
          fileUrl,
          completionDate,
          addedAt: new Date(),
          source: "roadmap",
        },
      } as any,
    }
  )

  return NextResponse.json({ success: true })
}