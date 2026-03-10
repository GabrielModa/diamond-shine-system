import { prisma } from "../prisma";

type RateLimitBucket = {
  count: number;
  resetAt: Date;
};

type RateLimitStore = {
  getBucket: (key: string) => Promise<RateLimitBucket | null>;
  resetBucket: (key: string, resetAt: Date) => Promise<void>;
  incrementBucket: (key: string) => Promise<RateLimitBucket>;
};

export type RateLimitInput = {
  key: string;
  limit?: number;
  windowMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function getHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function getRequestIp(
  headers?: Headers | Record<string, string | string[] | undefined> | null,
): string {
  if (!headers) {
    return "unknown";
  }

  const forwardedFor = getHeaderValue(headers, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = getHeaderValue(headers, "x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function createRateLimiter(store: RateLimitStore) {
  return async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
    const now = Date.now();
    const limit = input.limit ?? 60;
    const windowMs = input.windowMs ?? 60_000;

    const existing = await store.getBucket(input.key);

    if (!existing || now > existing.resetAt.getTime()) {
      const resetAt = new Date(now + windowMs);
      await store.resetBucket(input.key, resetAt);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.resetAt.getTime() - now) / 1000),
        ),
      };
    }

    await store.incrementBucket(input.key);
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

function createMemoryStore(): RateLimitStore {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    async getBucket(key) {
      return buckets.get(key) ?? null;
    },
    async resetBucket(key, resetAt) {
      buckets.set(key, { count: 1, resetAt });
    },
    async incrementBucket(key) {
      const bucket = buckets.get(key);
      if (!bucket) {
        throw new Error("Missing rate limit bucket.");
      }
      const updated = {
        count: bucket.count + 1,
        resetAt: bucket.resetAt,
      };
      buckets.set(key, updated);
      return updated;
    },
  };
}

function createPrismaStore(): RateLimitStore {
  return {
    async getBucket(key) {
      const bucket = await prisma.rateLimitBucket.findUnique({
        where: {
          key,
        },
      });

      if (!bucket) {
        return null;
      }

      return {
        count: bucket.count,
        resetAt: bucket.resetAt,
      };
    },
    async resetBucket(key, resetAt) {
      await prisma.rateLimitBucket.upsert({
        create: {
          key,
          count: 1,
          resetAt,
        },
        update: {
          count: 1,
          resetAt,
        },
        where: {
          key,
        },
      });
    },
    async incrementBucket(key) {
      const updated = await prisma.rateLimitBucket.update({
        data: {
          count: {
            increment: 1,
          },
        },
        where: {
          key,
        },
      });

      return {
        count: updated.count,
        resetAt: updated.resetAt,
      };
    },
  };
}

const defaultLimiter = createRateLimiter(
  process.env.NODE_ENV === "test" ? createMemoryStore() : createPrismaStore(),
);

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  return defaultLimiter(input);
}
