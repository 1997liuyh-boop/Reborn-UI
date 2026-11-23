import { z } from "zod";
import { buildPlaygroundUrl } from "~~/shared/playgroundUrl";

// 页面内的 WebMCP 工具 run_in_playground 能直接切页面；远程端碰不到浏览器，改为返回链接
export default defineMcpTool({
  name: "get_playground_url",
  title: "生成演练场链接",
  description:
    "把一段 Vue 单文件组件源码编码成 Reborn UI 在线演练场的链接，用户打开链接即可看到运行效果。源码写 <template> 加可选的 <script setup>；Reborn 组件已全局注册、Vue 与常用 VueUse API 已注入，import 语句会被忽略。只生成链接，不会替用户打开。",
  inputSchema: {
    code: z.string().min(1).max(100_000).describe("完整的 Vue SFC 源码，或只有模板标签的片段"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ code }) => jsonResult({ url: toSiteUrl(buildPlaygroundUrl(code.trim())) }),
});
