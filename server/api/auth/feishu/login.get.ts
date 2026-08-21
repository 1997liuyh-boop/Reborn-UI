import { randomUUID } from "node:crypto";

/**
 * 飞书登录入口:生成防 CSRF 的 state 后重定向到飞书授权页
 * 需在飞书开放平台的"安全设置-重定向 URL"中登记 {站点}/api/auth/feishu/callback
 */
export default defineEventHandler(async (event) => {
  const { feishu } = useRuntimeConfig(event);
  if (!feishu?.appId) {
    throw createError({ statusCode: 503, statusMessage: "飞书登录未配置(缺少 NUXT_FEISHU_APP_ID)" });
  }

  const session = await useAuthSession(event);
  const state = randomUUID();
  await session.update({ oauthState: state });

  const redirectUri = `${getRequestURL(event).origin}/api/auth/feishu/callback`;
  const authorizeUrl =
    `https://accounts.feishu.cn/open-apis/authen/v1/authorize` +
    `?client_id=${encodeURIComponent(feishu.appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code&state=${state}`;

  return sendRedirect(event, authorizeUrl);
});
