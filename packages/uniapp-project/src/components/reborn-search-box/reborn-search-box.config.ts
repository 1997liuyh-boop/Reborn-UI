const sizes = ['sm', 'md', 'lg'] as const;
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;

export { sizes as searchBoxSizes, colors as searchBoxColors };

/** 各 size 对应的 RebornInput 内部 ui 覆盖配置 (UniApp 2x 比例) */
export const searchBoxInputUi: Record<typeof sizes[number], { wrapper: string; icon: string; iconBox: string }> = {
    sm: { wrapper: "rounded-full!", icon: "!text-36", iconBox: "gap-8!" },
    md: { wrapper: "rounded-full!", icon: "!text-48", iconBox: "gap-12!" },
    lg: { wrapper: "rounded-full!", icon: "!text-48", iconBox: "gap-12!" },
};

export default {
    slots: {
        wrapper: "relative",
        inputWrapper: "flex-1 transition-all rounded-full relative",
        input: "w-full bg-transparent border-none outline-none text-28 text-gray-8 dark:text-gray-1 placeholder:text-gray-5",
        trailing: "flex flex-row items-center gap-12",
        cameraIcon: "text-48 text-gray-5 cursor-pointer hover:text-gray-7/80 dark:hover:text-gray-2/80 transition-colors",
        searchButton: "flex flex-row items-center justify-center text-white rounded-ui-md transition-all active:scale-95 hover:brightness-110 shadow-sm",
        searchIcon: "text-48",
        separator: "h-12 w-[1px] bg-[#D3D2D9]",
        // 下拉面板外层容器
        dropdownOuter: "absolute left-0 w-full overflow-hidden transition-[height,opacity] duration-300 ease-in-out z-10 pointer-events-none shadow-lg",
        // 下拉面板内容区
        dropdown: "left-0 w-full bg-white dark:bg-gray-9 border border-gray-2 dark:border-gray-8 rounded-b-32 shadow-xl z-50 overflow-hidden py-16 px-16 flex flex-col gap-24 z-1",
        section: "flex flex-col gap-12",
        sectionTitle: "text-24 font-bold text-gray-4 dark:text-gray-6 flex flex-row items-center justify-between",
        historyTags: "flex flex-row flex-wrap gap-12",
        historyTag: "flex flex-row items-center gap-4 bg-gray-1 dark:bg-gray-8 px-12 py-6 rounded-full text-24 text-gray-7 dark:text-gray-2 cursor-pointer hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors",
        deleteIcon: "text-20 text-gray-4 hover:text-red transition-colors ml-4",
        clearAll: "text-24 font-normal text-primary-500 cursor-pointer hover:underline",
        associateList: "flex flex-col",
        associateItem: "flex flex-row items-center gap-12 py-12 px-8 cursor-pointer hover:bg-gray-1 dark:hover:bg-gray-8 rounded-8 transition-colors text-28 text-gray-8 dark:text-gray-1",
        skuWrapper: "grid grid-cols-2 gap-16",
        skuItem: "flex flex-col gap-8 p-12 bg-gray-1 dark:bg-gray-8 rounded-12 cursor-pointer hover:border-primary transition-all border border-transparent",
        skuLabel: "text-24 text-gray-5",
        skuValue: "text-28 font-medium truncate",
        // 翻译切换按钮外层容器
        translateWrapper: "relative h-[80rpx] w-[82rpx] flex items-center justify-center pointer-events-auto",
        // 翻译切换卡片基础样式（位置由各卡片内联定义）
        translateCardBase: "absolute flex h-[46rpx] w-[46rpx] items-center justify-center rounded-ui-md border border-[2px] text-[22rpx] font-bold transition-all duration-300 pointer-events-none",
        // 激活卡片样式（颜色部分由 color variant 覆盖）
        translateCardActive: "z-10 bg-white shadow-sm border-primary text-primary",
        // 非激活卡片样式（固定灰色，不随 color 变化）
        translateCardInactive: "z-0 border-gray-200 bg-[#f8f9fa] text-gray-400",
    },
    variants: {
        size: {
            sm: {
                searchButton: "size-64 rounded-ui-sm",
                searchIcon: "text-24",
                cameraIcon: "text-28",
                input: "text-24",
                dropdown: "py-12 px-12 gap-16",
                sectionTitle: "text-20",
                historyTag: "text-20 px-10 py-4",
                associateItem: "text-24 py-10",
            },
            md: {
                searchButton: "size-80",
            },
            lg: {
                searchButton: "size-96 rounded-ui-md",
                searchIcon: "text-40",
                input: "text-32",
            },
        },
        expanded: {
            true: {
                inputWrapper: "bg-white",
                input: "bg-[#F7F7F9]",
            },
            false: {
                inputWrapper: "bg-[#F7F7F9]",
            },
        },
        color: {
            primary: {
                searchButton: "bg-primary",
                translateCardActive: "z-10 bg-white shadow-sm border-primary text-primary",
            },
            secondary: {
                searchButton: "bg-secondary",
                translateCardActive: "z-10 bg-white shadow-sm border-secondary text-secondary",
            },
            success: {
                searchButton: "bg-success",
                translateCardActive: "z-10 bg-white shadow-sm border-success text-success",
            },
            info: {
                searchButton: "bg-info",
                translateCardActive: "z-10 bg-white shadow-sm border-info text-info",
            },
            warning: {
                searchButton: "bg-warning",
                translateCardActive: "z-10 bg-white shadow-sm border-warning text-warning",
            },
            error: {
                searchButton: "bg-error",
                translateCardActive: "z-10 bg-white shadow-sm border-error text-error",
            },
            neutral: {
                searchButton: "bg-neutral",
                translateCardActive: "z-10 bg-white shadow-sm border-neutral text-neutral",
            },
        },
    },
    defaultVariants: {
        size: "md",
        expanded: false,
        color: "primary",
    },
} as const;
