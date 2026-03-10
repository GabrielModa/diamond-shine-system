import { createRateLimiter } from "../../src/lib/security/rateLimit";

type MemoryBucket = {
  count: number;
  resetAt: Date;
};

function createMemoryStore() {
  const buckets = new Map<string, MemoryBucket>();

  return {
    async getBucket(key: string): Promise<MemoryBucket | null> {
      return buckets.get(key) ?? null;
    },
    async resetBucket(key: string, resetAt: Date): Promise<void> {
      buckets.set(key, { count: 1, resetAt });
    },
    async incrementBucket(key: string): Promise<MemoryBucket> {
      const bucket = buckets.get(key);
      if (!bucket) {
        throw new Error("Missing bucket");
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

describe("Rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks requests over the limit and resets after the window", async () => {
    const limiter = createRateLimiter(createMemoryStore());

    const first = await limiter({ key: "login:ip", limit: 2, windowMs: 1000 });
    const second = await limiter({ key: "login:ip", limit: 2, windowMs: 1000 });
    const third = await limiter({ key: "login:ip", limit: 2, windowMs: 1000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);

    vi.advanceTimersByTime(1001);

    const afterWindow = await limiter({ key: "login:ip", limit: 2, windowMs: 1000 });
    expect(afterWindow.allowed).toBe(true);
  });
});
