import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/dashboard/login") return NextResponse.next();

  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    // Misconfigured — block access rather than allow open dashboard.
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/login";
    url.searchParams.set("err", "unconfigured");
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = await verifySession(token, password);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/dashboard/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
