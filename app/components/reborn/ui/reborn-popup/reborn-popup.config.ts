/*
 * 抽屉视觉规格：四周无圆角（round 需显式开启）；
 * header / footer 内边距 py-16px px-24px，body 内边距 24px；
 * header 底边与 footer 顶边均为 gray-2 分隔线；
 * 标题 text-lg 令牌（16px/24px）/ gray-10，关闭图标 20px 在标题左侧、间隔 12px。
 */
export default {
    slots: {
        wrapper: 'fixed pointer-events-none',
        root: 'pointer-events-auto fixed bg-white dark:bg-gray-9 flex flex-col shadow-xl z-50 box-border',
        header: 'w-full flex items-center gap-[12px] shrink-0 border-b border-gray-2 py-[16px] px-[24px]',
        title: 'text-lg font-medium text-gray-10',
        closeBtn: 'inline-flex size-[20px] shrink-0 cursor-pointer items-center justify-center text-gray-6 transition-colors hover:text-gray-8',
        body: 'flex-1 overflow-y-auto scrollbar-hide min-h-0 p-[24px]',
        footer: 'border-t border-gray-2 shrink-0 py-[16px] px-[24px]',
        resizer: 'absolute bg-transparent hover:bg-primary/20 hover:backdrop-blur-sm transition-colors z-[100]'
    },
    variants: {
        position: {
            right: { wrapper: 'top-0 left-0 w-full h-full', root: 'right-0 top-0 h-full', resizer: 'cursor-col-resize w-1.5 h-full left-0 top-0' },
            left: { wrapper: 'top-0 left-0 w-full h-full', root: 'left-0 top-0 h-full', resizer: 'cursor-col-resize w-1.5 h-full right-0 top-0' },
            top: { wrapper: 'top-0 left-0 w-full h-full', root: 'top-0 left-0 w-full max-h-screen', resizer: 'cursor-row-resize w-full h-1.5 bottom-0 left-0' },
            bottom: { wrapper: 'top-0 left-0 w-full h-full', root: 'bottom-0 left-0 w-full max-h-screen', resizer: 'cursor-row-resize w-full h-1.5 top-0 left-0' },
            center: { wrapper: 'inset-0 flex items-center justify-center w-full h-full', root: '' }
        },
        round: {
            true: { root: '' },
            false: { root: '' }
        }
    },
    compoundVariants: [
        { position: 'center' as const, round: true, class: { root: 'rounded-lg' } },
        { position: 'top' as const, round: true, class: { root: 'rounded-b-2xl' } },
        { position: 'bottom' as const, round: true, class: { root: 'rounded-t-2xl' } },
        { position: 'left' as const, round: true, class: { root: 'rounded-r-2xl' } },
        { position: 'right' as const, round: true, class: { root: 'rounded-l-2xl' } }
    ],
    defaultVariants: {
        position: 'center' as const,
        round: false
    }
}
