// app/api/interview-prep/mcq/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { MCQ_BANK } from "@/lib/mcq-bank"

// GET — fetch questions by domain + difficulty
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const domain = searchParams.get("domain") || "all"
  const difficulty = searchParams.get("difficulty") || "all"
  const limit = parseInt(searchParams.get("limit") || "10")

  let questions = MCQ_BANK
  if (domain !== "all") questions = questions.filter(q => q.domain === domain)
  if (difficulty !== "all") questions = questions.filter(q => q.difficulty === difficulty)

  // Shuffle and limit
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, limit)

  return NextResponse.json({ questions: shuffled, total: questions.length })
}

// POST — submit test results and save score
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { answers, domain, difficulty, timeTaken } = await req.json()
  // answers = { questionId: selectedIndex }

  let correct = 0
  let wrong = 0
  const results: any[] = []

  Object.entries(answers).forEach(([questionId, selected]) => {
    const question = MCQ_BANK.find(q => q.id === questionId)
    if (!question) return
    const isCorrect = question.correctIndex === selected
    if (isCorrect) correct++
    else wrong++
    results.push({
      questionId,
      question: question.question,
      selected,
      correctIndex: question.correctIndex,
      isCorrect,
      explanation: question.explanation,
    })
  })

  const total = correct + wrong
  const score = Math.round((correct / total) * 100)

  const db = await getDb()
  await db.collection("testResults").insertOne({
    userId: user?.id,
    domain,
    difficulty,
    score,
    correct,
    wrong,
    total,
    timeTaken,
    results,
    takenAt: new Date(),
  })

  return NextResponse.json({ score, correct, wrong, total, results })
}