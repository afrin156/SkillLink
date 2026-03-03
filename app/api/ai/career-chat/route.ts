// app/api/ai/career-chat/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const SYSTEM_PROMPT = `You are SkillLink Career AI — a friendly expert career counselor for Indian students and fresh graduates.

Your expertise:
- Career path guidance (IT, engineering, design, finance, marketing)
- Resume and cover letter writing
- Interview preparation (technical + HR rounds)
- Skill recommendations for specific roles
- Salary expectations in India (always give INR ranges)
- Job search on Naukri, LinkedIn, SkillLink, Internshala
- Higher education (MBA, MS abroad, AWS/Google certifications)
- Freelancing and startup careers
- Soft skills development

Rules:
- Be warm, encouraging and specific
- Use Indian context — INR salaries, Indian companies, Indian colleges
- Use bullet points or numbered steps to structure answers
- Name specific tools, languages, frameworks for technical roles
- Be empathetic if student seems stressed
- Keep responses 150-300 words
- End with a short motivational line`

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, userName } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 })
    }

    const cleanMessages = messages
      .filter((m: any) => m.role && m.content?.trim())
      .slice(-20)
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: String(m.content),
      }))

    const finalSystem = userName
      ? `${SYSTEM_PROMPT}\n\nThe student's name is ${userName}.`
      : SYSTEM_PROMPT

    // Call Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        stream: true,
        messages: [
          { role: "system", content: finalSystem },
          ...cleanMessages,
        ],
      }),
    })

    if (!groqResponse.ok) {
      const err = await groqResponse.text()
      console.error("Groq error:", err)
      return NextResponse.json({ error: "AI service error" }, { status: 500 })
    }

    // Stream back to frontend
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = groqResponse.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) { controller.close(); return }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const lines = decoder.decode(value, { stream: true }).split("\n")
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const data = line.slice(6).trim()
              if (!data || data === "[DONE]") continue
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  // Forward directly — Groq uses same format as frontend expects
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    choices: [{ delta: { content } }]
                  })}\n\n`))
                }
              } catch {}
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (e) {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (e: any) {
    console.error("Career AI error:", e)
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}