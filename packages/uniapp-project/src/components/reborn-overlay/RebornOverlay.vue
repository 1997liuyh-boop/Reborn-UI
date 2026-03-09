<script lang="ts">
export default {
  name: 'reborn-overlay',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useLockScroll } from '@/composables/useLockScroll'
import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'
import { overlayTheme } from './reborn-overlay.config'

interface OverlayProps {
  show?: boolean
  duration?: number | boolean | { enter: number, leave: number }
  lockScroll?: boolean
  zIndex?: number
  customClass?: string
  customStyle?: string
}

const props = withDefaults(defineProps<OverlayProps>(), {
  show: false,
  duration: 300,
  lockScroll: true,
  zIndex: 10,
  customClass: '',
  customStyle: '',
})

const emit = defineEmits(['click'])

const transitionStyle = computed(() => `z-index:${props.zIndex};${props.customStyle}`)

useLockScroll(() => !!props.show && !!props.lockScroll)
</script>

<template>
  <RebornTransition :show="show" name="fade" :duration="duration" :custom-class="`${overlayTheme.base} ${customClass}`" :custom-style="transitionStyle"
    :disable-touch-move="lockScroll" @click="emit('click')">
    <slot />
  </RebornTransition>
</template>
