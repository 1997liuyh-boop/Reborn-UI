/**
 * AI 端点统一防护:登录鉴权 + 滑动窗口限流。
 *
 * 保护对象是会消耗网关 token 的端点:
 * - Docus 助手聊天(路径取自 runtimeConfig.public.assistant.apiPath)
 * - /api/ai/diag(自检会触发一次真实 LLM 调用)
 *
 * /api/ai/status 不在此列:纯只读探针,未登录时由端点自身裁剪返回字段,
 * 保证部署后登录链路异常时仍可用它排障。
 */

/** 单用户限流规则 */
const RULES = {
  assistant: { limit: 30, windowMs: 10 * 60 * 1000, label: "AI 助手" },
  diag: { limit: 5, windowMs: 60 * 60 * 1000, label: "AI 自检" },
} as const;

/** 全站兜底:防止批量注册账号绕过单用户限额刷网关 */
const GLOBAL_RULE = { limit: 300, windowMs: 60 * 60 * 1000 };

export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0];
  const assistantPath =
    useRuntimeConfig(event).public.assistant?.apiPath || "/__docus__/assistant";

  let scope: keyof typeof RULES;
  if (path === assistantPath) scope = "assistant";
  else if (path === "/api/ai/diag") scope = "diag";
  else return;

  const user = await getAuthUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "AI 助手需登录后使用" });
  }

  // 先查全站兜底(未超时不计入个人额度),再查单用户额度
  const global = checkRateLimit(`${scope}:__global__`, GLOBAL_RULE.limit, GLOBAL_RULE.windowMs);
  if (!global.allowed) {
    setResponseHeader(event, "Retry-After", String(global.retryAfterSec));
    throw createError({ statusCode: 429, statusMessage: "当前使用人数较多,请稍后再试" });
  }

  const rule = RULES[scope];
  const perUser = checkRateLimit(`${scope}:${user.id}`, rule.limit, rule.windowMs);
  if (!perUser.allowed) {
    setResponseHeader(event, "Retry-After", String(perUser.retryAfterSec));
    throw createError({
      statusCode: 429,
      statusMessage: `${rule.label}请求过于频繁,请约 ${formatWait(perUser.retryAfterSec)}后再试`,
    });
  }
});

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  return `${Math.ceil(seconds / 60)} 分钟`;
}
