<script setup lang="ts">
import RebornChip from '~/components/reborn/ui/reborn-chip/RebornChip.vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'

const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const sizes = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
const positions = ['top-right', 'bottom-right', 'top-left', 'bottom-left'] as const

const color = ref<typeof colors[number]>('primary')
const size = ref<typeof sizes[number]>('md')
const position = ref<typeof positions[number]>('top-right')
const text = ref('9')
const show = ref(true)
const inset = ref(false)
const standalone = ref(false)
</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <div
      class="flex flex-wrap items-center gap-6 p-4 border rounded-lg border-gray-4 bg-gray-50/50 dark:bg-gray-900/50 dark:border-gray-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">颜色</span>
        <USelect v-model="color" :items="colors" class="w-32" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">大小</span>
        <USelect v-model="size" :items="sizes" class="w-24" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">位置</span>
        <USelect v-model="position" :items="positions" class="w-36" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">文本</span>
        <UInput v-model="text" class="w-24" />
      </div>

      <div class="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block"></div>

      <div class="flex flex-wrap items-center gap-4">
        <UCheckbox v-model="show" label="显示" />
        <UCheckbox v-model="inset" label="Inset" />
        <UCheckbox v-model="standalone" label="Standalone" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        class="flex flex-col gap-4 p-6 border rounded-lg justify-center items-center min-h-[160px] border-gray-4 dark:border-gray-1">
        <h3 class="text-sm font-medium text-gray-400 self-start">Chip 展示</h3>
        <RebornChip v-model:show="show" :color="color" :size="size" :position="position" :text="text"
          :inset="inset" :standalone="standalone">
          <div class="flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800">
            <span class="text-xs text-gray-500">目标</span>
          </div>
        </RebornChip>
      </div>

      <div class="flex flex-col gap-4 p-6 border rounded-lg border-gray-4 dark:border-gray-1">
        <h3 class="text-sm font-medium text-gray-400">控制</h3>
        <div class="flex flex-col gap-3">
          <RebornButton color="primary" variant="solid" class="w-40" @click="show = !show">
            {{ show ? '隐藏 Chip' : '显示 Chip' }}
          </RebornButton>
          <div class="flex flex-wrap gap-3">
            <RebornChip color="success" size="sm" text="1" />
            <RebornChip color="warning" size="md" text="2" />
            <RebornChip color="error" size="lg" text="3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
