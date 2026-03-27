<script lang="ts">
export default {
    name: 'reborn-overlay',
    options: {
        virtualHost: true,
        addGlobalClass: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, type PropType } from 'vue'
import RebornTransition from '../reborn-transition/RebornTransition.vue'
import { tv } from '@/lib/tv'
import theme from './reborn-overlay.config'
// #ifdef H5
import { useLockScroll } from '@/composables/useLockScroll'
// #endif

const props = defineProps({
    customClass: { type: String, default: '' },
    customStyle: { type: String, default: '' },
    modelValue: { type: Boolean, default: false },
    duration: {
        type: [Object, Number, Boolean] as PropType<Record<string, number> | number | boolean>,
        default: 300
    },
    lockScroll: { type: Boolean, default: true },
    zIndex: { type: Number, default: 10 },
    closeOnClickOverlay: { type: Boolean, default: true },
    absolute: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close', 'click'])

const b = tv(theme)

const overlayClass = computed(() => {
    return `${b({ absolute: props.absolute })} ${props.customClass}`
})

function handleClick() {
    emit('click')
    if (props.closeOnClickOverlay) {
        emit('update:modelValue', false)
        emit('close')
    }
}

// #ifdef H5
useLockScroll(() => props.modelValue && props.lockScroll)
// #endif
</script>

<template>
    <reborn-transition :show="modelValue" name="fade" :custom-class="overlayClass" :duration="duration"
        :custom-style="`z-index: ${zIndex}; ${customStyle}`" :disable-touch-move="lockScroll" @click="handleClick">
        <slot></slot>
    </reborn-transition>
</template>
