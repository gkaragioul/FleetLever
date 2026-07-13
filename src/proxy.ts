import { NextResponse, type NextRequest } from "next/server";

const sessionCookieName = "fleetlever_super_admin_session";
const localhostNames = new Set(["localhost", "127.0.0.1", "::1"]);

function allowsLocalhostAccess(request: NextRequest) {
  return process.env.NODE_ENV !== "production" && localhostNames.has(request.nextUrl.hostname);
}

function hasSessionCookie(request: NextRequest) {
  return Boolean(request.cookies.get(sessionCookieName)?.value);
}

function isProtectedPage(pathname: string) {
  return pathname === "/console" || pathname.startsWith("/console/") || pathname.startsWith("/field/");
}

function isProtectedApi(pathname: string) {
  return pathname.startsWith("/api/fleetlever/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (allowsLocalhostAccess(request)) {
    return NextResponse.next();
  }

  if (pathname === "/login" && hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/console", request.url));
  }

  if (!hasSessionCookie(request) && isProtectedPage(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasSessionCookie(request) && isProtectedApi(pathname)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/console/:path*", "/field/:path*", "/api/fleetlever/:path*"],
};
