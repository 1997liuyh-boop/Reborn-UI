/**
 * DocsFloatingToc（悬浮目录）样式配置
 *
 * 桌面端（lg+）文档正文已占满整行（不再为 TOC 保留栅格列），
 * 目录改为固定在视口右缘的「刻度条」，悬停 / 点击展开为完整目录卡片。
 *
 * z-index 约定（全站固化）：header z-50 > 悬浮目录 z-40 > 吸顶 Tab 栏 z-20 > 内容
 */
const config = {
    slots: {
        /**
         * 根节点：固定于视口右缘、垂直居中于内容区上部；
         * 仅 lg+ 显示（<lg 由 UPage #right 槽的原生 UContentToc 折叠条负责）
         */
        root: 'fixed right-3 z-40 hidden lg:flex flex-col items-end top-[calc(var(--ui-header-height)+2rem)]',
        /** 刻度条：每个标题一条短横线，纵向排列 */
        rail: 'flex flex-col items-end gap-2.5 rounded-md px-2 py-3 cursor-pointer',
        /** 刻度线：宽度按标题层级区分，active 高亮加长 */
        railItem: 'h-0.5 rounded-full bg-zinc-300 transition-all duration-200 dark:bg-zinc-600',
        /** 展开卡片：Arco 式轻边框浮层，弱化重阴影 */
        panel:
            'flex max-h-[calc(100vh-14rem)] w-60 flex-col overflow-y-auto overscroll-contain rounded-xl border border-zinc-200/80 bg-white/95 p-4 shadow-lg shadow-zinc-900/5 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-black/30',
        /** 卡片标题 */
        panelTitle: 'mb-2 text-xs font-medium tracking-wide text-zinc-400',
        /** 目录链接列表 */
        panelList: 'flex flex-col gap-0.5',
        /** 单条目录链接 */
        panelLink:
            'rounded-md px-2 py-1.5 text-[13px] leading-snug text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white',
    },
    variants: {
        /**
         * 右栏避让：文档页存在移动端 demo 面板（2xl+ fixed 贴视口右缘、宽 420px）时，
         * 刻度条左移到正文列与面板之间的分缝处，避免压在手机模拟器上。
         * 偏移量 = 面板宽 420px + 分缝间隙 12px = 27rem（面板 fixed 后与容器宽度无关）。
         */
        inset: {
            true: {
                root: '2xl:right-[27rem]',
            },
        },
        /** 刻度线 / 链接的激活态：跟随滚动位置高亮当前章节 */
        active: {
            true: {
                railItem: 'w-5 bg-primary',
                panelLink: 'bg-primary/8 font-medium text-primary hover:bg-primary/12 hover:text-primary dark:hover:text-primary',
            },
        },
        /** 子级标题（h3+）：刻度更短、链接缩进 */
        sub: {
            true: {
                railItem: 'w-2',
                panelLink: 'pl-4 text-[12px]',
            },
            false: {
                railItem: 'w-3.5',
            },
        },
    },
} as const

export default config
