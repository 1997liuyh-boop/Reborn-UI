<script lang="ts">
export default {
    name: 'reborn-tabbar-trigger-liquid',
    options: {
        virtualHost: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed } from 'vue'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import { useParent } from '@/composables/useChildren'
import { TABBAR_KEY } from '@/components/reborn-tabbar/types'

export interface TabbarTriggerLiquidProps {
    name?: number | string
    iconOn?: string
    iconOff?: string
    disabled?: boolean
    customClass?: any
    customStyle?: string
    imageSize?: number
}

const props = withDefaults(defineProps<TabbarTriggerLiquidProps>(), {
    disabled: false,
    customStyle: '',
    imageSize: 40,
})

const { parent: tabbar, index } = useParent(TABBAR_KEY)

const active = computed(() => {
    const itemName = props.name !== undefined ? props.name : index.value
    if (!tabbar) return false
    return tabbar.props.modelValue === itemName
})

function handleClick() {
    if (props.disabled || !tabbar) return
    const itemName: string | number = props.name !== undefined ? props.name : index.value
    tabbar.setChange({ name: itemName })
}
</script>

<template>
    <view class="reborn-tabbar-liquid-trigger" :class="[customClass, { 'is-active': active }]" :style="customStyle"
        @click="handleClick">
        <view class="reborn-tabbar-liquid-trigger__icon reborn-tabbar-liquid-trigger__icon--off">
            <RebornImage :width="imageSize" :height="imageSize" :src="iconOff || iconOn || ''" mode="scaleToFill" />
        </view>
        <view class="reborn-tabbar-liquid-trigger__icon reborn-tabbar-liquid-trigger__icon--on">
            <RebornImage :width="imageSize" :height="imageSize" :src="iconOn || iconOff || ''" mode="scaleToFill" />
        </view>
    </view>
</template>

<style scoped>
.reborn-tabbar-liquid-trigger {
    position: relative;
    width: 80rpx;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.reborn-tabbar-liquid-trigger__icon {
    position: absolute;
    top: 20rpx;
    left: 10rpx;
    width: 60rpx;
    height: 60rpx;
    transition: all .6s ease-in-out;
}

.reborn-tabbar-liquid-trigger__icon--off {
    opacity: 1;
}

.reborn-tabbar-liquid-trigger__icon--on {
    opacity: 0;
}

.reborn-tabbar-liquid-trigger.is-active .reborn-tabbar-liquid-trigger__icon {
    top: -20rpx;
}

.reborn-tabbar-liquid-trigger.is-active .reborn-tabbar-liquid-trigger__icon--off {
    opacity: 0;
}

.reborn-tabbar-liquid-trigger.is-active .reborn-tabbar-liquid-trigger__icon--on {
    opacity: 1;
}
</style>
