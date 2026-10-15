import { NextResponse, type NextRequest } from "next/server";
import {
  copySessionResponse,
  refreshSession,
} from "@/lib/supabase/proxy";

const publicStaffRoutes = new Set([
  "/staff/login",
  "/staff/forgot-password",
  "/staff/reset-password",
]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStaffRoute = pathname === "/staff" || pathname.startsWith("/staff/");
  const isProtectedStaffRoute =
    isStaffRoute && !publicStaffRoutes.has(pathname);
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' ${isDev ? "'unsafe-inline'" : "'nonce-" + nonce + "'"};
    img-src 'self' data: https:;
    connect-src 'self' https:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? "" : "upgrade-insecure-requests;"}
  `;
  const csp = cspHeader.replace(/\s{2,}/g, " ").trim();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const nextResponse = NextResponse.next({ request: { headers: requestHeaders } });
  nextResponse.headers.set("Content-Security-Policy", csp);

  if (!isAdminRoute && !isStaffRoute && !isAuthRoute) return nextResponse;

  const { authenticated, response: sessionResponse } = await refreshSession(request);
  const response = copySessionResponse(sessionResponse, nextResponse);

  if (!authenticated && (isAdminRoute || isProtectedStaffRoute)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/staff/login";
    loginUrl.search = "?error=authentication-required";

    return copySessionResponse(sessionResponse, NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};