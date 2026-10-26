
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

export interface PopoverProps {
  placement?: PopoverPlacement
  sideOffset?: number
  content?: PopoverContentProps
  arrow?: boolean
  portal?: boolean | string
  dismissible?: boolean
  defaultOpen?: boolean
  modal?: boolean
  openDelay?: number
  closeDelay?: number
  customClass?: any
  ui?: any
  disabled?: boolean
  title?: string | Record<string, any>[]
  displayMode?: 'normal' | 'menu'
}

export interface PopoverExpose {
    open: () => void
    close: () => void
}
