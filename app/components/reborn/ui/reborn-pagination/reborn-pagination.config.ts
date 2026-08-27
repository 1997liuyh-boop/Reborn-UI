/**
 * 分页组件基础常量定义
 */

/** 分页尺寸：sm / md / lg */
export const paginationSizes = ["sm", "md", "lg"] as const;

/** 分页尺寸类型 */
export type PaginationSize = (typeof paginationSizes)[number];

/** 分页主题色：与按钮/徽章等组件共用同一套语义色 */
export const paginationColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;

/** 分页主题色类型 */
export type PaginationColor = (typeof paginationColors)[number];

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
    button:
      "reborn-pagination-button px-1 inline-flex items-center justify-center cursor-pointer select-none transition-colors",
    pager: "reborn-pagination-pager inline-flex items-center gap-1",
    pagerItem: "reborn-pagination-pager-item",
    ellipsis:
      "reborn-pagination-ellipsis inline-flex items-center justify-center cursor-pointer select-none text-gray-5",
    prev: "reborn-pagination-prev",
    next: "reborn-pagination-next",
    jumper: "reborn-pagination-jumper inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5",
    total: "reborn-pagination-total shrink-0 whitespace-nowrap text-gray-5",
    sizes: "reborn-pagination-sizes shrink-0",
    simple: "reborn-pagination-simple inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-gray-5",
    input: "shrink-0"
  },
  variants: {
    size: {
      sm: {
        root: "text-sm",
        button: "h-pagination-sm min-w-pagination-sm rounded-ui-2xs",
        ellipsis: "h-pagination-sm min-w-pagination-sm rounded-ui-2xs",
        input: "w-pagination-input-sm min-w-pagination-input-sm",
      },
      md: {
        root: "text-base",
        button: "h-pagination-md min-w-pagination-md rounded-ui-xs",
        ellipsis: "h-pagination-md min-w-pagination-md rounded-ui-xs",
        input: "w-pagination-input-md min-w-pagination-input-md",
      },
      lg: {
        root: "text-lg",
        button: "h-pagination-lg min-w-pagination-lg rounded-ui-sm",
        ellipsis: "h-pagination-lg min-w-pagination-lg rounded-ui-sm",
        input: "w-pagination-input-lg min-w-pagination-input-lg",
      },
    },
    color: {
      primary: "",
      secondary: "",
      success: "",
      info: "",
      warning: "",
      error: "",
      neutral: "",
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
        button: "opacity-50 cursor-not-allowed pointer-events-none",
        ellipsis: "opacity-50 cursor-not-allowed pointer-events-none",
      },
      false: {},
    },
    simple: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // 无背景 + 未激活：悬停时高亮为当前主题色
    {
      color: "primary" as (typeof paginationColors)[number],
      background: false,
      active: false,
      class: { button: "hover:text-primary" },
    },
    {
      color: "secondary" as (typeof paginationColors)[number],
      background: false,
      active: false,
      class: { button: "hover:text-secondary" },
    },
    {
      color: "success" as (typeof paginationColors)[number],
      background: false,
      active: false,
      class: { button: "hover:text-success" },
    },
    {
      color: "info" as (typeof paginationColors)[number],
      background: false,
      active: false,
      class: { button: "hover:text-info" },
    },
    {
      color: "warning" as (typeof paginationColors)[number],
      background: false,
      active: false,
      class: { button: "hover:text-warning" },
    },
    {
      color: "error" as (typeof paginationColors)[number],
      background: false,
      active: false,
      class: { button: "hover:text-error" },
    },
    {
      color: "neutral" as (typeof paginationColors)[number],
      background: false,
      active: false,
      class: { button: "hover:text-neutral" },
    },
    // 无背景 + 激活：当前主题色文字
    {
      color: "primary" as (typeof paginationColors)[number],
      active: true,
      class: { button: "text-primary" },
    },
    {
      color: "secondary" as (typeof paginationColors)[number],
      active: true,
      class: { button: "text-secondary" },
    },
    {
      color: "success" as (typeof paginationColors)[number],
      active: true,
      class: { button: "text-success" },
    },
    {
      color: "info" as (typeof paginationColors)[number],
      active: true,
      class: { button: "text-info" },
    },
    {
      color: "warning" as (typeof paginationColors)[number],
      active: true,
      class: { button: "text-warning" },
    },
    {
      color: "error" as (typeof paginationColors)[number],
      active: true,
      class: { button: "text-error" },
    },
    {
      color: "neutral" as (typeof paginationColors)[number],
      active: true,
      class: { button: "text-neutral" },
    },
    // 有背景 + 未激活：灰色底
    {
      background: true,
      active: false,
      class: { button: "bg-gray-2 text-gray-5" },
    },
    // 有背景 + 激活：主题色浅底
    {
      color: "primary" as (typeof paginationColors)[number],
      background: true,
      active: true,
      class: { button: "bg-primary/20 text-primary" },
    },
    {
      color: "secondary" as (typeof paginationColors)[number],
      background: true,
      active: true,
      class: { button: "bg-secondary/20 text-secondary" },
    },
    {
      color: "success" as (typeof paginationColors)[number],
      background: true,
      active: true,
      class: { button: "bg-success/20 text-success" },
    },
    {
      color: "info" as (typeof paginationColors)[number],
      background: true,
      active: true,
      class: { button: "bg-info/20 text-info" },
    },
    {
      color: "warning" as (typeof paginationColors)[number],
      background: true,
      active: true,
      class: { button: "bg-warning/20 text-warning" },
    },
    {
      color: "error" as (typeof paginationColors)[number],
      background: true,
      active: true,
      class: { button: "bg-error/20 text-error" },
    },
    {
      color: "neutral" as (typeof paginationColors)[number],
      background: true,
      active: true,
      class: { button: "bg-neutral/20 text-neutral" },
    },
    // 有背景时省略号带灰色底
    {
      background: true,
      class: { ellipsis: "bg-gray-2" },
    },
  ] as const,
  defaultVariants: {
    size: "md",
    color: "primary",
    active: false,
    background: false,
    disabled: false,
    simple: false,
  },
} as const;