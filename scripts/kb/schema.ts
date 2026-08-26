import { z } from "zod";

/** 组件分类枚举：与文档站 content/2.components 下的子目录对应 */
export const categoryEnum = z.enum([
  "basic", // 基础组件（按钮等）
  "form", // 表单与输入
  "layout", // 布局
  "feedback", // 反馈（弹层、提示）
  "navigation", // 导航
  "data-display", // 数据展示（卡片、表格等）
  "effect", // 特效 / 动效
  "media", // 媒体 / 设备模拟
  "misc", // 其他
]);

/** 单个 Prop 的描述 */
export const propSchema = z.object({
  name: z.string(),
  type: z.string(), // 源码中的类型文本，如 "boolean"、"typeof buttonColors[number]"
  default: z.string().optional(), // 默认值的源码文本，如 "'primary'"、"() => []"
  required: z.boolean(),
  description: z.string(), // 中文说明，来自源码行尾注释或文档表格
  options: z.array(z.string()).optional(), // 枚举可选值（从 config.ts 常量数组解析）
  vModel: z.boolean().optional(), // 是否为 v-model 双向绑定 prop
});

/** 事件描述 */
export const eventSchema = z.object({
  name: z.string(),
  payload: z.string().optional(), // 回调参数的类型/说明文本
  description: z.string(),
});

/** 插槽描述 */
export const slotSchema = z.object({
  name: z.string(),
  props: z.string().optional(), // 作用域插槽透传的参数类型文本
  description: z.string(),
});

/** defineExpose 暴露的方法/属性 */
export const exposeSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  description: z.string(),
});

/**
 * 用法示例
 *
 * code 与 path 二选一，且分工固定：
 * - source=demo：仓库内只存 path（演示文件的仓库相对路径），不内联源码。
 *   内联会让「改一个 demo」重写整份知识库 JSON，是历史上最大的 diff 噪音源。
 *   完整代码由消费端按需取：MCP 发布时 kb:snapshot 把 code 灌进包内快照，
 *   monorepo 内开发时 MCP 运行时按 path 直接读仓库源码。
 * - source=manual：人工在 overrides 里手写 code，没有对应源文件，因此不带 path。
 */
export const exampleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  code: z.string().optional(), // 示例源码；demo 示例在仓库内为空，由消费端按 path 解析
  path: z.string().optional(), // 演示文件的仓库相对路径（POSIX 分隔符），仅 demo 示例有
  source: z.enum(["demo", "manual"]), // demo=从演示页抽取；manual=人工在 overrides 中编写
  platform: z.enum(["web", "uniapp"]).optional(),
});

/**
 * 生成元信息（不参与内容哈希）
 *
 * 刻意不含 generatedAt：该字段每次构建必变，而 contentHash 本就不覆盖它，
 * 结果是「内容没变但 145 个文件全是 diff」。总构建时间见 index.json / report.json。
 */
export const metaSchema = z.object({
  contentHash: z.string(), // 除 _meta/$schema 外全部字段的 sha1，用于 drift 检测
  hasOverride: z.boolean(),
  extractors: z.object({
    web: z.enum(["ok", "partial", "failed", "absent"]),
    uniapp: z.enum(["ok", "partial", "failed", "absent"]),
    docs: z.enum(["found", "missing"]),
  }),
});

/** 组件知识库条目（权威 schema） */
export const componentSchema = z.object({
  $schema: z.string().optional(),
  id: z.string(), // componentId，与目录名 / registry name / 文档 componentId 一致
  title: z.string(), // 中文名，如「按钮 Button」
  description: z.string(), // Agent 友好描述：一句话定位，≤60 字
  category: categoryEnum,
  tags: z.array(z.string()),
  platforms: z.array(z.enum(["web", "uniapp"])).min(1),
  /** 内部基础组件（被其他组件复用、不面向用户单独使用），不要求有独立文档 */
  internal: z.boolean().optional(),
  props: z.array(propSchema),
  events: z.array(eventSchema),
  slots: z.array(slotSchema),
  exposes: z.array(exposeSchema),
  examples: z.array(exampleSchema),
  related: z.array(z.string()), // 相关/前置组件 id
  whenToUse: z.array(z.string()), // 何时使用（人工维护于 overrides）
  whenNotToUse: z.array(z.string()), // 何时不用，尽量给出替代组件 id
  pitfalls: z.array(z.string()), // 注意事项 / 常见错误 / 平台差异
  dependencies: z.array(z.string()), // npm 依赖
  install: z.object({ cli: z.string() }),
  sourceRefs: z.object({
    web: z.array(z.string()).optional(),
    uniapp: z.array(z.string()).optional(),
  }),
  docPath: z.string().nullable(), // content 下的文档路径，无文档为 null
  _meta: metaSchema,
});

export type ComponentKnowledge = z.infer<typeof componentSchema>;
export type PropInfo = z.infer<typeof propSchema>;
export type EventInfo = z.infer<typeof eventSchema>;
export type SlotInfo = z.infer<typeof slotSchema>;
export type ExposeInfo = z.infer<typeof exposeSchema>;
export type ExampleInfo = z.infer<typeof exampleSchema>;
export type Category = z.infer<typeof categoryEnum>;

/** 轻量索引条目（index.json） */
export const indexEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: categoryEnum,
  tags: z.array(z.string()),
  platforms: z.array(z.enum(["web", "uniapp"])),
  /** 内部基础组件标记（选型时应跳过） */
  internal: z.boolean().optional(),
});

export const indexSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  components: z.array(indexEntrySchema),
});

export type KnowledgeIndex = z.infer<typeof indexSchema>;
