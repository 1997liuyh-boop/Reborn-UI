import { z } from "zod";

/** 各包管理器的 dlx 等价写法 */
const RUNNERS = { pnpm: "pnpm dlx", npm: "npx", yarn: "yarn dlx", bun: "bunx" } as const;

export default defineMcpTool({
  name: "get_install_command",
  title: "获取安装命令",
  description: "获取组件的 CLI 安装命令。",
  inputSchema: {
    id: z.string().describe("组件 id（kebab-case）"),
    packageManager: z.enum(["pnpm", "npm", "yarn", "bun"]).optional().describe("包管理器，默认 pnpm"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ id, packageManager }) => {
    const component = await loadKbComponent(id);
    if (!component) return errorResult(`组件不存在：${id}`);
    const runner = RUNNERS[packageManager ?? "pnpm"];
    return jsonResult({
      id,
      command: `${runner} reborn-ui@latest add ${id}`,
      dependencies: component.dependencies ?? [],
      note: `首次使用需先执行 init 生成 components.json：\`${runner} reborn-ui@latest init\``,
      // CLI 按 components.json 的 componentsDir 落盘（默认 components）；Nuxt 4 的源码目录是 app/，不改会写到项目根
      layoutNote:
        "组件写入 components.json 的 componentsDir（默认 components，相对项目根）。Nuxt 4 项目的源码在 app/ 下时加上 --components-dir app/components --lib-dir app/lib，或把 components.json 的 componentsDir / libDir 改成 app/ 开头的路径；装完确认文件落在框架实际扫描的组件目录里。",
    });
  },
});
