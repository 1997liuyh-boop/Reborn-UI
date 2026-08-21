/** 退出登录:清空 session */
export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event);
  await session.clear();
  return { ok: true };
});
