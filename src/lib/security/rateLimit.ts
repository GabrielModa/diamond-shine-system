type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitInput = {
  key: string;
  limit?: number;
  windowMs?: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(input: RateLimitInput): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const limit = input.limit ?? 60;
  const windowMs = input.windowMs ?? 60_000;
  const existing = buckets.get(input.key);

  if (!existing || now > existing.resetAt) {
    buckets.set(input.key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return { allowed: true, retryAfterSeconds: 0 };
}
