// lib/email.ts
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendOTPEmail(email: string, otp: string, name: string) {
  await transporter.sendMail({
    from: `"SkillLink" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verify your SkillLink account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">Welcome to SkillLink, ${name}!</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">Use the OTP below to verify your account. It expires in 10 minutes.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #111827;">${otp}</span>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  })
}