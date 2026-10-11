import type { UIMessage } from "ai";

export type Role = "user" | "assistant" | "system";

export interface StoredMessage {
  id: string;
  role: Role;
  text: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Giao diện tối thiểu của localStorage để dễ test và thay thế sau này. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "nori-conversations";
export const DEFAULT_TITLE = "Cuộc trò chuyện mới";
const TITLE_MAX_LENGTH = 40;
const VALID_ROLES = new Set(["user", "assistant", "system"]);

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Storage trong bộ nhớ, dùng cho test và môi trường không có localStorage. */
export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

export function generateTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return DEFAULT_TITLE;
  if (clean.length <= TITLE_MAX_LENGTH) return clean;
  return `${clean.slice(0, TITLE_MAX_LENGTH).trimEnd()}...`;
}

export function createConversation(firstText = ""): Conversation {
  const now = Date.now();
  return {
    id: uid(),
    title: generateTitle(firstText),
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addMessage(
  conversation: Conversation,
  message: { role: Role; text: string },
): Conversation {
  const now = Date.now();
  return {
    ...conversation,
    messages: [
      ...conversation.messages,
      { id: uid(), role: message.role, text: message.text, createdAt: now },
    ],
    updatedAt: now,
  };
}

export function renameConversation(
  list: Conversation[],
  id: string,
  title: string,
): Conversation[] {
  const clean = title.trim();
  if (!clean) return list;
  return list.map((c) =>
    c.id === id ? { ...c, title: clean, updatedAt: Date.now() } : c,
  );
}

export function deleteConversation(
  list: Conversation[],
  id: string,
): Conversation[] {
  return list.filter((c) => c.id !== id);
}

function isValidRole(role: unknown): role is Role {
  return typeof role === "string" && VALID_ROLES.has(role);
}

function normalizeConversation(raw: unknown): Conversation | null {
  if (typeof raw !== "object" || raw === null) return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.id !== "string" || typeof c.title !== "string") return null;
  if (!Array.isArray(c.messages)) return null;
  const messages: StoredMessage[] = [];
  for (const m of c.messages) {
    if (typeof m !== "object" || m === null) continue;
    const msg = m as Record<string, unknown>;
    if (!isValidRole(msg.role) || typeof msg.text !== "string") continue;
    messages.push({
      id: typeof msg.id === "string" ? msg.id : uid(),
      role: msg.role,
      text: msg.text,
      createdAt: typeof msg.createdAt === "number" ? msg.createdAt : Date.now(),
    });
  }
  const now = Date.now();
  return {
    id: c.id,
    title: c.title,
    messages,
    createdAt: typeof c.createdAt === "number" ? c.createdAt : now,
    updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : now,
  };
}

/** Đọc danh sách hội thoại. Không bao giờ throw: storage trống/hỏng → []. */
export function loadConversations(storage: StorageLike): Conversation[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list: Conversation[] = [];
    for (const item of parsed) {
      const c = normalizeConversation(item);
      if (c) list.push(c);
    }
    return list;
  } catch {
    return [];
  }
}

/** Lưu danh sách hội thoại. Không bao giờ throw. */
export function saveConversations(
  storage: StorageLike,
  list: Conversation[],
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Bỏ qua lỗi quota/truy cập storage (ví dụ chế độ riêng tư).
  }
}

interface UIMessageLike {
  id?: unknown;
  role?: unknown;
  parts?: unknown;
}

/** Rút gọn UIMessage từ AI SDK thành dạng lưu trữ gọn nhẹ. */
export function fromUIMessages(messages: UIMessageLike[]): StoredMessage[] {
  const now = Date.now();
  const stored: StoredMessage[] = [];
  for (const m of messages) {
    if (typeof m !== "object" || m === null) continue;
    if (!isValidRole(m.role)) continue;
    const parts = Array.isArray(m.parts) ? m.parts : [];
    const texts: string[] = [];
    for (const part of parts) {
      if (
        typeof part === "object" &&
        part !== null &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        texts.push((part as { text: string }).text);
      }
    }
    stored.push({
      id: typeof m.id === "string" ? m.id : uid(),
      role: m.role,
      text: texts.join("\n"),
      createdAt: now,
    });
  }
  return stored;
}

/** Dựng lại UIMessage cho AI SDK từ dạng lưu trữ. */
export function toUIMessages(messages: StoredMessage[]): UIMessage[] {
  return messages.map(
    (m) =>
      ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.text }],
      }) as UIMessage,
  );
}
