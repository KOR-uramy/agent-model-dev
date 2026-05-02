import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    const u = new URL("/login", req.nextUrl.origin);
    u.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(u);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
