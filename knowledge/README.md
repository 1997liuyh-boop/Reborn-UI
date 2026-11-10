# Reborn-UI 组件知识库

面向 AI Agent 与 MCP 的组件结构化元数据。**`components/` 与 `index.json` 为机器生成，禁止手改**；人工内容一律写入 `overrides/`。

## 目录结构

生成物已不入库（见仓库根 `.gitignore`），新克隆或需要本地测试时运行 `pnpm kb:bootstrap` 现生成。

| 路径 | 入库 | 说明 |
|---|---|---|
| `overrides/<id>.json` | ✅ | 人工覆盖层：描述、whenToUse、pitfalls、精选示例等，**人工维护的唯一来源** |
| `design-patterns.json` | ✅ | 设计稿节点 → 组件的配方表（人工维护），`kb:build` 把它并入 `index.json` 的 `designPatterns`，MCP 的 `match_design_nodes` 与设计工作室据此映射；见下文「设计稿配方表」 |
| `index.json` | ✅ | 轻量索引（id/title/description/category/tags/platforms/aliases）+ `designPatterns`。机器生成但保留入库：它是 `registry:build --strict-kb` 的元数据源，也是 CI 抓「新增/删除组件却没同步知识库」的守卫 |
| `components/<id>.json` | ❌ | 每组件一份知识条目，`pnpm kb:build` 全量重建 |
| `report.json` | ❌ | 抽取覆盖率与文档-源码偏差报告 |
| `schema/component.schema.json` | ❌ | 由 `scripts/kb/schema.ts`（zod）生成的 JSON Schema，勿手改 |

## 常用命令

```bash
pnpm kb:bootstrap          # 新克隆首次执行：registry:build → kb:build（两者互为上下游，顺序不可颠倒）
pnpm kb:build              # 全量重建（registry 已存在时用这个即可）
pnpm kb:build --only reborn-button,reborn-input   # 只重建指定组件
pnpm kb:check              # 校验：schema / 集合一致性 / overrides 悬空引用（本地还能抓 drift）
```

改动组件源码、文档 API 表格或 overrides 后必须重新运行 `pnpm kb:build`。**生成物不需要提交**，需要提交的只有 `overrides/` 与（内容确有变化时的）`index.json`；忘了提交 index.json 会被 CI 的 `git diff` 守卫拦下。

## 描述规范（Agent 友好）

本节与组件文档规范（`docs/authoring/component-doc.md`）是**同一条规则**，作用在同一句话上：
`description` 的真源是文档 frontmatter 的 `description`（`kb:build` 直接取它，见
`scripts/kb/merge.ts`），所以按规范写好文档那一句，知识库这一句就自动到位。

唯一会分叉的情况是 `overrides/<id>.json` 显式写了 `description` —— 它会覆盖 frontmatter 那句，
而文档站仍显示 frontmatter 原句。要么两处措辞保持一致，要么干脆不在 overrides 里写这个字段。

`description` 是 Agent 选型的第一依据，必须满足：

1. **一句话，≤60 字**，句式为「用于…的…组件」或等价的功能定位句。
2. **包含区分性信息**：与相近组件的差异点要能从描述中读出（如 `reborn-button` 与 `ripple-button` 的差异）。
3. **禁营销词**：不出现「优雅」「强大」「时尚」「炫酷」等形容词堆砌。
4. 不描述知识条目中不存在的能力（防幻觉：描述只能基于 props/events/slots/examples 已有事实）。

配套字段：

- `aliases`：检索别名，**选型命中率的主要来源**。写三类：① 同一外观在其它组件库里的叫法（Badge 写 `tag`，Chip 写 `badge`——本库这两个名字与 Element / Ant 相反，AI 会按它熟悉的叫法搜）；② 中英文同义词（`标签` / `状态标签` / `pill`）；③ UI 稿上看到的样子（`红点` / `未读数` / `胶囊标签`）。只参与 `search_components` 打分，不进文档；`tags` 来自文档 frontmatter，多为 `tailwind` / `css` 这类技术标签，顶不了这个用。别名不要与别的组件的 `title` 完全相同（`kb:check` 会拦），单字别名不参与「查询词包含别名」的匹配。
- `whenToUse`：2-4 条，具体场景（「表单中需要单选一组互斥选项时」）。
- `whenNotToUse`：1-3 条，**尽量给出替代组件 id**（「需要多选时改用 reborn-checkbox」）。两个易混组件要**互相指向**：只有 A 指向 B 时，AI 先落到 B 就没有任何提示再去看 A。`kb:check` 会把单向指向列为告警。
- `scripts/kb/check-search.ts` 里有一组「查询词 → 期望组件」的回归用例（「标签」→ `reborn-badge`、「红点」→ `reborn-chip`……），改别名或打分后 `pnpm kb:check` 会跑它；新增一对易混组件时顺手加一条。
- `pitfalls`：注意事项，只写事实：平台差异（仅 web / 仅 uniapp）、必须的父组件（如 RebornFormItem 需在 RebornForm 内）、已知易错 props 组合。

## overrides 写法

`overrides/<id>.json` 支持的字段与合并规则：

- `title` / `description` / `category`：字符串，整体替换。
- `tags` / `aliases` / `related` / `whenToUse` / `whenNotToUse` / `pitfalls`：数组，整体替换。
- `examples`：数组，**追加**在 demo 示例之后（`source` 自动标为 `manual`）。
- `props` / `events` / `slots` / `exposes`：数组，按 `name` 匹配后**合并字段**（用于修正描述/类型，不能新增源码中不存在的成员）。

改完 overrides 后运行 `pnpm kb:build` 使之生效。

## 设计稿配方表（design-patterns.json）

`search_components` 只认「这个东西叫什么」，而设计稿还原的问题是「稿面上这组节点是哪个组件」：
MasterGo 导出的实例名是 `缩略图` ×7、`image`、`icon/44/箭头`，没有一个叫「轮播」，AI 就把图廊做成了一列
`RebornButton + img`。配方表把这类**稿面命名 → 组件 + 写法**固定下来，MCP 的 `match_design_nodes`
按它逐节点给出组件、配方与需显式 import 的子组件，并对图廊这类跨节点的整体做二次提示。

每条规则：

- `match`：节点名 / 变体值 / 子节点名里的匹配项，子串（不分大小写）或 `/正则/i`。**按文件顺序取第一条命中**，具体规则（商品图廊）要放在通用规则（图片、按钮）前面；同一个字面匹配项不能出现在两条规则里，`kb:check` 会拦。
- `component`：组件 id；为空时必须标 `ignore`（图标、分割线这类不是组件的节点，配 recipe 说明用素材还是 border）或 `custom`（本库没有对应组件，按稿面自写）。`with` 列配套组件（签到按钮 + 角标）。
- `recipe`：怎么用——props 写法、插槽分工、ui 键、**禁止的替代实现**（「不要用一列 RebornButton + img 自绘缩略图」）。只写源码里存在的能力。
- `uses`：recipe 点到的 `props / slots / events / ui` 成员清单，`kb:check` 对照知识库与源码逐项核对，写错名字直接红。
- `minCount`：同名实例至少出现几次才算命中（问答列表要三条以上问句）；`confidence: low` 表示命中后仍要按稿面结构确认是否整体采用（站点头部、卡片容器）。

`scripts/kb/check-design.ts` 用 mastergo-test 两个页面真实导出的节点名跑回归（「缩略图」→ `reborn-carousel`、「计数器」→ `reborn-input-number`、「Tab 2」→ `reborn-tabs` 并提示显式 import `RebornTabPane`……）。设计工作室的实现清单里列出的「待映射组件」名称，就是该往 `match` 里补的词；补完 `pnpm kb:build && pnpm kb:check`。
