import { getDb } from "./mongodb"

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function saveOTP(email: string, otp: string) {
  const db = await getDb()
  await db.collection("otps").updateOne(
    { email },
    {
      $set: {
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
        verified: false,
      },
    },
    { upsert: true }
  )
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const db = await getDb()
  const record = await db.collection("otps").findOne({ email })

  if (!record) return false
  if (record.verified) return false
  if (record.expiresAt < new Date()) return false
  if (record.otp !== otp) return false

  await db.collection("otps").updateOne({ email }, { $set: { verified: true } })
  return true
}