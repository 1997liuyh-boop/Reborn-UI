# 组件设计与变量合同

适用于 Web `app/components/reborn/ui`。字号、圆角和尺寸以根目录 `AGENTS.md`、`app/assets/theme/typography.css` 和 `app/assets/theme/base.css` 为准。UniApp 保留独立的 rpx 体系，不复制 Web 的 px 令牌。

## 颜色

颜色分为基础色板、语义角色和组件槽位三层。接受 `color` 枚举的通用组件消费语义角色；需要特定阶数的浅底、图标、轨道等可以使用色板，但必须有明确的角色或设计依据。

语义色为 `primary / secondary / success / info / warning / error / neutral`，对应 `brand / secondary / green / blue / orange / red / gray` 色板。浅色和暗色使用相同阶数合同：

| 角色 | 变量示例 | 工具类示例 | 默认映射 |
| --- | --- | --- | --- |
| 默认强调色 | `--color-primary` | `bg-primary`、`text-primary` | 第 6 阶 |
| 悬停强调色 | `--color-primary-hover` | `hover:bg-primary-hover` | 第 5 阶 |
| 按下强调色 | `--color-primary-active` | `active:bg-primary-active` | 第 7 阶 |
| 浅底 | `--color-primary-soft` | `bg-primary-soft` | 第 1 阶 |
| 彩色描边 | `--color-primary-border` | `border-primary-border` | 第 2 阶 |
| 实底前景 | `--color-primary-foreground` | `text-primary-foreground` | 与默认背景配对 |
| 悬停实底前景 | `--color-primary-hover-foreground` | `hover:text-primary-hover-foreground` | 与悬停背景配对 |
| 按下实底前景 | `--color-primary-active-foreground` | `active:text-primary-active-foreground` | 与按下背景配对 |

其余六种语义色同样提供以上八个角色。实底文字必须同时指定背景和配对前景，不能统一写 `text-white`；对比度验收覆盖品牌蓝、橙、绿、红预设以及明暗模式，常规文字至少 4.5:1。

`text-primary` 表示强调色文字，不表示“主正文”；正文使用灰阶或 `text-foreground`。`text-*-foreground` 仅用于对应实底，不能用在固定黑白背景或浅底上。自定义一组语义色时，应一起覆盖其前景、交互态、浅底与描边；只改默认色不会自动推导其他角色。

`-border` 角色只配合 `border-*`、`ring-*`、`outline-*`、`divide-*` 使用。第 2 阶浅底等没有对应角色的取值直接写色板阶数（如 `bg-brand-2`），不借用恰好同阶的描边角色：描边阶数调整时，背景不应跟着变。

实底与前景跨槽位时（例如背景在面板、文字在标题），可以在背景所在槽位声明内部变量，例如 Guide 的 `--reborn-guide-internal-foreground`，后代槽位再通过 `text-(--变量)` 消费。自定义 CSS 色值无法推导配对前景，可以保留固定兜底色（如 Timeline 实心节点的白色），但预设色必须在合并顺序上覆盖兜底。

以下已确认设计保留：

- Alert 的 `filled` 是第 1 阶浅底，图标为第 6 阶背景和 `gray-1` 前景；标题 `gray-10`、辅助文字 `gray-8`、关闭图标 `gray-6`。
- Toast/Message 的 `base` 状态图标使用明确的第 6 阶色板，loading 无背景。
- Slider 的刻度边框取第 3 阶；Steps 的中性完成态使用灰色第 2 阶浅底；固定图片遮罩等使用与其实际底色匹配的固定前景。
- Menu 选中背景块与 Tree 拖拽放入内部的底色取色板第 2 阶，比 soft 角色的第 1 阶重一档。
- Tree 的 neutral 拖拽指示线取 `gray-9` 正文色，与内部放置的 `ring-gray-9` 一致；neutral 角色是第 6 阶弱化灰，压不住指示语义。
- 实底的默认、悬停、按下三态各自配对前景，允许字色在状态间黑白翻转（如浅色 primary 悬停时 `brand-5` 底配深色字）。色板较亮，白字在第 5 阶上约 3:1，保持字色一致就必须放弃 4.5:1 或改动取阶；当前选择保留取阶与对比度。
- Web 主色为品牌蓝、辅助色为薄荷绿；UniApp 主色为红、辅助色为灰。这是当前兼容合同，不通过 Web 主题整改隐式改变另一端品牌。

## 样式覆盖

默认 config → variant/state → 用户 `ui` / `class`。默认类放在 config；模板负责绑定槽位，不在用户覆盖之后追加 `leading-none`、圆角或间距等默认值。

每个组件导出具名 `XxxUI`，键位对应真实可覆盖槽位，值使用 `ClassValue`。不允许 `ui?: any` 或为了通过编译将不支持的值扩宽为任意 `string`。兼容别名需要有运行时解析和文档说明。

普通 `ui` 应能覆盖默认形状。不要用历史 `!important` 锁定圆角。布局所需的运行时几何可以使用 CSS 变量或内联样式，但必须记录其覆盖边界。NoticeBar 默认颜色来自 config，只有用户显式传入 `color/background` 才使用内联色；`customStyle` 最后覆盖。

控件尺寸优先级为：显式 `size` → Form 提供的 `size` → 组件默认值；Button 不从 FormItem 读取尺寸。按钮所有普通尺寸圆角均为 `rounded-sm`（4px），显式 `round/circle` 保留各自形状能力。

## 变量命名与单位

| 范围 | 命名 | 要求 |
| --- | --- | --- |
| 主题颜色、字体、圆角、尺寸 | Tailwind 的 `--color-*`、`--text-*`、`--radius-*`、`--spacing-*` | 在可分发的主题入口定义，引用必须在同平台闭合 |
| 新增组件公开变量 | `--reborn-<组件>-<部件或属性>` | 文档列出定义位置、单位、默认值和覆盖范围 |
| 新增组件内部变量 | `--reborn-<组件>-internal-<用途>` | 不作为公开 API，不与其他组件共享偶然相同的值 |
| 已发布旧变量 | 例如 `--step-color`、`--slider-thumb-grow`、`--re-switch-thumb-size` | 本次保留运行时合同；公开变量迁移必须保留旧别名，不直接批量重命名 |

局部变量优先由 Tailwind 任意属性声明，再通过 `bg-(--变量)`、`h-(--变量)` 等消费。几何关系必须保留同一来源，不能把恰好数值相同的其他组件令牌借来使用。

Web 常规尺寸与间距使用 Tailwind 刻度，字号与圆角使用固定 px 令牌。七级字号是 12/14/16/20/24/30/38px，禁止组件使用 `text-xs` 或已存在同值令牌的字面量。8/10px 微型文案、用户指定的特殊字号、圆内居中等例外需要在 config 中用中文解释原因；圆内几何行高例外不等于给普通正文任意追加 `leading-*`。

## 验证

日常运行：

```bash
pnpm design:check
pnpm test:design
pnpm lint:design
pnpm registry:build
pnpm kb:build
pnpm kb:check
```

设计检查覆盖 Web 旧字号、废弃圆角、`ui?: any`、主题引用闭合、`-border` 角色用于非边框属性，以及同一串类名里语义实底搭配 `text-white` / `text-black` / `text-gray-1`；跨槽位的实底与前景配对由浏览器回归覆盖（Steps、Carousel、Radio、Switch、Slider、Tree、FAB、Guide、Timeline、DatePickerPanel）。浏览器回归验证真实 CSS 的颜色、对比度、字号和覆盖行为。该守卫不宣称完成全部组件的视觉或无障碍审计。涉及新的交互或布局变化时，补充对应组件的行为回归。`design-check.yml` 在 CI 执行前三项，测试被跳过视为失败。
