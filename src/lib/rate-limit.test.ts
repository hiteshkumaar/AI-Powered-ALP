import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  test("blocks after capacity is exceeded", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit({ key, capacity: 2, refillPerMinute: 0 }).ok).toBe(true);
    expect(rateLimit({ key, capacity: 2, refillPerMinute: 0 }).ok).toBe(true);
    expect(rateLimit({ key, capacity: 2, refillPerMinute: 0 }).ok).toBe(false);
  });
});
