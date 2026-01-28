const size = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const variant = ['line', 'card'] as const

export { size as TabsSizes, color as TabsColors, variant as TabsVariants }

export default {
    slots: {
        tabs: '',
        scrollbar: 'flex flex-row w-full h-full',
        inner: 'flex flex-row relative',
        item: 'flex flex-row items-center justify-center h-full relative z-10 transition-colors group',
        text: 'font-medium whitespace-nowrap',
        line: 'absolute bottom-0 left-0 h-[2px] bg-[linear-gradient(90deg,var(--color-red-6),var(--color-red-3),var(--color-blue-1),var(--color-orange-1))] bg-[length:200%] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform',
        slider: 'absolute top-0 left-0 h-full w-full bg-primary text-white rounded-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform z-0',
        active: 'font-medium whitespace-nowrap'
    },
    variants: {
        variant: {
            line: {
                inner: '',
                item: 'hover:text-gray-900 dark:hover:text-gray-100', // Removed static border-b-2
                text: 'text-gray-500 dark:text-gray-400',
                active: 'text-primary'
            },
            card: {
                inner: '',
                item: 'rounded-md',
                text: 'text-gray-500 dark:text-gray-400',
                active: 'text-white'
            }
        },
        color: {
            primary: {
                item: "data-[state=active]:text-primary",
                slider: "bg-primary",
                line: "bg-gradient-to-r from-primary to-transparent"
            },
            secondary: {
                item: "data-[state=active]:text-secondary",
                slider: "bg-secondary",
                line: "bg-gradient-to-r from-secondary to-transparent"
            },
            success: {
                item: "data-[state=active]:text-success",
                slider: "bg-success",
                line: "bg-gradient-to-r from-success to-transparent"
            },
            info: {
                item: "data-[state=active]:text-info",
                slider: "bg-info",
                line: "bg-gradient-to-r from-info to-transparent"
            },
            warning: {
                item: "data-[state=active]:text-warning",
                slider: "bg-warning",
                line: "bg-gradient-to-r from-warning to-transparent"
            },
            error: {
                item: "data-[state=active]:text-error",
                slider: "bg-error",
                line: "bg-gradient-to-r from-error to-transparent"
            },
            neutral: {
                item: "data-[state=active]:text-neutral",
                slider: "bg-neutral",
                line: "bg-gradient-to-r from-neutral to-transparent"
            }
        },
        size: {
            xs: {
                item: 'px-2 py-1.5 text-xs',
                text: 'text-xs'
            },
            sm: {
                item: 'px-3 py-2 text-sm',
                text: 'text-sm'
            },
            md: {
                item: 'px-4 py-2.5 text-base',
                text: 'text-base'
            },
            lg: {
                item: 'px-5 py-3 text-lg',
                text: 'text-lg'
            },
            xl: {
                item: 'px-6 py-3.5 text-xl',
                text: 'text-xl'
            }
        },
        fill: {
            true: {
                inner: 'w-full',
                item: 'flex-1'
            }
        },
        justify: {
            start: {
                inner: 'justify-start'
            },
            center: {
                inner: 'justify-center'
            },
            end: {
                inner: 'justify-end'
            }
        }
    },
    compoundVariants: [
        {
            variant: 'line' as (typeof variant)[number],
            color: 'primary' as (typeof color)[number],
            class: {
                item: 'data-[state=active]:text-primary', // Removed static border-primary
                active: 'text-primary'
            }
        },
        {
            variant: 'line' as (typeof variant)[number],
            color: 'secondary' as (typeof color)[number],
            class: {
                item: 'data-[state=active]:text-secondary', // Removed static border-primary
                active: 'text-secondary'
            }
        },
        {
            variant: 'line' as (typeof variant)[number],
            color: 'success' as (typeof color)[number],
            class: {
                item: 'data-[state=active]:text-success', // Removed static border-primary
                active: 'text-success'
            }
        },
        {
            variant: 'line' as (typeof variant)[number],
            color: 'info' as (typeof color)[number],
            class: {
                item: 'data-[state=active]:text-info', // Removed static border-primary
                active: 'text-info'
            }
        },
        {
            variant: 'line' as (typeof variant)[number],
            color: 'warning' as (typeof color)[number],
            class: {
                item: 'data-[state=active]:text-warning', // Removed static border-primary
                active: 'text-warning'
            }
        },
        {
            variant: 'line' as (typeof variant)[number],
            color: 'error' as (typeof color)[number],
            class: {
                item: 'data-[state=active]:text-error', // Removed static border-primary
                active: 'text-error'
            }
        },
        {
            variant: 'line' as (typeof variant)[number],
            color: 'neutral' as (typeof color)[number],
            class: {
                item: 'data-[state=active]:text-neutral', // Removed static border-primary
                active: 'text-neutral'
            }
        },
    ],
    defaultVariants: {
        variant: 'line' as (typeof variant)[number],
        color: 'primary' as (typeof color)[number],
        size: 'xs' as (typeof size)[number],
        fill: false,
        justify: 'start' as 'start' | 'center' | 'end'
    }
}
