import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// 覆盖 AI SDK 的默认模型解析器:
// Docus AI 助手内部以字符串模型 ID 调用 streamText,默认解析到 Vercel AI Gateway;
// 设置 globalThis.AI_SDK_DEFAULT_PROVIDER 后,字符串模型 ID 会改由此处的
// OpenAI 兼容提供商解析(当前指向 rebornid 自建网关,模型 deepseek-v4-pro)。
export default defineNitroPlugin(() => {
  const { aiProvider } = useRuntimeConfig();

  // 未配置密钥或端点时不覆盖。生产若走到这里,助手会静默回落 Vercel AI Gateway 并秒级空回复。
  if (!aiProvider?.apiKey || !aiProvider?.baseUrl) {
    console.warn(
      "[ai-provider] NUXT_AI_PROVIDER_API_KEY / NUXT_AI_PROVIDER_BASE_URL 未注入,跳过自建网关注册",
    );
    return;
  }

  (globalThis as Record<string, unknown>).AI_SDK_DEFAULT_PROVIDER = createOpenAICompatible({
    name: "reborn-ai-gateway",
    apiKey: aiProvider.apiKey,
    // 注意:baseURL 需带 /v1 后缀,提供商会在其后拼接 /chat/completions
    baseURL: aiProvider.baseUrl,
  });
  console.log(`[ai-provider] 已注册自建网关: ${aiProvider.baseUrl}`);
});
