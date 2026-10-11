# BinBeoAI — Trợ lý AI tiếng Việt (miễn phí, công khai)

Website AI Chatbot chạy **thật**, dùng **OpenRouter (model free, không cần billing)**:
giao diện chat hiện đại, streaming theo thời gian thực, triển khai lên Vercel để
bất kỳ ai có đường dẫn cũng dùng được ngay — không cài app, không cần API key riêng.

> Không có câu trả lời viết sẵn. Mọi câu trả lời đều do mô hình AI tạo ra dựa trên
> tin nhắn và lịch sử hội thoại của bạn. Website không hứa hẹn lượt dùng không giới hạn:
> tất cả người dùng chung nhau hạn mức miễn phí (xem mục Hạn mức).

## Tính năng

- **Chat AI thật**: model mặc định `nvidia/nemotron-3-ultra-550b-a55b:free`
  (đã xác minh tồn tại + giá $0 trên OpenRouter), đổi được qua `OPENROUTER_MODEL`
  (chỉ dùng model có hậu tố `:free`). Hiểu và trả lời tiếng Việt tự nhiên,
  giữ ngữ cảnh nhiều lượt (đã kiểm thử live).
- **Streaming**: câu trả lời hiện dần từng chữ, có nút **Dừng** khi đang tạo.
- **Quản lý hội thoại**: tạo mới, mở lại, đổi tên, xóa (xác nhận 2 bước), tự đặt
  tiêu đề theo tin nhắn đầu tiên; lưu trong `localStorage`, chịu được dữ liệu hỏng.
- **Markdown đầy đủ**: tiêu đề, danh sách, bảng, liên kết, khối code với
  **nút chép code riêng từng khối**, nút sao chép + **tạo lại** câu trả lời.
- **Sáng/tối + responsive**: nhớ lựa chọn, sidebar thu gọn được, mobile thành ngăn kéo.
- **Bảo vệ quota công cộng**:
  - Rate-limit theo IP: **8 request/phút** + **50 request/ngày** (xem mục Bảo vệ quota).
  - Giới hạn đầu vào: tối đa 30 message, 8.000 ký tự/part, 24.000 ký tự/request;
    đầu ra tối đa 2.048 token/câu trả lời.
  - Không bao giờ tự gọi model trả phí, không nâng cấp, không phát sinh chi phí.
- **Xử lý lỗi rõ ràng**: thiếu key → hướng dẫn cấu hình; sai key, sai model, hết
  hạn mức, nội dung bị chặn → thông báo tiếng Việt cụ thể kèm nút **Thử lại**,
  không mất hội thoại, không giả vờ AI đang hoạt động.
- **Bảo mật**: `OPENROUTER_API_KEY` chỉ nằm phía máy chủ (không tiền tố `NEXT_PUBLIC_`),
  không xuất hiện trong bundle client, log hay Git.

## Công nghệ (phiên bản đã kiểm chứng tương thích)

| Thành phần | Phiên bản |
| --- | --- |
| Next.js (App Router) | 16.4.0 |
| React | 19.3.0 |
| Vercel AI SDK (`ai`) | 7.0.137 |
| `@ai-sdk/react` | 4.0.140 |
| `@ai-sdk/openai-compatible` (OpenRouter) | 3.0.67 |
| Upstash Redis / Ratelimit (rate-limit production) | 1.39.0 / 2.2.0 |
| Tailwind CSS | v4 |
| TypeScript | 5 (strict) |
| Markdown | react-markdown 10 + remark-gfm |
| Test | Vitest 5 |

API phía máy chủ dùng đúng pattern tài liệu AI SDK hiện hành:
`streamText` → `convertToModelMessages` → `toUIMessageStream` →
`createUIMessageStreamResponse`; client dùng `useChat`.

## Chạy trên localhost

### 1. Chuẩn bị

- Node.js 22+ và npm.

### 2. Cài đặt

```powershell
cd <thư-mục-dự-án>
npm install
```

### 3. Tạo API key OpenRouter miễn phí

1. Mở <https://openrouter.ai/keys> và đăng nhập (Google/GitHub đều được).
2. Bấm **Create Key** → đặt tên (ví dụ `binbeoai-local`) → copy key (dạng `sk-or-v1-...`).
3. Dùng model có hậu tố **`:free`** thì không cần thêm thẻ tín dụng, không tốn tiền.

### 4. Cấu hình local

```powershell
Copy-Item .env.example .env.local
```

Mở `.env.local`, điền key (Upstash có thể để trống khi chạy local):

```env
OPENROUTER_API_KEY=sk-or-v1-... (key của bạn)
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

> `.env.local` đã nằm trong `.gitignore`. Dev server tự tải lại env khi file đổi.

### 5. Chạy dev

```powershell
npm run dev
```

Mở <http://localhost:3000> — gửi thử “Xin chào, bạn là ai?”.

### 6. Kiểm tra chất lượng

```powershell
npm test          # test đơn vị (Vitest)
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript
npm run build     # build production (bắt buộc pass trước khi deploy)
```

## Hạn mức miễn phí & giới hạn cần biết

- Model free (`:free`) có giá $0 nhưng **bị giới hạn tốc độ dùng** (rate limit
  riêng của OpenRouter, thường tính theo request/phút và request/ngày cho mỗi
  key/model — con số cụ thể hiển thị trên trang model và trong header `429`).
- Hết hạn mức → website hiện “đã chạm hạn mức miễn phí, đợi vài phút rồi thử lại”.
- Model free đôi khi **nghẽn tạm thời** (nhiều người dùng chung) — thử lại sau
  hoặc chủ website đổi sang model `:free` khác trong `OPENROUTER_MODEL`.
- Lưu ý riêng tư: theo chính sách OpenRouter, prompt gửi tới endpoint free có thể
  được dùng để cải thiện dịch vụ — không gửi thông tin nhạy cảm (mật khẩu, key).
- Website **không** có lượt dùng không giới hạn — đó là giới hạn từ nhà cung cấp.

## Bảo vệ quota khi công khai website

1. **Rate-limit 2 tầng theo IP** (`lib/ratelimit.ts`):
   - 8 request/phút/IP — chặn bot/spam mà người thường không chạm tới.
   - 50 request/ngày/IP — một người không thể một mình cạn hạn mức.
   - Vượt → HTTP `429` kèm số giây cần đợi.
2. **Upstash Redis cho production** (khuyên dùng khi public):
   - In-memory chỉ đếm trong 1 instance — Vercel serverless có nhiều instance
     nên **không** dùng làm giải pháp duy nhất.
   - Tạo Redis miễn phí: <https://upstash.com> → Create Database (gói Free),
     hoặc Vercel Dashboard → Marketplace → Upstash (tự đổ biến môi trường).
   - Thêm 2 biến: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
     (Vercel: Project Settings → Environment Variables; local: `.env.local`).
   - Không có 2 biến này, app tự rớt về in-memory và vẫn chạy (chỉ phù hợp dev).
3. **Trần token**: input ≤ 24.000 ký tự/request, output ≤ 2.048 token/câu trả lời.
4. **Không leo thang**: gặp lỗi không bao giờ tự đổi sang model trả phí;
   model đổi chỉ khi chủ website sửa `OPENROUTER_MODEL` bằng model `:free` khác
   (danh sách: <https://openrouter.ai/models?q=free>).
5. Muốn siết thêm: giảm `DAILY_LIMIT`/`SHORT_LIMIT` trong `lib/ratelimit.ts`.

## Triển khai lên Vercel

### Cách 1: GitHub → Vercel (khuyên dùng)

1. Push code lên GitHub (đảm bảo **không** có `.env.local` — đã gitignore):
   ```powershell
   git init; git add .; git commit -m "BinBeoAI chatbot (OpenRouter free)"
   git remote add origin https://github.com/<bạn>/<repo>.git
   git push -u origin main
   ```
2. Vào <https://vercel.com/new> → **Import** repo. Giữ nguyên thiết lập build.
3. **Environment Variables** (chọn cả Production, Preview, Development):
   - `OPENROUTER_API_KEY` = key từ openrouter.ai/keys (bắt buộc).
   - `OPENROUTER_MODEL` = `nvidia/nemotron-3-ultra-550b-a55b:free` (tùy chọn).
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (khuyên dùng).
4. **Deploy**. Mỗi lần push code mới Vercel tự build lại. Đổi env →
   Settings → Environment Variables → Deployments → **Redeploy**.

### Cách 2: Vercel CLI

```powershell
npm i -g vercel
vercel login
vercel env add OPENROUTER_API_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel --prod
```

### Lưu ý production

- Client gọi API bằng đường dẫn tương đối (`/api/chat`, `/api/config`) —
  không phụ thuộc localhost.
- Không ghi file lâu dài phía server; lịch sử ở `localStorage` trình duyệt.
- Route `/api/chat` đặt `maxDuration = 60` cho stream dài.

## Cấu trúc dự án

```text
app/
  page.tsx            Trang chính (Sidebar + ChatPane + header)
  layout.tsx          Metadata tiếng Việt, font Be Vietnam Pro, chống nháy theme
  globals.css         Tailwind v4 + style (sáng/tối, markdown, chat)
  api/chat/route.ts   POST /api/chat — validate, rate-limit, gọi OpenRouter, stream
  api/config/route.ts GET /api/config — client biết đã cấu hình key chưa (không lộ key)
components/           ChatPane (useChat/streaming), MessageItem, ChatInput,
                      Markdown (+chép code), Sidebar
hooks/useConversations.ts  Trạng thái hội thoại + persist localStorage
lib/
  ai.ts               Lớp AI (OpenRouter): model, system prompt, ánh xạ lỗi (chỉ server)
  ratelimit.ts        Rate-limit Upstash-first, fallback memory (chỉ dev)
  validate.ts         Validate body /api/chat (có test)
  conversations.ts    CRUD + storage localStorage chịu lỗi (có test)
```

## Xử lý sự cố

| Triệu chứng | Cách sửa |
| --- | --- |
| “AI chưa được cấu hình” | Thêm `OPENROUTER_API_KEY` vào env (local: `.env.local`; Vercel: Environment Variables + Redeploy). |
| “API key không hợp lệ” | Key sai/thu hồi — tạo key mới tại openrouter.ai/keys. |
| “Model không tồn tại” (No endpoints found) | `OPENROUTER_MODEL` sai — đối chiếu https://openrouter.ai/models. |
| “Chạm hạn mức miễn phí” | Hết quota free của OpenRouter — đợi vài phút; nếu kéo dài, đổi model `:free` khác. |
| Spam 429 liên tục khi test local | Rate-limit local cũng áp 8 req/phút — đợi 1 phút. |
| Upstash báo lỗi kết nối | App tự rớt về in-memory và vẫn chạy; kiểm tra lại URL/TOKEN. |
| Port 3000 bận | `npm run dev -- -p 3001`. |
