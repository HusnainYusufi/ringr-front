import { auth } from "@/lib/auth";
// import type { AppRole } from "@/lib/auth/modules/authorization/permissions";
import { NextRequest, NextResponse } from "next/server";

const AUTH_ONLY_PATHS = ["/auth/sign-in", "/auth/sign-up"];
// const ROLE_PROTECTED: { prefix: string; requiredRole: AppRole }[] = [
//   { prefix: "/dashboard/settings", requiredRole: "admin" },
//   { prefix: "/dashboard/users", requiredRole: "admin" },
// ];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthOnly = AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path));

  if (!session?.session && !isAuthOnly) {
    const url = request.nextUrl.clone();
    url.searchParams.set("callbackUrl", pathname);
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }

  // const sessionRole = (session?.user as { role?: string } | undefined)?.role;

  // if (roleProtectedRoute && sessionRole !== roleProtectedRoute.requiredRole) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  if (isAuthOnly && session?.session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
