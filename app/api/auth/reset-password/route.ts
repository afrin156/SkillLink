// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { createHash } from "crypto"

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex")
}

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json()

    if (!email || !token || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const db = await getDb()

    // Find valid token
    const resetRecord = await db.collection("passwordResets").findOne({
      email: email.toLowerCase(),
      token,
      used: false,
      expires: { $gt: new Date() },
    })

    if (!resetRecord) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 })
    }

    // Update password
    const passwordHash = hashPassword(password)
    await db.collection("users").updateOne(
      { email: email.toLowerCase() },
      { $set: { passwordHash, updatedAt: new Date() } }
    )

    // Mark token as used
    await db.collection("passwordResets").updateOne(
      { _id: resetRecord._id },
      { $set: { used: true } }
    )

    return NextResponse.json({ success: true, message: "Password reset successfully!" })

  } catch (e: any) {
    console.error("RESET PASSWORD ERROR:", e?.message)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}