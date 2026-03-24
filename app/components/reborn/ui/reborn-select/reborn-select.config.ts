const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as selectSizes, colors as selectColors };

export const selectAnimations = {
    enterActiveClass: "transition duration-150 ease-out",
    enterFromClass: "opacity-0 -translate-y-1",
    enterToClass: "opacity-100 translate-y-0",
    leaveActiveClass: "transition duration-100 ease-in",
    leaveFromClass: "opacity-100 translate-y-0",
    leaveToClass: "opacity-0 -translate-y-1",
};

export default {
    slots: {
        wrapper: "relative inline-flex w-full group outline-none",
        trigger:
            "flex w-full items-center justify-between leading-normal border border-gray-3 dark:border-gray-6 bg-gray-1 dark:bg-gray-8 transition-colors cursor-pointer select-none outline-none",
        triggerText: "truncate text-gray-8 dark:text-gray-1",
        placeholder: "text-gray-4 dark:text-gray-5",
        arrow: "transition-transform duration-200 text-gray-4 shrink-0",
        dropdown:
            "absolute z-50 mt-1 w-full border border-gray-2 dark:border-gray-7 bg-white dark:bg-gray-8 shadow-lg overflow-auto max-h-[240px] top-full scrollbar-hide",
        option:
            "flex items-center cursor-pointer transition-colors leading-normal text-gray-7 dark:text-gray-2 data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none data-[disabled=true]:hover:bg-transparent",
        optionActive: "",
        optionHighlight: "",
        empty: "flex items-center justify-center py-6 text-sm text-gray-400",
        clearBtn: "shrink-0 text-gray-4 hover:text-gray-6 dark:hover:text-gray-3 cursor-pointer",
    },
    variants: {
        size: {
            sm: {
                trigger: "h-input-sm px-2 text-26 gap-1 rounded-ui-sm leading-none",
                option: "h-input-sm text-26 px-2 leading-none",
                dropdown: "rounded-ui-sm",
                arrow: "size-3",
                clearBtn: "size-3",
            },
            md: {
                trigger: "h-input-md px-3 text-28 gap-2 rounded-ui-md",
                option: "h-input-md text-28 px-3",
                dropdown: "rounded-ui-md",
                arrow: "size-4",
                clearBtn: "size-4",
            },
            lg: {
                trigger: "h-input-lg px-4 text-28 gap-2 rounded-ui-base",
                option: "h-input-lg text-28  px-4",
                dropdown: "rounded-ui-base",
                arrow: "size-5",
                clearBtn: "size-5",
            },
        },
        color: {
            primary: {
                trigger: "group-focus:border-primary data-[state=open]:border-primary",
                optionActive: "bg-primary/10 text-primary",
            },
            secondary: {
                trigger: "group-focus:border-secondary data-[state=open]:border-secondary",
                optionActive: "bg-secondary/10 text-secondary",
            },
            success: {
                trigger: "group-focus:border-success data-[state=open]:border-success",
                optionActive: "bg-success/10 text-success",
            },
            info: {
                trigger: "group-focus:border-info data-[state=open]:border-info",
                optionActive: "bg-info/10 text-info",
            },
            warning: {
                trigger: "group-focus:border-warning data-[state=open]:border-warning",
                optionActive: "bg-warning/10 text-warning",
            },
            error: {
                trigger: "group-focus:border-error data-[state=open]:border-error",
                optionActive: "bg-error/10 text-error",
            },
            neutral: {
                trigger: "group-focus:border-neutral data-[state=open]:border-neutral",
                optionActive: "bg-neutral/10 text-neutral",
            },
        },
        open: {
            true: { arrow: "rotate-180" },
        },
        disabled: {
            true: {
                trigger: "opacity-50 pointer-events-none cursor-not-allowed bg-gray-50 dark:bg-gray-900",
            },
        },
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
    },
};
