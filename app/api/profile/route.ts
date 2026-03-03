import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const user = await db.collection("users").findOne(
    { email: session.user?.email },
    { projection: { passwordHash: 0 } }
  )

  return NextResponse.json({ user })
}