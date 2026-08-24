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
    category: z.string(),
    tags: z.array(z.string()),
    badge: z.enum(["New", "Updated"]).optional(),
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
