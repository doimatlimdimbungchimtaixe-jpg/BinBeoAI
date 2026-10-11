import type { UIMessage } from "ai";

/** Số message tối đa trong một yêu cầu chat (giữ nhỏ để bảo vệ quota công cộng). */
export const MAX_MESSAGES = 30;
/** Số ký tự tối đa trong một text part. */
export const MAX_PART_CHARS = 8_000;
/** Tổng số ký tự tối đa của toàn bộ yêu cầu. */
export const MAX_TOTAL_CHARS = 24_000;

const VALID_ROLES = new Set(["user", "assistant", "system"]);

export type ValidationSuccess = { ok: true; messages: UIMessage[] };
export type ValidationFailure = {
  ok: false;
  error: string;
  status: number;
};
export type ValidationResult = ValidationSuccess | ValidationFailure;

function fail(status: number, error: string): ValidationFailure {
  return { ok: false, status, error };
}

/**
 * Kiểm tra body của POST /api/chat.
 * Chỉ kiểm tra cấu trúc, không gọi AI nên an toàn để test đơn vị.
 */
export function validateChatRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail(400, "invalid_request");
  }
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return fail(400, "invalid_request");
  }
  if (messages.length > MAX_MESSAGES) {
    return fail(413, "request_too_large");
  }

  let totalChars = 0;
  for (const message of messages) {
    if (typeof message !== "object" || message === null) {
      return fail(400, "invalid_request");
    }
    const { role, parts } = message as { role?: unknown; parts?: unknown };
    if (typeof role !== "string" || !VALID_ROLES.has(role)) {
      return fail(400, "invalid_request");
    }
    if (!Array.isArray(parts) || parts.length === 0) {
      return fail(400, "invalid_request");
    }
    for (const part of parts) {
      if (typeof part !== "object" || part === null) {
        return fail(400, "invalid_request");
      }
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") {
        if (text.length > MAX_PART_CHARS) {
          return fail(413, "request_too_large");
        }
        totalChars += text.length;
        if (totalChars > MAX_TOTAL_CHARS) {
          return fail(413, "request_too_large");
        }
      }
    }
  }

  return { ok: true, messages: messages as UIMessage[] };
}
