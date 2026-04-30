<script setup lang="ts">
import { ref } from 'vue'

import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'
import type { TransitionName } from '@/components/reborn-transition/RebornTransition.vue'

const show = ref(false)
const customShow = ref(false)
const name = ref<TransitionName>('fade-up')

function fade() {
    transition('fade')
}
function fadeUp() {
    transition('fade-up')
}
function fadeDown() {
    transition('fade-down')
}
function fadeLeft() {
    transition('fade-left')
}
function fadeRight() {
    transition('fade-right')
}
function slideUp() {
    transition('slide-up')
}
function slideDown() {
    transition('slide-down')
}
function slideLeft() {
    transition('slide-left')
}
function slideRight() {
    transition('slide-right')
}
function zoomIn() {
    transition('zoom-in')
}
function zoomOut() {
    transition('zoom-out')
}
function custom() {
    customShow.value = true
    setTimeout(() => {
        customShow.value = false
    }, 1200)
}
function transition(n: TransitionName) {
    name.value = n
    show.value = true
    setTimeout(() => {
        show.value = false
    }, 500)
}
</script>
<template>
    <RebornPage title="动画" description="用于在元素进入或离开时应用过渡效果。">
        <view class="text-20">
            1.2s后会消失
        </view>
        <view class="h-20 w-full bg-blue-2 rounded-lg">
            <RebornTransition :show="show" :name="name" :duration="500">
                <view
                    class="w-16 h-16 bg-red-500 flex items-center justify-center text-white rounded-lg shadow-lg text-20">
                    {{ name }}
                </view>
            </RebornTransition>
            <RebornTransition :show="customShow" :duration="{ enter: 700, leave: 1000 }" enter-class="custom-enter"
                enter-active-class="custom-enter-active" enter-to-class="custom-enter-to" leave-class="custom-leave"
                leave-active-class="custom-leave-active" leave-to-class="custom-leave-to" custom-class="block">
                <view
                    class="w-16 h-16 bg-red-500 flex items-center justify-center text-white rounded-lg shadow-lg text-20">
                    {{ name }}
                </view>
            </RebornTransition>
        </view>
        <RebornCard title="Fade 动画" custom-class="grid grid-cols-3 gap-2">
            <RebornButton variant="soft" @click="fade" size="sm">fade</RebornButton>
            <RebornButton variant="soft" @click="fadeUp" size="sm">fade-up</RebornButton>
            <RebornButton variant="soft" @click="fadeDown" size="sm">fade-down</RebornButton>
            <RebornButton variant="soft" @click="fadeLeft" size="sm">fade-left</RebornButton>
            <RebornButton variant="soft" @click="fadeRight" size="sm">fade-right</RebornButton>
        </RebornCard>
        <RebornCard title="Slide 动画" custom-class="grid grid-cols-3 gap-2">
            <RebornButton variant="soft" @click="slideUp" size="sm">slide-up</RebornButton>
            <RebornButton variant="soft" @click="slideDown" size="sm">slide-down</RebornButton>
            <RebornButton variant="soft" @click="slideLeft" size="sm">slide-left</RebornButton>
            <RebornButton variant="soft" @click="slideRight" size="sm">slide-right</RebornButton>
        </RebornCard>
        <RebornCard title="Zoom 动画" custom-class="grid grid-cols-3 gap-2">
            <RebornButton variant="soft" @click="zoomIn" size="sm">zoom-in</RebornButton>
            <RebornButton variant="soft" @click="zoomOut" size="sm">zoom-out</RebornButton>
        </RebornCard>
        <RebornCard title="自定义 动画" custom-class="grid grid-cols-3 gap-2">
            <RebornButton variant="soft" @click="custom" size="sm">custom</RebornButton>
        </RebornCard>
    </RebornPage>
</template>

<style lang="scss" scoped>
:deep(.custom-enter-active),
:deep(.custom-leave-active) {
    transition-property: transform;
}

:deep(.custom-enter) {
    transform: translate3d(-100px, -100px, 0) rotate(-180deg);
}

:deep(.custom-leave-to) {
    transform: translate3d(100px, 100px, 0) rotate(180deg);
}
</style>
