import { normalizeOpenAICompatibleBaseUrl } from "../../utils/aiProviderUrl";

/**
 * AI 运行时就绪探针(不回传任何密钥明文)。
 * 用于部署后确认 NUXT_AI_PROVIDER_* 是否已进入进程、provider 是否完成注册。
 *
 * 未登录仅返回 { ok }:网关 host/路径/模型等基础设施细节只对登录用户可见。
 * 该端点刻意不走 ai-guard 中间件,保证登录链路异常时仍可作为最低限度探针。
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const apiKey = String(config.aiProvider?.apiKey || "");
  const rawBaseUrl = String(config.aiProvider?.baseUrl || "");
  const baseUrl = rawBaseUrl ? normalizeOpenAICompatibleBaseUrl(rawBaseUrl) : "";
  const providerRegistered = Boolean(
    (globalThis as Record<string, unknown>).AI_SDK_DEFAULT_PROVIDER,
  );

  let baseHost: string | null = null;
  let basePath: string | null = null;
  try {
    if (baseUrl) {
      const u = new URL(baseUrl);
      baseHost = u.host;
      basePath = u.pathname;
    }
  } catch {
    baseHost = null;
    basePath = null;
  }

  const ok = Boolean(apiKey && baseUrl && providerRegistered && basePath?.includes("/v"));

  if (!(await getAuthUser(event))) {
    return { ok };
  }

  return {
    ok,
    hasApiKey: apiKey.length > 0,
    hasBaseUrl: baseUrl.length > 0,
    providerRegistered,
    model: config.assistant?.model || null,
    // 仅返回主机与路径,便于核对 /v1,不回传密钥
    baseHost,
    basePath,
    rawBaseUrlHadVersion: /\/v\d+/i.test(rawBaseUrl),
  };
});
