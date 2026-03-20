<script lang="ts" setup>
import { ref } from 'vue'

const fabColors = ['primary', 'success', 'warning', 'error', 'info', 'neutral'] as const
const fabDirections = ['top', 'right', 'bottom', 'left'] as const
const fabPositions = ['left-top', 'right-top', 'left-bottom', 'right-bottom'] as const
const fabTriggers = ['click', 'hover'] as const

const isActive = ref(false)
const defaultActive = ref(false)
const draggable = ref(false)
const demoColor = ref<any>('primary')
const demoDirection = ref<any>('top')
const demoPosition = ref<any>('right-bottom')
const demoTrigger = ref<any>('click')
const useTriggerSlot = ref(false)
const customCoord = ref(false)

function handleAction(name: string) {
    console.log('点击了动作: ' + name)
}

function handleCustomClick() {
    console.log('触发了自定义分享')
}
</script>

<template>
    <div class="space-y-4">
        <div class="p-6 flex flex-col gap-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <RebornText color="neutral">
                        按钮颜色：
                    </RebornText>
                    <RebornRadioGroup v-model="demoColor">
                        <RebornRadio v-for="item in fabColors" :key="item" :value="item" :showIcon="false">
                            <template #default="{ isChecked }">
                                <div class="relative flex size-5">
                                    <div v-if="isChecked"
                                        class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                                        :class="`bg-${item}`">
                                    </div>
                                    <div class="relative inline-flex size-5 rounded-full" :class="`bg-${item}`"></div>
                                </div>
                            </template>
                        </RebornRadio>
                    </RebornRadioGroup>
                </div>

                <div>
                    <RebornText color="neutral" class="block">
                        自定义坐标 (bottom: 100px)：
                    </RebornText>
                    <RebornSwitch v-model="customCoord" />
                </div>
                <div>
                    <RebornText color="neutral">
                        触发方式：
                    </RebornText>
                    <RebornRadioGroup v-model="demoTrigger" direction="row">
                        <RebornRadio v-for="t in fabTriggers" :key="t" :value="t">{{ t }}</RebornRadio>
                    </RebornRadioGroup>
                </div>
                <div>
                    <RebornText color="neutral" class="block">
                        开启拖拽：
                    </RebornText>
                    <RebornSwitch v-model="draggable" />
                </div>

                <div>
                    <RebornText color="neutral">
                        展开方向：
                    </RebornText>
                    <RebornRadioGroup v-model="demoDirection" direction="row">
                        <RebornRadio v-for="d in fabDirections" :key="d" :value="d">{{ d }}</RebornRadio>
                    </RebornRadioGroup>
                </div>

                <div>
                    <RebornText color="neutral" class="block">
                        自定义触发器 (Slot)：
                    </RebornText>
                    <RebornSwitch v-model="useTriggerSlot" />
                </div>
                <div>
                    <RebornText color="neutral">
                        预设位置 (非自定义坐标时)：
                    </RebornText>
                    <RebornRadioGroup v-model="demoPosition" direction="row">
                        <RebornRadio v-for="d in fabPositions" :key="d" :value="d">{{ d }}</RebornRadio>
                    </RebornRadioGroup>
                </div>
            </div>

            <div
                class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 italic text-sm text-blue-600 dark:text-blue-400">
                提示：抽屉式动画会自动根据展开方向平滑滑出。开启拖拽后移动至左右边缘会自动吸附并切换展开方向。
            </div>
        </div>

        <!-- 标准用法 -->
        <RebornFab v-if="!useTriggerSlot" v-model="isActive" :active="defaultActive" :color="demoColor"
            :draggable="draggable" :direction="demoDirection" :position="demoPosition" :trigger="demoTrigger"
            :bottom="customCoord ? 150 : undefined" expandable :gap="{ bottom: 100, right: 32 }">
            <template #default>
                <div class="flex items-center justify-center size-10 rounded-full bg-emerald-500 text-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    @click="handleAction('分享')">
                    <Icon name="lucide:share-2" class="size-5" />
                </div>
                <div class="flex items-center justify-center size-10 rounded-full bg-amber-500 text-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    @click="handleAction('收藏')">
                    <Icon name="lucide:star" class="size-5" />
                </div>
                <div class="flex items-center justify-center size-10 rounded-full bg-blue-500 text-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    @click="handleAction('消息')">
                    <Icon name="lucide:message-circle" class="size-5" />
                </div>
            </template>
        </RebornFab>

        <!-- 自定义内容 -->
        <RebornFab v-else position="right-bottom" :draggable="draggable" :expandable="false" :bottom="160">
            <template #trigger>
                <div class="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-full shadow-lg active:scale-95 transition-transform cursor-pointer"
                    @click="handleCustomClick">
                    <Icon name="lucide:heart" class="size-5" />
                    <span class="text-sm font-medium">点个赞吧</span>
                </div>
            </template>
        </RebornFab>
    </div>
</template>
