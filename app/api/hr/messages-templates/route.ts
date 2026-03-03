import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

// Default templates every HR gets
const DEFAULT_TEMPLATES = [
  {
    id: "shortlisted",
    label: "Shortlisted",
    text: "Hi {name}, great news! You have been shortlisted for the {role} position at {company}. We will be in touch shortly with next steps.",
  },
  {
    id: "interview_scheduled",
    label: "Interview Scheduled",
    text: "Hi {name}, your interview for {role} at {company} has been scheduled. Please check your calendar for the invite details.",
  },
  {
    id: "rejected",
    label: "Not Selected",
    text: "Hi {name}, thank you for applying for {role} at {company}. After careful consideration, we have decided to move forward with other candidates. We wish you the best.",
  },
  {
    id: "offer",
    label: "Job Offer",
    text: "Hi {name}, congratulations! We are pleased to offer you the {role} position at {company}. Please reply to discuss next steps.",
  },
]

// GET — fetch HR templates (custom + defaults)
export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = await getDb()
  const custom = await db.collection("messageTemplates")
    .find({ userId: user?.id })
    .toArray()

  return NextResponse.json({
    defaults: DEFAULT_TEMPLATES,
    custom: custom || [],
  })
}

// POST — save a custom template
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { label, text } = await req.json()
  if (!label || !text) {
    return NextResponse.json({ error: "Label and text required" }, { status: 400 })
  }

  const db = await getDb()
  await db.collection("messageTemplates").insertOne({
    userId: user?.id,
    label,
    text,
    createdAt: new Date(),
  })

  return NextResponse.json({ success: true })
}

// DELETE — remove a custom template
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await req.json()
  const db = await getDb()
  const { ObjectId } = await import("mongodb")

  await db.collection("messageTemplates").deleteOne({
    _id: new ObjectId(id),
    userId: user?.id,
  })

  return NextResponse.json({ success: true })
}