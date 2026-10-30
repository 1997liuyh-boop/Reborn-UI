import { floatingArrowSides } from "~/lib/floating-arrow";
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
        trigger: "inline-flex max-w-full",
        contentWrapper: "fixed top-0 left-0 z-[9999]",
        /** 面板不描边，以 8px 圆角和柔和阴影区分层级。 */
        content: "relative bg-gray-1 shadow-[0_2px_12px_0_rgb(0_0_0/0.15)] rounded-lg p-3",
        /** 曲线箭头与 Tooltip 共用轮廓，长短边比例固定为 2.5:1。 */
        arrow: "pointer-events-none absolute bg-gray-1 mask-no-repeat mask-size-[100%_100%]",
        bridge: "absolute inset-0 z-[-1]",
        mask: "fixed inset-0 bg-black/30 z-[9998]",
    },
    variants: {
        side: {
            top: {
                content: "origin-bottom",
                arrow: floatingArrowSides.top,
            },
            bottom: {
                content: "origin-top",
                arrow: floatingArrowSides.bottom,
            },
            left: {
                content: "origin-right",
                arrow: floatingArrowSides.left,
            },
            right: {
                content: "origin-left",
                arrow: floatingArrowSides.right,
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
