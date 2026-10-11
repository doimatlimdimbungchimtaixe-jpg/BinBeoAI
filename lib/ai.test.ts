import { describe, expect, it } from "vitest";

import { createChatModel, getConfiguredModel, mapUpstreamError } from "./ai";

const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

describe("createChatModel (OpenRouter)", () => {
  it("dùng OPENROUTER_API_KEY và model free mặc định", () => {
    const prevKey = process.env.OPENROUTER_API_KEY;
    const prevModel = process.env.OPENROUTER_MODEL;
    try {
      process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
      delete process.env.OPENROUTER_MODEL;
      const model = createChatModel() as unknown as { modelId: string };
      expect(model.modelId).toBe(DEFAULT_MODEL);
      expect(getConfiguredModel()).toBe(DEFAULT_MODEL);
    } finally {
      if (prevKey === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = prevKey;
      if (prevModel === undefined) delete process.env.OPENROUTER_MODEL;
      else process.env.OPENROUTER_MODEL = prevModel;
    }
  });

  it("ưu tiên OPENROUTER_MODEL khi được cấu hình", () => {
    const prev = process.env.OPENROUTER_MODEL;
    try {
      process.env.OPENROUTER_MODEL = "vendor/model:free";
      expect(getConfiguredModel()).toBe("vendor/model:free");
    } finally {
      if (prev === undefined) delete process.env.OPENROUTER_MODEL;
      else process.env.OPENROUTER_MODEL = prev;
    }
  });
});

describe("mapUpstreamError (OpenRouter)", () => {
  it("ánh xạ key sai thành auth_failed", () => {
    const mapped = mapUpstreamError(
      new Error("401 Invalid API key provided"),
    );
    expect(mapped.code).toBe("auth_failed");
    expect(mapped.status).toBe(502);
    expect(mapped.message).toContain("API key");
  });

  it("ánh xạ model không tồn tại thành model_not_found", () => {
    const mapped = mapUpstreamError(
      new Error("404 No endpoints found for model-khong-ton-tai"),
    );
    expect(mapped.code).toBe("model_not_found");
    expect(mapped.message).toContain("Model");
  });

  it("ánh xạ hết hạn mức free thành thông báo dễ hiểu", () => {
    const mapped = mapUpstreamError(
      new Error("429 Rate limit exceeded: free-models-per-day"),
    );
    expect(mapped.code).toBe("rate_limited");
    expect(mapped.message).toContain("hạn mức");
  });

  it("ánh xạ nội dung bị chặn thành blocked_content", () => {
    const mapped = mapUpstreamError(
      new Error("Response flagged by content moderation"),
    );
    expect(mapped.code).toBe("blocked_content");
  });

  it("ánh xạ lỗi lạ thành upstream_error chung chung", () => {
    const mapped = mapUpstreamError(new Error("socket hang up"));
    expect(mapped.code).toBe("upstream_error");
    expect(mapped.status).toBe(502);
  });

  it("không bao giờ lộ API key trong thông báo", () => {
    const mapped = mapUpstreamError(
      new Error("Invalid API key: sk-or-v1-SECRET123"),
    );
    expect(mapped.message).not.toContain("sk-or-v1-SECRET123");
  });
});
