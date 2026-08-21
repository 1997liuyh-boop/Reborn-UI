import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// 覆盖 AI SDK 的默认模型解析器:
// Docus AI 助手内部以字符串模型 ID 调用 streamText,默认解析到 Vercel AI Gateway;
// 设置 globalThis.AI_SDK_DEFAULT_PROVIDER 后,字符串模型 ID 会改由此处的
// OpenAI 兼容提供商解析(当前指向 rebornid 自建网关,模型 deepseek-v4-pro)。
export default defineNitroPlugin(() => {
  const { aiProvider } = useRuntimeConfig();

  // 未配置密钥或端点时不覆盖,保持默认行为(走 AI Gateway)
  if (!aiProvider?.apiKey || !aiProvider?.baseUrl) return;

  (globalThis as Record<string, unknown>).AI_SDK_DEFAULT_PROVIDER = createOpenAICompatible({
    name: "reborn-ai-gateway",
    apiKey: aiProvider.apiKey,
    // 注意:baseURL 需带 /v1 后缀,提供商会在其后拼接 /chat/completions
    baseURL: aiProvider.baseUrl,
  });
});
