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
            'border-default bg-default rounded-xl border',
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
        /**
         * 示例本体 + Theme slots 面板的并排容器。
         * 窄屏纵向堆叠（面板落到示例下方），lg 起分成左右两栏。
         */
        bodyRow: 'flex w-full min-w-0 flex-col lg:flex-row lg:items-stretch',
        /** 示例本体：卡片内唯一的内容区，自身无背景 */
        body: 'w-full min-w-0 flex-1 p-6 sm:p-8',
        /**
         * Theme slots 面板列：仅在该示例展开面板时渲染。
         * 窄屏是示例下方的一段，lg 起变成右侧固定宽度的一栏。
         */
        themePanel: 'border-default w-full min-w-0 shrink-0 border-t lg:w-64 lg:border-t-0 lg:border-l',
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
        /**
         * 网格列数（仅 layout="grid" 有意义，其余排列下 grid-cols-* 不产生效果）。
         * auto 沿用「窄屏 1 列 / sm 2 列 / lg 3 列」的默认响应式档位；
         * 显式指定则用于「示例条目数量固定」的场景，避免 3 列里排 4 项断成 3+1 的孤行。
         */
        columns: {
            auto: {},
            1: { root: 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-1' },
            2: { root: 'sm:grid-cols-2 lg:grid-cols-2' },
            3: { root: 'sm:grid-cols-2 lg:grid-cols-3' },
            4: { root: 'sm:grid-cols-2 lg:grid-cols-4' },
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
            inset: { root: 'bg-elevated rounded-lg p-4' },
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
        columns: 'auto' as const,
        align: 'auto' as const,
        tone: 'plain' as const,
    },
} as const

/**
 * DemoItem —— 示例条目：一行取值标签 + 示例本体 + 可选脚注
 *
 * 用来取代 demo 里反复手写的
 * `<div class="flex flex-col gap-3"><p class="text-dimmed text-xs italic">…</p>…</div>`：
 * 标签字号 / 颜色 / 间距各处不一致，且斜体作用在中文标签上会被合成为伪斜体，观感很差。
 */
export const itemConfig = {
    slots: {
        root: 'flex min-w-0 flex-col gap-2',
        /** 取值标签：不用斜体（中文伪斜体难看），靠字号与弱化色与示例本体拉开层级 */
        label: 'text-dimmed text-xs leading-none font-medium',
        /** 示例本体：允许放多个元素，纵向小间距排列 */
        body: 'flex min-w-0 flex-col gap-2',
        /** 脚注：绑定值回显、边界条件提示等 */
        note: 'text-dimmed text-xs leading-relaxed',
    },
    variants: {
        /** 标签是否用等宽字体：标签是字面量取值（outlined / circle / sm）时更整齐 */
        mono: {
            true: { label: 'font-mono' },
            false: {},
        },
    },
    defaultVariants: {
        mono: false,
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
