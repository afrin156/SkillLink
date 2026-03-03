// app/api/webinars/[id]/teams/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ✅ await params
  const { id } = await params

  const db = await getDb()
  const teams = await db.collection("hackathonTeams")
    .find({ webinarId: id })
    .toArray()

  return NextResponse.json({ teams })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ✅ await params
  const { id: webinarId } = await params

  const { action, teamName, teamId } = await req.json()
  const db = await getDb()

  const webinar = await db.collection("webinars").findOne({
    _id: new ObjectId(webinarId),
  })

  if (!webinar?.isHackathon) {
    return NextResponse.json({ error: "Not a hackathon" }, { status: 400 })
  }

  const alreadyInTeam = await db.collection("hackathonTeams").findOne({
    webinarId,
    "members.userId": user?.id,
  })
  if (alreadyInTeam) {
    return NextResponse.json({ error: "You are already in a team" }, { status: 400 })
  }

  if (action === "create") {
    if (!teamName?.trim()) {
      return NextResponse.json({ error: "Team name required" }, { status: 400 })
    }

    const nameTaken = await db.collection("hackathonTeams").findOne({
      webinarId, teamName: teamName.trim(),
    })
    if (nameTaken) {
      return NextResponse.json({ error: "Team name already taken" }, { status: 400 })
    }

    await db.collection("hackathonTeams").insertOne({
      webinarId,
      teamName: teamName.trim(),
      leaderId: user?.id,
      members: [{
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        joinedAt: new Date(),
      }],
      maxSize: webinar.maxTeamSize || 4,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Team created!" })
  }

  if (action === "join") {
    if (!teamId) return NextResponse.json({ error: "Team ID required" }, { status: 400 })

    const team = await db.collection("hackathonTeams").findOne({
      _id: new ObjectId(teamId),
    })

    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

    if (team.members.length >= team.maxSize) {
      return NextResponse.json({ error: "Team is full" }, { status: 400 })
    }

    await db.collection("hackathonTeams").updateOne(
      { _id: new ObjectId(teamId) },
      {
        $push: {
          members: {
            userId: user?.id,
            userName: user?.name,
            userEmail: user?.email,
            joinedAt: new Date(),
          },
        } as any,
      }
    )

    return NextResponse.json({ success: true, message: "Joined team!" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}