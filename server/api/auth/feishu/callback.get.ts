import { upsertUser } from "../../../utils/chatDb";

/** 飞书 v2 换票接口返回 */
interface FeishuTokenResponse {
  code?: number;
  access_token?: string;
  error_description?: string;
}

/** 飞书用户信息接口返回 */
interface FeishuUserInfoResponse {
  code: number;
  msg?: string;
  data?: { open_id: string; name: string; avatar_url?: string };
}

/**
 * 飞书授权回调:校验 state → 授权码换 user_access_token → 拉取用户身份
 * → 入库并写入 session,最后回到站点首页
 */
export default defineEventHandler(async (event) => {
  const { feishu } = useRuntimeConfig(event);
  const { code, state } = getQuery(event) as { code?: string; state?: string };
  const session = await useAuthSession(event);

  if (!code || !state || state !== session.data.oauthState) {
    throw createError({ statusCode: 400, statusMessage: "授权回调参数非法(state 不匹配或缺少 code)" });
  }

  // 授权码换用户凭证
  const token = await $fetch<FeishuTokenResponse>("https://open.feishu.cn/open-apis/authen/v2/oauth/token", {
    method: "POST",
    body: {
      grant_type: "authorization_code",
      client_id: feishu.appId,
      client_secret: feishu.appSecret,
      code,
      redirect_uri: `${getRequestURL(event).origin}/api/auth/feishu/callback`,
    },
  }).catch((err) => {
    throw createError({ statusCode: 502, statusMessage: `飞书换票失败:${err?.data?.error_description ?? err.message}` });
  });

  if (!token.access_token) {
    throw createError({ statusCode: 502, statusMessage: `飞书换票失败:${token.error_description ?? "未返回 access_token"}` });
  }

  // 拉取用户身份
  const info = await $fetch<FeishuUserInfoResponse>("https://open.feishu.cn/open-apis/authen/v1/user_info", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (info.code !== 0 || !info.data) {
    throw createError({ statusCode: 502, statusMessage: `获取飞书用户信息失败:${info.msg ?? info.code}` });
  }

  const user = { id: info.data.open_id, name: info.data.name, avatar: info.data.avatar_url };
  upsertUser(user);
  await session.update({ user, oauthState: undefined });

  return sendRedirect(event, "/");
});
