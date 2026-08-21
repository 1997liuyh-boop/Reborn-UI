import { useChatDb } from "../../utils/chatDb";

/** 当前用户的会话列表(按最近更新排序,最多 50 条) */
export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  return useChatDb()
    .prepare(
      `SELECT id, title, updated_at AS updatedAt FROM conversations
       WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50`,
    )
    .all(user.id);
});
