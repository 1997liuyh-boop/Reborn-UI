---
name: reborn-web
description: 指导创建 reborn-ui 的 Web 组件（Nuxt 3）。包含目录结构、设计标准、跨端一致性和文档要求。
metadata:
  version: "2026.3.10"
---

# Reborn UI (Web)

> 本 skill 旨在规范 Reborn UI 在 Web (Nuxt 3) 平台上的组件开发流程与标准。

Reborn UI 是一个遵循现代设计规范的高性能组件库。在 Web 平台上，我们利用 Nuxt 3 的强大特性（Auto-import, SFC），结合 `tailwind-variants` 实现声明式样式管理。通过与 UniApp 侧的紧密对齐，我们确保了开发者在不同平台间切换时的体验一致性。

## 开发参考手册

| 主题 | 说明 | 参考 |
|------|------|------|
| 目录结构 | Web 侧组件、Playground 与文档的物理存路径放规范 | [core-structure](references/core-structure.md) |
| 设计令牌 (Tokens) | 颜色体系、语义化映射与全局样式规范 | [design-tokens](references/design-tokens.md) |
| 配置文件 (Config) | 支持 Slots 变体、类型收口与跨端参数对齐规范 | [component-config](references/component-config.md) |
| 组件实现 (Vue) | 中文注释规范、defineModel 语法糖及跨端一致性实践 | [component-implementation](references/component-implementation.md) |
| 文档规范 (MD) | 组件文档结构、ComponentViewer 配置及平台差异标注 | [documentation-standards](references/documentation-standards.md) |

## 核心原则

1. **中文注释标准**: 代码中严禁出现英文注释，所有描述必须直观准确。
2. **跨端一致性**: 在开发 Web 端组件时，必须检索 UniApp 端实现。Props 参数名、Emit 事件（如 `update:modelValue`）应与 UniApp 端对齐。
3. **类型收口**: 将 `color`, `size` 等核心变体定义在 `config.ts` 中，并导出类型。
4. **语法现代化**: 必须使用 `defineModel` 应对双向绑定，并采用接口化 `defineProps` 宏。
