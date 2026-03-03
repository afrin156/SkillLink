import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { topic, type, userName, role } = await req.json()
  const prompts: any = {
    regular: `Write a 80-word professional career post about: "${topic}". By ${userName}, a ${role}. Engaging, no hashtags.`,
    win: `Write a 70-word celebratory career win post about: "${topic}". By ${userName}. Humble and inspiring. No hashtags.`,
    skill: `Write a 70-word post about learning "${topic}". By ${userName}. What was learned and career impact. No hashtags.`,
    poll: `Write a 20-word career poll question about: "${topic}". Just the question.`,
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile", max_tokens: 200,
      messages: [
        { role: "system", content: "You write short professional career social media posts." },
        { role: "user", content: prompts[type] || prompts.regular }
      ],
    }),
  })
  const data = await res.json()
  return NextResponse.json({ post: data.choices?.[0]?.message?.content?.trim() || "" })
}
