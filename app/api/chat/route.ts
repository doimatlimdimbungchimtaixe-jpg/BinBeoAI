import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";

import {
  createChatModel,
  hasApiKey,
  mapUpstreamError,
  MAX_OUTPUT_TOKENS,
  SYSTEM_PROMPT,
} from "@/lib/ai";
import { checkRateLimit } from "@/lib/ratelimit";
import { validateChatRequest } from "@/lib/validate";

/** Cho phép stream dài trên Vercel (giới hạn nền tảng vẫn được áp dụng). */
export const maxDuration = 60;

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "local";
}

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      {
        code: "missing_api_key",
        message:
          "AI chưa được cấu hình trên website này. Chủ website cần thêm OPENROUTER_API_KEY (tạo miễn phí tại https://openrouter.ai/keys) rồi triển khai lại.",
      },
      { status: 500 },
    );
  }

  const limited = await checkRateLimit(`chat:${clientIp(req)}`);
  if (!limited.allowed) {
    return Response.json(
      {
        code: "rate_limited",
        message: `Bạn đã gửi quá nhiều yêu cầu. Hãy đợi khoảng ${limited.retryAfterSec} giây rồi thử lại để nhường quota miễn phí cho mọi người.`,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { code: "invalid_request", message: "Nội dung yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  const validation = validateChatRequest(body);
  if (!validation.ok) {
    const message =
      validation.status === 413
        ? "Yêu cầu quá lớn. Hãy rút gọn nội dung hoặc bắt đầu cuộc trò chuyện mới."
        : "Yêu cầu không hợp lệ. Hãy thử gửi lại tin nhắn.";
    return Response.json(
      { code: validation.error, message },
      { status: validation.status },
    );
  }

  try {
    const result = streamText({
      model: createChatModel(),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(validation.messages),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        // Lỗi xảy ra giữa chừng (sai key, hết quota, model lạ...) không thể
        // đổi thành HTTP error vì headers đã gửi — ánh xạ thành thông báo
        // tiếng Việt thân thiện ngay trong stream để client hiển thị.
        onError: (err) => mapUpstreamError(err).message,
      }),
    });
  } catch (err) {
    const mapped = mapUpstreamError(err);
    return Response.json(
      { code: mapped.code, message: mapped.message },
      { status: mapped.status },
    );
  }
}
