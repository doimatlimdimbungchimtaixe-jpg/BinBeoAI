"use client";

import { useState } from "react";

import type { Conversation } from "@/hooks/useConversations";
import { Mascot } from "./Mascot";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Vừa xong";
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRename = (c: Conversation) => {
    setEditingId(c.id);
    setDraft(c.title);
    setConfirmDeleteId(null);
  };

  const commitRename = (id: string) => {
    if (draft.trim()) onRename(id, draft.trim());
    setEditingId(null);
  };

  const body = (
    <div className="sidebar-body">
      <div className="sidebar-top">
        <div className="brand">
          <Mascot size={38} />
          <span className="brand-text">
            <span className="brand-name">BinBeoAI</span>
            <span className="brand-sub">Trợ lý AI</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="icon-btn"
          aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 3 5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <button type="button" onClick={onNew} className="new-chat-btn">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        Cuộc trò chuyện mới
      </button>

      <p className="conv-label">Lịch sử trò chuyện</p>
      <div className="conv-list" role="list">
        {conversations.length === 0 ? (
          <p className="conv-empty">Chưa có cuộc trò chuyện nào.</p>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeId;
            const isEditing = editingId === c.id;
            const preview =
              c.messages.length > 0
                ? (c.messages[c.messages.length - 1]?.text ?? "")
                    .replace(/\s+/g, " ")
                    .slice(0, 60)
                : "Cuộc trò chuyện mới";
            return (
              <div
                key={c.id}
                role="listitem"
                className={`conv-item${isActive ? " conv-item-active" : ""}`}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commitRename(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(c.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="conv-rename-input"
                    aria-label="Đổi tên cuộc trò chuyện"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c.id);
                      onCloseMobile();
                    }}
                    className="conv-main"
                    aria-label={`Mở ${c.title}`}
                  >
                    <span className="conv-title">{c.title}</span>
                    <span className="conv-meta">
                      {preview}
                      {" · "}
                      {timeAgo(c.updatedAt)}
                    </span>
                  </button>
                )}
                {!isEditing && (
                  <span className="conv-tools">
                    <button
                      type="button"
                      onClick={() => startRename(c)}
                      className="icon-btn icon-btn-sm"
                      aria-label={`Đổi tên ${c.title}`}
                      title="Đổi tên"
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M11.5 2.5 13.5 4.5 5.5 12.5l-3 1 1-3 8.5-8.5Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {confirmDeleteId === c.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(c.id);
                          setConfirmDeleteId(null);
                        }}
                        className="conv-confirm-delete"
                        aria-label={`Xác nhận xóa ${c.title}`}
                      >
                        Xóa?
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(c.id);
                          window.setTimeout(() => {
                            setConfirmDeleteId((cur) =>
                              cur === c.id ? null : cur,
                            );
                          }, 3000);
                        }}
                        className="icon-btn icon-btn-sm"
                        aria-label={`Xóa ${c.title}`}
                        title="Xóa"
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path
                            d="M3 4.5h10M6.5 4V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M5 4.5l.7 8a1 1 0 0 0 1 .9h2.6a1 1 0 0 0 1-.9l.7-8"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="sidebar-foot">
        Lịch sử được lưu trên trình duyệt này.
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`sidebar-desktop${collapsed ? " sidebar-collapsed" : ""}`}
        aria-label="Thanh bên hội thoại"
      >
        {!collapsed && body}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`drawer-backdrop${mobileOpen ? " drawer-backdrop-open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        className={`sidebar-mobile${mobileOpen ? " sidebar-mobile-open" : ""}`}
        aria-label="Thanh bên hội thoại"
      >
        <div className="drawer-close-row">
          <button
            type="button"
            onClick={onCloseMobile}
            className="icon-btn"
            aria-label="Đóng thanh bên"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="m4 4 8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {body}
      </aside>
    </>
  );
}
