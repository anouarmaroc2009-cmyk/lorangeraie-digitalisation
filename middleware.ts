import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith("/dashboard/finances") && token?.role !== "DIRECTION") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (pathname.startsWith("/api/finances") && token?.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    if (pathname.startsWith("/api/expenses") && token?.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
    }

    if (pathname.startsWith("/api/salaries") && token?.role !== "DIRECTION") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
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
  matcher: ["/dashboard/:path*", "/api/students/:path*", "/api/finances/:path*", "/api/expenses/:path*", "/api/salaries/:path*"],
}
