# Design Tokens (设计令牌)

> 本文档定义了 Reborn UI 的核心设计变量，包括颜色体系、圆角规范及排版标准。所有组件开发必须遵循此规范以确保视觉一致性。

## 颜色体系 (Color System)

颜色基于 10 级灰度/色相系统。Level 6 通常作为主色（Primary）。

### 基础色池
| 色相 | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 | Level 6 | Level 7 | Level 8 | Level 9 | Level 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| **Red** | #ffebee | #ffe0e4 | #ffb1bc | #ff8b9b | #ff6675 | **#ff3d58** | #d92946 | #b31938 | #8c0d2a | #660821 |
| **Orange** | #fff7df | #ffe9c9 | #ffd5a0 | #ffc370 | #ffb03b | **#ff9711** | #bf7c2a | #995c1a | #733d0e | #522601 |
| **Green** | #f1faf8 | #e7f6f3 | #a2dfcf | #5fcfad | #3ac29e | **#16ae88** | #0b876c | #036150 | #003b32 | #001412 |
| **Blue** | #ecf9ff | #dff4ff | #9ed6f5 | #61ccff | #35b6f2 | **#0d99e5** | #0277bf | #005999 | #003f73 | #00284d |
| **Gray** | #ffffff | #f5f5f5 | #eeeeee | #cccccc | #aaaaaa | **#999999** | #666666 | #333333 | - | - |

## 语义映射 (Semantic Mappings)

在组件配置（Config）中，优先使用语义化名称：

| 语义名称 | 对应色值 | 说明 |
|---|---|---|
| `primary` | Red-6 | 品牌主色 |
| `success` | Green-6 | 成功、完成 |
| `warning` | Orange-6 | 警告、提醒 |
| `error` | Red-6 | 错误、危险 |
| `info` | Blue-6 | 信息、提示 |
| `neutral` | Gray-6 | 中性、辅助 |

## 辅助规范

### 圆角 (Radius)
- `2xs`: 4px
- `xs`: 6px
- `sm`: 8px
- `md`: 12px (默认)
- `base`: 16px
- `lg`: 24px

### 字体尺寸 (Typography)
- **辅助**: 20px, 22px, 24px
- **正文**: 26px, 28px
- **标题**: 30px, 32px, 36px, 40px, 48px, 52px
