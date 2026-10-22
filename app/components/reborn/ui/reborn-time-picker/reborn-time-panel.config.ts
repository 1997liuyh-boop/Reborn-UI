const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const timeUnits = ["hour", "minute", "second", "millisecond"] as const;
const variants = ["filled", "outlined"] as const;

export type TimeUnit = (typeof timeUnits)[number];
export type TimeRangeRole = "start" | "end";
export {
  variants as timePanelVariants,
  colors as timePickerColors,
  sizes as timePickerSizes,
  timeUnits,
};

export default {
  slots: {
    wrapper: "w-full",
    body: "px-1 py-2",
    rangeWrapper: "grid gap-4 sm:grid-cols-[1fr_auto_1fr]",
    rangeSeparator: "hidden items-center justify-center text-gray-5 sm:flex",
    section: "min-w-0",
    columns: "flex w-full divide-x divide-gray-2",
    column:
      "relative min-w-0 flex-1 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary",
    arrowButton:
      "flex h-5 w-full cursor-pointer items-center justify-center text-gray-6 hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-40",
    list: "h-time-picker-panel-list-height w-full",
    // 本组件按设计稿将局部行高令牌设为 150%，不修改全局 14px / 22px 档位；单项为 21px + 8px。
    item: "relative flex h-time-picker-panel-item w-full shrink-0 cursor-pointer items-center justify-center px-5 py-1 text-base [--text-base--line-height:1.5] text-gray-9 transition-colors hover:bg-gray-2 motion-reduce:transition-none",
    itemActive: "font-normal",
    // 状态类作为 item 的 class 参数合并，文字色、光标、悬停背景才能覆盖 item 的默认值；
    // 若与 item 并列输出，两组同类工具类同时生效，按 CSS 先后顺序反而是 item 的取值胜出。
    itemDisabled: "cursor-not-allowed text-gray-5 hover:bg-transparent",
    itemIdle: "font-normal",
    indicator: "pointer-events-none absolute inset-x-0 top-1/2 h-time-picker-panel-item -translate-y-1/2",
    // 保留旧的覆盖键，但默认不使用渐变遮罩，避免改变指定的文字色。
    mask: "pointer-events-none absolute inset-0",
    footer: "flex items-center justify-center gap-2 border-t border-gray-2 px-1 py-2",
  },
  variants: {
    size: { sm: {}, md: {}, lg: {} },
    color: {
      primary: { wrapper: "[--time-color-1:var(--color-brand-1)]" },
      secondary: { wrapper: "[--time-color-1:var(--color-secondary-1)]" },
      success: { wrapper: "[--time-color-1:var(--color-green-1)]" },
      info: { wrapper: "[--time-color-1:var(--color-blue-1)]" },
      warning: { wrapper: "[--time-color-1:var(--color-orange-1)]" },
      error: { wrapper: "[--time-color-1:var(--color-red-1)]" },
      neutral: { wrapper: "[--time-color-1:var(--color-gray-2)]" },
    },
    variant: {
      filled: { indicator: "bg-(--time-color-1)" },
      // 描边浮在选项之上，避免悬停背景遮挡；填充态仍置于文字下方。
      // 上下线各自缩放为半像素，避免小数边框被取整；不缩放中心选中区域。
      outlined: {
        indicator: [
          "z-10",
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:origin-top before:scale-y-50 before:bg-gray-6 before:content-['']",
          "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-bottom after:scale-y-50 after:bg-gray-6 after:content-['']",
        ].join(" "),
      },
    },
    arrowControl: { false: { arrowButton: "hidden" } },
    // 只屏蔽子元素的指针，外壳接住指针显示禁止光标；各交互处理函数已按 disabled 拦截
    disabled: { true: { wrapper: "cursor-not-allowed opacity-50 [&_*]:pointer-events-none" } },
  },
  defaultVariants: { size: "md", color: "primary", variant: "filled" } as const,
};
