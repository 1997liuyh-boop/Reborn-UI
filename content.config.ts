import type { DefinedCollection } from "@nuxt/content";
import { defineCollection, defineContentConfig, z } from "@nuxt/content";
import { useNuxt } from "@nuxt/kit";
import { resolve } from "pathe";

const { options } = useNuxt();
const cwd = resolve(options.rootDir, "content");

const createDocsSchema = () =>
  z.object({
    // 描述是 Agent 选型与 llms.txt 的第一依据，必填；组件页应遵循知识库描述规范（≤60 字），此处上限放宽以兼容指南类页面
    description: z.string().min(4).max(120),
    // 组件分类：侧栏与总览按「系列 → 分类」分组，取值见 useComponentsCatalog 的 CATEGORY_ORDER，目录只决定 URL
    category: z.string(),
    tags: z.array(z.string()),
    badge: z.enum(["New", "Updated"]).optional(),
    // 页头英文名的覆盖值，逃生舱而非常规字段：英文名默认由 title 推导（见 useDocTitleParts），
    // 只有推导结果不对时才写。已知两例：context-menu 的 `Menu 右键菜单` 推导成 Menu（与 menu 组件重名）、
    // loading-directive 的 `Loading 加载指令` 推导成 Loading（与 loading 组件重名）
    titleEn: z.string().optional(),
    // 组件适用端：web 仅 Web / uniapp 仅 UniApp / both 双端通用；
    // 驱动侧栏、总览与移动端预览按顶栏的平台开关筛选，组件文档必填，缺省按 web 处理
    platform: z.enum(["web", "uniapp", "both"]).optional(),
    // 组件系列：reborn 自研 / community 社区移植；缺省按 slug 的 `reborn-` 前缀判定，
    // 只有自研却未带前缀的组件（如 scrollbar）才需要显式写
    series: z.enum(["reborn", "community"]).optional(),
    // 总览等自带 Hero 的页面：跳过 DocsPage 默认 UPageHeader
    hideHeader: z.boolean().optional(),
    // 总览卡片缩略 Demo 组件名（如 RebornButtonOverview）；缺省时由 demoFile 约定推导
    overviewDemo: z.string().optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional(),
        }),
      )
      .optional(),
  });

let collections: Record<string, DefinedCollection>;

collections = {
  landing: defineCollection({
    type: "page",
    source: {
      cwd,
      include: "index.md",
    },
  }),
  docs: defineCollection({
    type: "page",
    source: {
      cwd,
      include: "**/*.md",
      exclude: ["index.md"],
    },
    schema: createDocsSchema(),
  }),
};

export default defineContentConfig({ collections });
