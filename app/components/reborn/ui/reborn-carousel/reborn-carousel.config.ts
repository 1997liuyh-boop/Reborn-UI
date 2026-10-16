const carouselArrowModes = ["hover", "always", "never"] as const;
const carouselDirections = ["horizontal", "vertical"] as const;
const carouselIndicatorPositions = ["inside", "outside", "none"] as const;
const carouselIndicatorDisplayModes = ["hover", "always", "never"] as const;
const carouselTriggers = ["hover", "click"] as const;
const carouselTypes = ["default", "card"] as const;

const carouselColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const carouselIndicatorTypes = ["line", "dot", "progress", "fraction", "button"] as const;

export {
  carouselArrowModes,
  carouselColors,
  carouselDirections,
  carouselIndicatorDisplayModes,
  carouselIndicatorPositions,
  carouselIndicatorTypes,
  carouselTriggers,
  carouselTypes,
};

export default {
  slots: {
    // 根容器：相对定位，隔离层，全宽
    root: "group/reborn-carousel relative isolate w-full min-w-0 max-w-full overflow-hidden",
    // 外层不裁剪 outside 分页的背景投影；轮播内容仍由 root 和 viewport 独立裁剪。
    wrapper: "group/carousel-shell w-full max-w-full min-w-0 overflow-visible",
    // 视口容器：相对定位，滚动容器，隐藏滚动条
    viewport:
      "relative w-full min-w-0 max-w-full overflow-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [scroll-behavior:auto!important] focus-visible:outline-2 focus-visible:outline-primary",
    // 轨道容器：弹性布局，全宽
    track: "flex w-full min-w-full items-start",
    // 幻灯片：相对定位，最小宽度，过渡动画
    slide: "relative min-w-0 max-w-full shrink-0 transition-all duration-500 will-change-transform",
    // 幻灯片内部容器：相对定位，溢出隐藏，圆角继承
    slideInner:
      "relative w-full overflow-hidden isolate translate-z-0 backface-hidden rounded-[inherit]",
    // 箭头组：绝对定位，垂直居中，两端对齐
    arrowGroup:
      "pointer-events-none absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 justify-between max-w-(--ui-container) mx-auto",
    // 箭头按钮：半透明黑色背景，模糊效果，圆形。
    // 箭头浮在图片之上，配色不随主题反转，所以用 black/white 而不用会反转的灰阶；描边 #BABCBF 取自设计稿，灰阶令牌里没有对应档位
    arrow:
      "pointer-events-auto cursor-pointer size-10 rounded-full inline-flex items-center justify-center bg-black/45 backdrop-blur-3xl border border-[#BABCBF] shadow-lg text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30",
    // 指示器包装容器：居中对齐
    indicatorWrapper: "flex justify-center",
    // 指示器组：弹性布局，间距
    indicators:
      "group/carousel-pagination flex w-max max-w-full shrink-0 items-center gap-2 p-0.5 pointer-events-auto text-gray-9",
    // 指示器：圆形，过渡动画
    indicator: "cursor-pointer rounded-full p-0 transition-all duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-default",
    // 类型变体决定灰阶外观，悬停与按钮激活色由局部色板变量统一提供。
    indicatorActive: "bg-gray-10",
    indicatorInactive: "bg-gray-2",
    // 仅当前页文字自身悬停时着色，总数保留容器悬停时的加粗反馈。
    indicatorCurrent: "transition-colors hover:text-(--carousel-color)",
    indicatorTotal: "group-hover/carousel-pagination:font-bold",
    // 通过 RebornProgress 的 ui 覆盖高度和两端圆角，不改公共进度条组件。
    progress: "w-full gap-0 text-(--carousel-color)",
    progressTrack: "h-0.5 rounded-none",
    progressFill: "rounded-none",
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
      "pointer-events-auto cursor-pointer size-8 rounded-full inline-flex items-center justify-center bg-black/45 backdrop-blur-3xl border border-[#BABCBF] shadow-lg text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30",
    // 缩略图项：相对定位，溢出隐藏，过渡动画
    thumb:
      "group/thumb relative cursor-pointer overflow-hidden transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    // 激活状态缩略图：描边取 gray-10，随主题反转；原先写死的 #252626 在深色模式下与底色融为一体
    thumbActive: "border border-gray-10 rounded-xl",
    // 未激活状态缩略图：描边 gray-3 半透明，悬停加深一档到 gray-4；灰阶自身随主题反转，不再写 dark: 前缀
    thumbInactive:
      "border-gray-3/80 opacity-70 hover:opacity-100 hover:border-gray-4",
    // 缩略图预览容器：指针事件禁用，变换动画
    thumbPreview:
      "pointer-events-none h-full w-full origin-center overflow-hidden rounded-[inherit] transition-transform duration-300 [&>*]:h-full [&>*]:w-full",
    // 缩略图覆盖层：渐变背景，透明度动画
    thumbOverlay:
      "pointer-events-none absolute inset-0 bg-linear-to-t from-black/18 via-transparent to-white/8 transition-opacity duration-300",
    // 缩略图指示器：绝对定位，白色背景
  },
  variants: {
    // 外部分页也属于轮播区域；隐藏只影响可见性，保留布局且不拦截点击或键盘焦点。
    indicatorDisplay: {
      hover: {
        indicatorWrapper: "invisible opacity-0 transition-opacity duration-200 group-hover/carousel-shell:visible group-hover/carousel-shell:opacity-100 group-focus-within/carousel-shell:visible group-focus-within/carousel-shell:opacity-100 [@media(hover:none)]:visible [@media(hover:none)]:opacity-100 motion-reduce:transition-none",
      },
      always: {},
      never: { indicatorWrapper: "hidden" },
    },
    autoHeight: {
      true: { slide: "h-auto", slideInner: "h-auto" },
      false: { slideInner: "h-full" },
    },
    autoSize: {
      true: { slide: "w-auto! h-auto! self-center", slideInner: "w-auto! h-auto! inline-block" },
    },
    grabCursor: { true: { viewport: "cursor-grab" } },
    dragging: { true: { viewport: "cursor-grabbing select-none" } },
    thumbsVertical: {
      true: { thumbsViewport: "flex-1 overflow-y-auto overflow-x-hidden", thumbsTrack: "flex-col w-full", thumb: "aspect-[4/3] w-full" },
      false: { thumbsViewport: "overflow-x-auto overflow-y-hidden", thumbsTrack: "flex-row", thumb: "aspect-[4/3] w-20 shrink-0 sm:w-24 md:w-28" },
    },
    // 指示器位置变体
    indicatorPosition: {
      // 内部位置：绝对定位在底部；背景独立控制，避免类型变体覆盖显隐开关。
      inside: {
        indicatorWrapper: "pointer-events-none absolute inset-x-0 bottom-2 z-20",
      },
      // 外部位置：在主图下方居中排列，默认间距 8px。
      outside: {
        indicatorWrapper: "mt-2",
      },
      // 不显示指示器
      none: {
        indicatorWrapper: "hidden",
      },
    },
    // 背景开关只作用容器，不改变指示项自身的配色。
    indicatorBackground: {
      true: {},
      false: {},
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
        arrowGroup: "inset-x-auto inset-y-4 left-1/2 top-4 -translate-x-1/2 translate-y-0 flex-col",
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
    // 统一取对应色板第 6 阶，子项与进度条继承变量，明暗主题均保持相同档位。
    color: {
      primary: {
        indicators: "[--carousel-color:var(--color-brand-6)]",
      },
      secondary: {
        indicators: "[--carousel-color:var(--color-secondary-6)]",
      },
      success: {
        indicators: "[--carousel-color:var(--color-green-6)]",
      },
      info: {
        indicators: "[--carousel-color:var(--color-blue-6)]",
      },
      warning: {
        indicators: "[--carousel-color:var(--color-orange-6)]",
      },
      error: {
        indicators: "[--carousel-color:var(--color-red-6)]",
      },
      neutral: {
        indicators: "[--carousel-color:var(--color-gray-6)]",
      },
    },
    // 指示器类型变体
    indicatorType: {
      // 线型：所有项尺寸固定，内外位置只切换激活配色。
      line: {
        indicators: "rounded-sm",
        indicator: "h-0.5 w-6 rounded-none",
        indicatorActive: "enabled:hover:bg-(--carousel-color)",
        indicatorInactive: "bg-gray-4",
      },
      // 点型：普通项为圆点，激活项横向延长。
      dot: {
        indicators: "rounded-full",
        indicator: "h-1.5",
        indicatorActive: "w-2.5 border border-gray-10 bg-transparent enabled:hover:border-(--carousel-color)",
        indicatorInactive: "w-1.5 bg-gray-10",
      },
      // 进度条始终横向铺满，背景开关不影响轨道，不继承浮动分页的留白。
      progress: {
        indicatorWrapper: "w-full",
        indicators: "w-full flex-row gap-0 rounded-none p-0",
      },
      // 分数型：文字自然撑开，纵向轮播也不把分数字符拆成一列。
      fraction: {
        indicators: "min-w-0 flex-row gap-1 rounded-full px-4 py-1 text-base tabular-nums",
      },
      // 按钮型：圆形按钮，显示数字
      button: {
        indicators: "rounded-full px-2 py-1",
        // 指示器是 size-5（20px）的圆点，序号要塞进圆内。
        // 10px 低于 7 级字号令牌的下限（--text-sm 12px），无对应档位，只能写字面量。
        indicator: "flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none size-5 text-[10px] text-white",
        indicatorActive: "bg-(--carousel-color) text-white border-transparent",
        // 描边向内绘制，避免未激活按钮的可见尺寸比激活态多出 2px。
        indicatorInactive: "bg-gray-2 ring-1 ring-inset ring-gray-5 text-gray-5",
      },
    },
    // 缩略图位置变体
    thumbsPosition: {
      // 顶部位置：垂直排列，底部间距，箭头垂直居中
      top: {
        thumbsShell: "flex-col",
        thumbsPanel: "order-first w-full flex-col mb-5",
        thumbsArrowGroup: "inset-x-0 top-1/2 -translate-y-1/2 flex-row justify-between items-center",
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
  compoundVariants: [
    // 阴影不设水平或垂直偏移，让底板四周均匀扩散；关闭背景时一并移除，进度条不使用底板。
    { indicatorType: ["line", "dot", "fraction", "button"] as (typeof carouselIndicatorTypes)[number][], indicatorBackground: true, class: { indicators: "bg-gray-1/30 backdrop-blur-xl shadow-[0_0_8px_rgb(0_0_0/0.18)] rounded-full" } },
    // 线段和圆点体积较小，用留白、较实的底色与内描边区分浅色图片，描边不改变布局尺寸。
    { indicatorType: ["line", "dot"] as (typeof carouselIndicatorTypes)[number][], indicatorBackground: true, class: { indicators: "p-2 bg-gray-1/80 ring-1 ring-inset ring-gray-10/15" } },
    // 图内线型当前项使用 gray-1，以相反灰阶的底板保证明暗主题下均可辨认。
    { indicatorPosition: "inside" as const, indicatorType: "line" as const, indicatorBackground: true, class: { indicators: "bg-gray-10/30 ring-gray-1/20" } },
    { indicatorPosition: "inside" as const, indicatorType: "line" as const, class: { indicatorActive: "bg-gray-1" } },
    { indicatorPosition: "outside" as const, indicatorType: "line" as const, class: { indicatorActive: "bg-gray-5" } },
    { indicatorPosition: "inside" as const, indicatorType: "progress" as const, class: { indicatorWrapper: "inset-x-0 inset-y-auto top-0 bottom-auto items-stretch" } },
    { indicatorPosition: "outside" as const, indicatorType: "progress" as const, class: { indicatorWrapper: "static inset-auto mt-0 items-stretch" } },
  ],
  defaultVariants: {
    direction: "horizontal" as (typeof carouselDirections)[number],
    type: "default" as (typeof carouselTypes)[number],
    arrow: "hover" as (typeof carouselArrowModes)[number],
    color: "primary" as (typeof carouselColors)[number],
    indicatorType: "line" as (typeof carouselIndicatorTypes)[number],
    indicatorDisplay: "always" as (typeof carouselIndicatorDisplayModes)[number],
    indicatorBackground: true,
  },
};
