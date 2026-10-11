import { connection } from "next/server";

import { getConfiguredModel, hasApiKey } from "@/lib/ai";

/**
 * Trạng thái cấu hình cho client.
 * CHỈ trả về cờ configured + tên model, không bao giờ lộ API key.
 */
export async function GET() {
  // Buộc render động mỗi request để đọc env lúc runtime
  // (tránh bị prerender tĩnh làm "đóng băng" giá trị lúc build).
  await connection();
  return Response.json({
    configured: hasApiKey(),
    model: getConfiguredModel(),
  });
}
