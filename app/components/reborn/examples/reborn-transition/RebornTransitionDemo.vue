<script lang="ts" setup>
import { ref } from 'vue'
import RebornTransition from '@/components/reborn/ui/reborn-transition/RebornTransition.vue'
import type { TransitionName } from '@/components/reborn/ui/reborn-transition/reborn-transition.config'

const show = ref(false)
const customShow = ref(false)
const name = ref<TransitionName>('fade-up')

function transition(n: TransitionName) {
    name.value = n
    show.value = true
    setTimeout(() => {
        show.value = false
    }, 1500)
}

function custom() {
    customShow.value = true
    setTimeout(() => {
        customShow.value = false
    }, 1200)
}
</script>

<template>
    <div class="space-y-6">
        <div
            class="h-32 w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center p-4 relative overflow-hidden">
            <span v-if="!show && !customShow" class="text-sm text-gray-400">点击下方按钮预览动画，1.5s 后自动消失</span>

            <RebornTransition :show="show" :name="name" :duration="500" class="absolute">
                <div
                    class="w-24 h-24 bg-primary flex items-center justify-center text-white rounded-lg shadow-lg text-sm font-medium">
                    {{ name }}
                </div>
            </RebornTransition>

            <RebornTransition :show="customShow" :duration="{ enter: 700, leave: 1000 }" enter-class="custom-enter"
                enter-active-class="custom-enter-active" enter-to-class="custom-enter-to" leave-class="custom-leave"
                leave-active-class="custom-leave-active" leave-to-class="custom-leave-to" class="absolute">
                <div
                    class="w-24 h-24 bg-red-500 flex items-center justify-center text-white rounded-lg shadow-lg text-sm font-medium">
                    custom
                </div>
            </RebornTransition>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">Fade 动画</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornButton color="primary" variant="solid" @click="transition('fade')">fade</RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('fade-up')">fade-up</RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('fade-down')">fade-down</RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('fade-left')">fade-left</RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('fade-right')">fade-right
                </RebornButton>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">Slide 动画</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornButton color="primary" variant="solid" @click="transition('slide-up')">slide-up</RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('slide-down')">slide-down
                </RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('slide-left')">slide-left
                </RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('slide-right')">slide-right
                </RebornButton>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">Zoom 动画</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornButton color="primary" variant="solid" @click="transition('zoom-in')">zoom-in</RebornButton>
                <RebornButton color="primary" variant="solid" @click="transition('zoom-out')">zoom-out</RebornButton>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">自定义 动画</h3>
            <div class="grid grid-cols-4 gap-2">
                <RebornButton color="primary" variant="solid" @click="custom">custom</RebornButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.custom-enter-active),
:deep(.custom-leave-active) {
    transition-property: transform, opacity;
}

:deep(.custom-enter) {
    transform: translate3d(-100px, -100px, 0) rotate(-180deg);
    opacity: 0;
}

:deep(.custom-leave-to) {
    transform: translate3d(100px, 100px, 0) rotate(180deg);
    opacity: 0;
}
</style>
