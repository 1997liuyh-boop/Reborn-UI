/**
 * 缓动曲线常量
 * - EASE_ENTER: 更接近 slide-* 的丝滑滑入感
 * - EASE_LEAVE: 更自然的滑出/淡出收尾
 */
const EASE_ENTER = '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]';
const EASE_LEAVE = '[transition-timing-function:cubic-bezier(0.4,0,0.2,1)]';

export const transitionStyles: Record<string, Record<string, string>> = {
  fade: {
    enter: 'opacity-0',
    'enter-active': `transition-opacity ${EASE_ENTER}`,
    'enter-to': 'opacity-100',
    leave: 'opacity-100',
    'leave-active': `transition-opacity ${EASE_LEAVE}`,
    'leave-to': 'opacity-0',
  },
  'fade-up': {
    // 从上淡入淡出 (starts from top)
    enter: '-translate-y-8 opacity-0',
    'enter-active': `transition-[opacity,transform] ${EASE_ENTER}`,
    'enter-to': 'translate-y-0 opacity-100',
    leave: 'translate-y-0 opacity-100',
    'leave-active': `transition-[opacity,transform] ${EASE_LEAVE}`,
    'leave-to': '-translate-y-8 opacity-0',
  },
  'fade-down': {
    // 从下淡入淡出 (starts from bottom)
    enter: 'translate-y-8 opacity-0',
    'enter-active': `transition-[opacity,transform] ${EASE_ENTER}`,
    'enter-to': 'translate-y-0 opacity-100',
    leave: 'translate-y-0 opacity-100',
    'leave-active': `transition-[opacity,transform] ${EASE_LEAVE}`,
    'leave-to': 'translate-y-8 opacity-0',
  },
  'fade-left': {
    // 从左淡入淡出
    enter: '-translate-x-8 opacity-0',
    'enter-active': `transition-[opacity,transform] ${EASE_ENTER}`,
    'enter-to': 'translate-x-0 opacity-100',
    leave: 'translate-x-0 opacity-100',
    'leave-active': `transition-[opacity,transform] ${EASE_LEAVE}`,
    'leave-to': '-translate-x-8 opacity-0',
  },
  'fade-right': {
    // 从右淡入淡出
    enter: 'translate-x-8 opacity-0',
    'enter-active': `transition-[opacity,transform] ${EASE_ENTER}`,
    'enter-to': 'translate-x-0 opacity-100',
    leave: 'translate-x-0 opacity-100',
    'leave-active': `transition-[opacity,transform] ${EASE_LEAVE}`,
    'leave-to': 'translate-x-8 opacity-0',
  },
  'slide-up': {
    enter: 'translate-y-full',
    'enter-active': `transition-transform ${EASE_ENTER}`,
    'enter-to': 'translate-y-0',
    leave: 'translate-y-0',
    'leave-active': `transition-transform ${EASE_LEAVE}`,
    'leave-to': 'translate-y-full',
  },
  'slide-right': {
    enter: 'translate-x-[100%]',
    'enter-active': `transition-transform ${EASE_ENTER}`,
    'enter-to': 'translate-x-0',
    leave: 'translate-x-0',
    'leave-active': `transition-transform ${EASE_LEAVE}`,
    'leave-to': 'translate-x-[100%]',
  },
  'slide-down': {
    enter: '-translate-y-[100%]',
    'enter-active': `transition-transform ${EASE_ENTER}`,
    'enter-to': 'translate-y-0',
    leave: 'translate-y-0',
    'leave-active': `transition-transform ${EASE_LEAVE}`,
    'leave-to': '-translate-y-[100%]',
  },
  'slide-left': {
    enter: '-translate-x-[100%]',
    'enter-active': `transition-transform ${EASE_ENTER}`,
    'enter-to': 'translate-x-0',
    leave: 'translate-x-0',
    'leave-active': `transition-transform ${EASE_LEAVE}`,
    'leave-to': '-translate-x-[100%]',
  },
  'zoom-in': {
    // 缩入 (从 0.95 放大到 1，关闭时缩小到 0.92)
    enter: 'opacity-0 scale-95',
    'enter-active': `transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]`,
    'enter-to': 'opacity-100 scale-100',
    leave: 'opacity-100 scale-100',
    'leave-active': `transition-[opacity,transform] duration-250 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]`,
    'leave-to': 'opacity-0 scale-95',
  },
  'zoom-out': {
    // 缩出 (从 1.1 缩小到 1)
    enter: 'opacity-0 scale-110',
    'enter-active': `transition-[opacity,transform] ${EASE_ENTER}`,
    'enter-to': 'opacity-100 scale-100',
    leave: 'opacity-100 scale-100',
    'leave-active': `transition-[opacity,transform] ${EASE_LEAVE}`,
    'leave-to': 'opacity-0 scale-110',
  },
  'zoom': {
    // 标准缩放 (入场放大，离场放大消失)
    enter: 'opacity-0 scale-95',
    'enter-active': `transition-[opacity,transform] ${EASE_ENTER}`,
    'enter-to': 'opacity-100 scale-100',
    leave: 'opacity-100 scale-100',
    'leave-active': `transition-[opacity,transform] ${EASE_LEAVE}`,
    'leave-to': 'opacity-0 scale-105',
  },
  'badge-custom': {
    // 徽章进出场：缩放 + 淡出。刻意用 v4 的原生 scale 属性而非 transform：
    // 容器自带 transform-gpu 占用了 transform，rotateY 之类的任意 transform 类会被它覆盖；
    // 过渡属性也必须写 scale（transition-[opacity,transform] 动不了 scale 属性）
    enter: 'opacity-0 scale-50',
    'enter-active': `transition-[opacity,scale] ${EASE_ENTER}`,
    'enter-to': 'opacity-100 scale-100',
    leave: 'opacity-100 scale-100',
    'leave-active': `transition-[opacity,scale] ${EASE_LEAVE}`,
    'leave-to': 'opacity-0 scale-50',
  },
  'select-collapse': {
    enter: 'opacity-0',
    'enter-active': 'transition-[height,opacity] duration-300 ease-out overflow-hidden',
    'enter-to': 'opacity-100',
    leave: 'opacity-100',
    'leave-active': 'transition-[height,opacity] duration-200 ease-in overflow-hidden',
    'leave-to': 'opacity-0',
  },
};

export type TransitionName = keyof typeof transitionStyles;
