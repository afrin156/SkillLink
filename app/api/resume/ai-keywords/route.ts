import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobDescription, resumeText } = await req.json()
  if (!jobDescription) return NextResponse.json({ error: "Job description required" }, { status: 400 })

  // ✅ Extract keywords from job description
  const stopWords = new Set([
    "the","and","or","in","at","to","a","an","of","for","with",
    "is","are","will","be","have","has","we","you","our","your",
    "this","that","which","who","their","from","on","by","as","we're",
    "they","it","its","can","but","not","all","new","also","more","other"
  ])

  const words = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, " ")
    .split(/\s+/)
    .filter((w: string) => w.length > 3 && !stopWords.has(w))

  // Count frequency
  const freq: Record<string, number> = {}
  words.forEach((w: string) => { freq[w] = (freq[w] || 0) + 1 })

  // Sort by frequency
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({
      word,
      count,
      // Check if already in resume
      inResume: resumeText
        ? resumeText.toLowerCase().includes(word)
        : false,
    }))

  // ATS Score — how many top keywords are in resume
  const topKeywords = keywords.slice(0, 10)
  const matched = topKeywords.filter(k => k.inResume).length
  const atsScore = Math.round((matched / topKeywords.length) * 100)

  const level = atsScore >= 80 ? "green" : atsScore >= 60 ? "yellow" : "red"

  return NextResponse.json({ keywords, atsScore, level, matched, total: topKeywords.length })
}