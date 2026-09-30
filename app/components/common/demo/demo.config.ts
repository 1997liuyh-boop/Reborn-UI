/**
 * DemoSection —— 示例分组：标题 + 描述（卡片外）→ 卡片（示例本体 + 底栏）→ 折叠源码
 *
 * ── 背景层级铁律（全站示例统一遵守）────────────────────────────
 * 示例区只有一层底色：环境层 —— 页面底色，由 layouts/docs.vue 的
 * pattern-background 提供，全站唯一。
 * 分组卡片**描边不填充**：只用 border-gray-3 勾一条细边把一组示例圈出来，
 * 自身不铺底色，示例本体直接落在环境层上。
 * 正因为卡片自己都不填充，卡片内部更不得出现「圆角 + 填充 + 描边/投影」
 * 的盒子 —— 那会凭空造出一层底色，把唯一的环境层压在下面。
 * 设备档（tablet / mobile）例外：iframe 外框必须铺底，否则设备屏幕会透出页面底纹。
 * ────────────────────────────────────────────────────────────────
 *
 * 源码区是唯一的例外：它不是卡片内的盒子而是卡片的下半截，与卡片共用描边与圆角，
 * 铺 bg-gray-2 把「读代码」与「看效果」两块区域分开。
 */
export const sectionConfig = {
    slots: {
        /**
         * 根节点：一张独立卡片。
         * 间距由卡片自带 mt-4（首张归零）而非父级 gap —— demo 文件普遍把分组包在
         * 自己的 <div class="flex flex-col"> 里，父级的 gap 传不到分组上。
         */
        root: 'relative mt-8 flex w-full min-w-0 flex-col gap-3 first:mt-0',
        /** 卡片外的标题区：标题在上、描述在下，先交代「这组示例演示什么」再看效果 */
        header: 'flex min-w-0 flex-col gap-1',
        /** 小节标题：小字号加粗，不与文档页大标题抢层级 */
        title: 'text-highlighted text-sm font-semibold tracking-tight',
        /** 小节描述：显式 description，或文档「用法」同名小节的首段 */
        description: 'text-muted text-sm leading-relaxed',
        /** 描述里的行内代码：与正文 prose 的行内代码同一套观感 */
        descCode: 'bg-gray-2 text-highlighted rounded-xs px-1 py-0.5 font-mono text-[0.85em]',
        /** 涉及参数行：标签 + 参数名，换行不溢出 */
        params: 'mt-1 flex min-w-0 flex-wrap items-center gap-1.5',
        /** 「涉及参数」标签 */
        paramsLabel: 'text-dimmed me-0.5 text-xs',
        /** 单个参数名：等宽小字，描边不填充，与示例卡片同一条边线色 */
        param: 'border-gray-3 text-toned rounded-xs border px-1.5 py-px font-mono text-xs',
        /**
         * 示例卡片：示例本体 + 底栏 + 折叠源码，三段共用一条描边与圆角。
         * 描边不填充：不写 bg-*，底色一律由环境层提供（见顶部铁律）。
         */
        card: [
            'group/demo-section flex w-full min-w-0 flex-col overflow-hidden',
            'border-gray-3 rounded-sm border',
            'transition-colors duration-200 hover:border-inverted/15',
        ].join(' '),
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
        themePanel: 'border-gray-3 w-full min-w-0 shrink-0 border-t lg:w-64 lg:border-t-0 lg:border-l',
        /** 卡片底栏：左侧示例代码名称（仅展开源码时显示），右侧动作组 */
        footer: 'border-gray-3 flex min-h-10 items-center gap-2 border-t px-3 py-1',
        /** 示例代码名称：等宽小字，超长截断，不挤压动作组 */
        codeName: 'text-muted flex min-w-0 items-center gap-1.5 font-mono text-xs',
        /** 代码名称前的文件类型图标 */
        codeIcon: 'size-4 shrink-0',
        /**
         * 源码区：卡片的下半截而非独立盒子，无描边、无内边距，只铺 bg-gray-2
         * 把「读代码」与「看效果」分开；高度完全由代码撑开。
         */
        code: 'bg-gray-2 w-full min-w-0',
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
 * 位于卡片底栏右侧，常驻显示：底栏本身就是动作区，再做悬停淡出只会留下一条空栏。
 * ms-auto 保证左侧代码名称未显示时动作组仍然靠右。
 */
export const actionsConfig = {
    slots: {
        root: 'ms-auto flex shrink-0 items-center gap-0.5',
        /** 收起/展开按钮上的箭头：展开时翻转 */
        chevron: 'transition-transform duration-200',
    },
    variants: {
        /** 源码是否展开：展开时箭头翻转 */
        open: {
            true: {
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
 * 代码名称已由卡片底栏承担，这里不再渲染文件名头部。
 * 代码块自带的描边、圆角、底色、外边距一律清掉，只留 pre 的行内边距，底色交给外层 bg-gray-2；
 * 不设定高，折叠面板的高度完全由代码撑开。
 * 代码块自带的复制 / 运行浮动按钮与底栏动作组重复，一并隐藏。
 */
export const codeConfig = {
    base: [
        'w-full min-w-0',
        '[&_pre]:m-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:px-4 [&_pre]:py-3',
        '[&_pre]:overflow-x-auto [&_button]:hidden',
        '[&_*]:my-0',
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
