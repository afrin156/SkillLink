// app/api/register/route.ts
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const validRoles = ["student", "hr"]
    const userRole = validRoles.includes(role) ? role : "student"

    const db = await getDb()

    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.collection("users").insertOne({
      name,
      email,
      passwordHash,
      role: userRole,
      // ✅ FIXED — set to true so login works immediately
      isVerifiedStudent: true,
      emailVerified: true,
      isHRVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Account created successfully" })

  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}