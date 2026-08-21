import { streamText } from "ai";

/**
 * AI 链路自检(仅返回错误摘要,不回传密钥)。
 * 用于定位生产"助手空回复":网关出网 / provider 解析 / streamText 哪一步失败。
 *
 * POST /api/ai/diag
 * body 可选: { prompt?: string }
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody<{ prompt?: string }>(event).catch(() => ({}));
  const prompt = body?.prompt || "只回复：你好";

  const apiKey = String(config.aiProvider?.apiKey || "");
  const baseUrl = String(config.aiProvider?.baseUrl || "");
  const model = String(config.assistant?.model || "");
  const provider = (globalThis as Record<string, unknown>).AI_SDK_DEFAULT_PROVIDER;

  const result: Record<string, unknown> = {
    model,
    hasApiKey: apiKey.length > 0,
    hasBaseUrl: baseUrl.length > 0,
    providerRegistered: Boolean(provider),
    baseHost: null as string | null,
    gatewayReachable: false,
    gatewayStatus: null as number | null,
    gatewayError: null as string | null,
    streamOk: false,
    streamTextChars: 0,
    streamReasoningChars: 0,
    streamFinishReason: null as string | null,
    streamError: null as string | null,
  };

  try {
    result.baseHost = baseUrl ? new URL(baseUrl).host : null;
  } catch {
    result.baseHost = null;
  }

  // 1) 服务器出网探测:直接请求网关 /models(或根路径)
  if (apiKey && baseUrl) {
    try {
      const probeUrl = baseUrl.replace(/\/$/, "") + "/models";
      const resp = await fetch(probeUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000),
      });
      result.gatewayStatus = resp.status;
      result.gatewayReachable = resp.status > 0 && resp.status < 500;
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        result.gatewayError = `HTTP ${resp.status}: ${text.slice(0, 200)}`;
      }
    } catch (err) {
      result.gatewayError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }
  } else {
    result.gatewayError = "缺少 NUXT_AI_PROVIDER_*，跳过出网探测";
  }

  // 2) streamText 最小调用(与 Docus 助手同一解析路径:字符串 model + 全局 provider)
  if (provider && model) {
    try {
      const stream = streamText({
        model,
        maxOutputTokens: 256,
        maxRetries: 0,
        prompt,
      });
      let textChars = 0;
      let reasoningChars = 0;
      for await (const part of stream.fullStream) {
        if (part.type === "text-delta") {
          textChars += (part.text || "").length;
        } else if (part.type === "reasoning-delta") {
          reasoningChars += (part.text || "").length;
        } else if (part.type === "finish") {
          result.streamFinishReason = part.finishReason;
        } else if (part.type === "error") {
          result.streamError =
            part.error instanceof Error ? part.error.message : String(part.error);
        }
      }
      result.streamTextChars = textChars;
      result.streamReasoningChars = reasoningChars;
      result.streamOk = textChars > 0 || reasoningChars > 0;
    } catch (err) {
      result.streamError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }
  } else {
    result.streamError = "provider 未注册或 model 为空，跳过 streamText";
  }

  return result;
});
