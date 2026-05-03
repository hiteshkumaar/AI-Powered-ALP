type Bucket = { tokens: number; lastRefillMs: number };

const buckets = new Map<string, Bucket>();

export function rateLimit({
  key,
  capacity,
  refillPerMinute,
}: {
  key: string;
  capacity: number;
  refillPerMinute: number;
}) {
  const now = Date.now();
  const existing = buckets.get(key) ?? { tokens: capacity, lastRefillMs: now };

  const elapsedMin = (now - existing.lastRefillMs) / 60000;
  const refill = elapsedMin * refillPerMinute;
  const nextTokens = Math.min(capacity, existing.tokens + refill);

  if (nextTokens < 1) {
    buckets.set(key, { tokens: nextTokens, lastRefillMs: now });
    return { ok: false, remaining: 0 };
  }

  const remaining = nextTokens - 1;
  buckets.set(key, { tokens: remaining, lastRefillMs: now });
  return { ok: true, remaining: Math.floor(remaining) };
}

