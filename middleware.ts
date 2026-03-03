import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith("/hr") && token?.role !== "hr" && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/feed/:path*",
    "/jobs/:path*",
    "/saved/:path*",
    "/applications/:path*",
    "/resume-builder/:path*",
    "/roadmap/:path*",
    "/webinars/:path*",
    "/messages/:path*",
    "/interview-prep/:path*",
    "/fake-job-check/:path*",
    "/profile/:path*",
    "/hr/:path*",
    "/admin/:path*",
  ],
}
