<script setup lang="ts">
import RebornChip from '~/components/reborn/ui/reborn-chip/RebornChip.vue'

import { chipColors, chipSizes, chipPositions } from '~/components/reborn/ui/reborn-chip/reborn-chip.config'

const color = ref<typeof chipColors[number]>('primary')
const status = ref<typeof chipColors[number]>(chipColors[0])
const size = ref<typeof chipSizes[number]>('md')
const position = ref<typeof chipPositions[number]>('top-right')
const text = ref('9')
const show = ref(true)

const timer = ref<NodeJS.Timeout>()

onMounted(() => {
  timer.value = setInterval(() => {
    if (status.value) {
      status.value = chipColors[(chipColors.indexOf(status.value) + 1) % chipColors.length] ?? chipColors[0]
    }
  }, 1000)
})
onBeforeUnmount(() => {
  clearInterval(timer.value)
})
</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <div
      class="flex flex-wrap items-center gap-6 p-4 border rounded-lg border-gray-4 bg-gray-50/50 dark:bg-gray-900/50 dark:border-gray-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">颜色</span>
        <USelect v-model="color" :items="[...chipColors]" class="w-32" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">大小</span>
        <USelect v-model="size" :items="[...chipSizes]" class="w-24" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">位置</span>
        <USelect v-model="position" :items="[...chipPositions]" class="w-36" />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-500">文本</span>
        <UInput v-model="text" class="w-24" />
      </div>

      <div class="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden md:block"></div>

      <div class="flex flex-wrap items-center gap-4">
        <UCheckbox v-model="show" label="显示" />
      </div>
    </div>

    <div
      class="grid grid-cols-2 gap-6 p-6 border rounded-lg justify-center items-center min-h-[160px] border-gray-4 dark:border-gray-1">
      <div>
        <RebornChip v-model:show="show" :color="color" :size="size" :position="position" :text="text">
          <div class="flex items-center justify-center w-[200px] h-[200px] rounded-lg bg-red-5 dark:bg-gray-800">
            <span class="text-xs text-gray-500">目标</span>
          </div>
        </RebornChip>
      </div>
      <div>
        <RebornChip v-model:show="show" :color="status" :size="size" :position="position" :text="text" inset>
          <UAvatar src="https://github.com/benjamincanac.png" size="3xl" />
        </RebornChip>
      </div>
    </div>
  </div>
</template>
