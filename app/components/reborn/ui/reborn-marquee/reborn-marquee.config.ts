import { tv, type VariantProps } from '~/lib/tv'

const orientation = ['horizontal', 'vertical'] as const

export { orientation as rebornMarqueeOrientations }

export type RebornMarqueeOrientation = (typeof orientation)[number]

export type RebornMarqueeUI = {
    root?: string
    content?: string
    overlayStart?: string
    overlayEnd?: string
}

const rebornMarquee = tv({
    slots: {
        root: 'reborn-marquee group relative flex overflow-hidden [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        content: 'flex shrink-0 justify-around [gap:var(--gap)] will-change-transform',
        overlayStart: 'pointer-events-none absolute z-[1]',
        overlayEnd: 'pointer-events-none absolute z-[1]',
    },
    variants: {
        orientation: {
            horizontal: {
                root: 'flex-row w-full',
                content: 'animate-marquee flex-row items-center',
                overlayStart: 'absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80',
                overlayEnd: 'absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80',
            },
            vertical: {
                root: 'flex-col',
                content: 'animate-marquee-vertical flex-col',
                overlayStart: 'absolute inset-x-0 top-0 h-24 z-10 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80',
                overlayEnd: 'absolute inset-x-0 bottom-0 h-24 z-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80',
            },
        },
        pauseOnHover: {
            true: {
                content: 'group-hover:[animation-play-state:paused!important]',
            },
            false: {},
        },
    },
    defaultVariants: {
        orientation: 'horizontal' as RebornMarqueeOrientation,
        pauseOnHover: false,
    },
})

export type RebornMarqueeVariantProps = VariantProps<typeof rebornMarquee>

export default rebornMarquee
