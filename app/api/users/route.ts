import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")

    const db = await getDb()
    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {}

    const users = await db
      .collection("users")
      .find(query)
      .project({ passwordHash: 0 })
      .limit(20)
      .toArray()

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
