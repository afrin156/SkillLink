import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  const db = await getDb()

  const user = await db.collection("users").findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() },
  })

  if (!user) {
    return NextResponse.json({ error: "Token expired or invalid" }, { status: 400 })
  }

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: { isVerifiedStudent: true },
      $unset: { verificationToken: "", verificationTokenExpiry: "" },
    }
  )

  return NextResponse.redirect("http://localhost:3000/auth?verified=true")
}
