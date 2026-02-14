const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export default {
    slots: {
        root: "relative inline-flex items-center",
        inner: "absolute top-0 h-full z-10 opacity-0 w-full left-0",
        list: "flex flex-row relative gap-1",
        item: "flex flex-row items-center justify-center duration-100 border border-solid border-surface-200 rounded-lg bg-gray-1 dark:bg-gray-8 ",
        value: "text-inherit font-medium",
        cursor: "absolute  w-[1px] h-[60%]",
    },
    variants: {
        size: {
            sm: {
                item: "h-8 w-8 text-xs",
            },
            md: {
                item: "h-10 w-10 text-sm",
            },
            lg: {
                item: "h-12 w-12 text-base",
            },
        },
        color: {
            primary: {
                item: "data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/20 data-[active=true]:text-primary",
                cursor: "bg-primary"
            },
            secondary: {
                item: "data-[active=true]:border-secondary data-[active=true]:ring-2 data-[active=true]:ring-secondary/20 data-[active=true]:text-secondary",
                cursor: "bg-secondary"
            },
            success: {
                item: "data-[active=true]:border-success data-[active=true]:ring-2 data-[active=true]:ring-success/20 data-[active=true]:text-success",
                cursor: "bg-success"
            },
            info: {
                item: "data-[active=true]:border-info data-[active=true]:ring-2 data-[active=true]:ring-info/20 data-[active=true]:text-info",
                cursor: "bg-info"
            },
            warning: {
                item: "data-[active=true]:border-warning data-[active=true]:ring-2 data-[active=true]:ring-warning/20 data-[active=true]:text-warning",
                cursor: "bg-warning"
            },
            error: {
                item: "data-[active=true]:border-error data-[active=true]:ring-2 data-[active=true]:ring-error/20 data-[active=true]:text-error",
                cursor: "bg-error"
            },
            neutral: {
                item: "data-[active=true]:border-neutral data-[active=true]:ring-2 data-[active=true]:ring-neutral/20 data-[active=true]:text-neutral",
                cursor: "bg-neutral"
            },
        },
        disabled: {
            true: {
                root: "opacity-50 pointer-events-none",
                item: "bg-muted",
            },
        },
    },
    defaultVariants: {
        size: "md",
        color: "primary",
    },
} as const;


export { sizes as inputOtpSizes, colors as inputOtpColors };
