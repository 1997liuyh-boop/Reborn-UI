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
        root: 'reborn-marquee group/marquee relative flex overflow-hidden [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        content: 'flex shrink-0 justify-around [gap:var(--gap)] will-change-transform',
        overlayStart: 'pointer-events-none absolute z-[1]',
        overlayEnd: 'pointer-events-none absolute z-[1]',
    },
    variants: {
        orientation: {
            horizontal: {
                root: 'flex-row w-full',
                content: 'animate-marquee flex-row items-center',
                overlayStart: 'absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-gray-1 via-gray-1/80 to-transparent',
                overlayEnd: 'absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-gray-1 via-gray-1/80 to-transparent',
            },
            vertical: {
                root: 'flex-col',
                content: 'animate-marquee-vertical flex-col',
                overlayStart: 'absolute inset-x-0 top-0 h-24 z-10 bg-gradient-to-b from-gray-1 via-gray-1/80 to-transparent',
                overlayEnd: 'absolute inset-x-0 bottom-0 h-24 z-10 bg-gradient-to-t from-gray-1 via-gray-1/80 to-transparent',
            },
        },
        pauseOnHover: {
            true: {
                // 用 v4 的 `!` 后缀写 important：`paused!important` 写在方括号里扫描器提取不到，类不会生成；
                // important 不能省，组件 scoped 样式里的 animation 简写不在层内，会压过 utilities 层的普通声明；
                // 分组必须具名（root 上的 group/marquee）：未命名的 group-hover 匹配任意一层带 group 的祖先，
                // 跑马灯放进带 group 的卡片里时，悬停卡片任意位置都会让它停下
                content: 'group-hover/marquee:[animation-play-state:paused]!',
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
