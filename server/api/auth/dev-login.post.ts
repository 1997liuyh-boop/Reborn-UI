import { upsertUser } from "../../utils/chatDb";

/** 本地开发专用的模拟登录(生产构建中该分支不可达),用于无飞书凭证时联调聊天记录链路 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }
  const user = { id: "dev:local", name: "本地开发者" };
  upsertUser(user);
  const session = await useAuthSession(event);
  await session.update({ user });
  return { user };
});
