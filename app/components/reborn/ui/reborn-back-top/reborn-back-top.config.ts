const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const sizes = ["sm", "md", "lg"] as const;
export { color as backTopColors, sizes as backTopSizes };
export default {
    slots: {
        wrapper: "fixed right-0 z-50 overflow-visible pointer-none transition-all duration-300 active:scale-95",
        base: "flex flex-row items-center justify-center text-white shadow-lg rounded-full pointer-events-auto cursor-pointer transition-transform duration-300",
        icon: "text-white"
    },
    variants: {
        color: {
            primary: { base: 'bg-primary' },
            secondary: { base: 'bg-secondary' },
            success: { base: 'bg-success' },
            info: { base: 'bg-info' },
            warning: { base: 'bg-warning' },
            error: { base: 'bg-error' },
            neutral: { base: 'bg-neutral' }
        },
        size: {
            sm: { base: 'size-8', icon: 'text-body-sm' },
            md: { base: 'size-10', icon: 'text-body-base' },
            lg: { base: 'size-12', icon: 'text-title-sm' }
        },
    },
    defaultVariants: {
        color: 'primary' as const,
        size: 'md' as const
    }
}
