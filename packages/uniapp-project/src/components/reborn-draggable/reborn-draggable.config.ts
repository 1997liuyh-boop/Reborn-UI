const theme = {
    slots: {
        root: 'flex flex-col relative overflow-visible',
        // #ifdef APP-IOS
        item: 'relative z-10 transition-none opacity-100',
        // #endif
        // #ifndef APP-IOS
        // @ts-ignore
        item: 'relative z-10',
        // #endif
    },
    variants: {
        columns: {
            true: { root: 'flex-row flex-wrap' },
        },
        disabled: {
            true: { item: 'opacity-60' },
        },
    },
    defaultVariants: {
        columns: false,
        disabled: false,
    },
}

export default theme
