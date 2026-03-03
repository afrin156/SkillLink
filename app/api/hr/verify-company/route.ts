import { NextResponse } from "next/server"
import dns from "dns/promises"
import { getDb } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

function validateGSTIN(gstin: string): boolean {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return regex.test(gstin)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  // ✅ Fix: cast to any to access role safely
  const user = session?.user as any

  if (!session || user?.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { companyDomain, gstin } = await req.json()
  const db = await getDb()
  const results: { domain: boolean; gstin: boolean } = {
    domain: false,
    gstin: false,
  }

  // ✅ Check 1: DNS domain check
  try {
    const records = await dns.resolveMx(companyDomain)
    if (records && records.length > 0) results.domain = true
  } catch {
    results.domain = false
  }

  // ✅ Check 2: GSTIN format validation
  if (gstin) {
    results.gstin = validateGSTIN(gstin.toUpperCase())
  }

  const isVerified = results.domain
  const verifiedAt = isVerified ? new Date() : null

  await db.collection("users").updateOne(
    { email: user?.email },
    {
      $set: {
        companyDomain,
        gstin: gstin || null,
        hrVerified: isVerified,
        hrVerifiedAt: verifiedAt,
        verificationChecks: results,
      },
    }
  )

  return NextResponse.json({ verified: isVerified, checks: results })
}
















