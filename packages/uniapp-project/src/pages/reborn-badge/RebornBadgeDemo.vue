<script setup lang="ts">
import { ref } from 'vue'
import { badgeColors, badgeSizes, badgeVariants } from '@/components/reborn-badge/reborn-badge.config'
import RebornBadge from '@/components/reborn-badge/RebornBadge.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

import RebornPage from '@/components/reborn-page/RebornPage.vue'

const showBadge = ref(true)
// const sizes = ['sm', 'md', 'lg'] as const
// const variants = ['solid', 'outline', 'soft'] as const
// const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
const currentColor = ref<typeof badgeColors[number]>('primary')
const demoSize = ref<typeof badgeSizes[number]>('md')
const demoVariant = ref<typeof badgeVariants[number]>('solid')
function handleClose() {
  showBadge.value = false
  setTimeout(() => {
    showBadge.value = true
  }, 2000)
}
</script>

<template>
  <RebornPage title="Badge" description="Badge component for status, labels, and notifications.">
    <!-- Variants -->
    <RebornCard title="Variants" custom-class="space-y-4">
      <view class="space-y-3">
        <view
          class="
            text-sm font-medium text-slate-500
            dark:text-slate-200
          "
        >
          Variant
        </view>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="v in badgeVariants" :key="v"
            class="
              cursor-pointer rounded-full border px-3 py-1.5 text-xs
              transition-colors
            "
            :class="demoVariant === v ? `
              border-slate-900 bg-slate-900 text-white
              dark:bg-white dark:text-slate-900
            ` : `
              border-slate-300 bg-transparent text-slate-600
              hover:border-slate-400
            `"
            @click="demoVariant = v"
          >
            {{ v }}
          </view>
        </view>
      </view>

      <view class="space-y-3">
        <text class="text-sm text-slate-500">Color</text>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="c in badgeColors" :key="c"
            class="
              size-6 cursor-pointer rounded-full ring-2 ring-transparent
              ring-offset-2 transition-all
            "
            :class="[
              `
                bg-${c}
              `,
              currentColor === c ? 'scale-110 ring-slate-400' : `
                hover:scale-110
              `,
            ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
            @click="currentColor = c"
          />
        </view>
      </view>

      <view class="space-y-3">
        <view
          class="
            text-sm font-medium text-slate-500
            dark:text-slate-200
          "
        >
          Size
        </view>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="s in badgeSizes" :key="s"
            class="
              cursor-pointer rounded-full border px-3 py-1.5 text-xs
              transition-colors
            "
            :class="demoSize === s ? `
              border-slate-900 bg-slate-900 text-white
              dark:bg-white dark:text-slate-900
            ` : `
              border-slate-300 bg-transparent text-slate-600
              hover:border-slate-400
            `"
            @click="demoSize = s"
          >
            {{ s }}
          </view>
        </view>
      </view>

      <view class="flex flex-wrap gap-3">
        <RebornBadge :variant="demoVariant" :label="demoVariant" :color="currentColor" :size="demoSize" />
      </view>
    </RebornCard>

    <!-- Icons -->
    <RebornCard title="Icons" custom-class="flex flex-wrap gap-3">
      <RebornBadge icon="i-lucide-check" label="Success" color="success" />
      <RebornBadge icon="i-lucide-alert-circle" label="Warning" color="warning" />
      <RebornBadge icon="i-lucide-info" label="Info" color="info" />
      <RebornBadge icon="i-lucide-star" />
    </RebornCard>

    <!-- Closable -->
    <RebornCard title="Closable" custom-class="flex flex-wrap gap-3">
      <RebornBadge v-if="showBadge" label="Closable (Reappears in 2s)" closable @close="handleClose" />
      <RebornBadge label="Closable Outline" variant="outline" closable />
      <RebornBadge label="Closable Soft" variant="soft" closable />
    </RebornCard>

    <!-- Square -->
    <RebornCard title="Square" custom-class="flex flex-wrap gap-3">
      <RebornBadge label="Square Badge" square />
      <RebornBadge label="Square Outline" variant="outline" square />
    </RebornCard>
  </RebornPage>
</template>
