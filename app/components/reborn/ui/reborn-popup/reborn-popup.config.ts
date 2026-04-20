export default {
    slots: {
        wrapper: 'fixed pointer-events-none',
        root: 'pointer-events-auto fixed bg-white dark:bg-gray-9 flex flex-col shadow-xl z-50 box-border  p-1',
        header: 'w-full flex items-center justify-between shrink-0',
        title: 'text-base font-medium text-gray-900 dark:text-gray-100',
        closeBtn: '',
        body: 'flex-1 overflow-y-auto scrollbar-hide min-h-0',
        footer: 'border-t border-gray-1 dark:border-gray-8 shrink-0',
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
        round: true
    }
}
