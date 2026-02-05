<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'

import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornAffix from '@/components/reborn-affix/RebornAffix.vue'

const { isDark, toggleDarkMode } = useDarkMode()

const list = ['i-meteocons-clear-day-fill', 'i-meteocons-solar-eclipse-fill']
</script>

<template>
    <reborn-page>
        <reborn-card>
            <view class="dark:text-white">禁用状态，无法拖拽</view>
        </reborn-card>

        <reborn-card>
            <view class="dark:text-white">不吸附边缘，任意位置可拖拽</view>
        </reborn-card>
        <reborn-affix disabled :left="20" :bottom="400" :gap="10">
            <view class="size-10 i-meteocons-hurricane-fill"></view>
        </reborn-affix>
        <reborn-affix :left="200" :bottom="50" :no-snapping="true">
            <view
                class="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-primary-500 overflow-hidden"
                @tap="toggleDarkMode">
                <view class="flex flex-col duration-300 transition-transform"
                    :class="isDark ? '-translate-y-[20px]' : 'translate-y-[20px]'">
                    <view v-for="item in list" :key="item" :class="item" class="text-white size-10" />
                </view>
            </view>
        </reborn-affix>
    </reborn-page>
</template>