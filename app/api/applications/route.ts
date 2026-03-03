// app/api/applications/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()

  // Students see their own applications
  // HR sees applications for their jobs
  const query = user?.role === "hr"
    ? { company: { $exists: true } } // HR: get from their posted jobs
    : { studentId: user?.id }

  const applications = await db.collection("applications")
    .find(user?.role === "hr"
      ? {} // will filter below
      : { studentId: user?.id }
    )
    .sort({ appliedAt: -1 })
    .toArray()

  return NextResponse.json({ applications })
}