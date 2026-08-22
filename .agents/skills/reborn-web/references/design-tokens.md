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
| 字号 | `text-sm`、`text-base`、`text-lg`、`text-xl`、`text-2xl`、`text-3xl`、`text-4xl` | 对应 `--text-*`，仅这 7 级 |
| 结构高度 | `h-badge-sm/md/lg`、`h-button-sm/md/lg`、`h-input-sm/md/lg` | 对应 `--height-*` |

> 注意：设计稿指定的一次性颜色（如 Badge warning 变体的 `bg-[#FFF7F3]`）允许使用任意值类，但需与设计确认后落盘，且不得替代已有令牌。

## 辅助规范

### 按钮尺寸 (Button)

Web / PC 端三档，水平内边距统一 **12px**（`px-3`）：

| size | 高度 | 高度令牌 | 字号 |
|---|---|---|---|
| `sm` | 24px | `--height-button-sm` | `text-sm` (12px) |
| `md` | 32px | `--height-button-md` | `text-base` (14px) |
| `lg` | 40px | `--height-button-lg` | `text-lg` (16px) |

`md` 为默认档。与 `RebornForm` 的 `size`（`'sm' \| 'md' \| 'lg'`）契约一致，表单组内按钮尺寸由组尺寸接管。

边框线型由 `borderStyle` prop 控制（`solid` / `dashed`），宽度固定 1px，对有边框的 `outline` / `subtle` 变体生效。`subtle` 的描边已由 `ring-1 ring-inset` 改为 `border`——ring 本质是 box-shadow，无法渲染虚线。

> UniApp 端按钮仍为 `xs` ~ `2xl` 七档，走自己的 rpx 令牌（`packages/uniapp-project/src/styles/theme.css` + 独立 `tailwind.config.ts`），与 Web 端互不影响。

### 圆角 (Radius)
- `2xs`: 4px
- `xs`: 6px
- `sm`: 8px
- `md`: 12px (默认)
- `base`: 16px
- `lg`: 24px

### 字体尺寸 (Typography)

Web / PC 端使用 px（区别于 UniApp 端的 rpx），定义在 `typography.css`，**直接覆盖 Tailwind 原生 `--text-*` 阶梯**，共 7 级。行高统一取「字号 + 8px」。

| 类名 | 字号 | 行高 | 组件 size 锚点 |
|---|---|---|---|
| `text-sm` | 12px | 20px | `size="sm"` |
| `text-base` | 14px | 22px | **默认**（`size="default"` / `"md"`） |
| `text-lg` | 16px | 24px | `size="lg"` |
| `text-xl` | 20px | 28px | — |
| `text-2xl` | 24px | 32px | — |
| `text-3xl` | 30px | 38px | — |
| `text-4xl` | 38px | 46px | — |

> **组件开发只允许从这 7 级中取。** `text-xs`、`text-5xl`、`text-6xl` 不属于本规范，保持 Tailwind 原生值，仅文档站与落地页可用。

#### 旧令牌迁移对照（已于本次重构全量替换，旧令牌已移除）

| 旧类名 | 旧字号 | 新类名 | 新字号 |
|---|---|---|---|
| `text-caption-sm` | 10px | `text-sm` | 12px |
| `text-caption-md` | 11px | `text-sm` | 12px |
| `text-caption-lg` | 12px | `text-sm` | 12px |
| `text-body-sm` | 13px | `text-sm` | 12px |
| `text-body-base` | 14px | `text-base` | 14px |
| `text-title-sm` | 15px | `text-lg` | 16px |
| `text-title-md` | 16px | `text-lg` | 16px |
| `text-title-lg` | 18px | `text-xl` | 20px |
| `text-title-xl` | 20px | `text-xl` | 20px |
| `text-title-2xl` | 24px | `text-2xl` | 24px |
| `text-title-3xl` | 26px | `text-2xl` | 24px |

> 映射规则：就近取整，等距（18px）向上取。`text-body-md` / `text-body-lg` 曾被少量组件误用，但从未在 `typography.css` 中定义过（属死类名），已分别归入 `text-base` / `text-lg`。
