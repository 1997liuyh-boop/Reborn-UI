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
