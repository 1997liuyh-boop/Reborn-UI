<script lang="ts">
export default {
  name: 'reborn-loadmore',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import RebornLoading from '@/components/reborn-loading/RebornLoading.vue'
import { useTranslate } from '@/lib/reborn-common/useTranslate'
import { isDef, isUndefined, omitBy } from '@/lib/reborn-common/util'
import { loadmoreTheme } from './reborn-loadmore.config'

interface LoadMoreProps {
  state?: 'loading' | 'error' | 'finished'
  loadingText?: string
  finishedText?: string
  errorText?: string
  loadingProps?: Record<string, any>
  customClass?: string
  customStyle?: string
}

const props = withDefaults(defineProps<LoadMoreProps>(), {
  state: 'loading',
  loadingText: '',
  finishedText: '',
  errorText: '',
  loadingProps: undefined,
  customClass: '',
  customStyle: '',
})

const emit = defineEmits(['reload'])
const { translate } = useTranslate('loadmore')

const customLoadingProps = computed(() => {
  const next = isDef(props.loadingProps) ? omitBy(props.loadingProps, isUndefined) : {}
  return { ...next, customClass: `${loadmoreTheme.loading} ${next.customClass || ''}` }
})

function reload() {
  if (props.state !== 'error') return
  emit('reload')
}
</script>

<template>
  <view :class="`${loadmoreTheme.root} ${customClass}`" :style="customStyle" @click="reload">
    <view v-if="state === 'finished'" :class="loadmoreTheme.text">{{ finishedText || translate('finished') }}</view>
    <block v-if="state === 'error'">
      <text :class="loadmoreTheme.text">{{ errorText || translate('error') }}</text>
      <text :class="`${loadmoreTheme.text} ${loadmoreTheme.textLight}`">{{ translate('retry') }}</text>
      <text :class="loadmoreTheme.refresh">↻</text>
    </block>
    <block v-if="state === 'loading'">
      <RebornLoading v-bind="customLoadingProps" />
      <text :class="loadmoreTheme.text">{{ loadingText || translate('loading') }}</text>
    </block>
  </view>
</template>
