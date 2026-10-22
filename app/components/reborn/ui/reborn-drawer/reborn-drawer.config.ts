import type { ClassValue } from 'clsx';

export type DrawerDirection = 'top' | 'right' | 'bottom' | 'left';
export interface DrawerUI {
  wrapper?: ClassValue;
  backdrop?: ClassValue;
  root?: ClassValue;
  header?: ClassValue;
  heading?: ClassValue;
  title?: ClassValue;
  close?: ClassValue;
  extra?: ClassValue;
  body?: ClassValue;
  /** 浮层滚动条根节点（RebornScrollbar） */
  scrollbar?: ClassValue;
  /** 浮层滚动条内部的滚动层 */
  scrollbarWrap?: ClassValue;
  footer?: ClassValue;
  resizer?: ClassValue;
}

export default {
  slots: {
    wrapper: 'pointer-events-none inset-0 overflow-hidden',
    backdrop: 'pointer-events-auto absolute inset-0',
    // 位移交给 Motion，尺寸拖动保持即时响应。
    root: 'pointer-events-auto absolute flex max-h-full max-w-full flex-col bg-white text-base text-gray-9 shadow-xl outline-none dark:bg-gray-1',
    header: 'flex shrink-0 items-center justify-between gap-4 px-6 py-4',
    heading: 'flex min-w-0 items-center gap-3',
    title: 'min-w-0 break-words text-lg text-gray-10',
    close: 'flex size-5 shrink-0 cursor-pointer items-center justify-center text-gray-6 transition-colors hover:text-gray-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    extra: 'flex shrink-0 items-center gap-2',
    /**
     * 正文不用原生 overflow-auto：Windows 等平台的原生滚动条在内容溢出时常驻显示，
     * 改由 RebornScrollbar 承担滚动，悬停或滚动时淡入、停止后隐藏。
     * scrollbar → scrollbarWrap 逐层 flex-1 + min-h-0 占满页头页脚之间的高度；
     * body 是滚动层里的内容节点，内边距随内容一起滚动，min-h-full 保证内容不足时仍铺满可视区域。
     * 需要正文固定为可视高度、由内部元素自行滚动的布局，给 body 加 h-full 与 overflow-hidden
     */
    body: 'min-h-full p-6',
    scrollbar: 'flex min-h-0 flex-1 flex-col',
    scrollbarWrap: 'h-auto min-h-0 flex-1',
    footer: 'shrink-0 px-6 py-4',
    resizer: 'absolute z-10 touch-none select-none focus-visible:bg-primary/20 focus-visible:outline-none',
  },
  variants: {
    direction: {
      right: { root: 'inset-y-0 right-0', resizer: 'inset-y-0 left-0 w-1 cursor-col-resize' },
      left: { root: 'inset-y-0 left-0', resizer: 'inset-y-0 right-0 w-1 cursor-col-resize' },
      top: { root: 'inset-x-0 top-0', resizer: 'inset-x-0 bottom-0 h-1 cursor-row-resize' },
      bottom: { root: 'inset-x-0 bottom-0', resizer: 'inset-x-0 top-0 h-1 cursor-row-resize' },
    },
    viewport: { true: { wrapper: 'fixed' }, false: { wrapper: 'absolute' } },
    modal: { true: { backdrop: 'bg-black/50' }, false: { backdrop: 'bg-transparent' } },
  },
  defaultVariants: { direction: 'right', viewport: true, modal: true },
} as const;

/** 进退场共用同一边缘位移，避免左右方向命名与动画实际方向相反。 */
export const drawerOffsets: Record<DrawerDirection, string> = {
  right: 'translate-x-full', left: '-translate-x-full', top: '-translate-y-full', bottom: 'translate-y-full',
};
