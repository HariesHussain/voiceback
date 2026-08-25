import { NextResponse } from 'next/server';

/**
 * IN-MEMORY RATE LIMITER & CONCURRENCY CONTROL FOR SERVERLESS ENVIRONMENT
 *
 * Limitation Notice:
 * This is an in-memory implementation suited for single-instance or hackathon deployments.
 * In a serverless environment (such as Vercel), state is maintained per-instance and resets
 * on cold starts. It does NOT provide globally consistent distributed rate limiting.
 * It serves as request frequency protection and DOES NOT replace database payment idempotency safeguards.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting: Key format `${route}:${clientIp}`
const rateLimitStore = new Map<string, RateLimitRecord>();

// In-memory concurrency state for run-agent batch execution
let agentRunning = false;

/**
 * Defensively extracts the client IP address from request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Periodically cleans up expired entries to prevent unbounded memory growth.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfterSeconds: number;
  response?: NextResponse;
}

/**
 * Checks and updates rate limits for a given request and route.
 *
 * @param req Next.js / Web Request object
 * @param route Identifier for the rate-limited route (e.g. 'run-agent', 'create-link')
 * @param maxRequests Maximum allowed requests within the window
 * @param windowMs Time window in milliseconds (e.g. 60000 for 1 minute)
 */
export function checkRateLimit(
  req: Request,
  route: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  // Clean expired entries on ~10% of checks to prevent memory leakage
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const clientIp = getClientIp(req);
  const key = `${route}:${clientIp}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  if (!record || now >= record.resetTime) {
    // New window initialization
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, record);

    const resetAfterSeconds = Math.ceil(windowMs / 1000);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAfterSeconds,
    };
  }

  // Window active
  if (record.count >= maxRequests) {
    const resetAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    const response = NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(resetAfterSeconds),
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      allowed: false,
      remaining: 0,
      resetAfterSeconds,
      response,
    };
  }

  // Increment count within window
  record.count += 1;
  const resetAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAfterSeconds,
  };
}

/**
 * Returns current status of agent concurrency flag.
 */
export function isAgentRunning(): boolean {
  return agentRunning;
}

/**
 * Sets agent running state.
 */
export function setAgentRunning(running: boolean): void {
  agentRunning = running;
}

/**
 * Checks agent concurrency and returns HTTP 409 if already running.
 */
export function checkAgentConcurrency(): { isRunning: boolean; response?: NextResponse } {
  if (agentRunning) {
    const response = NextResponse.json(
      { error: 'Agent is already running' },
      {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return { isRunning: true, response };
  }
  return { isRunning: false };
}

/**
 * Resets the in-memory rate limit store and concurrency state (useful for tests/resets).
 */
export function resetRateLimiter(): void {
  rateLimitStore.clear();
  agentRunning = false;
}
