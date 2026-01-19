const size = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const variant = ['solid', 'outline', 'soft', 'subtle'] as const

export { size as badgeSizes, color as badgeColors, variant as badgeVariants }

export default {
  slots: {
    base: "font-medium inline-flex items-center justify-center", // Added justify-center
    label: "truncate",
    leadingIcon: "shrink-0",
    trailingIcon: "shrink-0",
    closeButton: "ml-1 inline-flex items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer",
    closeIcon: "shrink-0"
  },
  variants: {
    color: {
      primary: "",
      secondary: "",
      success: "",
      info: "",
      warning: "",
      error: "",
      neutral: ""
    },
    variant: {
      solid: "",
      outline: "",
      soft: "",
      subtle: ""
    },
    size: {
      xs: {
        base: "text-[20rpx] px-1 py-0.5 gap-1 rounded-sm",
        leadingIcon: "size-3",
        trailingIcon: "size-3",
        closeIcon: "size-3"
      },
      sm: {
        base: "text-[22rpx] px-1.5 py-1 gap-1 rounded-sm",
        leadingIcon: "size-3",
        trailingIcon: "size-3",
        closeIcon: "size-3"
      },
      md: {
        base: "text-[24rpx] px-2 py-1 gap-1 rounded-md",
        leadingIcon: "size-4",
        trailingIcon: "size-4",
        closeIcon: "size-4"
      },
      lg: {
        base: "text-[28rpx] px-2 py-1 gap-1.5 rounded-md",
        leadingIcon: "size-5",
        trailingIcon: "size-5",
        closeIcon: "size-5"
      },
      xl: {
        base: "text-[32rpx] px-2.5 py-1 gap-1.5 rounded-md",
        leadingIcon: "size-6",
        trailingIcon: "size-6",
        closeIcon: "size-6"
      }
    },
    square: {
      true: {
          base: "px-1" // Override padding for square aspect
      } 
    }
  },
  compoundVariants: [
    {
      color: "primary",
      variant: "solid",
      class: { base: "bg-primary text-primary-foreground" }
    },
    {
      color: "secondary",
      variant: "solid",
      class: { base: "bg-secondary text-secondary-foreground" }
    },
    {
      color: "success",
      variant: "solid",
      class: { base: "bg-success text-success-foreground" }
    },
    {
      color: "info",
      variant: "solid",
      class: { base: "bg-info text-info-foreground" }
    },
    {
      color: "warning",
      variant: "solid",
      class: { base: "bg-warning text-warning-foreground" }
    },
    {
      color: "error",
      variant: "solid",
      class: { base: "bg-error text-error-foreground" }
    },
    {
      color: "neutral",
      variant: "solid",
      class: { base: "bg-neutral text-neutral-foreground" }
    },
    {
      color: "primary",
      variant: "outline",
      class: { base: "text-primary border border-primary/50" }
    },
    // ... Add more outline variants as needed mapping colors
     {
      color: "error",
      variant: "outline",
      class: { base: "text-error border border-error/50" }
    },
     {
      color: "success",
      variant: "outline",
      class: { base: "text-success border border-success/50" }
    },
     {
      color: "warning",
      variant: "outline",
      class: { base: "text-warning border border-warning/50" }
    },
    {
      color: "info",
      variant: "outline",
      class: { base: "text-info border border-info/50" }
    },
    // Soft variants
     {
      color: "primary",
      variant: "soft",
      class: { base: "bg-primary/10 text-primary" }
    },
     {
      color: "error",
      variant: "soft",
      class: { base: "bg-error/10 text-error" }
    },
    {
      color: "success",
      variant: "soft",
      class: { base: "bg-success/10 text-success" }
    },
     {
      color: "warning",
      variant: "soft",
      class: { base: "bg-warning/10 text-warning" }
    },
    {
      color: "info",
      variant: "soft",
      class: { base: "bg-info/10 text-info" }
    },
    // Square variants adjustments
    {
        size: "xs",
        square: true,
        class: { base: "w-4 h-4 p-0 items-center justify-center" }
    },
     {
        size: "sm",
        square: true,
        class: { base: "w-5 h-5 p-0 items-center justify-center" }
    },
     {
        size: "md",
        square: true,
        class: { base: "w-6 h-6 p-0 items-center justify-center" }
    },
     {
        size: "lg",
        square: true,
        class: { base: "w-7 h-7 p-0 items-center justify-center" }
    },
  ],
  defaultVariants: {
    color: "primary",
    variant: "solid",
    size: "md"
  }
}
