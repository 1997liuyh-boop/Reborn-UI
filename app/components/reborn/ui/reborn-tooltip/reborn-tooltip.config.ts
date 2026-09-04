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

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface TooltipUI {
  /** 根节点（触发器外层容器），class prop 也并到这里 */
  wrapper?: string;
  /** 触发元素的外框 */
  trigger?: string;
  /** 浮层定位外壳（fixed 定位、层级） */
  contentWrapper?: string;
  /** 提示面板（底色、文字、内边距、圆角、最大宽度） */
  content?: string;
  /** 箭头（颜色随 text-* 类，与面板同色） */
  arrow?: string;
}
