import type { WebMcpTool } from "~/utils/webmcpTools";
import { defineNuxtPlugin, navigateTo, onNuxtReady } from "#imports";
import { createWebMcpTools } from "~/utils/webmcpTools";

/** 入口对象里用得到的部分；旧入口的 registerTool 是同步的，且另有 unregisterTool */
interface ModelContextLike {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void> | void;
  unregisterTool?: (name: string) => void;
}

/**
 * WebMCP：向浏览器内的 AI 代理注册文档站工具（检索组件、读 API、打开文档、在演练场运行）。
 *
 * 渐进增强：入口对象不存在就直接返回。规范入口是 document.modelContext，
 * navigator.modelContext 是 Chrome 早期实现留下的别名，只作兜底。
 */
export default defineNuxtPlugin((nuxtApp) => {
  const modelContext
    = (document as { modelContext?: ModelContextLike }).modelContext
      ?? (navigator as { modelContext?: ModelContextLike }).modelContext;
  if (typeof modelContext?.registerTool !== "function") return;
  // 站内 iframe 里的页面不重复注册，同一套工具只由顶层文档提供
  if (window.top !== window.self) return;

  onNuxtReady(async () => {
    // 规范没有 unregisterTool，注销靠 signal；整页生命周期内不需要注销，只有开发期热更新会用到
    const controller = new AbortController();
    const tools = createWebMcpTools({
      navigate: (path) => nuxtApp.runWithContext(() => navigateTo(path)),
    });

    for (const tool of tools) {
      try {
        await modelContext.registerTool(tool, { signal: controller.signal });
      }
      catch (error) {
        // 注册失败（Permissions-Policy 禁用、重名等）不影响页面
        if (import.meta.dev) console.warn(`[webmcp] 工具 ${tool.name} 注册失败`, error);
      }
    }

    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        controller.abort();
        for (const tool of tools) modelContext.unregisterTool?.(tool.name);
      });
    }
  });
});
