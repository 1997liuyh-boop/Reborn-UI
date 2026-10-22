/**
 * 分页组件基础常量定义
 */

/** 分页尺寸：sm / md / lg */
export const paginationSizes = ["sm", "md", "lg"] as const;

/** 分页尺寸类型 */
export type PaginationSize = (typeof paginationSizes)[number];

/**
 * 分页组件 UI Slots 接口定义
 * 用于支持通过 ui 属性进行深度样式定制
 */
export interface PaginationUI {
  /** 根容器 */
  root?: string;
  /** 页码列表容器 */
  pager?: string;
  /** 上一页按钮 */
  prev?: string;
  /** 下一页按钮 */
  next?: string;
  /** 页码项（非激活态） */
  pagerItem?: string;
  /** 激活页码项 */
  pagerItemActive?: string;
  /** 省略号 */
  ellipsis?: string;
  /** 跳转输入区 */
  jumper?: string;
  /** 总数文本 */
  total?: string;
  /** 每页条数选择器 */
  sizes?: string;
  /** 简洁模式内容 */
  simple?: string;
  /** 跳转输入框 */
  input?: string;
}

/**
 * 分页组件样式配置（tailwind-variants）
 */
export default {
  slots: {
    root: "reborn-pagination inline-flex flex-wrap items-center gap-2",
    // 不做颜色过渡：折叠窗口切换时页码节点会瞬间重排，若高亮还在淡入淡出，旧激活项会在新位置上残留半程高亮，看起来像来回跳动
    button:
      "reborn-pagination-button px-1 inline-flex items-center justify-center rounded-md cursor-pointer select-none",
    pager: "reborn-pagination-pager inline-flex items-center gap-2",
    pagerItem: "reborn-pagination-pager-item",
    ellipsis:
      "reborn-pagination-ellipsis inline-flex items-center justify-center select-none text-gray-5",
    prev: "reborn-pagination-prev",
    next: "reborn-pagination-next",
    jumper: "reborn-pagination-jumper inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5",
    total: "reborn-pagination-total shrink-0 whitespace-nowrap text-gray-5",
    sizes: "reborn-pagination-sizes shrink-0",
    simple: "reborn-pagination-simple inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5",
    input: "shrink-0",
  },
  variants: {
    /*
     * 尺寸直接使用 Tailwind 刻度：
     * 按钮 / 省略号共用 h-6 / h-8 / h-10 与对应的 min-w-6 / min-w-8 / min-w-10；
     * 跳转 / 总数 / 简洁模式文字与控件同字号（sm、md 为 text-sm 12px，lg 为 text-base 14px）；
     * 跳转输入框宽度为 w-18 / w-24 / w-30，保持控件高度的三倍。
     */
    size: {
      sm: {
        button: "h-6 min-w-6 text-sm",
        ellipsis: "h-6 min-w-6 text-sm",
        jumper: "text-sm",
        total: "text-sm",
        simple: "text-sm",
        input: "w-18",
      },
      md: {
        button: "h-8 min-w-8 text-sm",
        ellipsis: "h-8 min-w-8 text-sm",
        jumper: "text-sm",
        total: "text-sm",
        simple: "text-sm",
        input: "w-24",
      },
      lg: {
        button: "h-10 min-w-10 text-base",
        ellipsis: "h-10 min-w-10 text-base",
        jumper: "text-base",
        total: "text-base",
        simple: "text-base",
        input: "w-30",
      },
    },
    active: {
      true: { button: "font-medium" },
      false: { button: "text-gray-5" },
    },
    background: {
      true: {},
      false: {},
    },
    disabled: {
      true: {
        // 不加 pointer-events-none，否则禁止光标显示不出来：按钮由原生 disabled 拦点击，省略号在 handleEllipsisJump 里拦
        button: "opacity-50 cursor-not-allowed",
        ellipsis: "opacity-50 cursor-not-allowed",
      },
      false: {},
    },
    simple: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // 无背景 + 未激活：悬停高亮为主色
    {
      background: false,
      active: false,
      disabled: false,
      class: { button: "hover:text-primary" },
    },
    // 无背景 + 激活：主色文字，无底
    {
      background: false,
      active: true,
      class: { button: "text-primary" },
    },
    // 有背景 + 未激活：灰色底
    {
      background: true,
      active: false,
      class: { button: "bg-gray-2 text-gray-5" },
    },
    // 有背景 + 激活：主色浅底
    {
      background: true,
      active: true,
      class: { button: "bg-primary/50 text-primary" },
    },
    // 有背景时省略号带灰色底
    {
      background: true,
      class: { ellipsis: "bg-gray-2" },
    },
  ] as const,
  defaultVariants: {
    size: "md",
    active: false,
    background: false,
    disabled: false,
    simple: false,
  },
} as const;
