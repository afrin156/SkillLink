// lib/fake-job-scanner.ts

export interface ScanResult {
  riskScore: number          // 0–100
  level: "green" | "yellow" | "red"
  passed: boolean
  flags: string[]
  details: {
    category: string
    triggered: boolean
    reason: string
  }[]
}

// ── Pattern banks ──
const SCAM_KEYWORDS = [
  "no experience required", "earn from home", "make money fast",
  "guaranteed income", "be your own boss", "unlimited earning",
  "work from home guaranteed", "easy money", "get rich",
  "investment required", "pay to apply", "registration fee",
  "urgent hiring", "immediate joining", "no interview",
  "whatsapp only", "telegram only", "data entry from home",
  "100% work from home", "earn lakhs", "earn thousands daily",
  "part time unlimited income", "no qualification needed",
  "multi level marketing", "mlm", "network marketing",
  "refer and earn", "weekly payout", "daily payout",
]

const PRESSURE_WORDS = [
  "apply now!!!", "hurry", "limited time offer", "act fast",
  "don't miss", "last chance", "offer expires", "seats filling",
  "only today", "exclusive opportunity",
]

const LEGIT_SIGNALS = [
  "provident fund", "health insurance", "annual leave",
  "background check", "interview process", "notice period",
  "ctc", "lpa", "fixed salary", "equity", "esop",
  "remote", "hybrid", "onsite", "flexible hours",
]

export function scanJobForFraud(
  title: string,
  description: string,
  salary?: string,
  company?: string
): ScanResult {
  const fullText = `${title} ${description} ${salary || ""} ${company || ""}`.toLowerCase()
  let riskScore = 0
  const flags: string[] = []
  const details: ScanResult["details"] = []

  // ── 1. Scam keyword check (0–40 pts) ──
  const scamMatches = SCAM_KEYWORDS.filter(kw => fullText.includes(kw))
  const scamScore = Math.min(40, scamMatches.length * 10)
  riskScore += scamScore
  details.push({
    category: "Scam Keywords",
    triggered: scamMatches.length > 0,
    reason: scamMatches.length > 0
      ? `Found ${scamMatches.length} suspicious keyword(s): ${scamMatches.slice(0, 3).join(", ")}`
      : "No scam keywords detected",
  })
  if (scamMatches.length > 0) {
    flags.push(`Suspicious phrases: "${scamMatches[0]}"`)
  }

  // ── 2. Pressure language check (0–15 pts) ──
  const pressureMatches = PRESSURE_WORDS.filter(w => fullText.includes(w))
  const pressureScore = Math.min(15, pressureMatches.length * 8)
  riskScore += pressureScore
  details.push({
    category: "Pressure Language",
    triggered: pressureMatches.length > 0,
    reason: pressureMatches.length > 0
      ? `Urgency/pressure language detected: ${pressureMatches[0]}`
      : "No pressure language found",
  })
  if (pressureMatches.length > 0) flags.push("Uses urgency/pressure tactics")

  // ── 3. ALL CAPS title check (0–10 pts) ──
  const titleWords = title.split(" ")
  const capsWords = titleWords.filter(w => w.length > 2 && w === w.toUpperCase())
  const capsRatio = capsWords.length / Math.max(titleWords.length, 1)
  const capsScore = capsRatio > 0.5 ? 10 : 0
  riskScore += capsScore
  details.push({
    category: "Title Formatting",
    triggered: capsScore > 0,
    reason: capsScore > 0
      ? "Job title is mostly in ALL CAPS (common in spam)"
      : "Title formatting looks normal",
  })
  if (capsScore > 0) flags.push("ALL CAPS job title")

  // ── 4. Description length check (0–10 pts) ──
  const descLen = description.trim().length
  const shortDescScore = descLen < 150 ? 10 : descLen < 300 ? 5 : 0
  riskScore += shortDescScore
  details.push({
    category: "Description Quality",
    triggered: shortDescScore > 0,
    reason: descLen < 150
      ? `Very short description (${descLen} chars). Legitimate jobs have detailed descriptions.`
      : descLen < 300
      ? "Description is somewhat brief. Consider adding more details."
      : "Description length looks good",
  })
  if (shortDescScore === 10) flags.push("Suspiciously short job description")

  // ── 5. Unrealistic salary check (0–15 pts) ──
  let salaryScore = 0
  if (salary) {
    const salaryText = salary.toLowerCase()
    // Look for numbers in salary
    const nums = salaryText.match(/\d+/g)?.map(Number) || []
    const maxNum = Math.max(...nums)

    // Check for "unlimited" salary claims
    if (salaryText.includes("unlimited") || salaryText.includes("no limit")) {
      salaryScore = 15
      flags.push("Claims unlimited earnings")
    }
    // Unrealistically high for freshers/entry level
    else if (
      maxNum > 500000 &&
      (fullText.includes("fresher") || fullText.includes("no experience") || fullText.includes("0-1 year"))
    ) {
      salaryScore = 15
      flags.push("Unrealistic salary for experience level")
    }
  }
  riskScore += salaryScore
  details.push({
    category: "Salary Realism",
    triggered: salaryScore > 0,
    reason: salaryScore > 0
      ? "Salary claims appear unrealistic for the stated experience level"
      : "Salary range appears reasonable",
  })

  // ── 6. Missing legit signals (0–10 pts) ──
  const legitFound = LEGIT_SIGNALS.filter(s => fullText.includes(s))
  const noLegitScore = legitFound.length === 0 && description.length > 200 ? 10 : 0
  riskScore += noLegitScore
  details.push({
    category: "Legitimacy Signals",
    triggered: noLegitScore > 0,
    reason: noLegitScore > 0
      ? "No standard employment terms found (benefits, CTC, interview process)"
      : `Found ${legitFound.length} legitimacy signal(s): ${legitFound.slice(0, 2).join(", ")}`,
  })
  if (noLegitScore > 0) flags.push("No standard employment terms mentioned")

  // ── 7. Contact method check (0–10 pts) ──
  const informalContact =
    fullText.includes("whatsapp") ||
    fullText.includes("telegram") ||
    fullText.includes("call directly") ||
    fullText.includes("no email")
  const contactScore = informalContact ? 10 : 0
  riskScore += contactScore
  details.push({
    category: "Contact Method",
    triggered: informalContact,
    reason: informalContact
      ? "Job only uses informal contact (WhatsApp/Telegram). Legitimate jobs use official channels."
      : "Contact method appears professional",
  })
  if (informalContact) flags.push("Only informal contact methods (WhatsApp/Telegram)")

  // ── Final score & level ──
  riskScore = Math.min(100, riskScore)
  const level: ScanResult["level"] =
    riskScore <= 30 ? "green" :
    riskScore <= 60 ? "yellow" : "red"

  return {
    riskScore,
    level,
    passed: riskScore <= 30,
    flags,
    details,
  }
}