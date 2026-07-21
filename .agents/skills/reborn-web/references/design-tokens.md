# Design Tokens (设计令牌)

> 本文档定义了 Reborn UI 的核心设计变量，包括颜色体系、圆角规范及排版标准。所有组件开发必须遵循此规范以确保视觉一致性。令牌源文件：`app/assets/theme/base.css`（颜色/圆角/语义色）与 `app/assets/theme/typography.css`（字号/结构高度/间距）。

## 颜色体系 (Color System)

颜色基于 10 级灰度/色相系统。Level 6 通常作为主色（Primary）。

### 基础色池
| 色相 | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 | Level 6 | Level 7 | Level 8 | Level 9 | Level 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| **Red** | #ffebee | #ffe0e4 | #ffb1bc | #ff8b9b | #ff6675 | **#ff3d58** | #d92946 | #b31938 | #8c0d2a | #660821 |
| **Orange** | #fff7df | #ffe9c9 | #ffd5a0 | #ffc370 | #ffb03b | **#ff9711** | #bf7c2a | #995c1a | #733d0e | #522601 |
| **Green** | #f1faf8 | #e7f6f3 | #a2dfcf | #5fcfad | #3ac29e | **#16ae88** | #0b876c | #036150 | #003b32 | #001412 |
| **Blue** | #ecf9ff | #dff4ff | #9ed6f5 | #61ccff | #35b6f2 | **#0d99e5** | #0277bf | #005999 | #003f73 | #00284d |
| **Gray** | #ffffff | #f5f5f5 | #eeeeee | #cccccc | #aaaaaa | **#999999** | #666666 | #333333 | #111111 | #000000 |

## 语义映射 (Semantic Mappings)

在组件配置（Config）中，优先使用语义化名称：

| 语义名称 | 对应色值 | 说明 |
|---|---|---|
| `primary` | Red-6 | 品牌主色 |
| `secondary` | Gray-8 | 次要色 |
| `success` | Green-6 | 成功、完成 |
| `warning` | Orange-6 | 警告、提醒 |
| `error` | Red-6 | 错误、危险 |
| `info` | Blue-6 | 信息、提示 |
| `neutral` | Gray-6 | 中性、辅助 |
| `inverted` | #ffffff | 反色文字（深色背景上使用，如 `text-inverted`） |
| `default` / `elevated` / `accented` | Gray-8 / Gray-2 / Gray-4 | 默认文字 / 浮层背景 / 强调边框 |

## 令牌类名使用 (Token Utility Classes)

组件 `config.ts` 中必须优先使用以下令牌类，而非任意值：

| 类别 | 类名示例 | 说明 |
|---|---|---|
| 圆角 | `rounded-ui-2xs` ~ `rounded-ui-lg` | 对应 `--radius-ui-*` |
| 颜色 | `bg-primary`、`text-inverted`、`bg-gray-9/90`、`border-gray-5` | 色阶类支持透明度修饰符（如 `/90`、`/10`） |
| 透明度变体 | `bg-success/10`、`border-warning/20` | soft / subtle 变体的标准写法 |
| 字号 | `text-caption-sm/md/lg`、`text-body-sm/base`、`text-title-sm ~ 3xl` | 对应 `--text-*` |
| 结构高度 | `h-badge-sm/md/lg`、`h-button-xs ~ 2xl`、`h-input-sm/md/lg` | 对应 `--height-*` |

> 注意：设计稿指定的一次性颜色（如 Badge warning 变体的 `bg-[#FFF7F3]`）允许使用任意值类，但需与设计确认后落盘，且不得替代已有令牌。

## 辅助规范

### 圆角 (Radius)
- `2xs`: 4px
- `xs`: 6px
- `sm`: 8px
- `md`: 12px (默认)
- `base`: 16px
- `lg`: 24px

### 字体尺寸 (Typography)

Web 端使用 px（区别于 UniApp 端的 rpx），定义在 `typography.css`：

- **辅助 (Caption)**: sm 10px / md 11px / lg 12px
- **正文 (Body)**: sm 13px / base 14px
- **标题 (Title)**: sm 15px / md 16px / lg 18px / xl 20px / 2xl 24px / 3xl 26px
