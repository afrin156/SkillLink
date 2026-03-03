// app/api/fake-job-check/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { title, company, salary, description } = await req.json()

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const fullText = `${title} ${company || ""} ${salary || ""} ${description}`.toLowerCase()

    // ── Scan checks ──
    const details = []
    const flags: string[] = []
    let riskScore = 0

    // 1. Registration/Fee request
    const feeKeywords = ["registration fee", "training fee", "security deposit", "pay to join",
      "refundable deposit", "processing fee", "id card fee", "refundable registration"]
    const feeFound = feeKeywords.filter(k => fullText.includes(k))
    const feeTriggered = feeFound.length > 0
    if (feeTriggered) { riskScore += 35; flags.push("Asks for payment/fee before joining") }
    details.push({
      category: "Payment / Fee Request",
      triggered: feeTriggered,
      reason: feeTriggered
        ? `Found: "${feeFound[0]}" — Legitimate companies never charge fees to applicants`
        : "No payment requests found — good sign",
    })

    // 2. Pressure tactics
    const pressureKeywords = ["today only", "limited seats", "only serious", "immediate joining",
      "urgent hiring", "act now", "offer valid", "closing today", "last day"]
    const pressureFound = pressureKeywords.filter(k => fullText.includes(k))
    const pressureTriggered = pressureFound.length > 0
    if (pressureTriggered) { riskScore += 20; flags.push("Uses pressure tactics: " + pressureFound[0]) }
    details.push({
      category: "Pressure Tactics",
      triggered: pressureTriggered,
      reason: pressureTriggered
        ? `Found: "${pressureFound[0]}" — Scammers use urgency to prevent you from thinking carefully`
        : "No pressure language detected",
    })

    // 3. Unrealistic salary
    const salaryKeywords = ["earn up to ₹2000 per day", "earn up to 2000", "unlimited earning",
      "no limit earning", "earn upto 5 lakh", "₹50000 per day", "2000 per day"]
    const salaryFound = salaryKeywords.filter(k => fullText.includes(k))
    const salaryTriggered = salaryFound.length > 0
    if (salaryTriggered) { riskScore += 25; flags.push("Unrealistic salary promises") }
    details.push({
      category: "Salary Realism",
      triggered: salaryTriggered,
      reason: salaryTriggered
        ? "Promises unrealistic income — common scam tactic to lure victims"
        : "Salary appears realistic",
    })

    // 4. Suspicious contact
    const contactKeywords = ["whatsapp only", "contact on whatsapp", "contact hr on whatsapp",
      "telegram", "contact directly on whatsapp"]
    const contactFound = contactKeywords.filter(k => fullText.includes(k))
    const contactTriggered = contactFound.length > 0
    if (contactTriggered) { riskScore += 15; flags.push("Only WhatsApp/Telegram contact — no official email") }
    details.push({
      category: "Contact Method",
      triggered: contactTriggered,
      reason: contactTriggered
        ? "Only personal messaging apps used — legitimate companies have official email/website"
        : "No suspicious contact method found",
    })

    // 5. No experience + work from home combo
    const noExpWfh = fullText.includes("no experience") && fullText.includes("work from home")
    if (noExpWfh) { riskScore += 10; flags.push("No experience + work from home combo — common scam pattern") }
    details.push({
      category: "Experience & Work Mode",
      triggered: noExpWfh,
      reason: noExpWfh
        ? "'No experience required' + 'work from home' combination is very common in job scams"
        : "Work requirements appear normal",
    })

    // 6. Legitimacy signals (reduce score)
    const legitKeywords = ["interview", "background check", "lpa", "per annum", "probation",
      "company website", "linkedin", "office address"]
    const legitFound = legitKeywords.filter(k => fullText.includes(k))
    const hasLegit = legitFound.length >= 2
    if (hasLegit) riskScore = Math.max(0, riskScore - 15)
    details.push({
      category: "Legitimacy Signals",
      triggered: !hasLegit,
      reason: hasLegit
        ? `Found legitimate signals: ${legitFound.slice(0, 3).join(", ")}`
        : "No legitimacy signals found (interview process, company website, etc.)",
    })

    // Cap at 100
    riskScore = Math.min(100, riskScore)

    // Determine level
    const level: "green" | "yellow" | "red" =
      riskScore <= 15 ? "green" :
      riskScore <= 40 ? "yellow" : "red"

    return NextResponse.json({
      riskScore,
      level,
      passed: level === "green",
      flags,
      details,
    })

  } catch (e) {
    console.error("FAKE JOB SCAN ERROR:", e)
    return NextResponse.json({ error: "Scan failed" }, { status: 500 })
  }
}