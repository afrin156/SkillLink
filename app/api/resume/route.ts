import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

function computeAtsScore(data: any): { score: number; suggestions: string[] } {
  let score = 0
  const suggestions: string[] = []

  if (data.summary && data.summary.length > 30) {
    score += 15
  } else {
    suggestions.push("Add a detailed professional summary (at least 30 characters)")
  }

  if (data.skills && data.skills.length >= 3) {
    score += 15
  } else {
    suggestions.push("Add at least 3 relevant skills")
  }

  if (data.experience && data.experience.length > 0) {
    score += 15
    const hasNumbers = data.experience.some((exp: any) =>
      exp.bullets?.some((b: string) => /\d/.test(b))
    )
    if (hasNumbers) {
      score += 10
    } else {
      suggestions.push("Add measurable impact with numbers in experience bullets")
    }
    const actionVerbs = ["led", "developed", "built", "managed", "designed", "implemented", "created", "improved", "increased", "reduced"]
    const hasActionVerbs = data.experience.some((exp: any) =>
      exp.bullets?.some((b: string) => actionVerbs.some((v) => b.toLowerCase().startsWith(v)))
    )
    if (hasActionVerbs) {
      score += 10
    } else {
      suggestions.push("Start bullet points with strong action verbs (Led, Developed, Built, etc.)")
    }
  } else {
    suggestions.push("Add work experience or internships")
  }

  if (data.projects && data.projects.length > 0) {
    score += 10
  } else {
    suggestions.push("Add at least one project to showcase your skills")
  }

  if (data.education && data.education.length > 0) {
    score += 15
  } else {
    suggestions.push("Add your education details")
  }

  if (data.certifications && data.certifications.length > 0) {
    score += 5
  } else {
    suggestions.push("Consider adding relevant certifications")
  }

  if (data.email) score += 2
  if (data.phone) score += 3

  return { score: Math.min(score, 100), suggestions }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const db = await getDb()
    const resume = await db.collection("resumes").findOne({ userId })
    return NextResponse.json(resume || null)
  } catch {
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { resumeJSON } = await req.json()
    const { score, suggestions } = computeAtsScore(resumeJSON)

    const db = await getDb()
    await db.collection("resumes").updateOne(
      { userId },
      {
        $set: {
          userId,
          resumeJSON,
          atsScore: score,
          suggestions,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ atsScore: score, suggestions })
  } catch {
    return NextResponse.json({ error: "Failed to save resume" }, { status: 500 })
  }
}
