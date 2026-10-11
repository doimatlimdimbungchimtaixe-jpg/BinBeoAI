import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Lớp tích hợp mô hình AI (OpenRouter — model free, không cần billing).
 *
 * Mọi gọi tới nhà cung cấp AI đều đi qua file này để dễ thay đổi
 * model/nhà cung cấp trong tương lai. File này CHỈ được import từ
 * phía máy chủ (Route Handler), không bao giờ import từ component client
 * để tránh lộ API key vào bundle trình duyệt.
 */

export const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
/** Giới hạn token đầu ra mỗi câu trả lời để bảo vệ hạn mức miễn phí chung. */
export const MAX_OUTPUT_TOKENS = 2048;

const BASE_URL = "https://openrouter.ai/api/v1";

export function getConfiguredModel(): string {
  const fromEnv = process.env.OPENROUTER_MODEL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_MODEL;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

/**
 * Khởi tạo model OpenRouter đang được cấu hình (chuẩn OpenAI-compatible).
 * API key lấy tường minh từ OPENROUTER_API_KEY.
 */
export function createChatModel() {
  const provider = createOpenAICompatible({
    name: "openrouter",
    baseURL: BASE_URL,
    apiKey: process.env.OPENROUTER_API_KEY?.trim(),
  });
  return provider(getConfiguredModel());
}

export const SYSTEM_PROMPT = `Bạn là BinBeoAI, một trợ lý AI thân thiện và hữu ích, thành thạo tiếng Việt.

Nguyên tắc trả lời:
- Luôn trả lời đúng ngôn ngữ mà người dùng đang dùng (chủ yếu là tiếng Việt tự nhiên, rõ ràng). Nếu người dùng dùng tiếng Anh hoặc ngôn ngữ khác, hãy trả lời bằng ngôn ngữ đó.
- Dùng lịch sử hội thoại được cung cấp để duy trì ngữ cảnh nhiều lượt.
- Dùng định dạng Markdown khi phù hợp (tiêu đề, danh sách, bảng, khối code) để dễ đọc.
- Khi viết code, hãy viết code đầy đủ, đúng và có giải thích ngắn gọn bằng tiếng Việt.
- Trung thực về khả năng của mình: bạn không có khả năng tìm kiếm Internet theo thời gian thực, không thể chạy công cụ hay xác minh thông tin bên ngoài. Nếu không chắc chắn, hãy nói rõ.
- Trả lời súc tích nhưng đầy đủ; giải thích chi tiết khi người dùng yêu cầu học tập, lập trình hoặc phân tích.`;

export type ChatApiErrorCode =
  | "missing_api_key"
  | "invalid_request"
  | "request_too_large"
  | "rate_limited"
  | "auth_failed"
  | "model_not_found"
  | "blocked_content"
  | "upstream_error";

export interface MappedError {
  status: number;
  code: ChatApiErrorCode;
  /** Thông báo tiếng Việt, an toàn để hiển thị cho người dùng. Không chứa API key. */
  message: string;
}

/** Ánh xạ lỗi từ OpenRouter thành thông báo thân thiện, không lộ bí mật. */
export function mapUpstreamError(err: unknown): MappedError {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid api key") ||
    lower.includes("api key not valid") ||
    lower.includes("api_key_invalid") ||
    lower.includes("unauthorized") ||
    lower.includes(" 401") ||
    lower.includes("authentication")
  ) {
    return {
      status: 502,
      code: "auth_failed",
      message:
        "API key OpenRouter không hợp lệ. Chủ website cần kiểm tra lại OPENROUTER_API_KEY.",
    };
  }
  if (
    lower.includes("no endpoints found") ||
    lower.includes("model not found") ||
    lower.includes("not found") ||
    lower.includes(" 404")
  ) {
    return {
      status: 502,
      code: "model_not_found",
      message:
        "Model AI đang cấu hình không tồn tại trên OpenRouter. Chủ website cần cập nhật OPENROUTER_MODEL (danh sách model free: https://openrouter.ai/models).",
    };
  }
  if (
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("free-models-per-day") ||
    lower.includes("quota") ||
    lower.includes("resource_exhausted") ||
    lower.includes(" 429")
  ) {
    return {
      status: 502,
      code: "rate_limited",
      message:
        "Website đã chạm hạn mức miễn phí lúc này. Hãy đợi vài phút rồi thử lại.",
    };
  }
  if (
    lower.includes("safety") ||
    lower.includes("blocked") ||
    lower.includes("flagged") ||
    lower.includes("content moderat")
  ) {
    return {
      status: 502,
      code: "blocked_content",
      message:
        "Câu trả lời bị bộ lọc an toàn chặn. Hãy thử diễn đạt lại câu hỏi.",
    };
  }
  return {
    status: 502,
    code: "upstream_error",
    message:
      "Không kết nối được tới mô hình AI lúc này. Hãy kiểm tra mạng và thử lại sau.",
  };
}
