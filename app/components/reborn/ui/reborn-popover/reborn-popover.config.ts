export const popoverAnimations = {
    base: {
        enterActiveClass: "transition ease-out duration-200",
        enterToClass: "opacity-100 scale-100 translate-x-0 translate-y-0",
        leaveActiveClass: "transition ease-in duration-150",
        leaveFromClass: "opacity-100 scale-100 translate-x-0 translate-y-0",
    },
    top: {
        enterFromClass: "opacity-0 translate-y-2 scale-95",
        leaveToClass: "opacity-0 translate-y-2 scale-95",
    },
    bottom: {
        enterFromClass: "opacity-0 -translate-y-2 scale-95",
        leaveToClass: "opacity-0 -translate-y-2 scale-95",
    },
    left: {
        enterFromClass: "opacity-0 translate-x-2 scale-95",
        leaveToClass: "opacity-0 translate-x-2 scale-95",
    },
    right: {
        enterFromClass: "opacity-0 -translate-x-2 scale-95",
        leaveToClass: "opacity-0 -translate-x-2 scale-95",
    }
} as const;

export default {
    slots: {
        wrapper: "relative inline-block",
        trigger: "inline-block",
        contentWrapper: "fixed top-0 left-0 z-[9999]",
        content: "relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-3",
        arrow: "absolute w-3 h-3 border dark:border-gray-800 border-gray-200 bg-white dark:bg-gray-900",
        bridge: "absolute inset-0 z-[-1]",
        mask: "fixed inset-0 bg-black/30 z-[9998]",
    },
    variants: {
        side: {
            top: {
                content: "origin-bottom"
            },
            bottom: {
                content: "origin-top"
            },
            left: {
                content: "origin-right"
            },
            right: {
                content: "origin-left"
            },
        },
        align: {
            start: {},
            center: {},
            end: {},
        },
    },
    defaultVariants: {
        side: "bottom",
        align: "center",
    },
} as const;
