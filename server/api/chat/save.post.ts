import { randomUUID } from "node:crypto";
import { useChatDb } from "../../utils/chatDb";

/** 前端(AI SDK)UIMessage 的最小结构 */
interface UIMessageLike {
  id: string;
  role: string;
  parts?: Array<Record<string, unknown>>;
}

/** 从消息 parts 中提取纯文本 */
function extractText(message: UIMessageLike): string {
  return (message.parts ?? [])
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("\n")
    .trim();
}

/** 从助手消息中提取 AI 实际读取过的文档路径(get-page 工具调用) —— 问答归类的天然标签 */
function extractDocPaths(message: UIMessageLike): string[] {
  const paths = new Set<string>();
  for (const part of message.parts ?? []) {
    // data-tool-calls 聚合部件:{ data: { tools: [{ toolName, args }] } }
    const tools = (part as { data?: { tools?: Array<{ toolName?: string; args?: { path?: string } }> } }).data?.tools;
    if (Array.isArray(tools)) {
      for (const tool of tools) {
        if (tool.toolName === "get-page" && tool.args?.path) paths.add(tool.args.path);
      }
    }
  }
  return [...paths];
}

/**
 * 保存会话:整体替换该会话的 UIMessage[] JSON(幂等),
 * 无 conversationId 时新建会话(标题取首条用户消息前 30 字);
 * 同时把「用户提问 + AI 读取的文档」写入 qa_logs 做组件问题归类统计
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const body = await readBody<{ conversationId?: string; messages?: UIMessageLike[] }>(event);
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "messages 不能为空" });
  }
  const raw = JSON.stringify(messages);
  if (raw.length > 512 * 1024) {
    throw createError({ statusCode: 413, statusMessage: "会话内容过大" });
  }

  const db = useChatDb();
  let conversationId = body.conversationId;

  // 校验归属或新建会话
  if (conversationId) {
    const owned = db
      .prepare("SELECT 1 FROM conversations WHERE id = ? AND user_id = ?")
      .get(conversationId, user.id);
    if (!owned) conversationId = undefined;
  }
  if (!conversationId) {
    conversationId = randomUUID();
    const firstUserText = messages.filter((m) => m.role === "user").map(extractText).find(Boolean) ?? "新对话";
    db.prepare("INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)").run(
      conversationId,
      user.id,
      firstUserText.slice(0, 30),
    );
  }

  db.prepare(
    `INSERT INTO conversation_messages (conversation_id, messages) VALUES (?, ?)
     ON CONFLICT(conversation_id) DO UPDATE SET messages = excluded.messages`,
  ).run(conversationId, raw);
  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversationId);

  // 问答归类日志:每轮「用户提问 → 紧随其后的助手回复」记一条,UNIQUE 约束防重
  const logStmt = db.prepare(
    `INSERT OR IGNORE INTO qa_logs (user_id, conversation_id, message_id, question, doc_paths)
     VALUES (?, ?, ?, ?, ?)`,
  );
  messages.forEach((message, index) => {
    if (message.role !== "user") return;
    const question = extractText(message);
    if (!question) return;
    const reply = messages.slice(index + 1).find((m) => m.role === "assistant");
    const docPaths = reply ? extractDocPaths(reply) : [];
    logStmt.run(user.id, conversationId, message.id, question, JSON.stringify(docPaths));
  });

  return { id: conversationId };
});
