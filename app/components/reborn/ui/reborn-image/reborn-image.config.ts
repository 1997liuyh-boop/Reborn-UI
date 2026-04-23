const mode = ["scaleToFill", "aspectFit", "aspectFill", "widthFix", "heightFix", "top", "bottom", "center", "left", "right", "top left", "top right", "bottom left", "bottom right"]
export default {
    slots: {
        root: "relative flex flex-row items-center justify-center rounded-xl overflow-hidden",
        error: "absolute h-full w-full bg-gray-2 dark:bg-gray-7  flex flex-col items-center justify-center",
        errorIcon: "text-gray-4  size-8 icon-[lucide--image-off]",
        loading: "absolute h-full w-full bg-gray-2 dark:bg-gray-7  flex flex-col items-center justify-center",
        loadingIcon: "text-gray-4 size-8 border-2 border-gray-3 border-t-blue-500 rounded-full animate-spin",
        inner: "w-full h-full",
        magnifierLens: "absolute bg-black/30 border border-white/20 pointer-events-none z-10 rounded-lg backdrop-blur-[2px]",
        magnifierView: "absolute top-0 left-[calc(100%+16px)] border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden pointer-events-none z-50 rounded-xl",
        magnifierViewImage: "absolute max-w-none origin-top-left",
    },
}

export { mode as imageMode }