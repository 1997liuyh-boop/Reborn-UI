<script lang="ts" setup>
import { computed } from 'vue'
import { useBooleanModel } from '@/composables/useBooleanModel'
import RebornTransition from '../reborn-transition/RebornTransition.vue'
import { tv } from '@/lib/tv'
import theme from './reborn-overlay.config'
// #ifdef H5
import { useLockScroll } from '@/composables/useLockScroll'
// #endif

interface OverlayProps {
  customClass?: string
  customStyle?: string
  duration?: Record<string, number> | number | boolean
  lockScroll?: boolean
  zIndex?: number
  closeOnClickOverlay?: boolean
  absolute?: boolean
}
defineOptions({
  name: 'reborn-overlay',
  options: { virtualHost: true, addGlobalClass: true, styleIsolation: 'shared' },
})

const props = withDefaults(defineProps<OverlayProps>(), {
  customClass: '', customStyle: '', duration: 300, lockScroll: true,
  zIndex: 10, closeOnClickOverlay: true, absolute: false,
})
const emit = defineEmits<{ close: []; click: [] }>()
defineModel<boolean>({ default: undefined })
const model = useBooleanModel('modelValue')

const b = tv(theme)

const overlayClass = computed(() => {
    return `${b({ absolute: props.absolute })} ${props.customClass}`
})

function handleClick() {
    emit('click')
    if (props.closeOnClickOverlay) {
        model.value = false
        emit('close')
    }
}

// #ifdef H5
useLockScroll(() => model.value && props.lockScroll)
// #endif
</script>

<template>
    <reborn-transition :show="model" name="fade" :custom-class="overlayClass" :duration="duration"
        :custom-style="`z-index: ${zIndex}; ${customStyle}`" :disable-touch-move="lockScroll" @click="handleClick">
        <slot></slot>
    </reborn-transition>
</template>
