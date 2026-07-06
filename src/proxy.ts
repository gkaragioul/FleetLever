import { NextResponse, type NextRequest } from "next/server";

const sessionCookieName = "fleetlever_super_admin_session";

function hasSessionCookie(request: NextRequest) {
  return Boolean(request.cookies.get(sessionCookieName)?.value);
}

function isLocalAuthBypassed() {
  return (
    (process.env.NODE_ENV === "development" && process.env.FLEETLEVER_BYPASS_AUTH === "true") ||
    process.env.FLEETLEVER_PUBLIC_DEMO === "true"
  );
}

function isProtectedPage(pathname: string) {
  return pathname === "/console" || pathname.startsWith("/console/") || pathname.startsWith("/field/");
}

function isProtectedApi(pathname: string) {
  return pathname.startsWith("/api/fleetlever/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isLocalAuthBypassed()) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/console", request.url));
    }

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
