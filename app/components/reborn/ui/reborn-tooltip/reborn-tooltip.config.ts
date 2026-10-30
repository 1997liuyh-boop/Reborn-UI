import { floatingArrowSides } from "~/lib/floating-arrow";
import { tv } from '~/lib/tv';

/*
 * 视觉规格来自 MasterGo 设计稿（组件 156 / layer 37:053141）：
 * 面板底色 gray-10（token 中性色_index_1/gray-10）、白字 14px/150%、padding 8px、
 * 圆角 8px、宽度上限 240px；箭头参考 7×17.5 轮廓，以连续曲线衔接根部与圆润尖端，与面板同色实色填充，
 * 底边与面板边缘无缝相接，SVG 遮罩由 bg-* 类控制同色。
 * 深浅模式取色走 gray 令牌的对偶：暗色主题下 gray-10 即白色，自然反色为浅底深字。
 * 需要别的底色用 color prop（面板与箭头同步着色）。
 * 折行用 wrap-anywhere（overflow-wrap: anywhere）而非 break-words：面板是 inline-flex，
 * 文案是匿名 flex 子项，min-width:auto 取 min-content；break-word 的断点不计入 min-content，
 * 一长串无空格字符（URL、长文件名、连续符号）会把子项撑出面板，anywhere 才能让它收缩折行。
 */
export const rebornTooltip = tv({
  slots: {
    wrapper: '',
    trigger: 'inline-flex max-w-full',
    contentWrapper: 'fixed left-0 top-0 z-[9999] pointer-events-none flex',
    content:
      'relative inline-flex max-w-60 items-center p-2 text-base rounded-lg whitespace-pre-line wrap-anywhere bg-gray-10 text-gray-1',
    arrow: 'absolute pointer-events-none bg-gray-10 mask-no-repeat mask-size-[100%_100%]',
  },
  variants: {
    side: {
      top: {
        arrow: floatingArrowSides.top,
        content: 'origin-bottom',
      },
      bottom: {
        arrow: floatingArrowSides.bottom,
        content: 'origin-top',
      },
      left: {
        arrow: floatingArrowSides.left,
        content: 'origin-right',
      },
      right: {
        arrow: floatingArrowSides.right,
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
  /** 箭头（颜色随 bg-* 类，与面板同色） */
  arrow?: string;
}
