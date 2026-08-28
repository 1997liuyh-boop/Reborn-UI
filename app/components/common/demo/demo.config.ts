/**
 * Demo 展示原语（DemoSection / DemoBlock / DemoNote / DemoActions）样式配置
 *
 * ══════════════════════════════════════════════════════════════════
 * 示例编写规范 · 铁律（全站唯一事实来源，文档页 /getting-started/demo-guidelines 与此同步）
 * ══════════════════════════════════════════════════════════════════
 *
 * 【一】背景层级：最多两层
 *
 *   页面底色 pattern-background          ← ① 环境层（全站唯一，由 layouts/docs.vue 提供）
 *   ┌──────────────────────────────────┐
 *   │ DemoSection 卡片  bg + border     ← ② 表面层（每个分组各自一张卡）
 *   │  小节标题 · 基础用法   [⌄][⧉][👁][▷][✨]  ← 卡片头：标题 + 悬停浮出的动作组
 *   │  ───────────────────────────────  │
 *   │   [ 组件 ]  [ 组件 ]               │  ← 示例本体，无背景
 *   │  ───────────────────────────────  │
 *   │   源码（reborn-collapse 折叠）      │  ← 展开代码时出现在示例下方
 *   └──────────────────────────────────┘
 *   ┌──────────────────────────────────┐
 *   │ DemoSection 卡片 · 尺寸            │  ← 分组之间靠 mt-4 间距分隔，不再用分隔线
 *   └──────────────────────────────────┘
 *
 *   DemoStage 的全宽画布**不再自带表面层**（否则就是「卡中卡」三层背景），
 *   它退化为一个纵向排布容器；表面层下放给每张 DemoSection 卡片与 Playground
 *   （Playground 默认 surface=true，自成一张卡）。
 *   卡片内部**禁止**再出现 `bg-* + rounded-* + (border|ring|shadow)` 的组合。
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
 *   · 间距：卡片内边距 p-6 sm:p-8；卡片之间 mt-4（DemoSection 自带，首张归零）；示例行内 gap-4
 *   · 禁用：backdrop-blur-*、shadow-xl / shadow-2xl、bg-white/xx、
 *           bg-slate-*（色板中不存在）、任意 rounded-[Npx] 硬编码
 *
 * 【四】分组即代码单元
 *
 *   · 每个 `<DemoSection title="...">` 就是一段可独立复制 / 运行的示例，
 *     其源码由 utils/extractDemoSections 从 demo 文件文本中按 title 抽取，
 *     **不需要在文档或分组上再写一份代码**。
 *   · 因此分组标题必须是字面量 `title="..."`；用 `:title` 动态绑定会导致抽取失败，
 *     该分组会自动隐藏「展开代码 / 复制 / Playground」三个动作（演示仍正常）。
 *   · 同一个 demo 文件内标题需唯一。
 *
 * 【五】惯用法（与文档页同步）
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

/**
 * DemoSection —— 示例分组卡片：卡片头（标题 + 动作组）+ 示例本体 + 折叠源码
 *
 * 卡片本身即示例区的表面层；group/demo-section 供动作组做 hover 显隐。
 */
export const sectionConfig = {
    slots: {
        /**
         * 根节点：一张独立卡片。
         * 间距由卡片自带 mt-4（首张归零）而非父级 gap —— demo 文件普遍把分组包在
         * 自己的 <div class="flex flex-col"> 里，父级的 gap 传不到分组上。
         */
        root: [
            'group/demo-section relative mt-4 flex w-full min-w-0 flex-col overflow-hidden first:mt-0',
            'border-default bg-default rounded-ui-md border',
            'transition-colors duration-200 hover:border-inverted/15',
        ].join(' '),
        /** 卡片头：左标题区 / 右动作组 */
        header: 'border-default flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-4 py-2',
        /** 标题区 */
        headerMain: 'flex min-w-0 flex-col gap-0.5',
        /** 小节标题：小字号加粗，不与文档页大标题抢层级 */
        title: 'text-highlighted text-sm font-semibold tracking-tight',
        /** 小节描述 */
        description: 'text-muted text-sm leading-relaxed',
        /** 示例本体：卡片内唯一的内容区，自身无背景 */
        body: 'w-full min-w-0 p-6 sm:p-8',
        /** 源码区：折叠展开后位于示例下方，与示例本体靠一条分隔线分开 */
        code: 'border-default w-full min-w-0 border-t',
    },
    variants: {
        /**
         * 保留 divider 属性以兼容既有 demo 的写法（分组已改为独立卡片，
         * 分隔靠卡片间距完成，这里不再绘制分隔线，传值不产生视觉差异）。
         */
        divider: {
            true: {},
            false: {},
        },
    },
    defaultVariants: {
        divider: true as const,
    },
} as const

/**
 * DemoActions —— 示例动作组（收起/展开 · 复制代码 · 预览 · Playground · 询问 AI）
 *
 * 卡片头右侧常驻位；默认淡出，悬停或键盘聚焦所属卡片时浮出，
 * 无 hover 能力的触屏（<md）与源码展开时常驻。
 */
export const actionsConfig = {
    slots: {
        root: [
            'flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150',
            'group-hover/demo-section:opacity-100 group-focus-within/demo-section:opacity-100',
            'max-md:opacity-100',
        ].join(' '),
        /** 收起/展开按钮上的箭头：展开时翻转 */
        chevron: 'transition-transform duration-200',
    },
    variants: {
        /** 源码是否展开：展开时动作组常驻、箭头翻转 */
        open: {
            true: {
                root: 'opacity-100',
                chevron: 'rotate-180',
            },
            false: {},
        },
    },
    defaultVariants: {
        open: false,
    },
} as const

/**
 * DemoCode —— 源码面板
 *
 * 文件名头部由代码块围栏标注（```vue [文件名]）渲染，这里只负责收口外边距、
 * 并给长示例加定高滚动，避免把卡片撑到几屏高。
 */
export const codeConfig = {
    base: [
        'w-full min-w-0 p-4',
        '[&_pre]:max-h-[420px] [&_pre]:overflow-auto',
        '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
    ].join(' '),
} as const

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
