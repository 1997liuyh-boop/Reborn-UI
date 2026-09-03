import { tv } from '~/lib/tv';

/*
 * 视觉规格来自 MasterGo 设计稿（组件 156 / layer 37:053141）：
 * 面板底色 gray-10（token 中性色_index_1/gray-10）、白字 14px/150%、padding 8px、
 * 圆角 8px、宽度上限 240px；箭头为 7×18 的圆头曲线，与面板同色实色填充，
 * 底边与面板边缘无缝相接（箭头 SVG 用 fill=currentColor，由 text-* 类控制同色）。
 * 深浅模式取色走 gray 令牌的对偶：暗色主题下 gray-10 即白色，自然反色为浅底深字。
 * 需要别的底色用 color prop（面板与箭头同步着色）。
 */
export const rebornTooltip = tv({
  slots: {
    wrapper: '',
    trigger: 'inline-flex max-w-full',
    contentWrapper: 'fixed left-0 top-0 z-[9999] pointer-events-none flex',
    content:
      'relative inline-flex max-w-60 items-center p-2 text-base leading-[1.5] rounded-ui-sm whitespace-pre-line break-words bg-gray-10 text-gray-1',
    arrow: 'absolute text-gray-10',
  },
  variants: {
    side: {
      top: {
        content: 'origin-bottom',
      },
      bottom: {
        content: 'origin-top',
      },
      left: {
        content: 'origin-right',
      },
      right: {
        content: 'origin-left',
      },
    },
  },
  defaultVariants: {
    side: 'bottom',
  },
});
