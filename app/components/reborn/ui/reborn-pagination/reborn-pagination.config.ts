/**
 * 分页组件基础常量定义
 */

/** 分页尺寸：sm / md / lg */
export const paginationSizes = ["sm", "md", "lg"] as const;

/** 分页尺寸类型 */
export type PaginationSize = (typeof paginationSizes)[number];

/** 分页语义色，与按钮的颜色选项一致 */
export const paginationColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/** 分页语义色类型 */
export type PaginationColor = (typeof paginationColors)[number];

/** 激活背景参考按钮 soft 变体；无背景时只使用对应文字色 */
const colorStyles = {
  primary: { text: "text-primary", hover: "hover:text-primary", soft: "bg-primary/10 text-primary enabled:hover:bg-primary/20" },
  secondary: { text: "text-secondary", hover: "hover:text-secondary", soft: "bg-secondary/10 text-secondary enabled:hover:bg-secondary/20" },
  success: { text: "text-success", hover: "hover:text-success", soft: "bg-success/10 text-success enabled:hover:bg-success/20" },
  info: { text: "text-info", hover: "hover:text-info", soft: "bg-info/10 text-info enabled:hover:bg-info/20" },
  warning: { text: "text-warning", hover: "hover:text-warning", soft: "bg-warning/10 text-warning enabled:hover:bg-warning/20" },
  error: { text: "text-error", hover: "hover:text-error", soft: "bg-error/10 text-error enabled:hover:bg-error/20" },
  neutral: { text: "text-neutral", hover: "hover:text-neutral", soft: "bg-gray-2 text-gray-10 enabled:hover:bg-gray-5/20" },
} as const;

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
  /** 简洁模式与跳转区的输入框容器 */
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
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
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
        simple: "text-base",
        input: "w-24",
      },
      lg: {
        button: "h-10 min-w-10 text-base",
        ellipsis: "h-10 min-w-10 text-base",
        jumper: "text-base",
        total: "text-base",
        simple: "text-lg",
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
      true: { input: "w-10" },
      false: {},
    },
  },
  compoundVariants: [
    // 语义色只控制激活项与可用按钮的悬停反馈，禁用灰阶由末尾规则覆盖
    ...paginationColors.flatMap((color) => [
      { color, background: false, active: false, disabled: false, class: { button: colorStyles[color].hover } },
      { color, background: false, active: true, class: { button: colorStyles[color].text } },
      { color, background: true, active: true, class: { button: colorStyles[color].soft } },
    ]),
    // 有背景 + 未激活：灰色底
    {
      background: true,
      active: false,
      class: { button: "bg-gray-2 text-gray-5" },
    },
    // 有背景时省略号带灰色底
    {
      background: true,
      class: { ellipsis: "bg-gray-2" },
    },
    // 普通无背景模式：可点击的未激活项使用正文灰色
    {
      simple: false,
      background: false,
      active: false,
      disabled: false,
      class: { button: "text-gray-9", ellipsis: "text-gray-9" },
    },
    // 禁用项直接使用灰色令牌，避免透明度再次淡化文字
    {
      simple: false,
      background: false,
      disabled: true,
      class: { button: "text-gray-5 opacity-100", ellipsis: "text-gray-5 opacity-100" },
    },
  ] as const,
  defaultVariants: {
    color: "primary",
    size: "md",
    active: false,
    background: false,
    disabled: false,
    simple: false,
  },
} as const;
