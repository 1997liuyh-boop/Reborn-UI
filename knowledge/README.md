# Reborn-UI 组件知识库

面向 AI Agent 与 MCP 的组件结构化元数据。**`components/` 与 `index.json` 为机器生成，禁止手改**；人工内容一律写入 `overrides/`。

## 目录结构

| 路径 | 说明 |
|---|---|
| `schema/component.schema.json` | 由 `scripts/kb/schema.ts`（zod）生成的 JSON Schema，勿手改 |
| `components/<id>.json` | 每组件一份知识条目，`pnpm kb:build` 全量重建 |
| `overrides/<id>.json` | 人工覆盖层：描述、whenToUse、pitfalls、精选示例等 |
| `index.json` | 轻量索引（id/title/description/category/tags/platforms） |
| `report.json` | 抽取覆盖率与文档-源码偏差报告 |

## 常用命令

```bash
pnpm kb:build              # 全量重建
pnpm kb:build --only reborn-button,reborn-input   # 只重建指定组件
pnpm kb:check              # CI 校验：drift / schema / 集合一致性 / 手改检测
```

改动组件源码、文档 API 表格或 overrides 后，必须重新运行 `pnpm kb:build` 并提交生成物，否则 `kb:check` 会失败。

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
