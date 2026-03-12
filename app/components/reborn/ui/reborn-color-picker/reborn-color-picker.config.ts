const size = ["sm", "md", "lg"] as const;

export { size as colorPickerSizes }
export default {
    slots: {
        root: "ring ring-1 ring-gray-5 p-1 rounded-md cursor-pointer select-none hover:scale-105 transition-all",
        base: "rounded-md ring ring-1 ring-gray-5 w-full h-full flex justify-center items-center",
        icon: "text-white transition-transform duration-200",
    },
    variants: {
        disabled: {
            true: {
                root: "cursor-not-allowed opacity-50",
            },
        },
        open: {
            true: {
                icon: "rotate-180",
            },
        },
        size: {
            sm: {
                root: "h-[var(--button-sm-height)] w-[var(--button-sm-height)]",
            },
            md: {
                root: "h-[var(--button-base-height)] w-[var(--button-base-height)]",
            },
            lg: {
                root: "h-[var(--button-lg-height)] w-[var(--button-lg-height)]",
            },
        },
    },
}
