<script setup lang="ts">
/** 用户评价数据 */
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

/** 演练场里滚动的品牌图标 */
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

/** 演练场状态 */
const state = ref({
    reverse: false,
    pauseOnHover: true,
    overlay: true,
    repeat: 4,
    duration: 20,
})

/** 演练场控制面板配置 */
const controls = [
    {
        title: '配置',
        children: [
            { label: '反向滚动', key: 'reverse', component: 'checkbox' as const, defaultValue: false },
            { label: '悬停暂停', key: 'pauseOnHover', component: 'checkbox' as const, defaultValue: true },
            { label: '边缘遮罩', key: 'overlay', component: 'checkbox' as const, defaultValue: true },
        ],
    },
    {
        title: '动画',
        children: [
            {
                label: '重复次数',
                key: 'repeat',
                component: 'slider' as const,
                defaultValue: 4,
                props: { min: 1, max: 10, step: 1 },
            },
            {
                label: '动画时长',
                key: 'duration',
                component: 'slider' as const,
                defaultValue: 20,
                props: { min: 5, max: 100, step: 1 },
            },
        ],
    },
]

const splitIndex = Math.ceil(reviews.length / 2)
const firstRow = reviews.slice(0, splitIndex)
const secondRow = reviews.slice(splitIndex)

/** 3D 截图墙三列各自的图片编号 */
const screenshotSets = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
]
</script>

<template>
    <div class="flex w-full min-w-0 flex-col">
        <Playground v-model="state" :controls="controls" component-name="RebornMarquee" title="交互演练场"
            description="调节滚动方向、悬停暂停与遮罩，观察跑马灯的实时表现。">
            <RebornMarquee v-bind="state" orientation="horizontal" :style="{ '--duration': `${state.duration}s` }">
                <div v-for="logo in logos" :key="logo"
                    class="border-default rounded-ui-sm text-muted mx-2 flex items-center justify-center gap-2 border px-6 py-4">
                    <UIcon :name="logo" class="size-8" />
                    <span class="text-sm font-semibold">{{ logo.split('-').pop() }}</span>
                </div>
            </RebornMarquee>
        </Playground>

        <DemoSection title="3D 截图墙"
            description="纵向跑马灯配合 CSS 3D 变换，可用 ui.root 直接改写根节点类名以叠加透视与定位。">
            <!-- 3D 透视舞台：只描边不填充，内部旋转的图片就是被演示的对象 -->
            <div class="border-default rounded-ui-md relative h-[400px] w-full overflow-hidden border">
                <RebornMarquee reverse orientation="vertical" :overlay="false" :ui="{
                    root: '[--duration:40s] absolute w-[460px] -left-[100px] -top-[300px] h-[940px] transform-3d [transform:rotateX(55deg)_rotateZ(30deg)]'
                }">
                    <img v-for="i in screenshotSets[0]" :key="i" :src="`https://picsum.photos/460/258?random=${i}`"
                        width="460" height="258" class="border-default rounded-ui-xs my-4 aspect-video border shadow-lg">
                </RebornMarquee>

                <RebornMarquee orientation="vertical" :overlay="false" :ui="{
                    root: '[--duration:40s] absolute w-[460px] -top-[400px] left-[480px] h-[1160px] transform-3d [transform:rotateX(55deg)_rotateZ(30deg)]'
                }">
                    <img v-for="i in screenshotSets[1]" :key="i" :src="`https://picsum.photos/460/258?random=${i}`"
                        width="460" height="258" class="border-default rounded-ui-xs my-4 aspect-video border shadow-lg">
                </RebornMarquee>

                <RebornMarquee reverse orientation="vertical" :overlay="false" :ui="{
                    root: 'hidden md:flex [--duration:40s] absolute w-[460px] -top-[300px] left-[1020px] h-[1060px] transform-3d [transform:rotateX(55deg)_rotateZ(30deg)]'
                }">
                    <img v-for="i in screenshotSets[2]" :key="i" :src="`https://picsum.photos/460/258?random=${i}`"
                        width="460" height="258" class="border-default rounded-ui-xs my-4 aspect-video border shadow-lg">
                </RebornMarquee>
            </div>
        </DemoSection>

        <DemoSection title="用户评价墙"
            description="两条方向相反的跑马灯上下叠放，配合 pause-on-hover 即可构成常见的口碑展示区。">
            <DemoBlock layout="stack" class="gap-6 overflow-hidden">
                <RebornMarquee pause-on-hover class="[--duration:35s] [--gap:1.5rem]">
                    <div v-for="review in firstRow" :key="review.username"
                        class="border-default rounded-ui-md flex w-[320px] flex-col gap-3 border p-5">
                        <div class="flex items-center gap-3">
                            <img :src="review.img" class="size-10 rounded-full object-cover">
                            <div>
                                <h4 class="text-highlighted text-sm font-bold">{{ review.name }}</h4>
                                <span class="text-dimmed text-xs">{{ review.username }}</span>
                            </div>
                        </div>
                        <p class="text-muted text-sm leading-relaxed">{{ review.body }}</p>
                    </div>
                </RebornMarquee>

                <RebornMarquee reverse pause-on-hover class="[--duration:40s] [--gap:1.5rem]">
                    <div v-for="review in secondRow" :key="review.username"
                        class="border-default rounded-ui-md flex w-[320px] flex-col gap-3 border p-5">
                        <div class="flex items-center gap-3">
                            <img :src="review.img" class="size-10 rounded-full object-cover">
                            <div>
                                <h4 class="text-highlighted text-sm font-bold">{{ review.name }}</h4>
                                <span class="text-dimmed text-xs">{{ review.username }}</span>
                            </div>
                        </div>
                        <p class="text-muted text-sm leading-relaxed">{{ review.body }}</p>
                    </div>
                </RebornMarquee>
            </DemoBlock>
        </DemoSection>
    </div>
</template>
