const mode = ["scaleToFill", "aspectFit", "aspectFill", "widthFix", "heightFix", "top", "bottom", "center", "left", "right", "top left", "top right", "bottom left", "bottom right"]
export default {
    slots: {
        root: "relative flex flex-row items-center justify-center rounded-xl overflow-hidden",
        error: "absolute h-full w-full bg-gray-2 dark:bg-gray-7  flex flex-col items-center justify-center",
        errorIcon: "text-gray-4  size-8 icon-[lucide--image-off]",
        loading: "absolute h-full w-full bg-gray-2 dark:bg-gray-7  flex flex-col items-center justify-center",
        loadingIcon: "text-gray-4 size-8 border-2 border-gray-3 border-t-blue-500 rounded-full animate-spin",
        inner: "w-full h-full",
    },
}

export { mode as imageMode }