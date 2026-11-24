/**
 * /mcp 端点限流。
 *
 * 端点公开、不鉴权，工具都是读内存里的知识库，不消耗 AI 网关 token；
 * 这里只按来源 IP 挡住失控的客户端，额度对正常的代理会话绰绰有余。
 */
const MCP_RULE = { limit: 120, windowMs: 60 * 1000 } as const;

/** 全站兜底：转发头可以伪造，单 IP 额度挡不住换着 IP 刷的客户端 */
const GLOBAL_RULE = { limit: 3000, windowMs: 60 * 1000 } as const;

export default defineEventHandler((event) => {
  const path = event.path.split("?")[0];
  if (path !== "/mcp" && !path.startsWith("/mcp/")) return;
  // GET 是浏览器访问的跳转页与安装徽章，不计入
  if (event.method !== "POST") return;

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  // 先查全站兜底（超限时不计入个人额度），再查单 IP 额度
  let result = checkRateLimit("mcp:__global__", GLOBAL_RULE.limit, GLOBAL_RULE.windowMs);
  if (result.allowed) result = checkRateLimit(`mcp:${ip}`, MCP_RULE.limit, MCP_RULE.windowMs);
  if (!result.allowed) {
    setResponseHeader(event, "Retry-After", result.retryAfterSec);
    throw createError({ statusCode: 429, statusMessage: "请求过于频繁，请稍后再试" });
  }
});
