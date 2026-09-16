import { tv } from "~/lib/tv";

/**
 * 结果状态。前四种是语义反馈，后三种是 HTTP 错误页的常见状态码。
 * 组件的 icon 属性还额外接受 null，表示不渲染图标区。
 */
export const resultIcons = [
  "info",
  "success",
  "warning",
  "error",
  "403",
  "404",
  "500",
] as const;
export type ResultIcon = (typeof resultIcons)[number];

/** 图标配色，取自全局语义色（-6 档） */
export const resultColors = ["info", "success", "warning", "error"] as const;
export type ResultColor = (typeof resultColors)[number];

/**
 * 状态 → 配色。
 * 403 是权限拦截，归警示；404 是资源不存在，不算故障，归信息；500 是服务端故障，归错误。
 */
export const RESULT_ICON_COLOR: Record<ResultIcon, ResultColor> = {
  "info": "info",
  "success": "success",
  "warning": "warning",
  "error": "error",
  "403": "warning",
  "404": "info",
  "500": "error",
};

/** 状态 → 默认 lucide 图标名。前四种与 reborn-alert 的 ALERT_TYPE_ICON 保持同一套字形。 */
export const RESULT_ICON_NAME: Record<ResultIcon, string> = {
  "info": "lucide:info",
  "success": "lucide:circle-check",
  "warning": "lucide:circle-alert",
  "error": "lucide:circle-x",
  "403": "lucide:lock",
  "404": "lucide:file-question",
  "500": "lucide:server-crash",
};

export const resultTheme = tv({
  slots: {
    // 图标 /（标题 + 描述）/ 额外区三段，段间 gap-6（24px），整体居中
    root: "reborn-result flex w-full flex-col items-center gap-6 text-center",
    // 72px 圆形底板，承载 32px 字形
    icon: "flex size-18 shrink-0 items-center justify-center rounded-full",
    iconGlyph: "size-8 shrink-0",
    // 标题与描述同属一段，段内 gap-2（8px）
    // 行高取令牌自带的 32 / 22px，不再叠 leading-[1.5]：多行标题的段间距由 gap-2 统一给出
    content: "flex min-w-0 max-w-full flex-col items-center gap-2",
    title: "text-2xl font-medium text-gray-10",
    subTitle: "text-base font-normal text-gray-7",
    // 额外区通常放按钮，横向排列、可换行
    extra: "flex flex-wrap items-center justify-center gap-3",
  },
  variants: {
    color: {
      info: { icon: "bg-info/10 text-info" },
      success: { icon: "bg-success/10 text-success" },
      warning: { icon: "bg-warning/10 text-warning" },
      error: { icon: "bg-error/10 text-error" },
    },
    /**
     * icon 传 null、图标区完全由 icon 插槽接管时开启：
     * 底板退化成无尺寸无底色的透明容器，让自定义插画自己决定大小。
     */
    bare: {
      true: { icon: "size-auto rounded-none bg-transparent" },
    },
  },
  // 不设 defaultVariants：color 由组件按 icon 推导，icon 为 null 时不传，底板就不着色
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface ResultUI {
  /** 根容器：三段纵向布局与居中 */
  root?: string;
  /** 图标区底板：72px 圆形 + 语义色淡底 */
  icon?: string;
  /** 图标字形：32px */
  iconGlyph?: string;
  /** 标题 + 描述的包裹层 */
  content?: string;
  /** 标题 */
  title?: string;
  /** 描述 */
  subTitle?: string;
  /** 额外区（一般是按钮） */
  extra?: string;
}

export default resultTheme;
