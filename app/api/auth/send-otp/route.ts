// app/api/auth/send-otp/route.ts
import { NextResponse } from "next/server"
import { generateOTP, saveOTP } from "@/lib/otp"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const otp = generateOTP()
    await saveOTP(email.toLowerCase(), otp)

    // ── Check env vars ──
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.error("❌ EMAIL_SERVER_USER or EMAIL_SERVER_PASSWORD missing in .env.local")
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
      subject: "SkillLink — Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1d4ed8; margin-bottom: 8px;">SkillLink</h2>
          <p style="color: #374151; margin-bottom: 24px;">Your one-time verification code:</p>
          <div style="background: #1d4ed8; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    })

    console.log(`✅ OTP sent to ${email}`)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("❌ OTP SEND ERROR:", error?.message || error)

    if (error?.code === "EAUTH") {
      return NextResponse.json({
        error: "Gmail authentication failed. Check your App Password in .env.local"
      }, { status: 500 })
    }

    return NextResponse.json({
      error: "Failed to send OTP: " + (error?.message || "Unknown error")
    }, { status: 500 })
  }
}