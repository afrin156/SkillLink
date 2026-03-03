import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ connections: [] }, { status: 200 })

    const myUserId = String((session.user as any).id)
    const url = new URL(req.url)
    const type = url.searchParams.get("type") || "incoming" 
    // incoming | outgoing | accepted

    const db = await getDb()

    let filter: any = {}

    if (type === "incoming") {
      filter = { toUserId: myUserId, status: "pending" }
    } else if (type === "outgoing") {
      filter = { fromUserId: myUserId, status: "pending" }
    } else if (type === "accepted") {
      filter = {
        status: "accepted",
        $or: [{ fromUserId: myUserId }, { toUserId: myUserId }],
      }
    } else {
      // default fallback
      filter = { toUserId: myUserId, status: "pending" }
    }

    const connections = await db.collection("connections").find(filter).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ connections }, { status: 200 })
  } catch (e) {
    console.log("GET CONNECTIONS ERROR:", e)
    return NextResponse.json({ connections: [] }, { status: 500 })
  }
}
