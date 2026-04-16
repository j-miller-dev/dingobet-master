/**
 * FUTURE: Server-side route protection via Next.js Middleware
 *
 * WHY bother upgrading from the current client-side useRequireAuth hook?
 * - The client-side hook causes a brief flash — the page renders, THEN redirects
 * - Middleware runs on the Edge BEFORE the page is sent to the browser (no flash)
 * - More secure — protection is enforced at the network level, not in JS
 *
 * WHY it isn't implemented yet:
 * - Middleware runs on the server/edge and has no access to localStorage
 * - The current auth setup stores the JWT in localStorage via Zustand persist
 * - To use middleware, the token must be readable server-side — i.e. stored in a cookie
 *
 * WHAT needs to change to enable this:
 * 1. On login (src/app/login/page.tsx), after calling setAuth(), also write the
 *    token to a cookie:
 *      document.cookie = `token=${accessToken}; path=/; SameSite=Lax`
 *    Or better — have the API set the cookie directly via a Set-Cookie header
 *
 * 2. On logout, clear the cookie alongside the Zustand store
 *
 * 3. Uncomment the middleware below and remove useRequireAuth() calls from
 *    individual pages (or keep them as a fallback during transition)
 *
 * HOW it works:
 * - Next.js automatically runs this file on every matching request
 * - The matcher config controls which routes are protected
 * - We read the token from cookies — if missing, redirect to /login
 */

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   const token = request.cookies.get("token")?.value;
//
//   if (!token) {
//     const loginUrl = new URL("/login", request.url);
//     // Preserve the original URL so we can redirect back after login
//     loginUrl.searchParams.set("from", request.nextUrl.pathname);
//     return NextResponse.redirect(loginUrl);
//   }
//
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Protect all routes EXCEPT:
//      * - /login
//      * - /register
//      * - /_next (Next.js internals)
//      * - /api (API routes, if any)
//      * - Static files (favicon, images, etc.)
//      */
//     "/((?!login|register|_next|api|.*\\..*).*)",
//   ],
// };
