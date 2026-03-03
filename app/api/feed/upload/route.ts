import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    // Check file size — max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 50MB" }, { status: 400 })
    }

    // Check file type
    const isVideo = file.type.startsWith("video/")
    const isImage = file.type.startsWith("image/")
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: "Only images and videos allowed" }, { status: 400 })
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: isVideo ? "video" : "image",
          folder: "skilllink/feed",
          // Auto compress
          transformation: isVideo
            ? [{ quality: "auto", fetch_format: "auto" }]
            : [{ quality: "auto", fetch_format: "auto", width: 1200, crop: "limit" }],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      type: isVideo ? "video" : "image",
      width: result.width,
      height: result.height,
      duration: result.duration || null,
    })
  } catch (e: any) {
    console.error("Upload error:", e)
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 })
  }
}