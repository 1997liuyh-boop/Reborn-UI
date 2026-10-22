import { APICallError, RetryError } from "ai";

/**
 * 把模型调用失败的错误换成给用户看的中文提示。
 *
 * AI SDK 与网关的错误原文都是英文(如「Failed after 3 attempts. Last error: Service temporarily
 * unavailable」),直接透给面板用户读不懂。这里按 HTTP 状态码与错误关键词归类成几句中文;
 * 原始错误由调用方写服务端日志,排查时看日志,不在面板上暴露。
 */
export function toFriendlyAiError(error: unknown): string {
  // RetryError 只是「重试了 N 次都失败」的包装,真正的原因在最后一次的错误里
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  const status = APICallError.isInstance(cause) ? cause.statusCode : undefined;
  const message = (cause instanceof Error ? cause.message : String(cause ?? "")).toLowerCase();
  // 附上状态码,用户反馈时管理员能直接判断是哪一类故障
  const code = status ? `（错误码 ${status}）` : "";

  if (status === 401 || status === 403) {
    return `AI 服务鉴权失败，请联系站点管理员检查密钥配置${code}。`;
  }
  if (status === 404 || message.includes("model_not_found")) {
    return `当前配置的 AI 模型不可用，请联系站点管理员${code}。`;
  }
  if (status === 429 || message.includes("rate limit")) {
    return `AI 服务当前请求过多，请稍等片刻再试${code}。`;
  }
  // 5xx:网关或上游模型故障(本站遇到最多的是 503「Service temporarily unavailable」)
  if ((status && status >= 500) || /temporarily unavailable|overloaded|bad gateway/.test(message)) {
    return `AI 服务暂时不可用，请稍后再试${code}。`;
  }
  if (/context length|context window|maximum context|too many tokens/.test(message)) {
    return "对话内容过长，请新建一个会话后重试。";
  }
  if (/timeout|timed out|fetch failed|econn|enotfound|network|socket/.test(message)) {
    return "连接 AI 服务超时或网络异常，请稍后再试。";
  }
  return `AI 服务出现异常，请稍后再试${code}。`;
}
