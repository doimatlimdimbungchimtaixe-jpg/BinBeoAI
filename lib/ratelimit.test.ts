import { describe, expect, it } from "vitest";

import { checkRateLimit } from "./ratelimit";

describe("checkRateLimit (fallback khi thiếu Upstash)", () => {
  it("cho qua vài request đầu", async () => {
    const key = `test-ok-${Date.now()}-a`;
    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit(key);
      expect(r.allowed).toBe(true);
    }
  });

  it("chặn khi vượt 8 request/phút trên cùng IP", async () => {
    const key = `test-spam-${Date.now()}-b`;
    let allowed = 0;
    for (let i = 0; i < 12; i++) {
      const r = await checkRateLimit(key);
      if (r.allowed) allowed++;
    }
    expect(allowed).toBe(8);
    const last = await checkRateLimit(key);
    expect(last.allowed).toBe(false);
    expect(last.retryAfterSec).toBeGreaterThan(0);
  });

  it("IP khác nhau có hạn mức riêng", async () => {
    const stamp = Date.now();
    for (let i = 0; i < 8; i++) {
      await checkRateLimit(`test-ip1-${stamp}`);
    }
    const other = await checkRateLimit(`test-ip2-${stamp}`);
    expect(other.allowed).toBe(true);
  });

  it("không throw khi thiếu cấu hình Upstash", async () => {
    expect(process.env.UPSTASH_REDIS_REST_URL).toBeUndefined();
    const r = await checkRateLimit(`test-noenv-${Date.now()}`);
    expect(typeof r.allowed).toBe("boolean");
    expect(r.backend).toBe("memory");
  });
});
