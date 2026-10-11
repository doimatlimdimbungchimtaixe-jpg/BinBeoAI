"use client";

import { useCallback, useEffect, useState } from "react";

import { ChatPane } from "@/components/ChatPane";
import { Mascot } from "@/components/Mascot";
import { Sidebar } from "@/components/Sidebar";
import { useConversations } from "@/hooks/useConversations";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  try {
    const saved = window.localStorage.getItem("nori-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Bỏ qua khi không đọc được storage.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function Home() {
  const {
    conversations,
    active,
    activeId,
    loaded,
    newConversation,
    select,
    remove,
    rename,
    touch,
  } = useConversations();
  const [theme, setTheme] = useState<Theme>("light");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [modelName, setModelName] = useState("");

  // Đồng bộ icon với theme mà script chặn-nháy đã áp dụng. Đọc
  // media query/localStorage trong effect để tránh lệch hydration SSR.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getPreferredTheme());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelled || typeof data !== "object" || data === null) return;
        const cfg = data as { configured?: unknown; model?: unknown };
        setApiConfigured(cfg.configured === true);
        if (typeof cfg.model === "string") setModelName(cfg.model);
      })
      .catch(() => {
        if (!cancelled) setApiConfigured(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        window.localStorage.setItem("nori-theme", next);
      } catch {
        // Bỏ qua khi không ghi được storage.
      }
      return next;
    });
  }, []);

  const handleMessagesChange = useCallback(
    (id: string, messages: Parameters<typeof touch>[1]) => {
      touch(id, messages);
    },
    [touch],
  );

  return (
    <div className="app-shell">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={select}
        onNew={newConversation}
        onRename={rename}
        onDelete={remove}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="icon-btn md-hidden"
              aria-label="Mở danh sách hội thoại"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 4.5h12M2 8h12M2 11.5h12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="icon-btn md-only"
                aria-label="Mở rộng thanh bên"
                title="Mở rộng thanh bên"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6 3l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
            <span className="topbar-brand">BinBeoAI</span>
            {modelName ? (
              <span className="model-badge" title="Mô hình AI đang dùng">
                {modelName}
              </span>
            ) : null}
          </div>
          <div className="topbar-right">
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn"
              aria-label={
                theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
              }
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5 3.4 12.6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={newConversation}
              className="btn-ghost btn-sm"
            >
              + Cuộc trò chuyện mới
            </button>
          </div>
        </header>

        <main className="chat-main">
          {!loaded ? (
            <div className="loading-lite" aria-label="Đang tải">
              <span className="thinking-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          ) : active ? (
            <ChatPane
              key={active.id}
              conversationId={active.id}
              initialMessages={active.messages}
              apiConfigured={apiConfigured}
              onMessagesChange={handleMessagesChange}
            />
          ) : (
            <div className="welcome">
              <Mascot size={72} className="welcome-mascot" />
              <h2 className="welcome-title">Bắt đầu với BinBeoAI</h2>
              <p className="welcome-sub">
                Tạo cuộc trò chuyện mới để hỏi đáp bằng tiếng Việt.
              </p>
              <button
                type="button"
                onClick={newConversation}
                className="btn-primary"
              >
                Bắt đầu trò chuyện
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
