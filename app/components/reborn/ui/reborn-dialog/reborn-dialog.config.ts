export default {
  slots: {
    /** 触发器容器（仅提供 trigger 插槽时渲染） */
    trigger: "inline-flex",
    /** 根容器：全屏定位层 */
    root: "fixed inset-0",
    /**
     * 遮罩层：只用半透明底色，不做 backdrop-blur——全屏背景模糊在动画期间每帧重算，是弹窗掉帧的主因。
     * 淡入淡出由组件直接翻 opacity 驱动（不走 <Transition>），时长与缓动以内联样式给出
     */
    backdrop: "absolute inset-0 bg-black/45 transition-opacity transform-gpu will-change-[opacity]",
    /** 面板定位壳：负责水平居中与垂直落点（居中 / top 边距两种形态）；自身不参与动画，点击空白区域等同点击遮罩 */
    shell: "absolute inset-0 flex justify-center px-4 sm:px-6",
    /**
     * 面板动画包裹层（过渡动画作用在这一层）：只有面板大小，避免整屏尺寸的图层参与缩放导致每帧重栅格化；
     * 指针事件放行给 shell 处理，面板自行接管
     */
    panelWrapper: "flex w-full justify-center pointer-events-none",
    /** 弹窗面板：统一内边距 py-20/px-24，header / body / footer 三段之间由 gap-20 分隔 */
    panel:
      "pointer-events-auto relative flex w-full max-w-[560px] flex-col gap-[20px] overflow-hidden rounded-ui-md border border-black/5 bg-white py-[20px] px-[24px] text-gray-900 shadow-[0_32px_90px_rgba(15,23,42,0.22)] focus:outline-none",
    /** 头部：无分隔线，内边距交由面板统一承担 */
    header: "flex items-start justify-between gap-4",
    /** 头部文字区：标题与描述之间间隔 8px */
    headerContent: "flex min-w-0 flex-1 flex-col gap-[8px]",
    /** 标题：16px / 500 字重 / gray-10（令牌语义为「title 标题」） */
    title: "text-[16px] font-medium leading-[1.35] text-gray-10",
    /** 描述：14px / gray-8（令牌语义为「secondary 辅助文字」） */
    description: "text-[14px] leading-[1.6] text-gray-8",
    /** 关闭图标：固定 18px，不随父级字号浮动 */
    close: "size-[18px] shrink-0 cursor-pointer text-gray-5 transition-colors hover:text-gray-7",
    body: "",
    /** 底部：无分隔线，按钮靠右对齐 */
    footer: "flex items-center justify-end gap-3",
  },
  variants: {
    /** 是否渲染遮罩层底色（modal=false 时遮罩透明，仅在不可穿透时保留点击拦截层） */
    modal: {
      true: {
        backdrop: "",
      },
      false: {
        backdrop: "bg-transparent",
      },
    },
    /**
     * 遮罩穿透（modal 必须为 false 才生效）：
     * 根层放行指针事件，面板自行接管，弹窗背后的页面可以继续交互
     */
    penetrable: {
      true: {
        root: "pointer-events-none",
        shell: "pointer-events-none",
        panel: "pointer-events-auto",
      },
      false: {},
    },
    /** 正文是否独立滚动（页头页脚固定） */
    scrollable: {
      true: {
        panel: "max-h-[min(86vh,760px)]",
        body: "overflow-y-auto",
      },
      false: {
        body: "overflow-visible",
      },
    },
    fullscreen: {
      true: {
        shell: "p-0!",
        panelWrapper: "h-full",
        panel: "h-full max-h-none max-w-none rounded-none! border-0 px-[32px] py-[24px]",
        body: "min-h-0 flex-1",
      },
      false: {},
    },
    draggable: {
      true: {
        header: "cursor-move select-none",
      },
      false: {},
    },
    /** header 与 footer 内容是否居中排列（对齐 Element Plus 的 center） */
    center: {
      true: {
        /**
         * 居中形态下 header 由 justify-between 变为 justify-center，在流内的关闭图标会被
         * 挤到标题旁边而不再贴右。左右各让出「图标 18px + 间距 8px」，标题在面板里真正居中，
         * 也不会被绝对定位的图标压住
         */
        header: "justify-center px-[26px] text-center",
        headerContent: "flex-none",
        footer: "justify-center",
        /** 关闭图标脱离流、相对面板绝对定位钉在右上角（偏移与面板 py-[20px]/px-[24px] 对齐） */
        close: "absolute top-[20px] right-[24px]",
      },
      false: {},
    },
    /**
     * 是否水平垂直对齐对话框（对齐 Element Plus 的 align-center）：
     * true 走 flex 垂直居中；false 顶部落位，垂直边距由 top prop 以内联样式给出（默认 15vh）
     */
    alignCenter: {
      true: {
        shell: "items-center py-4 sm:py-6",
      },
      false: {
        shell: "items-start",
      },
    },
  },
  compoundVariants: [
    {
      fullscreen: true as const,
      scrollable: true as const,
      class: {
        panel: "h-screen",
        body: "overflow-y-auto",
      },
    },
    // 非居中形态下限制面板最大高度，避免 top 边距 + 长内容溢出视口
    {
      alignCenter: false as const,
      scrollable: true as const,
      class: {
        panel: "max-h-[min(80vh,760px)]",
      },
    },
    // 全屏 + 头尾居中：面板内边距变成 px-[32px]/py-[24px]，绝对定位的关闭图标要跟着挪
    {
      fullscreen: true as const,
      center: true as const,
      class: {
        close: "top-[24px] right-[32px]",
      },
    },
  ],
  defaultVariants: {
    modal: true,
    penetrable: false,
    scrollable: false,
    fullscreen: false,
    draggable: false,
    center: false,
    alignCenter: false,
  },
};
