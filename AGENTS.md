<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Reborn-UI** (20700 symbols, 39491 relationships, 666 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/Reborn-UI/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Reborn-UI/clusters` | All functional areas |
| `gitnexus://repo/Reborn-UI/processes` | All execution flows |
| `gitnexus://repo/Reborn-UI/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

# Reborn-UI 仓库指南（Agent 必读）

## 仓库结构地图

| 路径 | 职责 |
|---|---|
| `app/` | Nuxt 4 + Docus 文档站；Web 端组件源码在 `app/components/reborn/ui/<componentId>/` |
| `packages/uniapp-project/` | uniapp 端组件源码 `src/components/<componentId>/` + demo 页 `src/pages/` |
| `packages/cli/` | 发布名 `reborn-ui`，shadcn 式组件安装 CLI；registry 生成器在 `src/commands/build.ts` |
| `packages/module/` | 发布名 `reborn-ui-registry`，纯 registry 数据分发包（无代码） |
| `knowledge/` | **组件知识库**：每组件一份结构化 JSON（props/events/slots/示例/使用边界），Agent 选型与 MCP 的数据源，详见 `knowledge/README.md` |
| `content/` | 文档站 Markdown，组件文档在 `content/2.components/<分类>/<componentId>.md` |
| `scripts/kb/` | 知识库生成器（源码 AST + 文档表格 + demo 三源合并） |

## componentId 四处一致约定

同一组件在以下四处使用**同一个 kebab-case id**，任何一处新增/改名必须四处同步：

1. 组件源码目录名（web 和/或 uniapp 侧）
2. registry 条目 `name`（`packages/*/registry/`）
3. 文档 `::ComponentViewer{componentId="..."}` 与文档文件名
4. 知识库文件名 `knowledge/components/<id>.json`

## 修改组件后的必做动作

```bash
pnpm kb:bootstrap      # 新克隆首次执行：registry:build → kb:build（顺序不可颠倒）
pnpm kb:build          # 日常：改了组件源码/文档 API 表格/overrides 后重新生成知识库
pnpm kb:check          # 提交前自检：schema / 集合一致性 / overrides 悬空引用
```

**生成物不入库**（`knowledge/components/`、`knowledge/report.json`、`knowledge/schema/`、`packages/*/registry/`），部署时由流水线现生成，本地按需构建即可，且一律禁止手改。

需要提交的只有人工源：`knowledge/overrides/<id>.json`，以及内容确有变化时的 `knowledge/index.json`（新增/删除组件、改了 title/description/category/tags 时会变；忘提交会被 CI 拦下）。

## 如何为用户选组件 / 写页面

> 前提：知识库生成物不入库，新克隆需先跑 `pnpm kb:bootstrap`；只查清单则读入库的 `index.json` 即可。

1. 查 `knowledge/index.json` 按 category/tags 筛选候选组件。
2. 读 `knowledge/components/<id>.json` 的 `description`、`whenToUse`、`whenNotToUse`、`pitfalls`，确认选型与端支持（`platforms`）。
3. props/events/slots 以知识库为准（源码抽取），示例见 `examples` 字段。
4. 涉及尺寸的样式优先使用 `rpx` 单位；组件代码使用 `defineModel` 与接口式 `defineProps`；所有注释必须中文。

## 样式令牌规范

### 为什么会乱：两种令牌策略并存

表面看是单位制不同（自建令牌是 px，Tailwind 内置刻度是 rem），真正的根因是**同一套设计体系用了两种令牌策略**：

| 维度 | 策略 | 结果 |
|---|---|---|
| 字号 | **覆盖**原生档（`--text-base: 14px` 盖掉原生 `1rem`） | 只有一套名字，值是 px |
| 圆角 | **另起**命名空间（`--radius-ui-*`，原生档原封不动） | 两套名字并存，一套 px 一套 rem |

圆角是那个不合群的决定。**统一方向是让圆角比照字号——覆盖原生档、值锁 px，而不是投降到原生的 rem 档**：后者会让圆角随根字号缩放、字号不动，把「写法不一致」换成更隐蔽的「行为不一致」。

### 三条硬规则

① **字号一律从 `app/assets/theme/typography.css` 的七级取**（`text-sm` 12 / `text-base` 14 / `text-lg` 16 / `text-xl` 20 / `text-2xl` 24 / `text-3xl` 30 / `text-4xl` 38），不写 `text-[14px]` 这种已有同值令牌的字面量。每级都配了同名的 `--text-*--line-height`，所以用了 `text-*` 就不要再叠 `leading-*`，否则等于只用令牌的一半又把另一半改掉。

两条配套约束：

- **七级之外的小字号不补令牌。** 12px 以下（8/9/10/11px）与 13px 都没有令牌，也不打算加——`--text-xs` 这条路被全仓 369 处既有用量堵死了。这类值就地写字面量，但**必须在 config 里用中文注释写明为什么不能落到七级**（通常是「跟随容器高度按比例缩放」）。
- **组件里不要用 `text-xs`。** 它是 Tailwind 原生值（0.75rem），不属于本规范，typography.css:31 已写明仅文档站与落地页可用。坑在于默认根字号下 `text-xs` 与 `text-sm` 同为 12px，看着一样大但一个 rem 一个 px，而且行高差 4px（16px vs 20px）。`app/components/reborn/ui` 下的 40 处历史用法已全部换成令牌 `text-sm`，现在是零存量，别再新增。文档站（`app/components/common`、`app/components/docs`）、demo（`app/components/reborn/examples`）与落地页不在此列，可继续用。

② **圆角走 Tailwind 原生档名，令牌值由 `base.css` 覆盖为 px**，不使用 `rounded-ui-*`。`--radius-ui-*` 是原生档的 1:1 重复、名字整体下移两档，这个错位是误用高发点——`rounded-ui-sm` 是 8px，而 `rounded-sm` 是 4px。对照关系：

| 作废写法 | 改用 | 实际值 |
|---|---|---|
| `rounded-ui-2xs` | `rounded-sm` | 4px |
| `rounded-ui-xs` | `rounded-md` | 6px |
| `rounded-ui-sm` | `rounded-lg` | 8px |
| `rounded-ui-md` | `rounded-xl` | 12px |
| `rounded-ui-base` | `rounded-2xl` | 16px |
| `rounded-ui-lg` | `rounded-3xl` | 24px |

方向性变体同理（`rounded-t-ui-xs` → `rounded-t-md`）。裸写的 `rounded` 是 4px 硬编码字面量、不读令牌，同样别用，要 4px 就写 `rounded-sm`。

> 现状：**Web 侧已收口**——`base.css` 用六行覆盖了原生 `--radius-sm/md/lg/xl/2xl/3xl`（值锁 px），`--radius-ui-*` 定义已删除，全仓 Web 代码、文档、`knowledge/overrides` 里的 342 处 `rounded-ui-*` 已全部换成原生档名。此后 Web 端再写 `rounded-ui-*` 不会有任何样式产出（令牌已不存在），按上表写即可。完整方案见仓库根 `样式令牌收口清单.md`。

③ **`--radius-ui-*` 仅 uniapp 端保留**。uniapp 有自己的一份定义（`packages/uniapp-project/src/styles/theme.css:66`），值是 **rpx** 而非 px，并且 `--radius: var(--radius-ui-md)` 依赖它。rpx 才随设计稿缩放，**所以 uniapp 端不跟随 Web 迁移，也不要删这组变量**。

> 已知欠账：uniapp 端同时有 248 处原生 `rounded-*`（rem）与 82 处 `rounded-ui-*`（rpx），按「尺寸优先 rpx」那 248 处本身就不对。修它意味着 248 处圆角在 375 屏上减半、需逐页回归，故单独立项，不在本轮范围。代价是**两端类名暂时分家**：Web 写 `rounded-lg`，uniapp 写 `rounded-ui-sm`。

### 间距

能落到 Tailwind 刻度的一律用刻度（`4px→1`、`8px→2`、`12px→3`、`16px→4`、`24px→6`；半档 `2px→0.5`、`6px→1.5`、`10px→2.5`），落不上的才写 `gap-[27px]` 这类字面量。注意刻度是 rem、字面量是 px，混用时两者在非默认根字号下会脱钩——同一组相邻元素的间距尽量只用其中一套。

存量的 146 处 px 字面量（其中约 136 处能落到刻度）**本轮不做批量迁移**：逐处替换要全站回归，成本不划算。真要收口，正确做法是比照圆角在 `@theme` 里覆盖 `--spacing` 为 px——改一处全仓生效，`gap-2` 与 `gap-[8px]` 当场同值、同行为，比把字面量逐个改写成刻度类名可靠得多。

## 组件文档规范

编写或修改 `content/2.components/**/*.md` 前，**必读 `docs/authoring/component-doc.md`**（规范正文唯一真源），或技能 `component-doc`（Claude 端 `.claude/skills/component-doc/SKILL.md`，Codex 端 `.codex/skills/component-doc/SKILL.md`，两份为镜像，改动须同步）。唯一参考范本是 `content/2.components/button/reborn-button.md`。

骨架速查（顺序固定）：

```
frontmatter（title / description ≤60 字 / category 取固定分类表 / platform: web|uniapp|both / tags；侧栏与总览按「系列 → 分类」分组，不按目录）
::ComponentViewer{... componentId="<id>"}
## 简介            三段：一句话定位+双端同构 → 正交维度拆解 → 剩余 API 分组概览
### 何时使用        3-5 条，每条点名具体 prop
### 何时不使用      2-3 条，每条给替代组件（—— 改用 `reborn-xxx`）
## 用法            一节一能力：一句话引子 → 维度表（含「典型用途」列）→ 5-15 行 vue 块
## API             ### Props / ### Emits / ### Slots / ### Expose
                   ### 自定义样式（ui） / ### CSS 变量（写出定义文件路径）
## 两端差异对照     维度|Web|UniApp 三列速查表（仅双端组件）
## 注意事项         每条 = 粗体结论句 + 机制 + 后果
```

三条硬规则：① 骨架固定有序，`简介` / `何时使用` / `何时不使用` / `注意事项` 不得省略；② `### Props|Emits|Slots|Expose` 下表格行名必须与源码成员逐字一致（**CI 强校验**），`ui` 键位表与 CSS 变量表必须放在非 API 标题下；③ 不描述源码里不存在的能力，预留未接线的 prop 要在「注意事项」里明说。

## 组件 Demo 规范

编写或修改组件 demo（web examples / uniapp pages）前，**必读 `docs/authoring/component-demo.md`**（规范正文唯一真源），或技能 `component-demo`（Claude 端 `.claude/skills/component-demo/SKILL.md`，Codex 端 `.codex/skills/component-demo/SKILL.md`，两份为镜像，改动须同步）。唯一参考范本是 `app/components/reborn/examples/reborn-button/RebornButtonDemo.vue`：顶部 Playground 交互演练场 + DemoSection 场景分节 + 显式 import + 中文注释，并按正文的收尾清单验证（eslint / kb:build / uni build）。

三条硬规则：① 严禁传组件不存在的 prop / 插槽 / 事件（死开关）；② `DemoSection` 节序与节名应与文档 `## 用法` 的 `###` 小节一一对应；③ uniapp demo 页尺寸一律 rpx，条件编译注释不得破坏，作用域插槽禁止 `v-bind="scope"` 整包透传。

demo 里的文案（`Playground` 的 `title` / `description`、`DemoSection` 的 `description`、`DemoNote` 正文）与上面的文档规范**同源**：一句话定位、prop 名用代码体、给理由不给口号、禁营销词、一律中文。
