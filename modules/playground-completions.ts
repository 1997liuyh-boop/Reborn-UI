import { defineNuxtModule } from "@nuxt/kit";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** 单个属性的补全条目 */
interface CompletionProp {
  /** 属性名 */
  name: string;
  /** 类型签名(展示在补全详情中) */
  type?: string;
  /** 中文说明 */
  description?: string;
  /** 枚举可选值(用于属性值补全) */
  options?: string[];
}

/** 单个组件的补全条目 */
interface CompletionEntry {
  /** 全局注册的组件标签名(PascalCase) */
  tag: string;
  /** 中文说明 */
  description?: string;
  props: CompletionProp[];
  /** 事件名列表(补全为 @xxx) */
  events: string[];
  /** 插槽名列表(展示在组件详情中) */
  slots: string[];
}

/** kebab-case 知识库 id 转 PascalCase 组件标签名 */
function toPascalCase(id: string): string {
  return id
    .split("-")
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

/**
 * Playground 补全数据生成模块
 *
 * 构建/启动时把 knowledge/components 下的组件知识条目(props/events/slots)
 * 汇总为紧凑 JSON 写入 public/,供 /playground 的 CodeMirror 编辑器做
 * 组件标签、属性与枚举值的智能提示。knowledge/ 是唯一事实来源,该文件
 * 属于生成产物(已 gitignore),跟随 kb 内容自动更新。
 */
export default defineNuxtModule({
  meta: { name: "playground-completions" },
  async setup(_options, nuxt) {
    const kbDir = join(nuxt.options.rootDir, "knowledge", "components");
    const outFile = join(nuxt.options.rootDir, "public", "playground-completions.json");

    let files: string[] = [];
    try {
      files = (await readdir(kbDir)).filter((f) => f.endsWith(".json"));
    } catch {
      // 知识库缺失时跳过(不阻塞构建),编辑器自动退化为无组件提示
      console.warn("[playground-completions] 未找到 knowledge/components,跳过补全数据生成");
      return;
    }

    const entries: CompletionEntry[] = [];

    for (const file of files) {
      try {
        const raw = JSON.parse(await readFile(join(kbDir, file), "utf8"));
        // 仅收录 Web 端组件(Playground 运行在 Web 文档站内)
        if (!Array.isArray(raw.platforms) || !raw.platforms.includes("web")) continue;

        entries.push({
          tag: toPascalCase(raw.id),
          description: [raw.title, raw.description].filter(Boolean).join(":"),
          props: (raw.props ?? []).map((p: Record<string, unknown>) => ({
            name: p.name as string,
            type: p.type as string | undefined,
            description: p.description as string | undefined,
            options: Array.isArray(p.options) ? (p.options as string[]) : undefined,
          })),
          events: (raw.events ?? []).map((e: Record<string, unknown>) => e.name as string),
          slots: (raw.slots ?? []).map((s: Record<string, unknown>) => s.name as string),
        });
      } catch {
        console.warn(`[playground-completions] 解析失败,已跳过:${file}`);
      }
    }

    entries.sort((a, b) => a.tag.localeCompare(b.tag));
    await writeFile(outFile, JSON.stringify(entries), "utf8");
    console.log(`[playground-completions] 已生成 ${entries.length} 个组件的补全数据`);
  },
});
