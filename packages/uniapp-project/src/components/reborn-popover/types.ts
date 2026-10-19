import type { ExtractPropTypes, PropType } from 'vue'

/** 气泡方位：「方向-对齐」写法，与 Web 端及 reborn-popconfirm、reborn-tooltip 的 placement 完全一致 */
export type PopoverPlacement =
    | 'top' | 'top-start' | 'top-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end'
    | 'right' | 'right-start' | 'right-end'

/** 旧的定位对象写法，等价于 placement + sideOffset，仅为兼容保留 */
export interface PopoverContentProps {
    /** Popover 相对于触发器的显示位置 */
    side?: 'top' | 'right' | 'bottom' | 'left'
    /** Popover 沿触发器轴线的对齐方式 */
    align?: 'start' | 'center' | 'end'
    /** Popover 与触发器之间的间距 */
    sideOffset?: number
}

export const popoverProps = {
    /** 出现方向与对齐方式，未传时回落到 content，都没有则为 bottom */
    placement: {
        type: String as PropType<PopoverPlacement>,
        default: undefined
    },
    /** 气泡与触发器之间的间距（px），未传时回落到 content.sideOffset，都没有则为 0 */
    sideOffset: {
        type: Number,
        default: undefined
    },
    /** 旧的定位对象写法（side / align / sideOffset），等价于 placement + sideOffset；已废弃，请改用 placement / sideOffset */
    content: {
        type: Object as PropType<PopoverContentProps>,
        default: () => ({ side: 'bottom', align: 'center', sideOffset: 0 })
    },
    /** 是否显示箭头 */
    arrow: {
        type: Boolean,
        default: true
    },
    /** 是否将 Popover 渲染到指定的 DOM 节点 (对于 UniApp 意义不大，保留作 API 一致性) */
    portal: {
        type: [Boolean, String] as PropType<boolean | string>,
        default: false
    },
    /** 点击外部时是否关闭 Popover */
    dismissible: {
        type: Boolean,
        default: true
    },
    /** 受控显示状态 */
    open: {
        type: Boolean,
        default: false
    },
    /** 非受控默认显示状态 */
    defaultOpen: {
        type: Boolean,
        default: false
    },
    /** 是否显示遮罩层并捕获焦点 */
    modal: {
        type: Boolean,
        default: false
    },
    /** 延迟打开时间 (ms) - 适用于 hover 模式 */
    openDelay: {
        type: Number,
        default: 0
    },
    /** 延迟关闭时间 (ms) - 适用于 hover 模式，防止意外关闭 */
    closeDelay: {
        type: Number,
        default: 0
    },
    /** 额外的类名 */
    customClass: {
        type: [String, Object, Array] as PropType<any>,
        default: ''
    },
    /** UI 覆盖配置 */
    ui: {
        type: Object as PropType<any>,
        default: () => ({})
    },
    // 以下为针对 uni-app 扩展的特有属性
    /**
     * 是否禁用 popover
     */
    disabled: {
        type: Boolean,
        default: false
    },
    /**
     * 显示的内容，可以通过 prop 也可以通过 slot 传入
     */
    title: {
        type: [String, Object] as PropType<string | Record<string, any>[]>,
        default: ''
    },
    /**
     * 是否使用 content 插槽自定义气泡内容；组件内部会按是否传入 content 插槽自动判定，通常无需手动设置
     */
    useContentSlot: {
        type: Boolean,
        default: true
    },
    /**
     * 内容展示模式：normal 直接渲染 title 文本，menu 将 title 数组渲染为可点击的菜单列表（点击项触发 menuclick）
     */
    displayMode: {
        type: String as PropType<'normal' | 'menu'>,
        default: 'normal'
    }
}

export type PopoverProps = ExtractPropTypes<typeof popoverProps>

export interface PopoverExpose {
    open: () => void
    close: () => void
}
