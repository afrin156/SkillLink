import { NextResponse } from "next/server"
import { verifyOTP } from "@/lib/otp"

export async function POST(req: Request) {
  const { email, otp } = await req.json()
  const valid = await verifyOTP(email, otp)
  if (!valid) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
  return NextResponse.json({ success: true })
}