import { describe, expect, it } from "vitest";

import { validateChatRequest } from "./validate";

function uiMessage(role: string, text: string) {
  return {
    id: `msg-${role}`,
    role,
    parts: [{ type: "text", text }],
  };
}

describe("validateChatRequest", () => {
  it("chấp nhận yêu cầu hợp lệ và trả về messages", () => {
    const body = {
      messages: [
        uiMessage("user", "Xin chào"),
        uiMessage("assistant", "Chào bạn!"),
        uiMessage("user", "Bạn là ai?"),
      ],
    };
    const result = validateChatRequest(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages).toHaveLength(3);
    }
  });

  it("từ chối body không phải object", () => {
    for (const body of [null, undefined, "hello", 42, []]) {
      const result = validateChatRequest(body);
      expect(result.ok).toBe(false);
    }
  });

  it("từ chối khi thiếu messages hoặc messages rỗng", () => {
    expect(validateChatRequest({}).ok).toBe(false);
    expect(validateChatRequest({ messages: [] }).ok).toBe(false);
    expect(validateChatRequest({ messages: "hello" }).ok).toBe(false);
  });

  it("từ chối message có role không hợp lệ", () => {
    const result = validateChatRequest({
      messages: [uiMessage("admin", "hack")],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("từ chối message thiếu parts", () => {
    const result = validateChatRequest({
      messages: [{ id: "1", role: "user" }],
    });
    expect(result.ok).toBe(false);
  });

  it("từ chối khi quá 30 messages (bảo vệ quota công cộng)", () => {
    const messages = Array.from({ length: 31 }, (_, i) =>
      uiMessage("user", `tin nhắn ${i}`),
    );
    const result = validateChatRequest({ messages });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
  });

  it("từ chối text quá dài trong một part", () => {
    const result = validateChatRequest({
      messages: [uiMessage("user", "a".repeat(8001))],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
  });

  it("từ chối khi tổng nội dung vượt quá giới hạn", () => {
    const messages = Array.from({ length: 5 }, () =>
      uiMessage("user", "b".repeat(6000)),
    );
    const result = validateChatRequest({ messages });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
  });
});
