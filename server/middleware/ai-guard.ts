/**
 * AI 端点统一防护。
 *
 * 保护对象是会消耗网关 token 的端点:
 * - /api/ai/diag(自检会触发一次真实 LLM 调用):登录鉴权 + 限流
 * - Docus 内置助手处理器(/__docus__/assistant):已被本仓库的 /api/assistant 取代,直接封禁
 *
 * 助手对话本身(/api/assistant)不在此列:它的登录校验与限流放在处理器内部,
 * 以「正常助手回复」的形式把原因讲给用户,而不是抛 HTTP 错误——面板的 onError
 * 会把 error.message 当 JSON 解析,Nitro 错误体不是那个形状,超限时用户只会看到
 * 一条读不懂的 toast,甚至什么都看不到(就是「AI 没有回复」的成因之一)。
 *
 * /api/ai/status 也不在此列:纯只读探针,未登录时由端点自身裁剪返回字段,
 * 保证部署后登录链路异常时仍可用它排障。
 */

/** /api/ai/diag 的限流规则 */
const DIAG_RULE = { limit: 5, windowMs: 60 * 60 * 1000, label: "AI 自检" } as const;

/** 全站兜底:防止批量注册账号绕过单用户限额刷网关 */
const GLOBAL_RULE = { limit: 300, windowMs: 60 * 60 * 1000 };

export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0];

  // Docus 自带的助手处理器仍注册在其默认路径上,但已无客户端指向它。
  // 它既不鉴权也不限流,必须封死,否则是个可被直接 POST 的免费 token 入口。
  const upstreamAssistantPath = "/__docus__/assistant";
  if (path === upstreamAssistantPath) {
    throw createError({
      statusCode: 410,
      statusMessage: "该端点已由 /api/assistant 取代",
    });
  }

  if (path !== "/api/ai/diag") return;

  const user = await getAuthUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "AI 自检需登录后使用" });
  }

  // 先查全站兜底(未超时不计入个人额度),再查单用户额度
  const global = checkRateLimit("diag:__global__", GLOBAL_RULE.limit, GLOBAL_RULE.windowMs);
  if (!global.allowed) {
    setResponseHeader(event, "Retry-After", global.retryAfterSec);
    throw createError({ statusCode: 429, statusMessage: "当前使用人数较多,请稍后再试" });
  }

  const perUser = checkRateLimit(`diag:${user.id}`, DIAG_RULE.limit, DIAG_RULE.windowMs);
  if (!perUser.allowed) {
    setResponseHeader(event, "Retry-After", perUser.retryAfterSec);
    throw createError({
      statusCode: 429,
      statusMessage: `${DIAG_RULE.label}请求过于频繁,请约 ${formatWait(perUser.retryAfterSec)}后再试`,
    });
  }
});

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  return `${Math.ceil(seconds / 60)} 分钟`;
}
