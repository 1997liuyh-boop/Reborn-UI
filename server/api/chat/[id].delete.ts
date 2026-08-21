import { useChatDb } from "../../utils/chatDb";

/** 删除单个会话及其消息(校验归属) */
export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const id = getRouterParam(event, "id");

  const db = useChatDb();
  const result = db.prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?").run(id, user.id);
  if (result.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: "会话不存在" });
  }
  db.prepare("DELETE FROM conversation_messages WHERE conversation_id = ?").run(id);
  return { ok: true };
});
