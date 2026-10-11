"use client";

import { useState } from "react";

import { Markdown } from "./Markdown";
import { Mascot } from "./Mascot";

interface MessageItemProps {
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

export function MessageItem({
  role,
  text,
  streaming,
  isLastAssistant,
  onRegenerate,
  canRegenerate,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Bỏ qua khi clipboard không khả dụng.
    }
  };

  if (role === "user") {
    return (
      <div className="msg-row msg-row-user">
        <div className="msg-bubble-user">
          <p className="whitespace-pre-wrap break-words">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-row msg-row-ai">
      <span className="ai-avatar">
        <Mascot size={30} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="msg-ai-body">
          {text ? (
            <Markdown text={text} />
          ) : (
            <span className="thinking-dots" aria-label="Đang soạn câu trả lời">
              <span />
              <span />
              <span />
            </span>
          )}
          {streaming && text ? <span className="stream-caret" aria-hidden="true" /> : null}
        </div>
        {!streaming && text ? (
          <div className="msg-actions">
            <button
              type="button"
              onClick={copyText}
              className="msg-action-btn"
              aria-label="Sao chép câu trả lời"
              title="Sao chép câu trả lời"
            >
              {copied ? "Đã chép" : "Sao chép"}
            </button>
            {isLastAssistant && onRegenerate ? (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={!canRegenerate}
                className="msg-action-btn"
                aria-label="Tạo lại câu trả lời"
                title="Tạo lại câu trả lời"
              >
                Tạo lại
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
