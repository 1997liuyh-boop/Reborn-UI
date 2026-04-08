/** 搜索框组件支持的尺寸变体 */
const sizes = ["sm", "md", "lg"] as const;

export { sizes as searchBoxSizes };

/** 
 * 各 size 对应的 RebornInput 内部 UI 覆盖配置 
 * 搜索框内部使用的输入框需要特殊的圆角和图标大小
 */
export const inputTheme = {
    slots: {
        wrapper: "h-[36px]!",
        icon: "",
        iconBox: "",
    },
    variants: {
        size: {
            sm: { wrapper: "rounded-full! px-1!", icon: "!text-title-lg", iconBox: "gap-4!" },
            md: { wrapper: "rounded-full! px-1!", icon: "!text-title-2xl", iconBox: "gap-6!" },
            lg: { wrapper: "rounded-full! px-1!", icon: "!text-title-2xl", iconBox: "gap-6!" },
        }
    }
} as const;

/** 
 * RebornSelect 内部 UI 覆盖配置 
 * 用于搜索框左侧的分类选择器，强制去除边框并限制文字宽度
 */
/** 
 * RebornSelect 内部触发器 UI 覆盖配置 
 */
export const selectTriggerTheme = {
    slots: {
        wrapper: "h-full!",
        trigger: "border-0! bg-transparent! h-full! overflow-hidden",
        dropdown: "min-w-30!",
        triggerText: "min-w-15 truncate text-gray-9 dark:text-gray-2",
    }
} as const;

/** 
 * RebornSelect 内部组件 UI 覆盖配置 
 */
export const selectUiTheme = {
    slots: {
        dropdown: "w-auto!",
    }
} as const;

/** RebornSearchBox 基础样式配置 */
export default {
    slots: {
        /** 最外层容器 */
        wrapper: "relative z-10",
        /** 输入框及按钮包裹层 */
        inputWrapper: "flex-1 transition-all p-1.5 z-20 rounded-full relative",
        /** 基础输入框样式 */
        input: "w-full bg-transparent border-none outline-none text-body-base text-gray-4 dark:text-gray-1 placeholder:text-gray-7",
        /** 相机识别图标 */
        cameraIcon: "text-title-2xl text-gray-5 cursor-pointer hover:text-gray-7/80 dark:hover:text-gray-2/80 transition-colors",

        // --- 下拿面板相关 ---
        /** 下拿面板外层容器 (负责动画过渡高度、透明度) */
        dropdownOuter: "absolute left-0 w-full overflow-hidden transition-[height,opacity] duration-300 ease-in-out z-10 pointer-events-none drop-shadow-lg",
        /** 下拿面板内容区 (承载具体列表、样式背景) */
        dropdown: "left-0 w-full bg-white dark:bg-gray-9 border border-gray-1 dark:border-gray-8 rounded-b-2xl drop-shadow-xl z-20 overflow-hidden py-4 px-5 flex flex-col gap-6 z-1",
        /** 功能区块 (如：最近搜索、联想列表) */
        section: "flex flex-col gap-3",
        /** 区块标题样式 */
        sectionTitle: "text-title-md font-bold text-gray-8 dark:text-gray-1 flex items-center justify-between",
        /** 历史记录标签容器 */
        historyTags: "flex flex-wrap gap-2",
        /** 单条历史记录标签 */
        historyTag: "flex items-center gap-1 bg-gray-1 dark:bg-gray-8 px-3 py-1.5 rounded-full text-caption-lg text-gray-7 dark:text-gray-2 cursor-pointer hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors",
        /** 历史记录删除图标 */
        deleteIcon: "text-caption-sm text-gray-4 hover:text-error transition-colors",
        /** 清空全部按钮 */
        clearAll: "text-body-base font-normal text-gray-5 cursor-pointer hover:underline flex items-center gap-1",
        /** 联想列表容器 */
        associateList: "flex flex-col",
        /** 联想项 */
        associateItem: "flex items-center gap-3 py-3 px-2 cursor-pointer hover:bg-gray-1 dark:hover:bg-gray-8 rounded-ui-sm transition-colors text-body-base text-gray-8 dark:text-gray-1",
        // --- 内部组件及辅助槽位 ---
        /** 选择器与输入框之间的连结包裹 */
        leadingWrapper: "flex items-center h-full",
        /** 后置元素包裹层 */
        trailingWrapper: "flex gap-6 items-center",
        /** 垂直分隔线 */
        separator: "mr-6 ml-3 bg-[#D3D2D9]!",
        /** 搜索按钮内的图标 */
        searchIconInner: "size-5",
        /** 历史记录为空时的提示文字 */
        emptyText: "text-sm text-gray-4 py-2",
        /** 推荐搜索列表中的图标 */
        recommendIcon: "size-4 text-gray-4 shrink-0",
        /** 左侧选择器触发文字样式 */
        selectTriggerText: "",
    },
    variants: {
        // size: {
        //     sm: {
        //         cameraIcon: "text-caption-lg",
        //         input: "text-caption-lg px-spacing-input-px-sm",
        //         dropdown: "py-3 px-3 gap-4",
        //         sectionTitle: "text-caption-sm",
        //         historyTag: "text-caption-sm px-2.5 py-1",
        //         associateItem: "text-caption-lg py-2.5",
        //         searchIconInner: "size-4",
        //     },
        //     md: {
        //         input: "px-spacing-input-px-md",
        //     },
        //     lg: {
        //         input: "text-title-md px-spacing-input-px-lg",
        //         searchIconInner: "size-6",
        //     },
        // },
        /** 下拉面板展开状态下的背景切换 */
        expanded: {
            true: {
                inputWrapper: "bg-white dark:bg-gray-8  shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]",
                input: "bg-[#F7F7F9]",
            },
            false: {
                inputWrapper: "bg-[#F7F7F9] dark:bg-gray-8",
            },
        },
    },

    defaultVariants: {
        size: "md",
        expanded: false,
    },
} as const;





