import { normalizeOpenAICompatibleBaseUrl } from "../../utils/aiProviderUrl";

/**
 * AI 运行时就绪探针(不回传任何密钥明文)。
 * 用于部署后确认 NUXT_AI_PROVIDER_* 是否已进入进程、provider 是否完成注册。
 */
export default defineEventHandler((event) => {
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

  return {
    ok: Boolean(apiKey && baseUrl && providerRegistered && basePath?.includes("/v")),
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
