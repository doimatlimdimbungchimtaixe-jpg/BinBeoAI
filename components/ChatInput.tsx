"use client";

import { useRef } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  disabled?: boolean;
  disabledHint?: string;
}

const MAX_HEIGHT = 200;

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  disabled,
  disabledHint,
}: ChatInputProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  };

  const canSend = value.trim().length > 0 && !busy && !disabled;

  return (
    <div className="composer">
      <div className="composer-box">
        <textarea
          ref={areaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={
            disabled
              ? (disabledHint ?? "Chưa thể gửi tin nhắn lúc này.")
              : "Nhắn tin cho BinBeoAI… (Enter để gửi, Shift + Enter để xuống dòng)"
          }
          aria-label="Nhập tin nhắn"
          className="composer-textarea"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="composer-btn composer-btn-stop"
            aria-label="Dừng tạo câu trả lời"
            title="Dừng tạo câu trả lời"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="composer-btn composer-btn-send"
            aria-label="Gửi tin nhắn"
            title="Gửi tin nhắn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 13V3M8 3 3.5 7.5M8 3l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <p className="composer-hint">
        BinBeoAI có thể mắc lỗi — hãy kiểm chứng thông tin quan trọng.
      </p>
    </div>
  );
}
