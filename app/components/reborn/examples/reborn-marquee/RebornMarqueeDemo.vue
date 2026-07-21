<script setup lang="ts">
import { rebornMarqueeOrientations } from "../../ui/reborn-marquee/reborn-marquee.config";

const reviews = [
    {
        name: 'Jack',
        username: '@jack',
        body: 'This feels polished, thoughtful, and unusually easy to integrate.',
        img: 'https://avatar.vercel.sh/jack',
    },
    {
        name: 'Jill',
        username: '@jill',
        body: 'The motion is smooth and the defaults are good enough to ship immediately.',
        img: 'https://avatar.vercel.sh/jill',
    },
    {
        name: 'John',
        username: '@john',
        body: 'It solves the visual repetition problem without feeling noisy or heavy.',
        img: 'https://avatar.vercel.sh/john',
    },
    {
        name: 'Jane',
        username: '@jane',
        body: 'The API is small, but the component still covers the common production cases.',
        img: 'https://avatar.vercel.sh/jane',
    },
    {
        name: 'Jenny',
        username: '@jenny',
        body: 'Hover pause and reverse mode make it easy to use in richer marketing layouts.',
        img: 'https://avatar.vercel.sh/jenny',
    },
    {
        name: 'James',
        username: '@james',
        body: 'Vertical mode works well for side rails and narrow content columns.',
        img: 'https://avatar.vercel.sh/james',
    },
]

const logos = [
    'i-simple-icons-github',
    'i-simple-icons-discord',
    'i-simple-icons-x',
    'i-simple-icons-instagram',
    'i-simple-icons-linkedin',
    'i-simple-icons-facebook',
    'i-simple-icons-youtube',
    'i-simple-icons-tiktok',
    'i-simple-icons-google',
    'i-simple-icons-apple',
]

const state = ref({
    orientation: 'horizontal' as any,
    reverse: false,
    pauseOnHover: true,
    overlay: true,
    repeat: 4,
    duration: 20
})

const controls = [
    {
        title: '配置',
        children: [
            {
                label: '反向滚动',
                key: 'reverse',
                component: 'checkbox' as const,
                defaultValue: false
            },
            {
                label: '悬停暂停',
                key: 'pauseOnHover',
                component: 'checkbox' as const,
                defaultValue: true
            },
            {
                label: '边缘遮罩',
                key: 'overlay',
                component: 'checkbox' as const,
                defaultValue: true
            }
        ]
    },
    {
        title: '动画',
        children: [
            {
                label: '重复次数',
                key: 'repeat',
                component: 'slider' as const,
                defaultValue: 4,
                props: { min: 1, max: 10, step: 1 }
            },
            {
                label: '动画时长',
                key: 'duration',
                component: 'slider' as const,
                defaultValue: 20,
                props: { min: 5, max: 100, step: 1 }
            }
        ]
    }
]

const splitIndex = Math.ceil(reviews.length / 2)
const firstRow = reviews.slice(0, splitIndex)
const secondRow = reviews.slice(splitIndex)

// 3D Screenshots images
const screenshotSets = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12]
]
</script>

<template>
    <div class="space-y-12 pb-24 w-full">
        <!-- Main Playground -->
        <Playground v-model="state" :controls="controls" component-name="RebornMarquee" title="交互演示"
            description="带有品牌卡片的跑马灯示例。">
            <div class="flex size-full items-center justify-center p-8">
                <RebornMarquee v-bind="state" orientation="horizontal" :style="{ '--duration': `${state.duration}s` }">
                    <div v-for="logo in logos" :key="logo"
                        class="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-white/50 px-6 py-4 shadow-sm backdrop-blur-md dark:bg-white/5 mx-2">
                        <UIcon :name="logo" class="size-8 text-gray-700 dark:text-white" />
                        <span class="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {{ logo.split('-').pop() }}
                        </span>
                    </div>
                </RebornMarquee>
            </div>
        </Playground>

        <!-- 3D Screenshot Wall -->
        <div class="space-y-8">
            <h2 class="text-xl font-bold border-l-4 border-primary-500 pl-4">
                进阶视觉：3D 截图墙
            </h2>
            <div
                class="relative h-[400px] w-full overflow-hidden rounded-3xl border border-border/50 bg-gray-100 dark:bg-gray-900/50">
                <!-- Column 1 -->
                <RebornMarquee reverse orientation="vertical" :overlay="false" :ui="{
                    root: '[--duration:40s] absolute w-[460px] -left-[100px] -top-[300px] h-[940px] transform-3d [transform:rotateX(55deg)_rotateZ(30deg)]'
                }">
                    <img v-for="i in screenshotSets[0]" :key="i" :src="`https://picsum.photos/460/258?random=${i}`"
                        width="460" height="258"
                        class="aspect-video rounded-lg border border-border bg-white shadow-lg my-4">
                </RebornMarquee>

                <!-- Column 2 -->
                <RebornMarquee orientation="vertical" :overlay="false" :ui="{
                    root: '[--duration:40s] absolute w-[460px] -top-[400px] left-[480px] h-[1160px] transform-3d [transform:rotateX(55deg)_rotateZ(30deg)]'
                }">
                    <img v-for="i in screenshotSets[1]" :key="i" :src="`https://picsum.photos/460/258?random=${i}`"
                        width="460" height="258"
                        class="aspect-video rounded-lg border border-border bg-white shadow-lg my-4">
                </RebornMarquee>

                <!-- Column 3 -->
                <RebornMarquee reverse orientation="vertical" :overlay="false" :ui="{
                    root: 'hidden md:flex [--duration:40s] absolute w-[460px] -top-[300px] left-[1020px] h-[1060px] transform-3d [transform:rotateX(55deg)_rotateZ(30deg)]'
                }">
                    <img v-for="i in screenshotSets[2]" :key="i" :src="`https://picsum.photos/460/258?random=${i}`"
                        width="460" height="258"
                        class="aspect-video rounded-lg border border-border bg-white shadow-lg my-4">
                </RebornMarquee>

                <!-- Dark Overlay Gradient -->
                <div
                    class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white/20 dark:to-black/20" />
            </div>
        </div>

        <!-- Business Example: Testimonials -->
        <div class="space-y-8">
            <h2 class="text-xl font-bold border-l-4 border-primary-500 pl-4">
                场景演示：用户评价
            </h2>

            <div
                class="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-border/50 bg-white/50 p-8 dark:bg-gray-900/40">
                <RebornMarquee pause-on-hover class="[--duration:35s] [--gap:1.5rem]">
                    <div v-for="review in firstRow" :key="review.username"
                        class="flex w-[320px] flex-col gap-3 rounded-2xl border border-gray-950/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-gray-800">
                        <div class="flex items-center gap-3">
                            <img :src="review.img" class="size-10 rounded-full object-cover">
                            <div>
                                <h4 class="text-sm font-bold">
                                    {{ review.name }}
                                </h4>
                                <span class="text-xs text-gray-400">{{ review.username }}</span>
                            </div>
                        </div>
                        <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            {{ review.body }}
                        </p>
                    </div>
                </RebornMarquee>

                <RebornMarquee reverse pause-on-hover class="[--duration:40s] [--gap:1.5rem]">
                    <div v-for="review in secondRow" :key="review.username"
                        class="flex w-[320px] flex-col gap-3 rounded-2xl border border-gray-950/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-gray-800">
                        <div class="flex items-center gap-3">
                            <img :src="review.img" class="size-10 rounded-full object-cover">
                            <div>
                                <h4 class="text-sm font-bold">
                                    {{ review.name }}
                                </h4>
                                <span class="text-xs text-gray-400">{{ review.username }}</span>
                            </div>
                        </div>
                        <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            {{ review.body }}
                        </p>
                    </div>
                </RebornMarquee>
            </div>
        </div>
    </div>
</template>
