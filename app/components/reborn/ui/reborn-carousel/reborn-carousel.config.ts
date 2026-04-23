const carouselArrowModes = ["hover", "always", "never"] as const;
const carouselDirections = ["horizontal", "vertical"] as const;
const carouselIndicatorPositions = ["inside", "outside", "none"] as const;
const carouselTriggers = ["hover", "click"] as const;
const carouselTypes = ["default", "card"] as const;

const carouselColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const carouselIndicatorTypes = ["line", "dot", "fraction", "button"] as const;

export {
  carouselArrowModes,
  carouselDirections,
  carouselIndicatorPositions,
  carouselTriggers,
  carouselTypes,
  carouselColors,
  carouselIndicatorTypes,
};

export default {
  slots: {
    // 根容器：相对定位，隔离层，全宽
    root: "group/reborn-carousel relative isolate w-full min-w-0 max-w-full overflow-hidden relative",
    // 包装容器：全宽，溢出隐藏
    wrapper: "w-full max-w-full min-w-0 overflow-hidden",
    // 视口容器：相对定位，滚动容器，隐藏滚动条
    viewport:
      "relative w-full min-w-0 max-w-full overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    // 轨道容器：弹性布局，全宽
    track: "flex w-full min-w-full items-stretch",
    // 幻灯片：相对定位，最小宽度，过渡动画
    slide: "relative min-w-0 max-w-full shrink-0 transition-all duration-500 will-change-transform",
    // 幻灯片内部容器：相对定位，溢出隐藏，圆角继承
    slideInner:
      "relative w-full overflow-hidden isolate translate-z-0 backface-hidden rounded-[inherit]",
    // 箭头组：绝对定位，垂直居中，两端对齐
    arrowGroup:
      "pointer-events-none absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 justify-between max-w-(--ui-container) mx-auto",
    // 箭头按钮：半透明黑色背景，模糊效果，圆形
    arrow:
      "pointer-events-auto cursor-pointer size-10 rounded-full inline-flex items-center justify-center bg-[#000000]/45 backdrop-blur-3xl border border-[#BABCBF] shadow-lg text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30",
    // 指示器包装容器：居中对齐
    indicatorWrapper: "flex justify-center",
    // 指示器组：弹性布局，间距
    indicators:
      "flex items-center gap-2 pointer-events-auto",
    // 指示器：圆形，过渡动画
    indicator: "rounded-full transition-all duration-300 ease-out",
    // 激活状态指示器：深色背景
    indicatorActive: "bg-slate-900 dark:bg-white",
    // 未激活状态指示器：浅色背景
    indicatorInactive: "bg-slate-400/60 dark:bg-slate-500/60",
    // 激活状态幻灯片
    slideActive: "",
    // 未激活状态幻灯片
    slideInactive: "",
    // 缩略图相关样式
    // 缩略图外壳：弹性布局，间距
    thumbsShell: "flex gap-4 md:gap-5",
    // 缩略图面板：相对定位，弹性布局
    thumbsPanel: "group/reborn-carousel-thumbs relative flex min-w-0 shrink-0 gap-3",
    // 缩略图视口：滚动容器，隐藏滚动条
    thumbsViewport: "min-w-0 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    // 缩略图轨道：弹性布局，间距
    thumbsTrack: "flex gap-3",
    // 缩略图箭头组：绝对定位，弹性布局
    thumbsArrowGroup: "pointer-events-none absolute z-10 flex items-center gap-2",
    // 缩略图箭头按钮：半透明黑色背景，模糊效果，圆形（尺寸比主箭头小）
    thumbsArrow:
      "pointer-events-auto cursor-pointer size-8 rounded-full inline-flex items-center justify-center bg-[#000000]/45 backdrop-blur-3xl border border-[#BABCBF] shadow-lg text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30",
    // 缩略图项：相对定位，溢出隐藏，过渡动画
    thumb:
      "group/thumb relative overflow-hidden transition-all duration-300",
    // 激活状态缩略图：边框，阴影效果
    thumbActive: "border border-[#252626] rounded-ui-md",
    // 未激活状态缩略图：透明度，悬停效果
    thumbInactive:
      "border-slate-200/80 opacity-70 hover:opacity-100 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20",
    // 缩略图预览容器：指针事件禁用，变换动画
    thumbPreview:
      "pointer-events-none h-full w-full origin-center overflow-hidden rounded-[inherit] transition-transform duration-300 [&>*]:h-full [&>*]:w-full",
    // 缩略图覆盖层：渐变背景，透明度动画
    thumbOverlay:
      "pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/18 via-transparent to-white/8 transition-opacity duration-300",
    // 缩略图指示器：绝对定位，白色背景
  },
  variants: {
    // 指示器位置变体
    indicatorPosition: {
      // 内部位置：绝对定位在底部，带背景和边框
      inside: {
        indicators: "rounded-full border border-white/60 bg-white/72 px-3 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 pointer-events-auto",
        indicatorWrapper: "pointer-events-none absolute inset-x-0 bottom-4 z-20",
      },
      // 外部位置：绝对定位在底部居中
      outside: {
        indicatorWrapper: "mt-5",
      },
      // 不显示指示器
      none: {
        indicatorWrapper: "hidden",
      },
    },
    // 滚动方向变体
    direction: {
      // 水平方向：水平滚动，水平排列
      horizontal: {
        viewport: "overflow-x-auto overflow-y-hidden",
        track: "flex-row",
        slide: "h-full",
      },
      // 垂直方向：垂直滚动，垂直排列
      vertical: {
        wrapper: "flex flex-row items-center",
        viewport: "overflow-y-auto overflow-x-hidden",
        track: "flex-col",
        slide: "w-full",
        indicatorWrapper: "inset-y-0 inset-x-auto items-center",
        indicators: "flex-col",
      },
    },
    // 轮播类型变体
    type: {
      // 默认类型：未激活状态降低透明度
      default: {
        slideInactive: "opacity-80",
      },
      // 卡片类型：激活状态放大，未激活状态缩小
      card: {
        viewport: "py-4",
        slide: "origin-center",
        slideActive: "z-10 scale-[1.05] opacity-100 ring-1 ring-white/10",
        slideInactive: "scale-[0.9] opacity-70 ring-1 ring-white/5",
      },
    },
    // 动态模糊变体
    motionBlur: {
      // 启用模糊：未激活状态添加模糊效果
      true: {
        slideInactive: "blur-[1.5px]",
      },
      // 不启用模糊
      false: {},
    },
    // 箭头显示模式变体
    arrow: {
      // 悬停显示：默认隐藏，悬停或聚焦时显示
      hover: {
        arrowGroup:
          "opacity-0 transition-opacity duration-300 group-hover/reborn-carousel:opacity-100 group-focus-within/reborn-carousel:opacity-100",
      },
      // 始终显示
      always: {},
      // 从不显示
      never: {
        arrowGroup: "hidden",
      },
    },
    // 颜色变体：指示器激活状态的颜色
    color: {
      primary: {
        indicatorActive: "bg-primary",
      },
      secondary: {
        indicatorActive: "bg-secondary",
      },
      success: {
        indicatorActive: "bg-success",
      },
      info: {
        indicatorActive: "bg-info",
      },
      warning: {
        indicatorActive: "bg-warning",
      },
      error: {
        indicatorActive: "bg-error",
      },
      neutral: {
        indicatorActive: "bg-neutral",
      },
    },
    // 指示器类型变体
    indicatorType: {
      // 线型：高度固定，激活状态宽度增加
      line: {
        indicator: "h-2",
        indicatorActive: "w-8",
        indicatorInactive: "w-2",
      },
      // 点型：固定尺寸
      dot: {
        indicator: "size-2",
        indicatorActive: "",
        indicatorInactive: "bg-gray-5",
      },
      // 分数型：无边框和阴影
      fraction: {
        indicators: "border-none shadow-none p-1 dark:bg-transparent gap-1",
      },
      // 按钮型：圆形按钮，显示数字
      button: {
        indicators: "border-none shadow-none p-1 dark:bg-transparent gap-2",
        indicator: "flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none size-5 text-[10px] text-white",
        indicatorActive: "text-white border-transparent",
        indicatorInactive: "bg-gray-2 ring-1 ring-gray-5 text-gray-5",
      },
    },
    // 缩略图位置变体
    thumbsPosition: {
      // 顶部位置：垂直排列，底部间距，箭头垂直居中
      top: {
        thumbsShell: "flex-col",
        thumbsPanel: "order-first w-full flex-col mb-5",
        thumbsArrowGroup: "inset-x-0 top-1/2 translate-y-1/2 flex-row justify-between items-center",
      },
      // 底部位置：垂直排列，顶部间距，箭头垂直居中
      bottom: {
        thumbsShell: "flex-col",
        thumbsPanel: "order-last w-full flex-col mt-5",
        thumbsArrowGroup: "inset-x-0 top-1/2 -translate-y-1/2 flex-row justify-between items-center",
      },
      // 左侧位置：水平排列，右侧间距，箭头水平居中
      left: {
        thumbsShell: "items-start",
        thumbsPanel: "order-first w-24 flex-col self-stretch md:w-28 mr-5",
        thumbsArrowGroup: "inset-y-0 left-1/2 -translate-x-1/2 flex-col justify-between items-center",
      },
      // 右侧位置：水平排列，左侧间距，箭头水平居中
      right: {
        thumbsShell: "items-start",
        thumbsPanel: "order-last w-24 flex-col self-stretch md:w-28 ml-5",
        thumbsArrowGroup: "inset-y-0 left-1/2 -translate-x-1/2 flex-col justify-between items-center",
      },
    },
    // 缩略图箭头显示模式变体
    thumbsArrow: {
      // 悬停显示：默认隐藏，悬停或聚焦时显示
      hover: {
        thumbsArrowGroup:
          "opacity-0 transition-opacity duration-300 group-hover/reborn-carousel-thumbs:opacity-100 group-focus-within/reborn-carousel-thumbs:opacity-100",
      },
      // 始终显示
      always: {},
      // 从不显示
      never: {},
    },
  },
  defaultVariants: {
    direction: "horizontal" as (typeof carouselDirections)[number],
    type: "default" as (typeof carouselTypes)[number],
    arrow: "hover" as (typeof carouselArrowModes)[number],
    color: "primary" as (typeof carouselColors)[number],
    indicatorType: "line" as (typeof carouselIndicatorTypes)[number],
  },
};
