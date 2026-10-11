"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { UIMessage } from "ai";

import { fromUIMessages, toUIMessages, type StoredMessage } from "@/lib/conversations";
import { ChatInput } from "./ChatInput";
import { Mascot } from "./Mascot";
import { MessageItem } from "./MessageItem";

interface ChatPaneProps {
  conversationId: string;
  initialMessages: StoredMessage[];
  /** null = đang kiểm tra; false = chưa cấu hình API key. */
  apiConfigured: boolean | null;
  onMessagesChange: (id: string, messages: StoredMessage[]) => void;
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n");
}

const SUGGESTIONS = [
  "Giải thích định lý Pythagoras thật đơn giản cho học sinh lớp 8",
  "Viết giúp tôi một email xin nghỉ phép lịch sự bằng tiếng Việt",
  "Gợi ý lịch trình du lịch Đà Lạt 3 ngày 2 đêm",
  "Hàm debounce trong JavaScript hoạt động như thế nào?",
];

export function ChatPane({
  conversationId,
  initialMessages,
  apiConfigured,
  onMessagesChange,
}: ChatPaneProps) {
  const { messages, sendMessage, regenerate, stop, status, error, clearError } =
    useChat({
      messages: toUIMessages(initialMessages),
    });
  const [input, setInput] = useState("");
  const [stickToBottom, setStickToBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(false);

  const busy = status === "submitted" || status === "streaming";

  // Lưu lịch sử mỗi khi messages thay đổi (kể cả khi dừng giữa chừng).
  useEffect(() => {
    onMessagesChange(conversationId, fromUIMessages(messages));
  }, [messages, conversationId, onMessagesChange]);

  // Tự động cuộn khi có nội dung mới, trừ khi người dùng đang đọc tin cũ.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, status, stickToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distance < 80);
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    clearError();
    pendingRef.current = true;
    setStickToBottom(true);
    void sendMessage({ text: clean });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    setInput("");
    send(text);
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const canRegenerate =
    !busy && !!lastMessage && lastMessage.role === "assistant";

  return (
    <div className="chat-pane">
      <div ref={scrollRef} onScroll={handleScroll} className="chat-scroll">
        {messages.length === 0 ? (
          <div className="welcome">
            <Mascot size={72} className="welcome-mascot" />
            <h2 className="welcome-title">
              Xin chào, tôi là <span className="grad">BinBeoAI</span>
            </h2>
            <p className="welcome-sub">
              Trợ lý AI tiếng Việt — hỏi đáp, giải thích, viết lách, lập trình
              và nhiều hơn nữa.
            </p>
            <div className="feature-pills" aria-label="Điểm nổi bật">
              <span>Tiếng Việt tự nhiên</span>
              <span>Trả lời trực tiếp</span>
              <span>Miễn phí</span>
            </div>
            {apiConfigured === false ? (
              <div className="setup-card" role="alert">
                <p className="setup-title">Chưa kết nối được tới mô hình AI</p>
                <p className="setup-text">
                  Website chưa có <code>OPENROUTER_API_KEY</code>. Chủ website
                  cần tạo key miễn phí tại <code>openrouter.ai/keys</code>,
                  thêm vào biến môi trường (xem <code>.env.example</code> và
                  README) rồi triển khai lại.
                </p>
              </div>
            ) : (
              <div className="suggestion-grid">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    disabled={busy}
                    className="suggestion-card"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="msg-list">
            {messages.map((m, index) => {
              if (m.role !== "user" && m.role !== "assistant") return null;
              const text = messageText(m);
              const isStreaming =
                busy && index === messages.length - 1 && m.role === "assistant";
              return (
                <MessageItem
                  key={m.id}
                  role={m.role}
                  text={text}
                  streaming={isStreaming}
                  isLastAssistant={
                    m.role === "assistant" && index === messages.length - 1
                  }
                  onRegenerate={() => {
                    clearError();
                    void regenerate();
                  }}
                  canRegenerate={canRegenerate}
                />
              );
            })}
            {status === "submitted" && lastMessage?.role === "user" ? (
              <div className="msg-row msg-row-ai">
                <span className="ai-avatar">
                  <Mascot size={30} />
                </span>
                <span className="thinking-dots" aria-label="Đang xử lý">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : null}
          </div>
        )}

        {status === "error" ? (
          <div className="error-banner" role="alert">
            <div>
              <p className="error-title">Gặp lỗi khi tạo câu trả lời</p>
              <p className="error-text">
                Có thể do mất mạng, API key sai hoặc nhà cung cấp AI quá tải.
                Lịch sử hội thoại của bạn vẫn được giữ nguyên.
              </p>
              {error ? (
                <details className="error-details">
                  <summary>Chi tiết kỹ thuật</summary>
                  <code>{error.message}</code>
                </details>
              ) : null}
            </div>
            <div className="error-actions">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  void regenerate();
                }}
                className="btn-primary btn-sm"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={clearError}
                className="btn-ghost btn-sm"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="composer-form">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => {
            send(input);
            setInput("");
          }}
          onStop={stop}
          busy={busy}
          disabled={apiConfigured === false}
          disabledHint="AI chưa được cấu hình trên website này. Hãy quay lại sau."
        />
      </form>
    </div>
  );
}
