<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Reborn-UI** (11645 symbols, 22907 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Reborn-UI/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Reborn-UI/clusters` | All functional areas |
| `gitnexus://repo/Reborn-UI/processes` | All execution flows |
| `gitnexus://repo/Reborn-UI/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

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