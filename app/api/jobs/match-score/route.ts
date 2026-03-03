// app/api/jobs/match-score/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobId, jobTitle, jobDescription, requiredSkills, experienceRequired } = await req.json()

  const db = await getDb()
  const student = await db.collection("users").findOne({ email: user?.email })

  if (!student) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const studentSkills: string[] = (student.skills || []).map((s: string) => s.toLowerCase())
  const studentBio = (student.bio || "").toLowerCase()
  const studentExperience = student.experienceYears || 0
  const studentLocation = (student.location || "").toLowerCase()
  const certs = student.certificates || []

  const jobText = `${jobTitle} ${jobDescription}`.toLowerCase()
  const requiredSkillsLower = (requiredSkills || []).map((s: string) => s.toLowerCase())

  let score = 0
  const breakdown: { label: string; points: number; max: number; reason: string }[] = []

  // ── 1. Skills match (0–40 pts) ──
  const skillMatches = requiredSkillsLower.filter((s: string) =>
    studentSkills.some(ss => ss.includes(s) || s.includes(ss))
  )
  const skillScore = requiredSkillsLower.length > 0
    ? Math.round((skillMatches.length / requiredSkillsLower.length) * 40)
    : studentSkills.length > 0 ? 20 : 0
  score += skillScore
  breakdown.push({
    label: "Skills Match",
    points: skillScore,
    max: 40,
    reason: skillMatches.length > 0
      ? `${skillMatches.length}/${requiredSkillsLower.length} required skills matched`
      : "No skill overlap found",
  })

  // ── 2. Bio/experience keyword match (0–20 pts) ──
  const jobKeywords = jobText
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 4)
  const bioMatches = jobKeywords.filter(kw => studentBio.includes(kw)).length
  const bioScore = Math.min(20, bioMatches * 2)
  score += bioScore
  breakdown.push({
    label: "Profile Relevance",
    points: bioScore,
    max: 20,
    reason: bioScore > 10
      ? "Your bio strongly aligns with this role"
      : bioScore > 0
      ? "Some relevance found in your profile"
      : "Add more keywords to your bio",
  })

  // ── 3. Experience match (0–20 pts) ──
  let expScore = 0
  if (experienceRequired !== undefined) {
    if (studentExperience >= experienceRequired) expScore = 20
    else if (studentExperience >= experienceRequired - 1) expScore = 12
    else if (studentExperience >= experienceRequired - 2) expScore = 6
  } else {
    expScore = 10 // unknown requirement — neutral
  }
  score += expScore
  breakdown.push({
    label: "Experience Level",
    points: expScore,
    max: 20,
    reason: expScore === 20
      ? "Your experience meets the requirement"
      : expScore > 0
      ? "Slightly below experience requirement"
      : "Experience gap detected",
  })

  // ── 4. Certificates (0–10 pts) ──
  const certScore = Math.min(10, certs.length * 3)
  score += certScore
  breakdown.push({
    label: "Certifications",
    points: certScore,
    max: 10,
    reason: certs.length > 0
      ? `${certs.length} certificate(s) boost your profile`
      : "Add certificates to boost match score",
  })

  // ── 5. Profile completeness (0–10 pts) ──
  const fields = ["bio", "skills", "location", "phone", "linkedin"]
  const filled = fields.filter(f => student[f] && student[f].length > 0).length
  const profileScore = Math.round((filled / fields.length) * 10)
  score += profileScore
  breakdown.push({
    label: "Profile Completeness",
    points: profileScore,
    max: 10,
    reason: profileScore === 10
      ? "Your profile is fully complete"
      : `Fill ${fields.length - filled} more profile field(s)`,
  })

  score = Math.min(100, score)
  const level = score >= 75 ? "green" : score >= 50 ? "yellow" : "red"
  const label = score >= 75 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Weak Match"

  // Save match to DB for analytics
  if (jobId) {
    await db.collection("jobMatchScores").updateOne(
      { userId: user?.id, jobId },
      { $set: { userId: user?.id, jobId, score, level, checkedAt: new Date() } },
      { upsert: true }
    )
  }

  return NextResponse.json({ score, level, label, breakdown, matchedSkills: skillMatches })
}