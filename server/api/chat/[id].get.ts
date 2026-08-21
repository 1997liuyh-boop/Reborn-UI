import { useChatDb } from "../../utils/chatDb";

/** 读取单个会话的完整消息(校验归属) */
export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  const id = getRouterParam(event, "id");

  const row = useChatDb()
    .prepare(
      `SELECT m.messages FROM conversations c
       JOIN conversation_messages m ON m.conversation_id = c.id
       WHERE c.id = ? AND c.user_id = ?`,
    )
    .get(id, user.id) as { messages: string } | undefined;

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "会话不存在" });
  }
  return { id, messages: JSON.parse(row.messages) };
});
