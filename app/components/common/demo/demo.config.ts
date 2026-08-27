/**
 * Demo 展示原语（DemoSection / DemoBlock / DemoNote）样式配置
 *
 * ══════════════════════════════════════════════════════════════════
 * 示例编写规范 · 铁律（全站唯一事实来源，文档页 /getting-started/demo-guidelines 与此同步）
 * ══════════════════════════════════════════════════════════════════
 *
 * 【一】背景层级：最多两层
 *
 *   页面底色 pattern-background          ← ① 环境层（全站唯一，由 layouts/docs.vue 提供）
 *   ┌──────────────────────────────────┐
 *   │ DemoStage 画布  bg + border       ← ② 表面层（示例区唯一）
 *   │   小节标题 · 基础用法               │
 *   │   [ 组件 ]  [ 组件 ]               │  ← 无背景
 *   │  ───────────────────────────────  │  ← 分隔线代替卡片
 *   │   小节标题 · 尺寸                   │
 *   │   [ 组件 ]  [ 组件 ]               │
 *   └──────────────────────────────────┘
 *
 *   画布内部**禁止**出现 `bg-* + rounded-* + (border|ring|shadow)` 的组合。
 *   分组一律靠分隔线（DemoSection 自带上边框）、留白与小标题完成。
 *
 * 【二】唯一例外：内嵌演示体
 *
 *   当被演示的对象本身需要一个「容器」才说得清（滚动容器、拖拽区、水印底、
 *   弹层落点、骨架屏占位），允许**一层** `<DemoBlock tone="inset">`：
 *   浅填充 + 小圆角，**无 shadow、无 backdrop-blur、无描边**，
 *   且该层内部不得再出现任何填充盒。
 *
 * 【三】Token 白名单
 *
 *   · 圆角：只用 rounded-ui-2xs|xs|sm|md|base|lg（4/6/8/12/16/24px，见 assets/theme/base.css）
 *   · 颜色：只用语义类 bg-default / bg-elevated / text-default / text-muted /
 *           text-dimmed / text-highlighted / border-default / divide-default
 *   · 间距：画布内边距 p-6 sm:p-8；小节间 gap-8；示例行内 gap-4
 *   · 禁用：backdrop-blur-*、shadow-xl / shadow-2xl、bg-white/xx、
 *           bg-slate-*（色板中不存在）、任意 rounded-[Npx] 硬编码
 *
 * 【四】惯用法（与文档页同步）
 *
 *   · 内容 vs 脚手架：被演示对象自己的表面保留并改用白名单 token；
 *     hero 标题、How to Use 卡片、图标徽章、光晕 blob、径向渐变衬底一律删除。
 *   · 自带表面 / 固定定位组件（Popover、Menu、Dropdown、Toast、Popup、
 *     BackTop、Affix、Fab 等）裸渲染，不要再套 tone="inset"。
 *   · 描边盒（border + rounded-*，无 bg-*）不计入背景层，允许作为落点占位。
 *   · 彩色 / 渐变 / 图片主体上的芯片与 CTA 用 border-current，祖先设好文字色。
 *   · 必须在两种模式下都保持深色的表面：bg-gray-10 dark:bg-gray-1
 *     （灰阶 gray-1…10 在亮暗之间对偶翻转，不存在单 token 永深色）；
 *     深色底上的弱文字用 text-gray-6。禁止写 gray-900 / gray-800 等默认色板名。
 *   · 交互演练场用 <Playground>，不要手写控制条。左侧控制面板的控件统一 lg 尺寸
 *     （Playground 内置，demo 无需配置）；「传参明细」完整列出当前所有参数
 *     （含等于默认值的项），不做默认值过滤。
 *
 * ══════════════════════════════════════════════════════════════════
 */

/** DemoSection —— 示例分组：小标题 + 内容，自身无背景，靠上边框与相邻分组分隔 */
export const sectionConfig = {
    slots: {
        /** 根节点：首个分组不画上边框，其余用一条分隔线代替卡片 */
        root: 'w-full min-w-0',
        /** 标题区 */
        header: 'mb-4 flex flex-col gap-1',
        /** 小节标题：小字号加粗，不与文档页大标题抢层级 */
        title: 'text-highlighted text-sm font-semibold tracking-tight',
        /** 小节描述 */
        description: 'text-muted text-sm leading-relaxed',
        /** 内容区 */
        body: 'w-full min-w-0',
    },
    variants: {
        /** 是否绘制与上一个分组之间的分隔线（首个分组由 first: 变体自动省略） */
        divider: {
            true: {
                root: 'border-default mt-8 border-t pt-8 first:mt-0 first:border-t-0 first:pt-0',
            },
            false: {
                root: 'mt-8 first:mt-0',
            },
        },
    },
    defaultVariants: {
        divider: true as const,
    },
} as const

/** DemoBlock —— 承载示例本体：排列方式 + 对齐 + 唯一允许的浅填充档 inset */
export const blockConfig = {
    slots: {
        root: 'w-full min-w-0',
    },
    variants: {
        /** 排列方式：行内并排 / 网格 / 纵向堆叠 */
        layout: {
            row: { root: 'flex flex-wrap gap-4' },
            grid: { root: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' },
            stack: { root: 'flex flex-col gap-4' },
        },
        /** 交叉轴对齐；auto 表示按 layout 取各自最自然的默认值 */
        align: {
            auto: {},
            start: { root: 'items-start' },
            center: { root: 'items-center' },
            end: { root: 'items-end' },
        },
        /**
         * 填充档位：
         * - plain：无背景（默认，绝大多数场景）
         * - inset：规范里唯一允许的那层浅填充，仅用于「演示体本身需要容器」的情况
         */
        tone: {
            plain: {},
            inset: { root: 'bg-elevated rounded-ui-sm p-4' },
        },
    },
    compoundVariants: [
        // auto 对齐：行内并排默认垂直居中，网格拉伸等高，堆叠靠左
        { layout: 'row', align: 'auto', class: { root: 'items-center' } },
        { layout: 'grid', align: 'auto', class: { root: 'items-stretch' } },
        { layout: 'stack', align: 'auto', class: { root: 'items-start' } },
    ],
    defaultVariants: {
        layout: 'row' as const,
        align: 'auto' as const,
        tone: 'plain' as const,
    },
} as const

/** DemoNote —— 说明性文字，纯文本无盒子，取代各处手写的 text-sm text-gray-500 */
export const noteConfig = {
    base: 'text-sm leading-relaxed',
    variants: {
        /** 文字明度：muted 为常规说明，dimmed 更弱（如单位、边界条件备注） */
        tone: {
            muted: 'text-muted',
            dimmed: 'text-dimmed',
        },
    },
    defaultVariants: {
        tone: 'muted' as const,
    },
} as const
