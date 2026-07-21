export default {
    slots: {
        wrapper: "reborn-sticky-wrapper relative",
        content: "w-full",
    },
    variants: {
        sticky: {
            true: {
                content: "fixed w-full z-50",
            },
            false: {
                content: "relative w-full",
            },
        },
    },
    defaultVariants: {
        sticky: false,
    },
} as const;
