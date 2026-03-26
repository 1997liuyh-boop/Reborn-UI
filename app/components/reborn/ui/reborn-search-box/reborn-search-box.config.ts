/** 搜索框组件支持的尺寸变体 */
const sizes = ["sm", "md", "lg"] as const;

export { sizes as searchBoxSizes };

/** 
 * 各 size 对应的 RebornInput 内部 UI 覆盖配置 
 * 搜索框内部使用的输入框需要特殊的圆角和图标大小
 */
export const inputTheme = {
    slots: {
        wrapper: "",
        icon: "",
        iconBox: "",
    },
    variants: {
        size: {
            sm: { wrapper: "rounded-full! px-1!", icon: "!text-36", iconBox: "gap-4!" },
            md: { wrapper: "rounded-full! px-1!", icon: "!text-48", iconBox: "gap-6!" },
            lg: { wrapper: "rounded-full! px-1!", icon: "!text-48", iconBox: "gap-6!" },
        }
    }
} as const;

/** 
 * RebornSelect 内部 UI 覆盖配置 
 * 用于搜索框左侧的分类选择器，强制去除边框并限制文字宽度
 */
export const selectTheme = {
    slots: {
        trigger: "border-0! bg-transparent!",
        dropdown: "p-4! w-auto!",
        triggerText: "truncate w-[50px]",
    }
} as const;

/** RebornSearchBox 基础样式配置 */
export default {
    slots: {
        /** 最外层容器 */
        wrapper: "relative",
        /** 输入框及按钮包裹层 */
        inputWrapper: "flex-1 transition-all p-1.5 z-20 rounded-full relative",
        /** 基础输入框样式 */
        input: "w-full bg-transparent border-none outline-none text-28 text-gray-4 dark:text-gray-1 placeholder:text-gray-5",
        /** 相机识别图标 */
        cameraIcon: "text-48 text-gray-5 cursor-pointer hover:text-gray-7/80 dark:hover:text-gray-2/80 transition-colors",

        // --- 下拿面板相关 ---
        /** 下拿面板外层容器 (负责动画过渡高度、透明度) */
        dropdownOuter: "absolute left-0 w-full overflow-hidden transition-[height,opacity] duration-300 ease-in-out z-10 pointer-events-none shadow-lg",
        /** 下拿面板内容区 (承载具体列表、样式背景) */
        dropdown: "left-0 w-full bg-white dark:bg-gray-9 border border-gray-1 dark:border-gray-8 rounded-b-2xl shadow-xl z-20 overflow-hidden py-4 px-4 flex flex-col gap-6 z-1",
        /** 功能区块 (如：最近搜索、联想列表) */
        section: "flex flex-col gap-3",
        /** 区块标题样式 */
        sectionTitle: "text-32 font-bold text-gray-8 dark:text-gray-6 flex items-center justify-between",
        /** 历史记录标签容器 */
        historyTags: "flex flex-wrap gap-2",
        /** 单条历史记录标签 */
        historyTag: "flex items-center gap-1 bg-gray-1 dark:bg-gray-8 px-3 py-1.5 rounded-full text-24 text-gray-7 dark:text-gray-2 cursor-pointer hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors",
        /** 历史记录删除图标 */
        deleteIcon: "text-20 text-gray-4 hover:text-error transition-colors",
        /** 清空全部按钮 */
        clearAll: "text-24 font-normal text-primary-500 cursor-pointer hover:underline",
        /** 联想列表容器 */
        associateList: "flex flex-col",
        /** 联想项 */
        associateItem: "flex items-center gap-3 py-3 px-2 cursor-pointer hover:bg-gray-1 dark:hover:bg-gray-8 rounded-ui-sm transition-colors text-28 text-gray-8 dark:text-gray-1",
        /** SKU 属性网格容器 */
        skuWrapper: "grid grid-cols-2 gap-4",
        /** SKU 属性单项 */
        skuItem: "flex flex-col gap-2 p-3 bg-gray-1 dark:bg-gray-8 rounded-ui-md cursor-pointer hover:border-primary transition-all border border-transparent",
        /** SKU 属性名 */
        skuLabel: "text-24 text-gray-5",
        /** SKU 属性值 */
        skuValue: "text-28 font-medium truncate",

        // --- 内部组件及辅助槽位 ---
        /** 选择器与输入框之间的连结包裹 */
        leadingWrapper: "flex items-center",
        /** 后置元素包裹层 */
        trailingWrapper: "flex gap-6 items-center",
        /** 垂直分隔线 */
        separator: "mx-6 bg-[#D3D2D9]!",
        /** 搜索按钮内的图标 */
        searchIconInner: "size-5",
    },
    variants: {
        size: {
            sm: {
                cameraIcon: "text-24",
                input: "text-24 px-spacing-input-px-sm",
                dropdown: "py-3 px-3 gap-4",
                sectionTitle: "text-20",
                historyTag: "text-20 px-2.5 py-1",
                associateItem: "text-24 py-2.5",
                searchIconInner: "size-4",
            },
            md: {
                input: "px-spacing-input-px-md",
            },
            lg: {
                input: "text-32 px-spacing-input-px-lg",
                searchIconInner: "size-6",
            },
        },
        /** 下拉面板展开状态下的背景切换 */
        expanded: {
            true: {
                inputWrapper: "bg-white",
                input: "bg-[#F7F7F9]",
            },
            false: {
                inputWrapper: "bg-[#F7F7F9]",
            },
        },
    },

    defaultVariants: {
        size: "md",
        expanded: false,
    },
} as const;





