export const tabsVariants = ['line', 'solid'] as const
export const tabsSizes = ['sm', 'md', 'lg'] as const
export const tabsOrientations = ['horizontal', 'vertical'] as const
export const tabsShrinkDirections = ['start', 'center', 'end'] as const

export default {
    slots: {
        base: 'flex flex-col gap-2', // Removed w-full to prevent overflow in constrained parents
        list: 'relative flex max-w-full box-border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', // Removed w-full from global, forcing it only on horizontal
        trigger: 'relative z-10 inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-32 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1',
        content: 'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        indicator: 'absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-red-6 to-orange-1 transition-all duration-300 ease-in-out z-0 opacity-90 rounded-full -translate-y-1'
    },
    variants: {
        variant: {
            line: {
                list: 'border-b border-border border-gray-2',
                trigger: 'bg-transparent shadow-none border-b-2 border-transparent rounded-none hover:text-primary/80 data-[state=active]:text-primary',
                indicator: 'block'
            },
            solid: {
                list: 'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
                trigger: 'rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                indicator: 'hidden'
            }
        },
        orientation: {
            horizontal: {
                base: 'flex-col w-full h-full min-w-0 max-w-full overflow-hidden',
                list: 'flex-row w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden shrink-0', // Added w-full here
                trigger: 'shrink-0',
                indicator: 'h-1.5 w-[var(--radix-tabs-indicator-width)] translate-x-[var(--radix-tabs-indicator-position)] bottom-2',
                content: 'flex-1 w-full overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
            },
            vertical: {
                base: 'flex-row items-start gap-4 h-full [&>*:not([role=tablist])]:flex-1 [&>*:not([role=tablist])]:w-full [&>*:not([role=tablist])]:h-full', // Enforce flex layout on content wrapper
                list: 'flex-col w-auto h-full overflow-y-auto overflow-x-hidden border-b-0 border-r border-border', // h-fit ensures list height matches triggers
                trigger: 'flex-initial w-full justify-start border-b-0 border-r-0 rounded-none data-[state=active]:border-primary',
                indicator: 'hidden',
                content: 'flex-1 w-full h-full overflow-y-auto mt-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' // Restrict height to parent, scroll internal content
            }
        },
        size: {
            sm: {
                trigger: 'text-28 px-2.5 py-1'
            },
            md: {
                trigger: 'text-32 px-3 py-1.5'
            },
            lg: {
                trigger: 'text-36 px-4 py-2'
            }
        },
        sticky: {
            true: {
                list: 'sticky top-0 z-50 bg-background'
            }
        },
        shrink: {
            true: {
                // When shrinking is enabled (user wants compaction):
                // We override the default "flex-1" (grow) behavior to "flex-none" (grow-0, shrink-0, basis-auto)
                // to prevent tabs from expanding to fill space, but also preventing them from squeezing.
                trigger: 'flex-none'
            }
        },
        shrinkDir: {
            start: {
                list: 'justify-start'
            },
            center: {
                list: 'justify-center'
            },
            end: {
                list: 'justify-end'
            }
        }
    },
    compoundVariants: [
        {
            variant: 'solid' as typeof tabsVariants[number],
            orientation: 'vertical' as typeof tabsOrientations[number],
            class: {
                list: 'border-r-0',
                trigger: 'border-r-0'
            }
        }
    ],
    defaultVariants: {
        variant: 'line' as typeof tabsVariants[number],
        orientation: 'horizontal' as typeof tabsOrientations[number],
        size: 'md' as typeof tabsSizes[number],
        sticky: false,
        shrink: false,
        shrinkDir: 'start' as typeof tabsShrinkDirections[number]
    }
}
