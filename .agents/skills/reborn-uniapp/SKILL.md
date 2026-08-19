---
name: reborn-uniapp
description: 指导创建 reborn-ui 的 UniApp 组件。包含路径规范、设计标准、配置要求和跨端一致性。
metadata:
  version: "2026.7.20"
---

# Reborn UI (UniApp)

> 本 skill 旨在规范 Reborn UI 在 UniApp 平台上的组件开发流程与标准。

Reborn UI 是一个遵循现代设计规范的高性能组件库。在 UniApp 平台上，我们强调样式的动态覆盖能力（Slots 模式）、跨端样式一致性（rpx 规范）以及严密的类型定义与语法实践。

## 开发参考手册

| 主题 | 说明 | 参考 |
|------|------|------|
| 目录结构 | 组件、配置、Demo 与工具类的存放路径规范 | [core-structure](references/core-structure.md) |
| 设计令牌 (Tokens) | 颜色体系（10 级灰度）、圆角与字号规范 | [design-tokens](references/design-tokens.md) |
| 配置文件 (Config) | 强制 Slots 模式、类型定义位置及 rpx 单位规范 | [component-config](references/component-config.md) |
| 组件实现 (Vue) | 中文注释、v-model 语法糖、一致性检查及 Props 模式 | [component-implementation](references/component-implementation.md) |
| Demo 开发 | RebornPage/Card 容器规范及完整状态展示指南 | [demo-standards](references/demo-standards.md) |
| 文档规范 (MD) | 组件文档的结构、API 描述及平台差异标注要求 | [documentation-standards](references/documentation-standards.md) |

## 核心原则

1. **严禁英文注释**: 代码中所有逻辑说明、Prop 说明等必须使用中文。
2. **跨端一致性**: 在开发前必须检索 Web 端（Nuxt 版，位于本仓库 `app/components/reborn/ui/reborn-[name]/`）是否存在同名组件。如果有，Props 参数、事件名称（Emit）、插槽命名以及 `defineExpose` 暴露的方法必须尽量保持一致，以降低开发者的学习成本。最新的对齐基线见 [component-implementation](references/component-implementation.md) 的「跨端 API 对齐基线」章节。
3. **样式优先原则**: 涉及尺寸的样式必须优先使用 `rpx` 单位，确保在不同屏幕密度下的表现一致。
4. **语法现代化**: 必须使用 `defineModel` 语法糖和接口式 `defineProps` 宏，保持代码简洁、类型完备。

## 组件知识库（先查库，再看源码）

了解既有组件的 API（Props/Events/Slots/示例/使用边界）时，**优先读结构化知识库**而非翻源码或文档正文：

- 轻量索引：`knowledge/index.json`（id/title/description/category/platforms）
- 完整条目：`knowledge/components/<id>.json`
- 外部 Agent 场景可用 `reborn-ui-mcp`（见 `packages/mcp/README.md`）

改动组件源码、文档 API 表格或 `knowledge/overrides/` 后，必须运行 `pnpm kb:build && pnpm registry:build && pnpm kb:check` 并提交生成物，否则 CI 失败。使用侧工作流见 [reborn-ui-usage](../reborn-ui-usage/SKILL.md)。
