
export const CascaderSizes = ['sm', 'md', 'lg'] as const
export const CascaderColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export type CascaderSize = (typeof CascaderSizes)[number]
export type CascaderColor = (typeof CascaderColors)[number]

export interface CascaderUI {
    root?: string
    popup?: string
    tabs?: string
    tab?: string
    tabActive?: string
    list?: string
    item?: string
    itemActive?: string
    itemText?: string
    itemTextActive?: string
    footer?: string
    footerText?: string
    loading?: string
    loadingText?: string
}

// 选项接口定义
export interface CascaderOption {
    label: string
    value: string | number
    children?: CascaderOption[]
    [key: string]: any
}

export interface CascaderProps {
    /** 绑定值 */
    modelValue?: (string | number)[] | (string | number)[][]
    /** 选项数据 */
    options?: CascaderOption[]
    /** 标题 */
    title?: string
    /** 占位提示 */
    placeholder?: string
    /** 是否显示触发器 */
    showTrigger?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 标签字段 */
    labelKey?: string
    /** 值字段 */
    valueKey?: string
    /** 分隔符 */
    textSeparator?: string
    /** 列表高度 (rpx) */
    height?: number | string
    /** 尺寸 */
    size?: CascaderSize
    /** 颜色 */
    color?: CascaderColor
    /** 自定义类名 */
    customClass?: string
    /** 自定义样式 */
    customStyle?: string
    /** UI 覆盖 */
    ui?: CascaderUI
    /** 是否动态加载子节点 */
    lazy?: boolean
    /** 加载动态数据的方法 */
    lazyLoad?: (node: CascaderOption, resolve: (children: CascaderOption[]) => void, reject: () => void) => void
    /** 指定选项的子选项字段 */
    childrenKey?: string
    /** 查询次级菜单层级；为0时候查询所有 */
    leafLevel?: number
    /** 是否多选 */
    multiple?: boolean
    /** 是否显示省略号 */
    ellipsis?: boolean
    /** 省略号行数 */
    lines?: number
}

const config = {
    slots: {
        root: 'w-full',
        popup: 'bg-white dark:bg-slate-900 rounded-t-[32rpx] overflow-hidden',
        tabs: 'flex flex-row items-center border-b border-gray-100 dark:border-slate-800 p-2 gap-1.5 overflow-x-auto no-scrollbar',
        tab: 'shrink-0',
        tabActive: '',
        list: 'h-[600rpx]',
        item: 'flex flex-row items-center justify-between px-[32rpx] py-[24rpx] active:bg-gray-50 dark:active:bg-slate-800 transition-colors',
        itemActive: 'bg-primary/5 dark:bg-primary/10',
        itemText: 'text-[28rpx]',
        itemTextActive: 'text-primary font-medium',
        footer: 'flex flex-row items-center justify-between px-[32rpx] py-[24rpx] border-t border-gray-100 dark:border-slate-800',
        footerText: 'text-[24rpx] text-gray-500',
        loading: 'flex flex-col items-center justify-center h-full w-full',
        loadingText: 'mt-2 text-[24rpx] text-gray-400',
    },
    variants: {
        size: {
            sm: {
                item: 'px-[24rpx] py-[16rpx]',
                itemText: 'text-[24rpx]',
            },
            md: {
                item: 'px-[32rpx] py-[24rpx]',
                itemText: 'text-[28rpx]',
            },
            lg: {
                item: 'px-[40rpx] py-[32rpx]',
                itemText: 'text-[32rpx]',
            },
        },
        color: {
            primary: {
                itemTextActive: 'text-primary',
                itemActive: 'bg-primary/5',
            },
            secondary: {
                itemTextActive: 'text-secondary',
                itemActive: 'bg-secondary/5',
            },
            success: {
                itemTextActive: 'text-success',
                itemActive: 'bg-success/5',
            },
            info: {
                itemTextActive: 'text-info',
                itemActive: 'bg-info/5',
            },
            warning: {
                itemTextActive: 'text-warning',
                itemActive: 'bg-warning/5',
            },
            error: {
                itemTextActive: 'text-error',
                itemActive: 'bg-error/5',
            },
            neutral: {
                itemTextActive: 'text-slate-900 dark:text-white',
                itemActive: 'bg-slate-100 dark:bg-slate-800',
            },
        },
    },
    defaultVariants: {
        color: 'primary',
        size: 'md',
    },
} as const

export default config
