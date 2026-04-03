import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Redirect authenticated users away from login page
    if (pathname === "/login" && token) {
      const redirectMap: Record<string, string> = {
        ADMIN: "/admin",
        TUTOR: "/tutor",
        LEARNER: "/learner",
      };
      const destination = redirectMap[token.role as string] ?? "/";
      return NextResponse.redirect(new URL(destination, req.url));
    }

    // Role-based access control
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/tutor") && token?.role !== "TUTOR") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/learner") && token?.role !== "LEARNER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = (req as NextRequest).nextUrl.pathname;

        // Public routes
        if (
          pathname === "/login" ||
          pathname === "/" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname === "/unauthorized"
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
