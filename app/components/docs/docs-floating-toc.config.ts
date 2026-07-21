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
        root: 'fixed right-3 z-40 hidden lg:flex flex-col items-end top-[calc(var(--ui-header-height)*2+2rem)]',
        /** 刻度条：每个标题一条短横线，纵向排列 */
        rail: 'flex flex-col items-end gap-2 rounded-full px-2 py-3 cursor-pointer',
        /** 刻度线：宽度按标题层级区分，active 高亮加长 */
        railItem: 'h-0.5 rounded-full bg-gray-300 transition-all duration-300 dark:bg-gray-700',
        /** 展开卡片：半透明磨砂浮层 */
        panel:
            'flex max-h-[calc(100vh-14rem)] w-72 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-gray-200/60 bg-white/85 p-5 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/85 dark:shadow-black/40',
        /** 卡片标题 */
        panelTitle: 'mb-3 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase',
        /** 目录链接列表 */
        panelList: 'flex flex-col gap-0.5',
        /** 单条目录链接 */
        panelLink:
            'rounded-lg px-2 py-1.5 text-[13px] leading-snug text-gray-500 transition-colors hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
    },
    variants: {
        /** 刻度线 / 链接的激活态：跟随滚动位置高亮当前章节 */
        active: {
            true: {
                railItem: 'w-6 bg-primary',
                panelLink: 'bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary dark:hover:text-primary',
            },
        },
        /** 子级标题（h3+）：刻度更短、链接缩进 */
        sub: {
            true: {
                railItem: 'w-2.5',
                panelLink: 'pl-5',
            },
            false: {
                railItem: 'w-4',
            },
        },
    },
} as const

export default config
