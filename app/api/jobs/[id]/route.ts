import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDb()
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(id) })
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    return NextResponse.json(job)
  } catch {
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 })
  }
}
