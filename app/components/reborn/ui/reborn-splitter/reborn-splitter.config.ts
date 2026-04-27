import type { ClassValue } from 'clsx'

/**
 * Splitter 分隔面板配置
 */
export const splitterLayouts = ['horizontal', 'vertical'] as const
export type SplitterLayout = typeof splitterLayouts[number]

export default {
  slots: {
    root: 'relative flex w-full h-full overflow-hidden select-none',
    panel: 'relative flex shrink-0 hover:z-50',
    bar: 'relative flex items-center justify-center shrink-0 bg-gray-200 hover:bg-primary-500 transition-colors select-none z-20',
    collapseButton: 'absolute flex items-center justify-center size-5 rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 opacity-20 group-hover:opacity-100 transition-opacity z-30 cursor-pointer'
  },
  variants: {
    layout: {
      horizontal: {
        root: 'flex-row',
        panel: 'flex-row h-full',
        bar: 'w-[2px] h-full cursor-col-resize',
      },
      vertical: {
        root: 'flex-col',
        panel: 'flex-col w-full',
        bar: 'h-[2px] w-full cursor-row-resize',
      }
    },
    isDragging: {
      true: {
        root: 'pointer-events-none', // 拖拽时禁用根部交互，通过 document 监听
        bar: 'bg-primary-500'
      },
      false: {}
    },
    resizable: {
      true: {},
      false: {
        bar: 'cursor-default hover:bg-gray-200'
      }
    },
    collapsible: {
      true: {
        bar: 'group'
      },
      false: {}
    }
  },
  defaultVariants: {
    layout: 'horizontal',
    resizable: true,
    collapsible: false
  }
} as const

export type SplitterUI = {
  root: (props?: { class?: ClassValue }) => string
  panel: (props?: { class?: ClassValue }) => string
  bar: (props?: { class?: ClassValue }) => string
  collapseButton: (props?: { class?: ClassValue }) => string
}