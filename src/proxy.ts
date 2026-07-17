import { NextResponse, type NextRequest } from "next/server";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

const superAdminSessionCookieName = "fleetlever_super_admin_session";
const accountSessionCookieName = "fleetlever_account_session";
const localhostNames = new Set(["localhost", "127.0.0.1", "::1"]);

function allowsLocalhostAccess(request: NextRequest) {
  return process.env.NODE_ENV !== "production" && localhostNames.has(request.nextUrl.hostname);
}

function hasSuperAdminSessionCookie(request: NextRequest) {
  return Boolean(request.cookies.get(superAdminSessionCookieName)?.value);
}

function hasAccountSessionCookie(request: NextRequest) {
  return Boolean(request.cookies.get(accountSessionCookieName)?.value);
}

function hasFleetLeverSessionCookie(request: NextRequest) {
  return hasSuperAdminSessionCookie(request) || hasAccountSessionCookie(request);
}

function isProtectedPage(pathname: string) {
  return pathname === "/fleet-management"
    || pathname.startsWith("/fleet-management/")
    || pathname === "/console"
    || pathname.startsWith("/console/")
    || pathname.startsWith("/field/");
}

function isProtectedApi(pathname: string) {
  return pathname.startsWith("/api/fleetlever/");
}

function isLisaCompanionRelayApi(pathname: string) {
  return pathname.startsWith("/api/fleetlever/lisa/relay/");
}

function startsWithRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isMunicipalRoute(pathname: string) {
  return ["/main-page", "/civic-dispatch", "/external-blockers", "/worker-apps"].some((route) => startsWithRoute(pathname, route));
}

function isProductRoute(pathname: string) {
  return ["/fleet-management", "/console", "/field", "/login"].some((route) => startsWithRoute(pathname, route))
    || pathname.startsWith("/api/fleetlever/")
    || pathname.startsWith("/api/auth/");
}

function isAccountRoute(pathname: string) {
  return ["/signup", "/forgot-password", "/reset-password", "/verify-email"].some((route) => startsWithRoute(pathname, route));
}

function rewriteToProductApp(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!appUrl) {
    return null;
  }

  const destination = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, `${appUrl}/`);
  return NextResponse.rewrite(destination);
}

function isMarketingRoute(pathname: string) {
  return ["/landing", "/pricing", "/request-demo", "/privacy", "/terms", "/security", "/api/commercial"].some((route) => startsWithRoute(pathname, route));
}

function notFoundResponse() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const edition = getFleetLeverEdition();

  if (edition === "site" && pathname === "/landing") {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  if (edition === "site" && (isProductRoute(pathname) || isAccountRoute(pathname))) {
    const productAppResponse = rewriteToProductApp(request);

    if (productAppResponse) {
      return productAppResponse;
    }
  }

  if (edition === "site" && (isMunicipalRoute(pathname) || isProductRoute(pathname))) {
    return notFoundResponse();
  }

  if (edition === "console" && (isMunicipalRoute(pathname) || isMarketingRoute(pathname))) {
    return notFoundResponse();
  }

  if (edition === "elliniko" && isMarketingRoute(pathname)) {
    return notFoundResponse();
  }

  if (allowsLocalhostAccess(request)) {
    return NextResponse.next();
  }

  if (pathname === "/login" && hasFleetLeverSessionCookie(request)) {
    return NextResponse.redirect(new URL(hasAccountSessionCookie(request) ? "/fleet-management" : "/console", request.url));
  }

  if (!hasFleetLeverSessionCookie(request) && isProtectedPage(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasFleetLeverSessionCookie(request) && isProtectedApi(pathname) && !isLisaCompanionRelayApi(pathname)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/console/:path*",
    "/field/:path*",
    "/api/auth/:path*",
    "/api/fleetlever/:path*",
    "/main-page/:path*",
    "/civic-dispatch/:path*",
    "/external-blockers/:path*",
    "/worker-apps/:path*",
    "/fleet-management/:path*",
    "/landing/:path*",
    "/pricing/:path*",
    "/request-demo/:path*",
    "/privacy/:path*",
    "/terms/:path*",
    "/security/:path*",
    "/api/commercial/:path*",
  ],
};
