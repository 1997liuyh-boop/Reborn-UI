/** 返回当前登录用户(未登录时 user 为 null),并告知飞书登录是否已配置 */
export default defineEventHandler(async (event) => {
  const { feishu } = useRuntimeConfig(event);
  return {
    user: await getAuthUser(event),
    feishuEnabled: !!feishu?.appId,
  };
});
