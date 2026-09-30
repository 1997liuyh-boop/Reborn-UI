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
                root: "size-(--height-button-sm)",
            },
            md: {
                root: "size-(--height-button-md)",
            },
            lg: {
                root: "size-(--height-button-lg)",
            },
        },
    },
}
