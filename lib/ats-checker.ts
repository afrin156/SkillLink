export interface ATSCheckResult {
  score: number           // 0-100
  level: "green" | "yellow" | "red"
  passed: boolean
  suggestions: string[]
}

export function checkATSQuality(description: string, title: string): ATSCheckResult {
  const suggestions: string[] = []
  let score = 100

  // ❌ Check 1: Tables (ATS can't parse them)
  if (description.includes("|") || description.includes("<table")) {
    suggestions.push("Remove tables — ATS systems cannot parse them")
    score -= 20
  }

  // ❌ Check 2: Too short
  if (description.length < 200) {
    suggestions.push("Description is too short — add at least 200 characters")
    score -= 25
  }

  // ❌ Check 3: No skills section mentioned
  const hasSkills = /skills|requirements|qualifications/i.test(description)
  if (!hasSkills) {
    suggestions.push("Add a 'Required Skills' or 'Qualifications' section")
    score -= 15
  }

  // ❌ Check 4: No responsibilities mentioned
  const hasResponsibilities = /responsibilities|duties|role|you will/i.test(description)
  if (!hasResponsibilities) {
    suggestions.push("Add a 'Responsibilities' section describing the role")
    score -= 15
  }

  // ❌ Check 5: Special characters that break ATS
  const specialChars = /[★✓●•◆▶]/g
  if (specialChars.test(description)) {
    suggestions.push("Remove special characters (★ ✓ ● etc) — use plain text bullets")
    score -= 10
  }

  // ❌ Check 6: No experience level mentioned
  const hasExperience = /year|experience|fresher|entry|senior|junior|mid/i.test(description)
  if (!hasExperience) {
    suggestions.push("Mention required experience level (e.g. '2+ years', 'Fresher')")
    score -= 10
  }

  // ❌ Check 7: Title too vague
  const vagueTitles = ["developer", "engineer", "manager", "analyst"]
  const isTitleVague = vagueTitles.some(t => title.toLowerCase() === t)
  if (isTitleVague) {
    suggestions.push("Make job title more specific (e.g. 'Backend Developer' not just 'Developer')")
    score -= 5
  }

  score = Math.max(0, score)
  const level = score >= 80 ? "green" : score >= 60 ? "yellow" : "red"
  const passed = score >= 60

  return { score, level, passed, suggestions }
}