const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as selectSizes, colors as selectColors };

export default {
    slots: {
        option: "flex items-center cursor-pointer transition-colors leading-normal text-gray-7 dark:text-gray-2 data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none data-[disabled=true]:hover:bg-transparent",
        optionContent: "flex w-full items-center justify-between gap-2",
        optionLabel: "flex-1 truncate",
        optionActive: "",
        optionActiveIcon: "size-4 opacity-75 shrink-0",
        optionHighlight: "bg-gray-50 dark:bg-gray-700/50",
        empty: "flex items-center justify-center py-6 text-sm text-gray-400",
        dropdown: "max-h-60 overflow-y-auto scrollbar-hide",
    },
    variants: {
        size: {
            sm: {
                option: "h-input-sm text-body-sm px-2 leading-none",
            },
            md: {
                option: "h-input-md text-body-base px-3",
            },
            lg: {
                option: "h-input-lg text-body-base  px-4",
            },
        },
        color: {
            primary: {
                trigger: "group-focus:border-primary data-[state=open]:border-primary",
                optionActive: "bg-primary/10 dark:bg-primary/80 text-primary",
            },
            secondary: {
                trigger: "group-focus:border-secondary data-[state=open]:border-secondary",
                optionActive: "bg-secondary/10 dark:bg-secondary/80 text-secondary",
            },
            success: {
                trigger: "group-focus:border-success data-[state=open]:border-success",
                optionActive: "bg-success/10 dark:bg-success/80 text-success",
            },
            info: {
                trigger: "group-focus:border-info data-[state=open]:border-info",
                optionActive: "bg-info/10 dark:bg-info/80 text-info",
            },
            warning: {
                trigger: "group-focus:border-warning data-[state=open]:border-warning",
                optionActive: "bg-warning/10 dark:bg-warning/80 text-warning",
            },
            error: {
                trigger: "group-focus:border-error data-[state=open]:border-error",
                optionActive: "bg-error/10 dark:bg-error/80 text-error",
            },
            neutral: {
                trigger: "group-focus:border-neutral data-[state=open]:border-neutral",
                optionActive: "bg-neutral/10 dark:bg-neutral/80 text-neutral",
            },
        },
        open: {
            true: {},
        },
        disabled: {
            true: {},
        },
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
    },
};
