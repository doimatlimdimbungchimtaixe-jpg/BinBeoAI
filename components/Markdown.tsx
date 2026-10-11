"use client";

import { memo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ children }: { children?: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    const text = boxRef.current?.querySelector("code")?.innerText ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard không khả dụng (trình duyệt cũ / không phải secure context).
    }
  };

  return (
    <div ref={boxRef} className="code-block">
      <button
        type="button"
        onClick={copyCode}
        className="code-copy-btn"
        aria-label="Sao chép đoạn code"
        title="Sao chép đoạn code"
      >
        {copied ? (
          <span className="inline-flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8.5 6.5 12 13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Đã chép
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 3 4v5A1.5 1.5 0 0 0 4.5 10.5H5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Chép code
          </span>
        )}
      </button>
      <pre>{children}</pre>
    </div>
  );
}

interface MarkdownProps {
  text: string;
}

/** Render Markdown (GFM: bảng, checklist, ...) với nút chép code riêng từng khối. */
export const Markdown = memo(function Markdown({ text }: MarkdownProps) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
