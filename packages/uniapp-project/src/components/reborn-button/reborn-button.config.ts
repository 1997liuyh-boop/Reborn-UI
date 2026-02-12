export const buttonColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
export const buttonVariants = ["solid", "outline", "soft", "subtle"] as const;

export const buttonSizes = [
    "xs",
    "sm",
    "default", // Mapped to md
    "md",
    "lg",
    "xl",
    "2xl",
] as const;

export default {
    slots: {
        base: "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-gdray-4 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        label: "truncate",
        loading: "border-2 border-gray-3 border-t-current rounded-full animate-spin",
        leadingIcon: "shrink-0",
        leadingAvatar: "shrink-0",
        leadingAvatarSize: "",
        trailingIcon: "shrink-0",
    },
    variants: {
        fieldGroup: {
            horizontal:
                "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]",
            vertical:
                "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]",
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
        variant: {
            solid: "",
            outline: "",
            soft: "",
            subtle: "",
        },
        size: {
            xs: {
                base: "h-[var(--button-xs-height)] text-24 gap-1.5 px-3",
                loading: "size-3",
            },
            sm: {
                base: "h-[var(--button-sm-height)] text-24 gap-1.5 px-3",
                loading: "size-3.5",
            },
            default: {
                base: "h-[var(--button-base-height)] text-26 px-4",
                loading: "size-4",
            },
            md: {
                base: "h-[var(--button-base-height)] text-26 px-4",
                loading: "size-4",
            },
            lg: {
                base: "h-[var(--button-lg-height)] text-28 px-6",
                loading: "size-5",
            },
            xl: {
                base: "h-[var(--button-xl-height)] text-30 px-6",
                loading: "size-6",
            },
            "2xl": {
                base: "h-[var(--button-2xl-height)] text-32 px-6",
                loading: "size-7",
            },
        },
        square: {
            true: { base: "p-0" },
        },
    },
    compoundVariants: [
        // Solid Variants
        {
            color: "primary" as (typeof buttonColors)[number],
            variant: "solid" as (typeof buttonVariants)[number],
            class: "bg-primary text-white hover:bg-primary/75",
        },
        {
            color: "secondary" as (typeof buttonColors)[number],
            variant: "solid" as (typeof buttonVariants)[number],
            class: "bg-secondary text-white hover:bg-secondary/75",
        },
        {
            color: "success" as (typeof buttonColors)[number],
            variant: "solid" as (typeof buttonVariants)[number],
            class: "bg-success text-white hover:bg-success/75",
        },
        {
            color: "info" as (typeof buttonColors)[number],
            variant: "solid" as (typeof buttonVariants)[number],
            class: "bg-info text-white hover:bg-info/75",
        },
        {
            color: "warning" as (typeof buttonColors)[number],
            variant: "solid" as (typeof buttonVariants)[number],
            class: "bg-warning text-white hover:bg-warning/75",
        },
        {
            color: "error" as (typeof buttonColors)[number],
            variant: "solid" as (typeof buttonVariants)[number],
            class: "bg-error text-white hover:bg-error/75",
        },
        {
            color: "neutral" as (typeof buttonColors)[number],
            variant: "solid" as (typeof buttonVariants)[number],
            class: "bg-neutral text-white hover:bg-neutral/75",
        },

        // Outline Variants
        {
            color: "primary" as (typeof buttonColors)[number],
            variant: "outline" as (typeof buttonVariants)[number],
            class:
                "bg-transparent text-primary border border-primary hover:bg-primary/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        },
        {
            color: "secondary" as (typeof buttonColors)[number],
            variant: "outline" as (typeof buttonVariants)[number],
            class:
                "bg-transparent text-secondary border border-secondary hover:bg-secondary/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        },
        {
            color: "success" as (typeof buttonColors)[number],
            variant: "outline" as (typeof buttonVariants)[number],
            class:
                "bg-transparent text-success border border-success hover:bg-success/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        },
        {
            color: "info" as (typeof buttonColors)[number],
            variant: "outline" as (typeof buttonVariants)[number],
            class:
                "bg-transparent text-info border border-info hover:bg-info/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        },
        {
            color: "warning" as (typeof buttonColors)[number],
            variant: "outline" as (typeof buttonVariants)[number],
            class:
                "bg-transparent text-warning border border-warning hover:bg-warning/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        },
        {
            color: "error" as (typeof buttonColors)[number],
            variant: "outline" as (typeof buttonVariants)[number],
            class:
                "bg-transparent text-error border border-error hover:bg-error/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        },
        {
            color: "neutral" as (typeof buttonColors)[number],
            variant: "outline" as (typeof buttonVariants)[number],
            class:
                "bg-transparent text-neutral border border-neutral hover:bg-neutral/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        },

        // Soft Variants
        {
            color: "primary" as (typeof buttonColors)[number],
            variant: "soft" as (typeof buttonVariants)[number],
            class: "bg-primary bg-opacity-10 text-primary hover:bg-opacity-20",
        },
        {
            color: "secondary" as (typeof buttonColors)[number],
            variant: "soft" as (typeof buttonVariants)[number],
            class: "bg-secondary bg-opacity-10 text-secondary hover:bg-opacity-20",
        },
        {
            color: "success" as (typeof buttonColors)[number],
            variant: "soft" as (typeof buttonVariants)[number],
            class: "bg-success bg-opacity-10 text-success hover:bg-opacity-20",
        },
        {
            color: "info" as (typeof buttonColors)[number],
            variant: "soft" as (typeof buttonVariants)[number],
            class: "bg-info bg-opacity-10 text-info hover:bg-opacity-20",
        },
        {
            color: "warning" as (typeof buttonColors)[number],
            variant: "soft" as (typeof buttonVariants)[number],
            class: "bg-warning bg-opacity-10 text-warning hover:bg-opacity-20",
        },
        {
            color: "error" as (typeof buttonColors)[number],
            variant: "soft" as (typeof buttonVariants)[number],
            class: "bg-error bg-opacity-10 text-error hover:bg-opacity-20",
        },
        {
            color: "neutral" as (typeof buttonColors)[number],
            variant: "soft" as (typeof buttonVariants)[number],
            class: "bg-neutral bg-opacity-10 text-neutral hover:bg-opacity-20",
        },

        // Subtle Variants
        {
            color: "primary" as (typeof buttonColors)[number],
            variant: "subtle" as (typeof buttonVariants)[number],
            class: "bg-primary bg-opacity-10 border border-primary text-primary hover:bg-opacity-20",
        },
        {
            color: "secondary" as (typeof buttonColors)[number],
            variant: "subtle" as (typeof buttonVariants)[number],
            class:
                "bg-secondary bg-opacity-10 border border-secondary text-secondary hover:bg-opacity-20",
        },
        {
            color: "success" as (typeof buttonColors)[number],
            variant: "subtle" as (typeof buttonVariants)[number],
            class: "bg-success bg-opacity-10 border border-success text-success hover:bg-opacity-20",
        },
        {
            color: "info" as (typeof buttonColors)[number],
            variant: "subtle" as (typeof buttonVariants)[number],
            class: "bg-info bg-opacity-10 border border-info text-info hover:bg-opacity-20",
        },
        {
            color: "warning" as (typeof buttonColors)[number],
            variant: "subtle" as (typeof buttonVariants)[number],
            class: "bg-warning bg-opacity-10 border border-warning text-warning hover:bg-opacity-20",
        },
        {
            color: "error" as (typeof buttonColors)[number],
            variant: "subtle" as (typeof buttonVariants)[number],
            class: "bg-error bg-opacity-10 border border-error text-error hover:bg-opacity-20",
        },
        {
            color: "neutral" as (typeof buttonColors)[number],
            variant: "subtle" as (typeof buttonVariants)[number],
            class: "bg-neutral bg-opacity-10 border border-neutral text-neutral hover:bg-opacity-20",
        },
    ],
    defaultVariants: {
        color: "primary" as (typeof buttonColors)[number],
        variant: "solid" as (typeof buttonVariants)[number],
        size: "md" as (typeof buttonSizes)[number],
    },
};
