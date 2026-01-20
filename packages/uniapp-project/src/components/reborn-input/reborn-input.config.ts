const size = ['sm', 'md', 'lg'] as const
const variant = ['outline', 'filled', 'flushed'] as const // Common input variants

export { size as inputSizes, variant as inputVariants }

export default {
  slots: {
        wrapper: "relative flex items-center w-full rounded-md border transition-colors focus-within:ring-2 focus-within:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        input: "flex-1 bg-transparent outline-none min-w-0 placeholder:text-muted-foreground",
        leading: "flex shrink-0 items-center justify-center text-muted-foreground mr-2",
        trailing: "flex shrink-0 items-center justify-center text-muted-foreground ml-2",
        icon: "text-lg" // Default icon size class if needed
  },
  variants: {
    size: {
      sm: {
        wrapper: "h-8 px-3 text-xs",
        input: "text-xs",
        icon: "text-xs"
      },
      md: {
        wrapper: "h-10 px-3 text-sm",
        input: "text-sm",
        icon: "text-base"
      },
      lg: {
         wrapper: "h-12 px-4 text-base",
         input: "text-base",
         icon: "text-lg"
      },
    },
    variant: {
        outline: {
            wrapper: "border-input bg-background focus-within:ring-ring focus-within:border-primary",
        },
        filled: {
            wrapper: "border-transparent bg-secondary focus-within:bg-background focus-within:ring-ring",
        },
        flushed: {
            wrapper: "rounded-none border-b border-input bg-transparent px-0 focus-within:ring-0 focus-within:border-primary shadow-none",
        }
    },
    error: {
        true: {
            wrapper: "border-error focus-within:ring-error",
            input: "text-error placeholder:text-error/50",
            leading: "text-error",
            trailing: "text-error"
        }
    }
  },
  defaultVariants: {
    size: "md",
    variant: "outline",
    error: false
  },
}
