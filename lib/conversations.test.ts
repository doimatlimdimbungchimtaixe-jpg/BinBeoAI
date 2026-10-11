import { describe, expect, it } from "vitest";

import {
  addMessage,
  createConversation,
  createMemoryStorage,
  deleteConversation,
  fromUIMessages,
  generateTitle,
  loadConversations,
  renameConversation,
  saveConversations,
  toUIMessages,
  type Conversation,
} from "./conversations";

function sampleConversation(): Conversation {
  return {
    ...createConversation("Xin chào BinBeoAI"),
    messages: [],
  };
}

describe("createConversation", () => {
  it("tạo hội thoại với id, tiêu đề và timestamp", () => {
    const c = createConversation("Xin chào");
    expect(c.id.length).toBeGreaterThan(0);
    expect(c.title).toBe("Xin chào");
    expect(c.messages).toEqual([]);
    expect(c.createdAt).toBeLessThanOrEqual(c.updatedAt);
  });

  it("dùng tiêu đề mặc định khi không có nội dung", () => {
    expect(createConversation("").title).toBe("Cuộc trò chuyện mới");
    expect(createConversation("   ").title).toBe("Cuộc trò chuyện mới");
  });
});

describe("generateTitle", () => {
  it("rút gọn tiêu đề dài quá 40 ký tự", () => {
    const title = generateTitle("a".repeat(100));
    expect(title.length).toBeLessThanOrEqual(43);
    expect(title.endsWith("...")).toBe(true);
  });

  it("gộp khoảng trắng thừa", () => {
    expect(generateTitle("  xin   chào\nbạn  ")).toBe("xin chào bạn");
  });
});

describe("addMessage", () => {
  it("thêm tin nhắn và cập nhật updatedAt", () => {
    const c = sampleConversation();
    const updated = addMessage(c, { role: "user", text: "Hello" });
    expect(updated.messages).toHaveLength(1);
    expect(updated.messages[0]?.text).toBe("Hello");
    expect(updated.updatedAt).toBeGreaterThanOrEqual(c.updatedAt);
    expect(c.messages).toHaveLength(0);
  });
});

describe("renameConversation / deleteConversation", () => {
  it("đổi tên hội thoại theo id", () => {
    const a = sampleConversation();
    const b = sampleConversation();
    const list = renameConversation([a, b], a.id, "Tên mới");
    expect(list.find((c) => c.id === a.id)?.title).toBe("Tên mới");
    expect(list.find((c) => c.id === b.id)?.title).toBe(b.title);
  });

  it("bỏ qua tên rỗng khi đổi tên", () => {
    const a = sampleConversation();
    const list = renameConversation([a], a.id, "   ");
    expect(list[0]?.title).toBe(a.title);
  });

  it("xóa hội thoại theo id", () => {
    const a = sampleConversation();
    const b = sampleConversation();
    expect(deleteConversation([a, b], a.id)).toHaveLength(1);
    expect(deleteConversation([a, b], "không-tồn-tại")).toHaveLength(2);
  });
});

describe("loadConversations / saveConversations", () => {
  it("trả về [] khi storage trống", () => {
    expect(loadConversations(createMemoryStorage())).toEqual([]);
  });

  it("trả về [] khi dữ liệu hỏng mà không throw", () => {
    const storage = createMemoryStorage();
    storage.setItem("nori-conversations", "{ hỏng: json");
    expect(loadConversations(storage)).toEqual([]);
  });

  it("bỏ qua bản ghi không đúng định dạng", () => {
    const storage = createMemoryStorage();
    const valid = sampleConversation();
    storage.setItem(
      "nori-conversations",
      JSON.stringify([valid, { sai: "định dạng" }, null]),
    );
    const loaded = loadConversations(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe(valid.id);
  });

  it("lưu và tải lại đầy đủ", () => {
    const storage = createMemoryStorage();
    const list = [sampleConversation(), sampleConversation()];
    saveConversations(storage, list);
    const loaded = loadConversations(storage);
    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.id).toBe(list[0]?.id);
  });

  it("không throw khi storage lỗi", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(loadConversations(broken)).toEqual([]);
    expect(() => saveConversations(broken, [])).not.toThrow();
  });
});

describe("fromUIMessages / toUIMessages", () => {
  it("trích text từ parts, bỏ qua part không phải text", () => {
    const ui = [
      {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "Chào" },
          { type: "tool-weather", toolCallId: "x" },
        ],
      },
      { id: "2", role: "assistant", parts: [{ type: "text", text: "Hi" }] },
    ];
    const stored = fromUIMessages(ui);
    expect(stored).toHaveLength(2);
    expect(stored[0]?.text).toBe("Chào");
    expect(stored[1]?.text).toBe("Hi");
  });

  it("chuyển stored messages về UIMessage", () => {
    const c = addMessage(sampleConversation(), {
      role: "user",
      text: "Xin chào",
    });
    const ui = toUIMessages(c.messages);
    expect(ui[0]?.role).toBe("user");
    expect(ui[0]?.parts).toEqual([{ type: "text", text: "Xin chào" }]);
  });

  it("round-trip giữ nguyên nội dung", () => {
    const c = addMessage(sampleConversation(), {
      role: "assistant",
      text: "Nội dung **markdown**",
    });
    expect(fromUIMessages(toUIMessages(c.messages))[0]?.text).toBe(
      "Nội dung **markdown**",
    );
  });
});
