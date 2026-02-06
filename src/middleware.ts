import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// Security headers applied to ALL responses
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

// Rate limit configs by path pattern
const RATE_LIMITS: { pattern: RegExp; limit: number; windowMs: number }[] = [
  // Auth endpoints: strict — 5 requests per minute
  { pattern: /^\/api\/auth\//, limit: 5, windowMs: 60_000 },
  // Registration: very strict — 3 per 5 minutes
  { pattern: /^\/api\/auth\/register/, limit: 3, windowMs: 300_000 },
  // General API: 100 requests per minute
  { pattern: /^\/api\//, limit: 100, windowMs: 60_000 },
];

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (pathname.startsWith("/api")) {
    const ip = getClientIP(request);

    // Find matching rate limit config (first match wins, most specific first)
    for (const config of RATE_LIMITS) {
      if (config.pattern.test(pathname)) {
        const result = rateLimit(
          `${ip}:${config.pattern.source}`,
          config.limit,
          config.windowMs,
        );

        if (!result.success) {
          return new NextResponse(
            JSON.stringify({
              error: "Too many requests. Please try again later.",
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(
                  Math.ceil((result.resetAt - Date.now()) / 1000),
                ),
                "X-RateLimit-Limit": String(result.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
                ...securityHeaders,
              },
            },
          );
        }

        // Add rate limit info to response headers
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", String(result.limit));
        response.headers.set("X-RateLimit-Remaining", String(result.remaining));
        response.headers.set(
          "X-RateLimit-Reset",
          String(Math.ceil(result.resetAt / 1000)),
        );

        // Add security headers
        for (const [key, value] of Object.entries(securityHeaders)) {
          response.headers.set(key, value);
        }

        return response;
      }
    }
  }

  // Non-API routes: just add security headers
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
