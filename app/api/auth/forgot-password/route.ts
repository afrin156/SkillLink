// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import nodemailer from "nodemailer"
import { createHash, randomBytes } from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.collection("users").findOne({ email: email.toLowerCase() })

    // Always return success (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 1000 * 60 * 30) // 30 mins

    // Save token to DB
    await db.collection("passwordResets").insertOne({
      email: email.toLowerCase(),
      token,
      expires,
      used: false,
      createdAt: new Date(),
    })

    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`

    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.error("❌ Email env vars missing")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"SkillLink" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: "SkillLink — Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1d4ed8; margin-bottom: 8px;">SkillLink</h2>
          <p style="color: #374151; margin-bottom: 8px;">Hi <strong>${user.name}</strong>,</p>
          <p style="color: #374151; margin-bottom: 24px;">We received a request to reset your password. Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: block; background: #1d4ed8; color: white; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 24px;">
            Reset My Password
          </a>
          <p style="color: #6b7280; font-size: 13px;">This link expires in <strong>30 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 11px;">Or copy this link: ${resetLink}</p>
        </div>
      `,
    })

    console.log(`✅ Password reset link sent to ${email}`)
    return NextResponse.json({ success: true })

  } catch (e: any) {
    console.error("FORGOT PASSWORD ERROR:", e?.message)
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 })
  }
}