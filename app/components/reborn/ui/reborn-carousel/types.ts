import type { ClassValue } from "clsx";

/**
 * RebornCarousel 类型定义
 * 从组件内抽离，供组件与外部调用方共享
 */

/** 轮播图控制箭头的显示模式：'hover' (悬浮时显示) | 'always' (始终显示) | 'never' (不显示) */
export type CarouselArrowMode = "hover" | "always" | "never";
/** 轮播滚动方向：'horizontal' (水平) | 'vertical' (垂直) */
export type CarouselDirection = "horizontal" | "vertical";
/** 分页指示器的位置：'inside' (轨道内部) | 'outside' (轨道外部) | 'none' (不显示) */
export type CarouselIndicatorPosition = "inside" | "outside" | "none";
/** 缩略图导航面板的位置：'top' (上方) | 'bottom' (下方) | 'left' (左侧) | 'right' (右侧) */
export type CarouselThumbsPosition = "top" | "bottom" | "left" | "right";
/** 触发切换幻灯片的手势或操作：'hover' (悬停) | 'click' (点击) */
export type CarouselTrigger = "hover" | "click";
/** 轮播展现风格：'default' (标准平面) | 'card' (立体卡片式) */
export type CarouselType = "default" | "card";

/** 自动播放参数配置接口 */
export interface CarouselAutoplay {
  /** 每一帧幻灯片停留的时间 (毫秒) */
  delay?: number;
}

/** 分页指示器个性化配置接口 */
export interface CarouselPagination {
  /** 指示器是否支持点击进行切换 */
  clickable?: boolean;
  /** 指示器类型风格：'line' (线段型) | 'dot' (小圆点) | 'fraction' (数字分式 '1/3') | 'button' (带有数字编码的按钮) */
  type?: "line" | "dot" | "fraction" | "button";
}

/** 缩略图面板配置参数接口 */
export interface CarouselThumbs {
  /** 缩略图放置的位置方位 */
  position?: CarouselThumbsPosition;
  /** 缩略图本身是否允许无限循环轮转 */
  loop?: boolean;
  /** 缩略图导航箭头的展示模式 */
  arrow?: CarouselArrowMode;
}

/** 渲染队列中的单张幻灯片描述（loop 模式下含首尾克隆片） */
export interface CarouselRenderSlide {
  /** 幻灯片对应的真实数据索引 */
  realIndex: number;
  /** 幻灯片在渲染队列中的索引（含克隆片偏移） */
  renderIndex: number;
  /** 是否为 loop 模式下的克隆幻灯片 */
  isClone: boolean;
}

/** 响应式媒介断点独立配置接口 */
export interface RebornCarouselBreakpoint {
  /** 对应宽度下每屏显示的幻灯片张数，'auto' 代表根据幻灯片元素自身宽度决定 */
  slidesPerview?: number | "auto";
  /** 幻灯片之间的间隔距离 (像素 px) */
  spaceBetween?: number;
  /** 是否将活动项强制居中展示 */
  centeredSlides?: boolean;
  /** 对应宽度下的控制箭头显示模式 */
  arrow?: CarouselArrowMode;
  /** 对应宽度下分页器指示器的显示位置 */
  indicatorPosition?: CarouselIndicatorPosition;
  /** 滚动转场时是否开启边缘动态模糊视觉动效 */
  motionBlur?: boolean;
  /** 整个容器在当前断点下的指定高度值 */
  height?: string;
  /** 轮播风格类型 (默认平面或立体卡片) */
  type?: CarouselType;
  /** 滚动过渡方向 (水平或垂直) */
  direction?: CarouselDirection;
  /** 是否在此宽度下启用拖拽抓取的手势鼠标指针 */
  grabCursor?: boolean;
  /** 是否完全由幻灯片自身内容决定尺寸大小（不强行拉伸填充） */
  autoSize?: boolean;
}

/** RebornCarousel 组件的主属性定义接口 */
export interface RebornCarouselProps {
  /** 每屏可见的幻灯片数量，或指定为 'auto' 根据内容内在尺寸决定 */
  slidesPerview?: number | "auto";
  /** 幻灯片之间的横向/纵向间距 (px) */
  spaceBetween?: number;
  /** 是否将当前活动的幻灯片居中对齐展示 */
  centeredSlides?: boolean;
  /** 是否开启无限循环无缝无障碍滚动 */
  loop?: boolean;
  /** 是否自动播放：可直接传布尔值，或传包含 delay 时延的配置对象 */
  autoplay?: boolean | CarouselAutoplay;
  /** 分页器配置对象，为 null 时不显示任何分页元素 */
  pagination?: CarouselPagination | null;
  /** 指示器交互触发方式 (鼠标 hover 或鼠标 click) */
  trigger?: CarouselTrigger;
  /** 分页指示器在布局中的摆放位置 */
  indicatorPosition?: CarouselIndicatorPosition;
  /** 控制箭头的显隐交互模式 */
  arrow?: CarouselArrowMode;
  /** 在滑动转场动画期间是否启用动态的高级运动模糊视觉特效 */
  motionBlur?: boolean;
  /** 轮播图主体容器的外观高度 */
  height?: string;
  /** 轮播图结构展现风格：'default' 标准平面 | 'card' 3D卡片堆叠 */
  type?: CarouselType;
  /** 转场滚动的主轴轴线方向 (水平或垂直) */
  direction?: CarouselDirection;
  /** 初始加载时首先渲染定位在第几张幻灯片 (从 0 开始计数) */
  initialSlide?: number;
  /** 响应式断点控制映射表，Key 为最小视口宽度 (px)，Value 为断点配置 */
  breakpoints?: Record<number, RebornCarouselBreakpoint>;
  /** 当鼠标悬浮在轮播图区域时，是否展示为可抓取抓紧的手势光标 */
  grabCursor?: boolean;
  /** 是否禁止强行将幻灯片等宽拉伸，完全使用其内在元素宽高尺寸 */
  autoSize?: boolean;
  /** 指示器相对于底边界或右边界的自定义偏移间距 (px) */
  indicatorOffset?: number;
  /** 底部或侧边联动缩略图面板的特定配置 */
  thumbs?: CarouselThumbs | null;
  /** 预设的主题配色，用于指示器及操作按钮的色彩 */
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
  /** 自定义挂载在组件最外层根节点的 CSS 类名 */
  class?: any;
  /** 组件内置各个细分 UI 元素块的样式类名覆盖集，支持高度定制化 */
  ui?: Partial<{
    wrapper: ClassValue;
    root: ClassValue;
    viewport: ClassValue;
    track: ClassValue;
    slide: ClassValue;
    slideInner: ClassValue;
    slideActive: ClassValue;
    slideInactive: ClassValue;
    arrowGroup: ClassValue;
    arrow: ClassValue;
    indicatorWrapper: ClassValue;
    indicators: ClassValue;
    indicator: ClassValue;
    indicatorActive: ClassValue;
    indicatorInactive: ClassValue;
    thumbsShell: ClassValue;
    thumbsPanel: ClassValue;
    thumbsViewport: ClassValue;
    thumbsTrack: ClassValue;
    thumbsArrowGroup: ClassValue;
    thumbsArrow: ClassValue;
    thumb: ClassValue;
    thumbActive: ClassValue;
    thumbInactive: ClassValue;
    thumbPreview: ClassValue;
    thumbOverlay: ClassValue;
  }>;
}
