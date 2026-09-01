const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const variant = ["filled", "outlined"] as const;
const direction = ["horizontal", "vertical"] as const;

export {
  size as checkboxSizes,
  color as checkboxColors,
  variant as checkboxVariants,
  direction as checkboxDirections,
};

/** 多选框选项值类型 */
export type CheckboxValue = string | number | boolean;

/** 复选框组 options 属性的对象写法 */
export interface CheckboxOption {
  /** 选项文案，复杂内容请改用 label 插槽 */
  label?: string;
  /** 选项的值 */
  value: CheckboxValue;
  /** 是否禁用该选项 */
  disabled?: boolean;
  /** 该选项是否为半选状态 */
  indeterminate?: boolean;
}

export default {
  slots: {
    wrapper: "inline-flex items-center gap-3 cursor-pointer select-none",
    input: "peer sr-only",
    // 显形规则用 :not([data-dot]) 排除半选方块：方块靠自身的 scale-50 缩小，
    // 若被 [&>*]:scale-100 命中就会被顶回原尺寸撑满整个勾选框
    control:
      "flex items-center justify-center rounded-ui-2xs border border-gray-4 bg-white text-white transition-colors ring-1 ring-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-checked:[&>*:not([data-dot])]:opacity-100 peer-checked:[&>*:not([data-dot])]:scale-100 data-[indeterminate=true]:[&>*:not([data-dot])]:opacity-100 data-[indeterminate=true]:[&>*:not([data-dot])]:scale-100",
    icon: "size-4 opacity-0 scale-75 transition-all",
    // outlined 变体的半选方块：与勾选框同尺寸同圆角，再整体缩到 50%。
    // 这样圆角随之等比减半，形状与外框一致；transform 以中心为原点，也不会像
    // size-1/2 那样因为 18px 的一半是奇数而出现半像素偏移导致视觉不居中。
    // 只在半选时挂载，故不写 opacity-0 这类入场过渡（永远看不到）。
    dot: "size-full rounded-ui-2xs scale-50",
    label: "text-gray-9",
  },
  variants: {
    size: {
      sm: {
        control: "size-4",
        label: "text-[length:var(--text-size-24)]",
      },
      md: {
        control: "size-5",
        label: "text-[length:var(--text-size-26)]",
      },
      lg: {
        control: "size-6",
        label: "text-[length:var(--text-size-28)]",
      },
    },
    /** 配色本身不带样式，实际类名由 color × variant 的复合变体给出 */
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    /** 形态本身不带配色，同样交给复合变体 */
    variant: {
      filled: {},
      outlined: {},
    },
    error: {
      true: {
        control: "border-red-5 ring-red-5/20",
      },
    },
    // 禁用态：独立的状态维度，由组件传入的 isDisabled 直接驱动。
    disabled: {
      true: {
        wrapper: "cursor-not-allowed",
        control: "border-gray-2 bg-gray-4 ring-transparent",
        // 禁用且已选中时仍要看得见勾，只是降到灰阶（配色复合变体已被门控掉，这里必须自己给色）
        icon: "text-gray-2",
        dot: "bg-gray-2",
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      color: "primary" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      disabled: false,
      class: {
        control:
          "peer-checked:bg-primary peer-checked:border-primary data-[indeterminate=true]:bg-primary data-[indeterminate=true]:border-primary",
        icon: "text-white",
      },
    },
    {
      color: "primary" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      disabled: false,
      class: {
        control: "peer-checked:border-primary",
        icon: "text-primary",
        dot: "bg-primary",
      },
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      disabled: false,
      class: {
        control:
          "peer-checked:bg-secondary peer-checked:border-secondary data-[indeterminate=true]:bg-secondary data-[indeterminate=true]:border-secondary",
        icon: "text-white",
      },
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      disabled: false,
      class: {
        control: "peer-checked:border-secondary",
        icon: "text-secondary",
        dot: "bg-secondary",
      },
    },
    {
      color: "success" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      disabled: false,
      class: {
        control:
          "peer-checked:bg-success peer-checked:border-success data-[indeterminate=true]:bg-success data-[indeterminate=true]:border-success",
        icon: "text-white",
      },
    },
    {
      color: "success" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      disabled: false,
      class: {
        control: "peer-checked:border-success",
        icon: "text-success",
        dot: "bg-success",
      },
    },
    {
      color: "info" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      disabled: false,
      class: {
        control:
          "peer-checked:bg-info peer-checked:border-info data-[indeterminate=true]:bg-info data-[indeterminate=true]:border-info",
        icon: "text-white",
      },
    },
    {
      color: "info" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      disabled: false,
      class: {
        control: "peer-checked:border-info",
        icon: "text-info",
        dot: "bg-info",
      },
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      disabled: false,
      class: {
        control:
          "peer-checked:bg-warning peer-checked:border-warning data-[indeterminate=true]:bg-warning data-[indeterminate=true]:border-warning",
        icon: "text-white",
      },
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      disabled: false,
      class: {
        control: "peer-checked:border-warning",
        icon: "text-warning",
        dot: "bg-warning",
      },
    },
    {
      color: "error" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      disabled: false,
      class: {
        control:
          "peer-checked:bg-error peer-checked:border-error data-[indeterminate=true]:bg-error data-[indeterminate=true]:border-error",
        icon: "text-white",
      },
    },
    {
      color: "error" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      disabled: false,
      class: {
        control: "peer-checked:border-error",
        icon: "text-error",
        dot: "bg-error",
      },
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      disabled: false,
      class: {
        control:
          "peer-checked:bg-neutral peer-checked:border-neutral data-[indeterminate=true]:bg-neutral data-[indeterminate=true]:border-neutral",
        icon: "text-white",
      },
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      disabled: false,
      class: {
        control: "peer-checked:border-neutral",
        icon: "text-neutral",
        dot: "bg-neutral",
      },
    },
  ],
  defaultVariants: {
    size: "md" as (typeof size)[number],
    color: "primary" as (typeof color)[number],
    variant: "filled" as (typeof variant)[number],
    /** 必须给默认值：否则未传 disabled 时该维度为 undefined，复合变体的 disabled: false 匹配不上，配色会整体丢失 */
    disabled: false,
  },
};

/** 复选框组的样式定义，仅有根节点一个区域 */
export const checkboxGroupTheme = {
  slots: {
    root: "reborn-checkbox-group flex flex-wrap gap-4",
  },
  variants: {
    /** 排列方向 */
    direction: {
      horizontal: {
        root: "flex-row items-center",
      },
      vertical: {
        root: "flex-col items-start",
      },
    },
  },
  defaultVariants: {
    direction: "horizontal" as (typeof direction)[number],
  },
};
