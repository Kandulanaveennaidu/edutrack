/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window algorithm with automatic cleanup.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier.
 * @param identifier - Unique key (e.g., IP address or IP + path)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}
