<script setup lang="ts">
import RebornAffix from '@/components/reborn-affix/RebornAffix.vue'

import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleDarkMode } = useDarkMode()

const list = ['i-meteocons-clear-day-fill', 'i-meteocons-solar-eclipse-fill']
</script>

<template>
  <RebornPage>
    <RebornCard>
      <view class="dark:text-white">
        禁用状态，无法拖拽
      </view>
    </RebornCard>

    <RebornCard>
      <view class="dark:text-white">
        不吸附边缘，任意位置可拖拽
      </view>
    </RebornCard>
    <RebornAffix disabled :right="20" :bottom="150" :gap="10">
      <view class="i-meteocons-hurricane-fill size-10" />
    </RebornAffix>
    <RebornAffix :left="20" :bottom="150" :no-snapping="true">
      <view
        class="
          bg-primary-500 flex size-10 flex-col items-center justify-center
          overflow-hidden rounded-full
        "
        @tap="toggleDarkMode"
      >
        <view
          class="flex flex-col transition-transform duration-300"
          :class="isDark ? '-translate-y-[20px]' : `translate-y-[20px]`"
        >
          <view
            v-for="item in list" :key="item" :class="item" class="
              size-10 text-white
            "
          />
        </view>
      </view>
    </RebornAffix>
  </RebornPage>
</template>
