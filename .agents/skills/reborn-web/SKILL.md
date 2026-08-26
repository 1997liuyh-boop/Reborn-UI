---
name: reborn-web
description: 指导创建 reborn-ui 的 Web 组件（Nuxt 3）。包含目录结构、设计标准、跨端一致性和文档要求。
metadata:
  version: "2026.7.20"
---

# Reborn UI (Web)

> 本 skill 旨在规范 Reborn UI 在 Web (Nuxt 3) 平台上的组件开发流程与标准。

Reborn UI 是一个遵循现代设计规范的高性能组件库。在 Web 平台上，我们利用 Nuxt 3 的强大特性（Auto-import, SFC），结合 `tailwind-variants` 实现声明式样式管理。通过与 UniApp 侧的紧密对齐，我们确保了开发者在不同平台间切换时的体验一致性。

## 开发参考手册

| 主题 | 说明 | 参考 |
|------|------|------|
| 目录结构 | Web 侧组件、Playground 与文档的物理存路径放规范 | [core-structure](references/core-structure.md) |
| 设计令牌 (Tokens) | 颜色体系、语义化映射与全局样式规范 | [design-tokens](references/design-tokens.md) |
| 配置文件 (Config) | 支持 Slots 变体、布尔变体、compoundVariants 与类型收口规范 | [component-config](references/component-config.md) |
| 组件实现 (Vue) | 中文注释规范、defineModel 语法糖、DOM 测量与竞态防护实践 | [component-implementation](references/component-implementation.md) |
| 组合式函数 (Composables) | useOverlay 命令式弹层管理与 RebornOverlay 全局滚动锁规范 | [composables-overlay](references/composables-overlay.md) |
| 文档规范 (MD) | 组件文档结构、ComponentViewer 配置及平台差异标注 | [documentation-standards](references/documentation-standards.md) |

## 核心原则

1. **中文注释标准**: 代码中严禁出现英文注释，所有描述必须直观准确。
2. **跨端一致性**: 在开发 Web 端组件时，必须检索 UniApp 端实现。Props 参数名、Emit 事件（如 `update:modelValue`）应与 UniApp 端对齐。
3. **类型收口**: 将 `color`, `size` 等核心变体定义在 `config.ts` 中，并导出类型；`customClass` 与 `ui` 覆盖项使用 `tailwind-variants` 的 `ClassValue` 类型，禁止裸用 `any`。
4. **语法现代化**: 必须使用 `defineModel` 应对双向绑定，并采用接口化 `defineProps` 宏；`defineEmits` 必须使用类型化写法。
5. **根因注释**: 涉及动画、布局抖动、异步竞态等复杂交互的修复，必须在代码注释中写明「根因 → 方案」（可用 `⚠️ 根因` / `✅ 修复` 标记），让后来者不敢轻易删除关键代码。

## 组件知识库（先查库，再看源码）

了解既有组件的 API（Props/Events/Slots/示例/使用边界）时，**优先读结构化知识库**而非翻源码或文档正文：

- 轻量索引：`knowledge/index.json`（id/title/description/category/platforms，入库文件）
- 完整条目：`knowledge/components/<id>.json`（生成物不入库，新克隆需先跑 `pnpm kb:bootstrap`）
- 外部 Agent 场景可用 `reborn-ui-mcp`（见 `packages/mcp/README.md`）

改动组件源码、文档 API 表格或 `knowledge/overrides/` 后，必须运行 `pnpm kb:build && pnpm kb:check`。生成物不入库（部署时现生成），需要提交的只有 `knowledge/overrides/` 与内容确有变化时的 `knowledge/index.json`，漏提交 index.json 会导致 CI 失败。使用侧工作流见 [reborn-ui-usage](../reborn-ui-usage/SKILL.md)。
