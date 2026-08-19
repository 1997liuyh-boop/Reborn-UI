---
name: reborn-ui-usage
description: 指导 Agent 使用 Reborn-UI 组件库开发页面：组件选型、安装、Props 用法与平台决策。数据源为组件知识库（knowledge/）或 reborn-ui-mcp。
metadata:
  version: "2026.8.19"
---

# 用 Reborn-UI 开发页面（Agent 工作流）

Reborn-UI 是 Web（Nuxt）+ uniapp 双端组件库，采用 shadcn 式源码分发（CLI 把组件源码复制进你的项目）。**不要 grep 组件源码来了解 API**——所有组件的 Props/Events/Slots/示例/使用边界都在结构化知识库里。

## 数据源（二选一）

1. **配置了 `reborn-ui-mcp` 时**：用 MCP 工具查询（推荐，见下方工具映射）。
2. **在本仓库内工作时**：直接读 `knowledge/index.json`（轻量索引）与 `knowledge/components/<id>.json`（完整条目）。

## 标准工作流

1. **找候选**：`search_components({query})` 或按 `list_categories()` → `list_components({category})` 浏览。分类枚举：basic / form / layout / feedback / navigation / data-display / effect / media / misc。
2. **确认选型**：`get_component({id})`，重点读：
   - `platforms`：端支持（见下方决策树）；
   - `whenToUse` / `whenNotToUse`：场景匹配与替代组件；
   - `pitfalls`：父组件要求（如 RebornFormItem 必须在 RebornForm 内）、平台差异、易错 props。
3. **安装**：`get_install_command({id})`；首次使用先 `init` 生成 `components.json`。
4. **写代码**：`get_component_example({id})` 取示例，props 用法以知识条目为准，不要凭记忆猜 API。

## 平台决策树

- 目标是**小程序 / App / H5 混合端** → 只能选 `platforms` 含 `uniapp` 的组件（多为 `reborn-*` 前缀）；模板用 `<view>/<text>`，尺寸单位优先 `rpx`。
- 目标是**纯 Web（Nuxt/Vue）站点** → 选 `platforms` 含 `web` 的组件；特效类组件（effect/text-animations 分类）全部仅 web。
- 双端项目共用一套页面 → 只选 `platforms` 同时含两端的组件，并注意 pitfalls 中标注的端差异。

## 主题定制约定

- 每个组件的样式变体定义在同目录 `*.config.ts`（tailwind-variants）：`slots` + `variants` + `defaultVariants`，并导出 `xxxColors/xxxSizes/xxxVariants` 常量数组（即 props 的合法取值，知识条目 props.options 同源）。
- 调样式的正确姿势：优先传 `color/size/variant` 等语义 props → 其次用 `ui` prop 按 slot 覆盖类名 → 最后才是 `customClass`。禁止直接改组件源码里的类名。
- 设计 token 是 CSS 变量（`:root, body, page` 三处挂载），暗色模式切 `dark` class。

## 常见错误对照表

| 症状 | 原因与修正 |
|---|---|
| 小程序端样式全丢 | 用了仅 web 的组件或 tailwind 任意值写法；查该组件 `platforms` 与 pitfalls |
| 表单校验不生效 | RebornFormItem 未包在 RebornForm 内，或 item 未传 prop 字段名 |
| v-model 不更新 | 该组件用 `defineModel` 或显式 `update:modelValue`，检查是否误绑了其他事件名 |
| 组件安装后报缺依赖 | `get_install_command` 返回的 `dependencies` 需要手动安装 |
| 弹层/浮层被裁剪 | 参考知识条目 pitfalls 中 portal / overlay 相关说明（uniapp 端常需 root-portal） |

## 开发本仓库组件时

改动组件源码 / 文档 API 表格 / `knowledge/overrides/` 后，必须依次运行：

```bash
pnpm kb:build && pnpm registry:build && pnpm kb:check
```

并将生成物一并提交（CI 会校验 drift）。规范细节见 `knowledge/README.md` 与仓库根 `AGENTS.md`。
