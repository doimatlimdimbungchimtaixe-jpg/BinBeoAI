"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createConversation,
  createMemoryStorage,
  DEFAULT_TITLE,
  deleteConversation,
  generateTitle,
  loadConversations,
  renameConversation,
  saveConversations,
  type Conversation,
  type Role,
  type StorageLike,
  type StoredMessage,
} from "@/lib/conversations";

function browserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    // Đọc thử để phát hiện chế độ chặn storage.
    window.localStorage.getItem("__nori_probe__");
    return window.localStorage;
  } catch {
    return null;
  }
}

export interface UseConversations {
  conversations: Conversation[];
  active: Conversation | null;
  activeId: string | null;
  loaded: boolean;
  newConversation: () => void;
  select: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
  /** Lưu messages mới của một hội thoại (gọi mỗi khi useChat cập nhật). */
  touch: (id: string, messages: StoredMessage[]) => void;
}

export function useConversations(): UseConversations {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Đọc localStorage sau mount để tránh lệch hydration SSR (server không có
  // localStorage). Đây là đồng bộ từ external system, ngoại lệ hợp lệ của rule.
  useEffect(() => {
    const storage = browserStorage() ?? createMemoryStorage();
    const list = loadConversations(storage);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConversations(list);
    setActiveId(list.length > 0 ? list[0].id : null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const storage = browserStorage();
    if (storage) saveConversations(storage, conversations);
  }, [conversations, loaded]);

  const newConversation = useCallback(() => {
    const c = createConversation();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  }, []);

  const select = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const remove = useCallback(
    (id: string) => {
      const next = deleteConversation(conversations, id);
      setConversations(next);
      if (activeId === id) {
        setActiveId(next.length > 0 ? next[0].id : null);
      }
    },
    [conversations, activeId],
  );

  const rename = useCallback(
    (id: string, title: string) => {
      setConversations(renameConversation(conversations, id, title));
    },
    [conversations],
  );

  const touch = useCallback(
    (id: string, messages: StoredMessage[]) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const firstUser = messages.find((m) => m.role === "user");
          const title =
            c.title === DEFAULT_TITLE && firstUser
              ? generateTitle(firstUser.text)
              : c.title;
          return { ...c, messages, title, updatedAt: Date.now() };
        }),
      );
    },
    [],
  );

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  );

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  return {
    conversations: sorted,
    active,
    activeId,
    loaded,
    newConversation,
    select,
    remove,
    rename,
    touch,
  };
}

export type { Conversation, Role, StoredMessage };
