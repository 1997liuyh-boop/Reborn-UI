export const fabDirections = ['top', 'bottom', 'left', 'right'] as const
export const fabPositions = ['left-top', 'right-top', 'left-bottom', 'right-bottom'] as const
export const fabColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

/** 由内层 v-for 渲染的动作项（推荐微信小程序使用，避免插槽穿透样式问题） */
export interface FabActionItem {
    /** 用于 @action 回传 */
    name: string
    /** 图标 class，如 i-lucide-share-2 */
    icon: string
    /** 面板按钮背景语义色 */
    color?: (typeof fabColors)[number]
    /** 跳过点击 */
    disabled?: boolean
}

export default {
    slots: {
        root: 'fixed pointer-events-none transition-all duration-300 ease-out',
        trigger: 'pointer-events-auto flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 duration-200',
        icon: 'text-white text-40',
        // flex/gap 放在内层容器；gap 在部分小程序端不可靠，间距由内层样式 + 子项 margin 实现
        actions: 'absolute pointer-events-none transition-all duration-300',
        /** 每项为组件内原生 view；类名 reborn-fab-action 用于展开态与间距选择器 */
        action: 'reborn-fab-action pointer-events-auto flex size-12 items-center justify-center rounded-full text-white shadow-md transition-transform duration-300 active:scale-95'
    },
    variants: {
        color: {
            primary: { trigger: 'bg-primary' },
            secondary: { trigger: 'bg-secondary' },
            success: { trigger: 'bg-success' },
            info: { trigger: 'bg-info' },
            warning: { trigger: 'bg-warning' },
            error: { trigger: 'bg-error' },
            neutral: { trigger: 'bg-neutral' }
        },
        size: {
            sm: {
                trigger: 'w-10 h-10',
                icon: 'text-32'
            },
            md: {
                trigger: 'w-12 h-12',
                icon: 'text-40'
            },
            lg: {
                trigger: 'w-14 h-14',
                icon: 'text-48'
            }
        },
        active: {
            true: {
                trigger: 'rotate-45'
            },
            false: {
                trigger: 'rotate-0'
            }
        }
    },
    defaultVariants: {
        color: 'primary' as (typeof fabColors)[number],
        size: 'md' as any,
        active: false
    }
}
