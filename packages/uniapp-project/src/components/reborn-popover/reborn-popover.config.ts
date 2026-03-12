export default {
    slots: {
        base: 'relative inline-block',
        target: 'inline-block',
        pos: 'absolute box-border min-h-[36px] z-[500] transition-opacity duration-200  rounded-md bg-white',
        hidden: 'left-[-100vw] invisible',
        container: 'relative text-sm leading-normal shadow-[0_2px_15px_0_rgba(0,0,0,0.1)]',
        inner: 'relative whitespace-nowrap p-3 rounded-md bg-white dark:bg-gray-8',
        arrow: 'absolute w-[9px] h-[9px] bg-white dark:bg-zinc-800 pointer-events-none', // requires rotation in style
        closeIcon: 'absolute text-[12px] right-[-8px] top-[-10px] scale-50 p-2.5',
        menu: 'inline-block px-3 whitespace-nowrap relative rounded-md bg-white dark:bg-zinc-800 z-[500]',
        menuInner: 'relative py-3 flex items-center border-t border-solid border-gray-200 dark:border-gray-700 first:border-0',
    },
    variants: {
        // Arrow directions
        arrowSide: {
            top: 'top-[-4.5px] rotate-45 border-t border-l border-gray-200 dark:border-gray-700',
            bottom: 'bottom-[-4.5px] rotate-45 border-b border-r border-gray-200 dark:border-gray-700',
            left: 'left-[-4.5px] rotate-45 border-b border-l border-gray-200 dark:border-gray-700',
            right: 'right-[-4.5px] rotate-45 border-t border-r border-gray-200 dark:border-gray-700',
            none: '',
        }
    },
    defaultVariants: {
        arrowSide: 'none' as 'none' | 'top' | 'bottom' | 'left' | 'right',
    }
}
