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
  /**
   * 该条目专属的平台。
   * 仅在双端同名 prop 的对象键位集不同（如 ui 两端键位零重叠）时才并存两条并标注；
   * 两端一致的通用 prop 保持单条、不带此字段，避免给全部组件的 JSON 无谓地加字段。
   */
  platform: z.enum(["web", "uniapp"]).optional(),
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
  /**
   * 检索别名（人工维护于 overrides）：同一外观在其它组件库里的叫法、中英文同义词、
   * 从 UI 稿上看到的样子（"红点""胶囊标签"）。只参与 search_components 打分，
   * 不进文档。tags 来自文档 frontmatter，多为「tailwind / css」这类技术标签，顶不了这个用。
   */
  aliases: z.array(z.string()),
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
  /** 检索别名，仅在非空时写入索引（见 build.ts），search_components 据此匹配同义词 */
  aliases: z.array(z.string()).optional(),
  /** 内部基础组件标记（选型时应跳过） */
  internal: z.boolean().optional(),
});

/**
 * 设计稿节点 → 组件的配方（人工维护于 knowledge/design-patterns.json）
 *
 * match 是节点名 / 变体值 / 子节点名里的匹配项：普通字符串按子串（不分大小写）匹配，
 * 形如 /.../i 的按正则匹配。按文件顺序取第一条命中的规则，所以具体规则要放在通用规则前面。
 * component 为空只允许两种情况：ignore（图标、素材、分割线这类不是组件的节点）或
 * custom（本库没有对应组件，按稿面自写）。uses 里列出的成员由 kb:check 对照知识库逐项核对，
 * 保证 recipe 只描述源码里存在的能力。
 */
export const designPatternSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/), // 规则标识，回归用例与工具返回里用它定位规则
    pattern: z.string().min(1), // 给人读的场景描述
    match: z.array(z.string().min(1)).min(1),
    component: z.string().nullable(),
    with: z.array(z.string()).optional(), // 配套组件（签到按钮 + 角标）
    ignore: z.boolean().optional(),
    custom: z.boolean().optional(),
    /** 排版容器：自身不是组件，传了 children 时改按子节点再匹配一次（自动命名的「容器 129642」） */
    container: z.boolean().optional(),
    confidence: z.enum(["high", "low"]).optional(), // low：命中后仍要按稿面结构确认是否整体采用
    minCount: z.number().int().min(1).optional(), // 同名实例至少出现几次才算命中（问答列表）
    recipe: z.string().optional(), // 怎么用：props 写法、插槽分工、ui 键、禁止的替代实现
    imports: z.array(z.string()).optional(), // 额外的导入提示
    uses: z
      .object({
        props: z.array(z.string()).optional(),
        slots: z.array(z.string()).optional(),
        events: z.array(z.string()).optional(),
        ui: z.array(z.string()).optional(),
      })
      .optional(),
    pitfalls: z.array(z.string()).optional(),
  })
  .refine((p) => p.component !== null || p.ignore === true || p.custom === true, {
    message: "component 为空时必须标 ignore 或 custom",
  });

export const designPatternsFileSchema = z.object({
  schemaVersion: z.literal(1),
  description: z.string(),
  patterns: z.array(designPatternSchema).min(1),
});

export type DesignPattern = z.infer<typeof designPatternSchema>;

export const indexSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  components: z.array(indexEntrySchema),
  /** 设计稿配方表：随索引一起分发，MCP 与设计工作室据此做节点→组件映射 */
  designPatterns: z.array(designPatternSchema).optional(),
});

export type KnowledgeIndex = z.infer<typeof indexSchema>;
