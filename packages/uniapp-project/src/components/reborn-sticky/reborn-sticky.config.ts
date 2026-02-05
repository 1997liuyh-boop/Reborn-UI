import { type VariantProps, tv } from "tailwind-variants";

export const stickyVariants = tv({
    slots: {
        wrapper: "",
        content: "w-full relative transition-[top] duration-200",
    },
    variants: {
        sticky: {
            true: {
                content: "fixed w-full",
            },
            false: {
                content: "relative w-full",
            },
        },
    },
    defaultVariants: {
        sticky: false,
    },
});

export type StickyVariants = VariantProps<typeof stickyVariants>;

export default {
    slots: {
        wrapper: "reborn-sticky-wrapper relative",
        content: "w-full relative transition-[top] duration-200",
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