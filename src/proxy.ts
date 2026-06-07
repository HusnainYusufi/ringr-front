import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/auth/sign-in", "/auth/accept-invite", "/demo"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = request.cookies.get("ringr_token")?.value;
  const role = request.cookies.get("ringr_role")?.value;

  if (!token) {
    if (isPublic) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic) {
    // Never redirect away from accept-invite when a token is in the URL —
    // the admin may be logged in on the same browser but still needs to activate a new account.
    if (pathname.startsWith("/auth/accept-invite") && request.nextUrl.searchParams.has("token")) {
      return NextResponse.next();
    }
    const dest = role === "SUPER_ADMIN" || role === "TENANT_ADMIN" ? "/admin" : "/portal";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isPortalRoute = pathname.startsWith("/portal");
  const isAdminRole = role === "SUPER_ADMIN" || role === "TENANT_ADMIN";
  const isProviderRole = role === "PROVIDER_OWNER" || role === "PROVIDER_STAFF";

  if (isAdminRoute && !isAdminRole) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }
  if (isPortalRoute && !isProviderRole) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isAdminRole ? "/admin" : "/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
