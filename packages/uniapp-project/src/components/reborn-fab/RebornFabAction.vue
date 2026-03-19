<script lang="ts" setup>
import { computed, inject, ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
    /** 图标 */
    icon?: string
    /** 背景颜色 */
    color?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 自定义类名 */
    customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false
})

const emit = defineEmits(['click'])

// 注入父组件状态控制动画
const isActive = inject('reborn-fab-active', ref(false))

function handleClick() {
    if (props.disabled) return
    emit('click')
}
</script>

<template>
    <view
        class="pointer-events-auto flex items-center justify-center size-12 rounded-full shadow-md transition-all duration-300 transform"
        :class="[
            cn(customClass),
            disabled ? 'opacity-50' : '',
            isActive ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
        ]" :style="{ backgroundColor: color || 'white' }" @tap.stop="handleClick">
        <slot>
            <view :class="[icon, 'text-36']" :style="{ color: color ? 'white' : '#666' }" />
        </slot>
    </view>
</template>
