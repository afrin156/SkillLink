// app/api/auth/register/route.ts
import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { createHash } from "crypto"

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "rediffmail.com", "ymail.com", "icloud.com", "live.com",
]

const STUDENT_DOMAINS = [".edu", ".ac.in", ".edu.in", ".ac.uk", ".edu.au"]

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex")
}

function checkEmailDomain(email: string, role: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return { valid: false, message: "Invalid email", isVerified: false }

  if (role === "hr") {
    if (FREE_EMAIL_DOMAINS.includes(domain)) {
      return {
        valid: false,
        message: `HR must use a company email (not ${domain}). Example: name@yourcompany.com`,
        isVerified: false,
      }
    }
    return { valid: true, message: "Company email verified ✅", isVerified: true }
  }

  if (role === "student") {
    const isCollege = STUDENT_DOMAINS.some(d => domain.endsWith(d))
    if (isCollege) {
      return { valid: true, message: "College email verified ✅", isVerified: true }
    }
    return {
      valid: true,
      message: "Registered! Use college email (.ac.in/.edu) to get Verified Student badge.",
      isVerified: false,
    }
  }

  return { valid: true, message: "Registered successfully", isVerified: false }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name?.trim() || !email?.trim() || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!["student", "hr"].includes(role)) {
      return NextResponse.json({ error: "Role must be student or hr" }, { status: 400 })
    }

    const db = await getDb()

    const existing = await db.collection("users").findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: "Email already registered. Please login." }, { status: 400 })
    }

    const domainCheck = checkEmailDomain(email.toLowerCase(), role)
    if (!domainCheck.valid) {
      return NextResponse.json({ error: domainCheck.message }, { status: 400 })
    }

    // Use your existing password hashing method
    const passwordHash = hashPassword(password)

    const result = await db.collection("users").insertOne({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role,
      isVerified: domainCheck.isVerified,
      isVerifiedHR: role === "hr" && domainCheck.isVerified,
      isVerifiedStudent: role === "student" && domainCheck.isVerified,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString(),
      isVerified: domainCheck.isVerified,
      message: domainCheck.message,
      requiresOTP: true,
    })

  } catch (e) {
    console.error("REGISTER ERROR:", e)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}