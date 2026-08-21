/**
 * AI 运行时就绪探针(不回传任何密钥明文)。
 * 用于部署后确认 NUXT_AI_PROVIDER_* 是否已进入进程、provider 是否完成注册。
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const apiKey = String(config.aiProvider?.apiKey || "");
  const baseUrl = String(config.aiProvider?.baseUrl || "");
  const providerRegistered = Boolean(
    (globalThis as Record<string, unknown>).AI_SDK_DEFAULT_PROVIDER,
  );

  return {
    ok: Boolean(apiKey && baseUrl && providerRegistered),
    hasApiKey: apiKey.length > 0,
    hasBaseUrl: baseUrl.length > 0,
    providerRegistered,
    model: config.assistant?.model || null,
    // 仅返回端点主机名,便于核对是否指向 rebornid,不暴露完整 URL 中的路径密钥
    baseHost: (() => {
      try {
        return baseUrl ? new URL(baseUrl).host : null;
      } catch {
        return null;
      }
    })(),
  };
});
