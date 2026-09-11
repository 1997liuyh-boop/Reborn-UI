const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
/** 开关形态：circle 胶囊圆形（默认）/ round 圆角方形 / line 细线轨道 + 悬浮滑块 */
const type = ["circle", "round", "line"] as const;

export { color as switchColors, size as switchSizes, type as switchTypes };

export default {
  slots: {
    wrapper: "group/switch inline-flex items-center gap-3 cursor-pointer select-none",
    activeTrack: "",
    inactiveTrack: "bg-gray-5",
    input: "peer sr-only",
    track:
      "relative inline-flex items-center rounded-full transition-colors ring-1 ring-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-disabled:cursor-not-allowed data-[loading=true]:cursor-wait data-[loading=true]:opacity-80",
    // 参考 Ant Design 的位置过渡；左右边界始终留白 2px，不叠加横向位移和负边距。
    thumb:
      "absolute left-[2px] right-[max(2px,calc(100%_-_var(--re-switch-thumb-size)_-_2px))] top-[2px] w-auto flex items-center justify-center rounded-full bg-white shadow transition-[left,right] duration-200 ease-[ease-in-out] motion-reduce:transition-none",
    /** 两态文案共享网格占位，以较长内容撑宽；只过渡位移，不切换节点。 */
    inlineActive:
      "col-start-1 row-start-1 self-center min-w-0 max-w-full truncate transition-transform duration-200 ease-[ease-in-out] motion-reduce:transition-none text-white leading-none pointer-events-none select-none",
    /** 关态文案向右滑出，开态文案从左滑入；裁剪仅作用于文本容器。 */
    inlineInactive:
      "col-start-1 row-start-1 self-center min-w-0 max-w-full truncate transition-transform duration-200 ease-[ease-in-out] motion-reduce:transition-none text-gray-1 leading-none pointer-events-none select-none",
    /** 切换波纹：盖满轨道的空壳节点，动画（扩散 box-shadow + 淡出）在组件 scoped 样式里定义 */
    wave: "absolute inset-0 rounded-full pointer-events-none",
    // 两侧标签字号固定 14px（text-base），不随 size 变化
    activeLabel: "text-base text-gray-8",
    inactiveLabel: "text-base text-gray-8",
  },
  variants: {
    /**
     * 尺寸规格：滑块四周留白固定 2px（基础槽的 left-[2px] / top-[2px]），
     * 选中位移 = 轨道宽 − 滑块直径 − 4px 留白。
     */
    // 按压只向轨道内侧加宽，松开后恢复；禁用、加载和减弱动效时不拉伸。
    size: {
      sm: {
        track: "h-[16px] w-[28px]",
        thumb: "[--re-switch-thumb-size:12px] h-[var(--re-switch-thumb-size)]",
        // 点内文本：滑块侧内边距 = 滑块直径 + 6px 间隙，外侧 6px
        inlineActive: "pl-[6px] pr-[18px]",
        inlineInactive: "pl-[18px] pr-[6px]",
      },
      md: {
        track: "h-[24px] w-[44px]",
        thumb: "[--re-switch-thumb-size:20px] h-[var(--re-switch-thumb-size)]",
        inlineActive: "pl-[8px] pr-[26px]",
        inlineInactive: "pl-[26px] pr-[8px]",
      },
      lg: {
        track: "h-[32px] w-[60px]",
        thumb: "[--re-switch-thumb-size:28px] h-[var(--re-switch-thumb-size)]",
        inlineActive: "pl-[10px] pr-[34px]",
        inlineInactive: "pl-[34px] pr-[10px]",
      },
    },
    /** 轨道宽度是否随点内文本撑开：开启后固定宽变为最小宽，文本完整显示不省略 */
    autoWidth: {
      true: {},
      false: {},
    },
    /**
     * 形态：circle 胶囊圆形（默认，基础槽即是）；round 轨道与滑块换小圆角方形；
     * line 轨道压成细线（高度见 compoundVariants）、滑块居中骑在线上，位移逻辑不变。
     */
    type: {
      circle: {},
      round: {
        track: "rounded-ui-2xs",
        thumb: "rounded-ui-2xs",
        wave: "rounded-ui-2xs",
      },
      line: {
        track: "overflow-visible",
        // top-1/2 + translate-y 居中盖掉基础槽的 top-[2px]；补一圈淡描边把白滑块从浅色背景里衬出来
        thumb: "top-1/2 -translate-y-1/2 ring-1 ring-black/10",
      },
    },
    color: {
      primary: {
        activeTrack: "bg-primary",
      },
      secondary: {
        activeTrack: "bg-secondary",
      },
      success: {
        activeTrack: "bg-success",
      },
      info: {
        activeTrack: "bg-info",
      },
      warning: {
        activeTrack: "bg-warning",
      },
      error: {
        activeTrack: "bg-error",
      },
      neutral: {
        activeTrack: "bg-neutral",
      },
    },
    active: {
      true: {
        inlineActive: "translate-x-0",
        inlineInactive: "translate-x-full",
        // 开态固定右边界，按压只向左侧伸展；关态方向相反。
        thumb: "left-[max(2px,calc(100%_-_var(--re-switch-thumb-size)_-_2px))] right-[2px] motion-safe:group-[:active:not([data-disabled=true])]/switch:left-[max(2px,calc(100%_-_var(--re-switch-thumb-size)*1.3_-_2px))]",
        activeLabel: "font-medium",
        inactiveLabel: "text-gray-5",
      },
      false: {
        inlineActive: "-translate-x-full",
        inlineInactive: "translate-x-0",
        thumb: "motion-safe:group-[:active:not([data-disabled=true])]/switch:right-[max(2px,calc(100%_-_var(--re-switch-thumb-size)*1.3_-_2px))]",
        activeLabel: "text-gray-5",
        inactiveLabel: "text-gray-9 font-medium",
      },
    },
    disabled: {
      true: { inactiveTrack: "bg-gray-2", activeTrack: "bg-gray-2" },
    },
    error: {
      true: {
        track: "ring-red-5 focus-within:ring-red-5/20",
      },
    },
  },
  compoundVariants: [
    // autoWidth：固定宽降级为最小宽，轨道随点内文本撑开
    { autoWidth: true, size: "sm" as (typeof size)[number], class: { track: "w-auto min-w-[28px]" } },
    { autoWidth: true, size: "md" as (typeof size)[number], class: { track: "w-auto min-w-[44px]" } },
    { autoWidth: true, size: "lg" as (typeof size)[number], class: { track: "w-auto min-w-[60px]" } },
    // line 型轨道高度：约为滑块直径的一半，宽度与位移沿用 size 档
    { type: "line" as (typeof type)[number], size: "sm" as (typeof size)[number], class: { track: "h-[8px]" } },
    { type: "line" as (typeof type)[number], size: "md" as (typeof size)[number], class: { track: "h-[12px]" } },
    { type: "line" as (typeof type)[number], size: "lg" as (typeof size)[number], class: { track: "h-[16px]" } },
    // inline-prompt 文本字号随尺寸收缩（sm 轨道仅 16px 高）
    { size: "sm" as (typeof size)[number], class: { inlineActive: "text-[8px]", inlineInactive: "text-[8px]" } },
    { size: "md" as (typeof size)[number], class: { inlineActive: "text-[10px]", inlineInactive: "text-[10px]" } },
    { size: "lg" as (typeof size)[number], class: { inlineActive: "text-[12px]", inlineInactive: "text-[12px]" } },
    { color: "primary" as (typeof color)[number], active: true, class: { activeLabel: "text-primary" } },
    { color: "secondary" as (typeof color)[number], active: true, class: { activeLabel: "text-secondary" } },
    { color: "success" as (typeof color)[number], active: true, class: { activeLabel: "text-success" } },
    { color: "info" as (typeof color)[number], active: true, class: { activeLabel: "text-info" } },
    { color: "warning" as (typeof color)[number], active: true, class: { activeLabel: "text-warning" } },
    { color: "error" as (typeof color)[number], active: true, class: { activeLabel: "text-error" } },
    { color: "neutral" as (typeof color)[number], active: true, class: { activeLabel: "text-neutral" } },
    // Inactive states
    { color: "primary" as (typeof color)[number], active: false, class: { inactiveLabel: "text-primary" } },
    { color: "secondary" as (typeof color)[number], active: false, class: { inactiveLabel: "text-secondary" } },
    { color: "success" as (typeof color)[number], active: false, class: { inactiveLabel: "text-success" } },
    { color: "info" as (typeof color)[number], active: false, class: { inactiveLabel: "text-info" } },
    { color: "warning" as (typeof color)[number], active: false, class: { inactiveLabel: "text-warning" } },
    { color: "error" as (typeof color)[number], active: false, class: { inactiveLabel: "text-error" } },
    { color: "neutral" as (typeof color)[number], active: false, class: { inactiveLabel: "text-neutral" } },
  ],
  defaultVariants: {
    size: "md" as (typeof size)[number],
    color: "primary" as (typeof color)[number],
    type: "circle" as (typeof type)[number],
    autoWidth: false,
  },
};
