import type { ComputedRef, InjectionKey, PropType, Ref, VNode } from 'vue'
import type { SplitterLayout } from './reborn-splitter.config'
import { computed, defineComponent, provide } from 'vue'

/**
 * Splitter 下发给面板的上下文：只读状态 + 显式动作。
 * 面板不能直接改写父级的尺寸数组，所有尺寸变化都经由这里的动作，由 Splitter 负责补偿相邻面板、发出事件。
 */
export interface SplitterContext {
  /** 布局方向 */
  layout: ComputedRef<SplitterLayout>
  /** 是否正在拖拽 */
  isDragging: Readonly<Ref<boolean>>
  /** 在拖拽条上按下：barIndex 为拖拽条后面那个面板的下标 */
  startDrag: (barIndex: number, event: PointerEvent) => void
  /** 拖拽中的指针移动（拖拽条捕获了指针，事件都派发到拖拽条上） */
  moveDrag: (event: PointerEvent) => void
  /** 松开 / 取消指针，结束拖拽 */
  endDrag: (event: PointerEvent) => void
  /** 折叠或展开指定下标的面板 */
  toggleCollapse: (panelIndex: number) => void
  /** 外部改写某个面板的尺寸（百分比）：从相邻面板补偿，总和保持 100% */
  setPanelSize: (panelKey: string, size: number) => void
  /**
   * 面板登记尺寸变更通知：只在用户拖拽、折叠或 setPanelSize 补偿后调用，用于发出 update:size。
   * 返回注销函数
   */
  onPanelResize: (panelKey: string, notify: (size: number) => void) => () => void
  /** 面板卸载时调用：若正在拖拽它的拖拽条，结束拖拽并恢复页面样式 */
  releasePanel: (panelKey: string) => void
}

/** 面板在 Splitter 中的位置与尺寸，每次渲染由 Splitter 直接提供 */
export interface SplitterPanelPosition {
  /** 面板下标（按插槽顺序） */
  index: ComputedRef<number>
  /** 面板总数 */
  count: ComputedRef<number>
  /** 面板的稳定标识：按插槽结构路径生成，面板增删时其余面板的标识不变 */
  key: ComputedRef<string>
  /** 当前尺寸（百分比） */
  size: ComputedRef<number>
  /** 本面板是否已折叠 */
  collapsed: ComputedRef<boolean>
  /** 后一个面板是否已折叠 */
  nextCollapsed: ComputedRef<boolean>
  /** 后一个面板是否允许调整大小 */
  nextResizable: ComputedRef<boolean>
}

export const splitterContextKey: InjectionKey<SplitterContext> = Symbol('reborn-splitter')
/** 面板位置只给 Splitter 的直接子面板：Scope 提供，面板自身再以 null 覆盖，阻止内容里嵌套的面板拿到它 */
export const splitterPanelPositionKey: InjectionKey<SplitterPanelPosition | null> = Symbol('reborn-splitter-panel-position')

/**
 * 每次渲染直接给面板提供位置与尺寸，不依赖挂载登记：
 * 服务端首屏与客户端用同一份由插槽推导出的结果，动态增删面板后下标也随插槽顺序即时更新。
 * 此组件不产生 DOM 包裹，面板的 ref、插槽与组件实例语义不变。
 */
export const SplitterPanelScope = defineComponent({
  name: 'RebornSplitterPanelScope',
  inheritAttrs: false,
  props: {
    index: { type: Number, required: true },
    count: { type: Number, required: true },
    panelKey: { type: String, required: true },
    size: { type: Number, required: true },
    collapsed: { type: Boolean, required: true },
    nextCollapsed: { type: Boolean, required: true },
    nextResizable: { type: Boolean, required: true },
    node: { type: Object as PropType<VNode>, required: true },
  },
  setup(props) {
    provide(splitterPanelPositionKey, {
      index: computed(() => props.index),
      count: computed(() => props.count),
      key: computed(() => props.panelKey),
      size: computed(() => props.size),
      collapsed: computed(() => props.collapsed),
      nextCollapsed: computed(() => props.nextCollapsed),
      nextResizable: computed(() => props.nextResizable),
    })
    return () => props.node
  },
})

/** 把 size / min / max 的字符串写法（如 '30%'）解析为数字；数字原样返回 */
export function parseSizeValue(value: string | number): number {
  return typeof value === 'string' ? Number.parseFloat(value) : value
}
