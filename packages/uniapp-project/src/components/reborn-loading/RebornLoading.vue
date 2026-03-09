<script lang="ts">
export default {
  name: 'reborn-loading',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { addUnit } from '@/lib/reborn-common/util'
import { loadingTheme } from './reborn-loading.config'

type LoadingType = 'outline' | 'ring' | 'spinner'
interface LoadingProps {
  type?: LoadingType
  color?: string
  size?: string | number
  customClass?: string
  customStyle?: string
}

const props = withDefaults(defineProps<LoadingProps>(), {
  type: 'ring',
  color: '#4D80F0',
  size: '28',
  customClass: '',
  customStyle: '',
})

const rootStyle = computed(() => {
  const size = addUnit(props.size)
  return `color:${props.color};width:${size};height:${size};${props.customStyle}`
})
</script>

<template>
  <view :class="`${loadingTheme.base} ${customClass}`" :style="rootStyle">
    <view :class="`${loadingTheme.icon[type]} size-full`" />
  </view>
</template>
