import { useChatDb } from "../../utils/chatDb";

/**
 * 当前用户的会话列表(按最近更新排序,只取最新 20 条)
 * 更早的会话仍保留在库里(qa_logs 归类统计按会话 id 关联),只是不再出现在 AI 助手抽屉的历史栏
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event);
  return useChatDb()
    .prepare(
      `SELECT id, title, updated_at AS updatedAt FROM conversations
       WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`,
    )
    .all(user.id);
});
