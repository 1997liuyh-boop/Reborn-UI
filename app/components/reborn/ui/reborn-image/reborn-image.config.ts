const mode = ["scaleToFill", "aspectFit", "aspectFill", "widthFix", "heightFix", "top", "bottom", "center", "left", "right", "top left", "top right", "bottom left", "bottom right"]

/**
 * 预览菜单可用的按钮 token，即 viewerjs 自带的全部工具栏功能；
 * 唯一改名的是 fullscreen：它对应 viewerjs 的 play，进入播放模式并请求浏览器全屏。
 */
const previewToolbarTokens = ["fullscreen", "zoomIn", "zoomOut", "oneToOne", "reset", "prev", "next", "rotateLeft", "rotateRight", "flipHorizontal", "flipVertical"] as const

/** 预览菜单默认的按钮与顺序 */
const defaultPreviewToolbar = "fullscreen, rotateRight, rotateLeft, zoomIn, zoomOut, oneToOne"

/**
 * 菜单按钮的图标类名与无障碍文案。图标走 @iconify/tailwind4 的 icon-[lucide--zoom-in] 工具类：
 * 菜单是在 viewerjs 的 DOM 里用原生节点创建的，挂不了 <Icon> 组件；
 * 这些类名写成字面量放在这里，Tailwind 才能扫描到并生成样式。
 * oneToOne 没有贴切的图标，沿用 viewerjs 的做法直接显示「1:1」文字。
 */
const previewToolbarMeta: Record<(typeof previewToolbarTokens)[number], { label: string; icon?: string; text?: string }> = {
    fullscreen: { label: "全屏", icon: "icon-[lucide--maximize]" },
    zoomIn: { label: "放大", icon: "icon-[lucide--zoom-in]" },
    zoomOut: { label: "缩小", icon: "icon-[lucide--zoom-out]" },
    oneToOne: { label: "1:1", text: "1:1" },
    reset: { label: "重置", icon: "icon-[lucide--refresh-ccw]" },
    prev: { label: "上一张", icon: "icon-[lucide--chevron-left]" },
    next: { label: "下一张", icon: "icon-[lucide--chevron-right]" },
    rotateLeft: { label: "逆时针旋转 90°", icon: "icon-[lucide--rotate-ccw-square]" },
    rotateRight: { label: "顺时针旋转 90°", icon: "icon-[lucide--rotate-cw-square]" },
    flipHorizontal: { label: "水平翻转", icon: "icon-[lucide--flip-horizontal-2]" },
    flipVertical: { label: "垂直翻转", icon: "icon-[lucide--flip-vertical-2]" },
}

/** 两侧切换箭头的图标 */
const previewArrowIcons = {
    prev: "icon-[lucide--chevron-left]",
    next: "icon-[lucide--chevron-right]",
}

export default {
    slots: {
        /** 默认不带圆角，与 uniapp 端一致；需要圆角时经 customClass 或 ui.root 传入 */
        root: "relative flex flex-row items-center justify-center overflow-hidden",
        error: "absolute h-full w-full bg-gray-2 flex flex-col items-center justify-center",
        errorIcon: "text-gray-4 size-8 icon-[lucide--image-off]",
        loading: "absolute h-full w-full bg-gray-2 flex flex-col items-center justify-center",
        loadingIcon: "text-gray-4 size-8 border-2 border-gray-3 border-t-primary rounded-full animate-spin",
        inner: "w-full h-full",
        magnifierLens: "absolute bg-black/30 border border-white/20 pointer-events-none z-10 rounded-lg backdrop-blur-[2px]",
        magnifierView: "absolute top-0 left-[calc(100%+16px)] border border-gray-3 bg-gray-1 shadow-2xl overflow-hidden pointer-events-none z-50 rounded-xl",
        magnifierViewImage: "absolute max-w-none origin-top-left",
        /**
         * 预览菜单栏：插在 viewerjs 底部区域的标题与缩略图条之间。
         * 用块级 flex + w-fit + mx-auto 居中而不是 inline-flex：viewerjs 的标题是 inline-block，
         * 菜单若也是行内元素会和标题挤在同一行。
         * mb-6（24px）与两侧箭头离屏幕边缘的距离一致：缩略图列表默认隐藏，菜单就是底部区域的最后一块，
         * 太小会贴着屏幕底边；开启缩略图列表时，它是菜单与缩略图之间的间距。
         */
        previewToolbar: "mx-auto mb-6 flex w-fit items-center gap-4 rounded-lg bg-gray-1 px-10 py-2",
        /** 菜单按钮：图标继承按钮的文字色，hover / 按下时一起转为主题色 */
        previewAction: "flex size-14 cursor-pointer items-center justify-center rounded-lg text-gray-8 transition-colors hover:bg-gray-2 hover:text-primary active:bg-gray-2 active:text-primary focus-visible:outline-2 focus-visible:outline-primary",
        previewActionIcon: "size-6",
        /** oneToOne 按钮的「1:1」文字 */
        previewActionText: "text-base font-semibold",
        /**
         * 多图预览时遮罩两侧的切换箭头，相对预览容器垂直居中。
         * 不放进 viewerjs 的画布（canvas）：点画布会关闭预览，箭头必须在画布之外。
         */
        previewArrow: "absolute top-1/2 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-gray-1 text-gray-8 transition-colors hover:bg-gray-2 hover:text-primary active:bg-gray-2 active:text-primary focus-visible:outline-2 focus-visible:outline-primary",
        previewArrowIcon: "size-6",
    },
    variants: {
        /** 箭头左右各一，只有定位不同 */
        arrowSide: {
            prev: { previewArrow: "left-6" },
            next: { previewArrow: "right-6" },
        },
    },
}

export {
    defaultPreviewToolbar,
    mode as imageMode,
    previewArrowIcons,
    previewToolbarMeta,
    previewToolbarTokens,
}
