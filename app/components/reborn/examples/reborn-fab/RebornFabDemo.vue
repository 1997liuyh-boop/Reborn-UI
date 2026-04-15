<script lang="ts" setup>
import { ref, computed } from 'vue'
import RebornFab from "~/components/reborn/ui/reborn-fab/RebornFab.vue"
import Playground from "~/components/common/play-ground/Playground.vue"

// 悬浮按钮配置项
const fabColors = [
    { label: 'Primary', value: 'primary' },
    { label: 'Success', value: 'success' },
    { label: 'Warning', value: 'warning' },
    { label: 'Error', value: 'error' },
    { label: 'Info', value: 'info' },
    { label: 'Neutral', value: 'neutral' }
]
const fabDirections = [
    { label: '上方', value: 'top' },
    { label: '下方', value: 'bottom' },
    { label: '左侧', value: 'left' },
    { label: '右侧', value: 'right' },
]
const fabPositions = [
    { label: 'Left Top', value: 'left-top' },
    { label: 'Right Top', value: 'right-top' },
    { label: 'Left Bottom', value: 'left-bottom' },
    { label: 'Right Bottom', value: 'right-bottom' }
]
const fabTriggers = [
    { label: 'Click (点击)', value: 'click' },
    { label: 'Hover (悬浮)', value: 'hover' }
]
const fabVariants = [
    { label: 'Float (悬浮)', value: 'float' },
    { label: 'Capsule (胶囊)', value: 'capsule' },
    { label: 'Circle (环形)', value: 'circle' }
]

// 统一状态
const state = ref({
    isActive: false,
    draggable: true as boolean,
    color: 'primary' as any,
    variant: 'float' as any,
    direction: 'top' as any,
    position: 'right-bottom' as any,
    trigger: 'click' as any,
    customCoord: true,
    useTriggerSlot: false,
    expandable: true,
    attract: true
})

// 控制面板配置
const controls = [
    {
        title: "核心配置",
        children: [
            {
                label: "UI 变体",
                key: "variant",
                component: "select" as const,
                defaultValue: "float",
                props: { options: fabVariants }
            },
            {
                label: "主题色调",
                key: "color",
                component: "select" as const,
                defaultValue: "primary",
                props: { options: fabColors }
            },
            {
                label: "允许拖拽",
                key: "draggable",
                component: "checkbox" as const,
                defaultValue: true
            },
            {
                label: "开启展开",
                key: "expandable",
                component: "checkbox" as const,
                defaultValue: true
            },
            {
                label: "自动吸边",
                key: "attract",
                component: "checkbox" as const,
                defaultValue: true
            }
        ]
    },
    {
        title: "交互与位置",
        children: [
            {
                label: "触发方式",
                key: "trigger",
                component: "select" as const,
                defaultValue: "click",
                props: { options: fabTriggers }
            },
            {
                label: "预设位置",
                key: "position",
                component: "select" as const,
                defaultValue: "right-bottom",
                props: { options: fabPositions }
            },
            {
                label: "展开方向",
                key: "direction",
                component: "select" as const,
                defaultValue: "top",
                props: { options: fabDirections }
            }
        ]
    },
    {
        title: "高级开发",
        children: [
            {
                label: "自定义Slot",
                key: "useTriggerSlot",
                component: "checkbox" as const,
                defaultValue: false
            },
            {
                label: "自定义坐标",
                key: "customCoord",
                component: "checkbox" as const,
                defaultValue: true
            },
            {
                label: "同步显隐(仅拖拽可见)",
                key: "syncHideTest",
                component: "checkbox" as const,
                hide: (val: any, state: any) => !state.draggable
            },
            {
                label: "异步显隐(非Primary可见)",
                key: "asyncHideTest",
                component: "checkbox" as const,
                hide: async (val: any, state: any) => {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return state.color === 'primary';
                }
            }
        ]
    }
]

/**
 * 处理操作项点击
 */
function handleAction(name: string) {
    console.log('点击了动作: ' + name)
}
</script>

<template>
    <div class="space-y-12 pb-24">
        <!-- 交互演练场 -->
        <Playground v-model="state" :controls="controls" component-name="RebornFab" title="交互演练场"
            description="尝试拖动右侧预览区的按钮，或通过左侧面板调整交互参数。">

            <template v-if="!state.useTriggerSlot">
                <!-- 浮动模式演示 (支持 Linear 与 Radial 切换) -->
                <RebornFab v-if="state.variant === 'float'" v-model="state.isActive" :color="state.color"
                    variant="float" :draggable="state.draggable" :attract="state.attract" :direction="state.direction"
                    :position="state.position" :trigger="state.trigger" :top="state.customCoord ? '40vh' : undefined"
                    :expandable="state.expandable" :gap="{ top: 32, bottom: 32, left: 32, right: 32 }" :z-index="500">
                    <template #default>
                        <div v-for="i in 5" :key="i"
                            class="flex items-center justify-center size-12 rounded-full bg-emerald-500 text-white shadow-lg cursor-pointer hover:rotate-12 hover:scale-110 active:scale-95 transition-all"
                            @click="handleAction('按钮 ' + i)">
                            <Icon name="lucide:star" class="size-6" />
                        </div>
                    </template>
                </RebornFab>

                <!-- 胶囊模式演示 -->
                <RebornFab v-else-if="state.variant === 'capsule'" v-model="state.isActive" :color="state.color"
                    variant="capsule" :draggable="state.draggable" :attract="state.attract" :direction="state.direction"
                    :position="state.position" :trigger="state.trigger" :top="state.customCoord ? '65vh' : undefined"
                    :expandable="state.expandable" divider :gap="{ top: 32, bottom: 32, left: 32, right: 32 }"
                    :z-index="500">
                    <template #default>
                        <Icon name="lucide:share-2" v-for="item in 3" :key="item" class="size-6 text-white"
                            @click="handleAction('分享')" />
                    </template>
                </RebornFab>

                <!-- 环形模式演示 -->
                <RebornFab v-else-if="state.variant === 'circle'" v-model="state.isActive" :color="state.color"
                    variant="circle" :draggable="state.draggable" :attract="state.attract" :direction="state.direction"
                    :position="state.position" :trigger="state.trigger" :top="state.customCoord ? '20vh' : undefined"
                    :expandable="state.expandable" :gap="{ top: 32, bottom: 32, left: 32, right: 32 }" :z-index="500">
                    <template #default>
                        <div v-for="i in 5" :key="i"
                            class="flex items-center justify-center size-10 rounded-full bg-indigo-500 text-white shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all text-sm font-bold"
                            @click="handleAction('环形按钮' + i)">
                            {{ i }}
                        </div>
                    </template>
                </RebornFab>
            </template>

            <!-- 自定义触发器演示 -->
            <RebornFab v-else position="right-bottom" :draggable="state.draggable" :expandable="false"
                :attract="state.attract" :trigger="state.trigger" :bottom="state.customCoord ? 150 : undefined"
                :color="state.color" :z-index="500" @click="handleAction('自定义触发器')">
                <template #trigger>
                    <div
                        class="group flex items-center gap-3 pl-3 pr-5 py-2.5 bg-linear-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-xl shadow-rose-500/20 active:scale-95 transition-all cursor-pointer ring-0 hover:ring-4 ring-rose-500/10">
                        <div
                            class="size-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon name="lucide:heart" class="size-5 fill-white" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xs opacity-80 leading-tight tracking-tighter">Like This</span>
                            <span class="text-sm font-bold leading-tight">点个赞吧</span>
                        </div>
                    </div>
                </template>
            </RebornFab>
        </Playground>

        <!-- 变体矩阵 (Showcases) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- 技巧卡片 -->
            <div
                class="p-8 rounded-3xl bg-neutral-100/50 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/50 space-y-6">
                <div class="flex items-center gap-2 text-primary font-bold">
                    <Icon name="lucide:sparkles" class="size-5" />
                    高级交互特性
                </div>
                <div class="space-y-4">
                    <div v-for="(item, i) in [
                        { t: '自动吸附', d: '释放后会自动寻找最近的窗口边缘进行贴合。' },
                        { t: '最优展开', d: '位于左边缘时自动向右展开，顶部边缘向下展开。' },
                        { t: '触碰反馈', d: '点击或悬浮时触发展开，支持多级操作嵌套。' }
                    ]" :key="i" class="flex items-start gap-4">
                        <div
                            class="size-8 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                            0{{ i + 1 }}
                        </div>
                        <div class="space-y-1">
                            <div class="font-medium">{{ item.t }}</div>
                            <div class="text-sm text-neutral-500">{{ item.d }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 自定义内容展示 -->
            <div class="p-8 rounded-3xl bg-linear-to-br from-primary/5 to-info/5 border border-primary/10 space-y-4">
                <div class="flex items-center gap-2 text-primary font-bold">
                    <Icon name="lucide:layout-template" class="size-5" />
                    自定义 Slot
                </div>
                <p class="text-sm text-neutral-500">
                    除了标准的 Icon 模式，你可以通过插槽完全自定义按钮的外观，例如胶囊形态、带文字的按钮等，适应更复杂的业务需求。
                </p>
                <div class="pt-4 flex justify-center">
                    <div
                        class="px-6 py-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center gap-3 animate-pulse">
                        <div class="size-8 rounded-full bg-primary/20 animate-bounce"></div>
                        <div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
