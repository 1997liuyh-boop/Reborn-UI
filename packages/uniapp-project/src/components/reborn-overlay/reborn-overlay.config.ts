const config = {
    base: 'inset-0 bg-gray-8/70 dark:bg-gray-2/70',
    variants: {
        absolute: {
            true: 'absolute',
            false: 'fixed'
        }
    },
    defaultVariants: {
        absolute: false
    }
} as const

export default config
