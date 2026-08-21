import type { H3Event } from "h3";
import type { AuthUser } from "./chatDb";

/** session 数据结构 */
interface AuthSessionData {
  /** 已登录用户;未登录时为空 */
  user?: AuthUser;
  /** OAuth 防 CSRF 的 state 随机串 */
  oauthState?: string;
}

/**
 * 加密 session(h3 sealed cookie,无服务端存储)
 *
 * 密码来自 NUXT_SESSION_PASSWORD(至少 32 字符);
 * 未配置时仅开发环境退回内置默认值,生产直接抛错防止弱密钥上线
 */
export function useAuthSession(event: H3Event) {
  const config = useRuntimeConfig(event);
  let password = config.sessionPassword;
  if (!password || password.length < 32) {
    if (import.meta.dev) {
      password = "reborn-ui-dev-only-session-password-0000";
    } else {
      throw createError({ statusCode: 500, statusMessage: "NUXT_SESSION_PASSWORD 未配置或过短(需 ≥32 字符)" });
    }
  }
  return useSession<AuthSessionData>(event, {
    password,
    name: "reborn-auth",
    maxAge: 60 * 60 * 24 * 30,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      // h3 默认 secure: true 会导致纯 HTTP 部署(如 http://IP)种不上 cookie,
      // 这里跟随请求协议:HTTPS 下保持 secure,HTTP 下放行(建议尽快上 HTTPS)
      secure: getRequestURL(event).protocol === "https:",
    },
  });
}

/** 读取当前登录用户,未登录返回 null */
export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  const session = await useAuthSession(event);
  return session.data.user ?? null;
}

/** 要求登录,未登录返回 401 */
export async function requireAuthUser(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "请先登录" });
  }
  return user;
}
