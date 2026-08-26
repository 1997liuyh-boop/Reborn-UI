# Reborn-UI 组件知识库

面向 AI Agent 与 MCP 的组件结构化元数据。**`components/` 与 `index.json` 为机器生成，禁止手改**；人工内容一律写入 `overrides/`。

## 目录结构

生成物已不入库（见仓库根 `.gitignore`），新克隆或需要本地测试时运行 `pnpm kb:bootstrap` 现生成。

| 路径 | 入库 | 说明 |
|---|---|---|
| `overrides/<id>.json` | ✅ | 人工覆盖层：描述、whenToUse、pitfalls、精选示例等，**人工维护的唯一来源** |
| `index.json` | ✅ | 轻量索引（id/title/description/category/tags/platforms）。机器生成但保留入库：它是 `registry:build --strict-kb` 的元数据源，也是 CI 抓「新增/删除组件却没同步知识库」的守卫 |
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

`description` 是 Agent 选型的第一依据，必须满足：

1. **一句话，≤60 字**，句式为「用于…的…组件」或等价的功能定位句。
2. **包含区分性信息**：与相近组件的差异点要能从描述中读出（如 `reborn-button` 与 `ripple-button` 的差异）。
3. **禁营销词**：不出现「优雅」「强大」「时尚」「炫酷」等形容词堆砌。
4. 不描述知识条目中不存在的能力（防幻觉：描述只能基于 props/events/slots/examples 已有事实）。

配套字段：

- `whenToUse`：2-4 条，具体场景（「表单中需要单选一组互斥选项时」）。
- `whenNotToUse`：1-3 条，**尽量给出替代组件 id**（「需要多选时改用 reborn-checkbox」）。
- `pitfalls`：注意事项，只写事实：平台差异（仅 web / 仅 uniapp）、必须的父组件（如 RebornFormItem 需在 RebornForm 内）、已知易错 props 组合。

## overrides 写法

`overrides/<id>.json` 支持的字段与合并规则：

- `title` / `description` / `category`：字符串，整体替换。
- `tags` / `related` / `whenToUse` / `whenNotToUse` / `pitfalls`：数组，整体替换。
- `examples`：数组，**追加**在 demo 示例之后（`source` 自动标为 `manual`）。
- `props` / `events` / `slots` / `exposes`：数组，按 `name` 匹配后**合并字段**（用于修正描述/类型，不能新增源码中不存在的成员）。

改完 overrides 后运行 `pnpm kb:build` 使之生效。
