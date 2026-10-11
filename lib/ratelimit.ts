import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Giới hạn tần suất chat theo IP để bảo vệ quota Gemini miễn phí dùng chung.
 *
 * Production: dùng Upstash Redis (có gói miễn phí) để trạng thái được chia sẻ
 * giữa mọi serverless instance. Xem README để cấu hình UPSTASH_REDIS_REST_URL
 * và UPSTASH_REDIS_REST_TOKEN.
 *
 * Không có Upstash (chạy local/dev): tự động dùng bộ nhớ trong tiến trình.
 * Chế độ này CHỈ phù hợp dev, không phải giải pháp production.
 */

export const SHORT_LIMIT = 8;
const SHORT_WINDOW_MS = 60_000;
const SHORT_WINDOW = "60 s";

export const DAILY_LIMIT = 50;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_WINDOW = "24 h";

export interface LimitResult {
  allowed: boolean;
  /** Số giây nên đợi trước khi thử lại (0 nếu được phép). */
  retryAfterSec: number;
  /** Backend đã dùng để đếm. */
  backend: "upstash" | "memory";
}

interface UpstashLimiters {
  minute: Ratelimit;
  daily: Ratelimit;
}

let cached: UpstashLimiters | null | undefined;

function getUpstash(): UpstashLimiters | null {
  if (cached !== undefined) return cached;
  try {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      cached = null;
      return null;
    }
    const redis = Redis.fromEnv();
    cached = {
      minute: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(SHORT_LIMIT, SHORT_WINDOW),
        analytics: true,
        prefix: "nori:chat:min",
      }),
      daily: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(DAILY_LIMIT, DAILY_WINDOW),
        analytics: true,
        prefix: "nori:chat:day",
      }),
    };
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

// Fallback bộ nhớ trong (chỉ cho dev/local).
const memMinute = new Map<string, number[]>();
const memDaily = new Map<string, number[]>();

function memTake(
  store: Map<string, number[]>,
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): { allowed: boolean; retryAfterSec: number } {
  const hits = (store.get(key) ?? []).filter((t) => t > now - windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    store.set(key, hits);
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  hits.push(now);
  store.set(key, hits);
  // Dọn dẹp định kỳ để Map không phình to.
  if (store.size > 2000) {
    const cutoff = now - windowMs;
    for (const [k, times] of store) {
      const kept = times.filter((t) => t > cutoff);
      if (kept.length === 0) store.delete(k);
      else store.set(k, kept);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Kiểm tra một IP có được gửi chat không. Không bao giờ throw:
 * lỗi backend → từ chối an toàn (fail-closed) để bảo vệ quota.
 */
export async function checkRateLimit(key: string): Promise<LimitResult> {
  const upstash = getUpstash();
  if (upstash) {
    try {
      const [minute, daily] = await Promise.all([
        upstash.minute.limit(key),
        upstash.daily.limit(key),
      ]);
      if (!minute.success) {
        return {
          allowed: false,
          retryAfterSec: Math.max(
            1,
            Math.ceil((minute.reset - Date.now()) / 1000),
          ),
          backend: "upstash",
        };
      }
      if (!daily.success) {
        return {
          allowed: false,
          retryAfterSec: Math.max(
            1,
            Math.ceil((daily.reset - Date.now()) / 1000),
          ),
          backend: "upstash",
        };
      }
      return { allowed: true, retryAfterSec: 0, backend: "upstash" };
    } catch {
      // Rớt về bộ nhớ trong nếu Upstash lỗi mạng.
    }
  }
  const now = Date.now();
  const m = memTake(memMinute, key, SHORT_LIMIT, SHORT_WINDOW_MS, now);
  if (!m.allowed) return { ...m, backend: "memory" };
  const d = memTake(memDaily, key, DAILY_LIMIT, DAILY_WINDOW_MS, now);
  return { ...d, backend: "memory" };
}
