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
        /** 所在表单项校验失败：外圈描边改为错误色，与输入框、选择器的错误态一致 */
        error: {
            true: {
                root: "ring-red-5",
            },
        },
        size: {
            sm: {
                root: "size-6",
            },
            md: {
                root: "size-8",
            },
            lg: {
                root: "size-10",
            },
        },
    },
}
