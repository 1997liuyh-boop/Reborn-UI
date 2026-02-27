export const tabsTypes = ['line', 'card'] as const
export const tabsVariants = ['primary', 'info', 'success', 'warning', 'neutral'] as const
export const tabsSizes = ['sm', 'md', 'lg'] as const
export const tabsOrientations = ['horizontal', 'vertical'] as const

export default {
  slots: {
    root: 'flex flex-col gap-2 min-w-0',
    list: 'relative flex max-w-full box-border gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
    trigger:
      'relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap px-3 py-2 text-32 font-medium text-gray-7 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-20  flex-1',
    leadingIcon: 'flex items-center text-28',
    leadingAvatar: 'flex items-center overflow-hidden rounded-full',
    leadingAvatarSize: 'h-6 w-6',
    label: 'relative z-10',
    trailingBadge: 'flex items-center rounded-full bg-gray-2 px-2 py-0.5 text-24 text-gray-7',
    trailingBadgeSize: 'text-24',
    content:
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 scroll-mt-24',
    indicator:
      'absolute bottom-1 left-0 h-1.5 w-0 rounded-full transition-all duration-300 ease-in-out z-0 opacity-90 -translate-y-1',
  },
  variants: {
    type: {
      line: {
        list: 'border-b border-gray-2',
        trigger: 'bg-transparent shadow-none rounded-none !text-gray-7 hover:text-gray-8 data-[state=active]:font-bold data-[state=active]:!text-gray-8',
        indicator: 'block',
      },
      card: {
        list: 'inline-flex items-center justify-start rounded-[var(--radius-ui-base)] bg-gray-2/70 p-1',
        trigger: 'rounded-[var(--radius-ui-sm)] px-3 py-2 shadow-none !text-gray-7 data-[state=active]:!text-white',
        indicator: 'hidden',
      },
    },
    variant: {
      primary: {
        trigger: 'data-[state=active]:text-primary',
        indicator:
          'bg-[linear-gradient(90deg,var(--color-red-6),var(--color-red-3),var(--color-blue-1),var(--color-orange-1))] bg-[length:200%]',
      },
      info: {
        trigger: 'data-[state=active]:text-info',
        indicator: 'bg-info',
      },
      success: {
        trigger: 'data-[state=active]:text-success',
        indicator: 'bg-success',
      },
      warning: {
        trigger: 'data-[state=active]:text-warning',
        indicator: 'bg-warning',
      },
      neutral: {
        trigger: 'data-[state=active]:text-gray-8',
        indicator: 'bg-gray-8',
      },
    },
    orientation: {
      horizontal: {
        root: 'flex-col w-full h-full min-w-0 max-w-full relative overflow-hidden',
        list: 'flex-row flex-nowrap w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden shrink-0',
        trigger: 'shrink-0',
        indicator:
          'h-1.5 w-[var(--radix-tabs-indicator-width)] translate-x-[var(--radix-tabs-indicator-position)] bottom-1',
        content: 'flex-1 w-full min-h-0 overflow-y-auto',
      },
      vertical: {
        root: 'flex-row items-start gap-4 h-full [&>*:not([role=tablist])]:flex-1 [&>*:not([role=tablist])]:w-full [&>*:not([role=tablist])]:h-full relative overflow-hidden',
        list: 'flex-col w-auto h-full overflow-y-auto overflow-x-hidden border-b-0 border-r border-gray-2',
        trigger: 'flex-initial w-full justify-start border-b-0 border-r-0 rounded-none',
        indicator: 'hidden',
        content:
          'flex-1 w-full h-full overflow-y-auto mt-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      },
    },
    size: {
      sm: {
        trigger: 'text-28 px-2.5 py-1.5',
        leadingAvatarSize: 'h-5 w-5',
        trailingBadgeSize: 'text-20',
      },
      md: {
        trigger: 'text-32 px-3 py-2',
        leadingAvatarSize: 'h-6 w-6',
        trailingBadgeSize: 'text-22',
      },
      lg: {
        trigger: 'text-36 px-4 py-2.5',
        leadingAvatarSize: 'h-7 w-7',
        trailingBadgeSize: 'text-24',
      },
    },
    sticky: {
      true: {
        root: 'h-auto block overflow-visible',
        list: 'sticky top-0 z-40 bg-background/95 backdrop-blur',
        content: 'h-auto block overflow-visible',
      },
    },
    shrink: {
      true: {
        list: 'justify-start',
        trigger: 'flex-none',
      },
    },
    scrollspy: {
      true: {
        // Base scrollspy styles
      },
    },
  },
  compoundVariants: [
    {
      orientation: 'horizontal' as (typeof tabsOrientations)[number],
      scrollspy: true,
      class: {
        root: 'block h-auto overflow-visible relative',
        list: 'sticky top-0 z-10 bg-background shadow-sm',
        content: 'h-auto block',
      },
    },
    {
      orientation: 'vertical' as (typeof tabsOrientations)[number],
      scrollspy: true,
      class: {
        root: 'flex flex-row items-start gap-0 h-full min-h-0 overflow-hidden',
        list: 'h-full min-h-0 overflow-y-auto overflow-x-hidden border-r border-gray-2 shrink-0 w-auto',
        content: 'flex-1 min-w-0 w-full',
      },
    },
    {
      type: 'card' as (typeof tabsTypes)[number],
      variant: 'primary' as (typeof tabsVariants)[number],
      class: {
        trigger: 'data-[state=active]:bg-primary data-[state=active]:text-white',
      },
    },
    {
      type: 'card' as (typeof tabsTypes)[number],
      variant: 'info' as (typeof tabsVariants)[number],
      class: {
        trigger: 'data-[state=active]:bg-info data-[state=active]:text-white',
      },
    },
    {
      type: 'card' as (typeof tabsTypes)[number],
      variant: 'success' as (typeof tabsVariants)[number],
      class: {
        trigger: 'data-[state=active]:bg-success data-[state=active]:text-white',
      },
    },
    {
      type: 'card' as (typeof tabsTypes)[number],
      variant: 'warning' as (typeof tabsVariants)[number],
      class: {
        trigger: 'data-[state=active]:bg-warning data-[state=active]:text-white',
      },
    },
    {
      type: 'card' as (typeof tabsTypes)[number],
      variant: 'neutral' as (typeof tabsVariants)[number],
      class: {
        trigger: 'data-[state=active]:bg-gray-8 data-[state=active]:text-white',
      },
    },
    {
      type: 'card' as (typeof tabsTypes)[number],
      orientation: 'vertical' as (typeof tabsOrientations)[number],
      class: {
        list: 'border-r-0',
        trigger: 'border-r-0',
      },
    },
  ],
  defaultVariants: {
    type: 'line' as (typeof tabsTypes)[number],
    variant: 'primary' as (typeof tabsVariants)[number],
    orientation: 'horizontal' as (typeof tabsOrientations)[number],
    size: 'md' as (typeof tabsSizes)[number],
    sticky: false,
    shrink: false,
  },
}
