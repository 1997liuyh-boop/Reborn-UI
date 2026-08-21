/**
 * 规范化 OpenAI 兼容网关 baseURL。
 * @ai-sdk/openai-compatible 会在其后拼接 `/chat/completions`，
 * 因此必须带 `/v1`（或网关等价前缀）。Secrets 里若漏写 `/v1`，
 * 会请求到错误路径并被助手吞成秒级空回复。
 */
export function normalizeOpenAICompatibleBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  // 已含版本前缀则原样返回（兼容 /v1、/v1beta 等）
  if (/\/v\d+[a-z]*$/i.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
}
