/**
 * Small in-memory rate limiter (the app runs as a single PM2 process).
 * Used to slow down password guessing and checkout spam.
 */
import { TRPCError } from "@trpc/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets)
    if (bucket.resetAt <= now) buckets.delete(key);
}

function current(key: string, now: number) {
  const bucket = buckets.get(key);
  return bucket && bucket.resetAt > now ? bucket : null;
}

/** Throws TOO_MANY_REQUESTS if `key` has already been hit `limit` times in the window. */
export function assertWithinLimit(key: string, limit: number, message: string) {
  const now = Date.now();
  sweep(now);
  const bucket = current(key, now);
  if (bucket && bucket.count >= limit) {
    const minutes = Math.max(1, Math.ceil((bucket.resetAt - now) / 60_000));
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `${message} Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    });
  }
}

/** Counts one hit against `key`; the window starts at the first hit. */
export function recordHit(key: string, windowMs: number) {
  const now = Date.now();
  const bucket = current(key, now);
  if (bucket) bucket.count += 1;
  else buckets.set(key, { count: 1, resetAt: now + windowMs });
}

/** Checks the limit, then counts this hit. */
export function consume(
  key: string,
  limit: number,
  windowMs: number,
  message: string
) {
  assertWithinLimit(key, limit, message);
  recordHit(key, windowMs);
}

export function resetLimit(key: string) {
  buckets.delete(key);
}

/**
 * The visitor's address as reported by the reverse proxy (or "unknown").
 * X-Real-IP is set by the proxy itself, so it is preferred; the first X-Forwarded-For
 * entry can be supplied by the visitor.
 */
export function clientIp(req: Request) {
  const real = req.headers.get("x-real-ip")?.trim();
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return real || forwarded || "unknown";
}

/** Only for tests. */
export function resetAllLimits() {
  buckets.clear();
}
