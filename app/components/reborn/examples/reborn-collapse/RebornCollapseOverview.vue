<script setup lang="ts">
/**
 * 总览卡片缩略：展开状态的单个折叠面板
 *
 * 触发行与正文都由插槽提供，这里沿用 Demo 的写法：带边框的标题行加旋转箭头。
 */
import { ref } from 'vue'
import RebornCollapse from '~/components/reborn/ui/reborn-collapse/RebornCollapse.vue'

const expanded = ref(true)
</script>

<template>
  <div class="w-full max-w-[210px]">
    <RebornCollapse
      v-model="expanded"
      custom-class="w-full"
    >
      <template #default="{ open }">
        <div class="border-default flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
          <span>配送说明</span>
          <Icon
            name="lucide:chevron-down"
            class="size-4 transition-transform"
            :class="open ? 'rotate-180' : ''"
          />
        </div>
      </template>
      <template #content>
        <div class="text-muted px-3 py-2 text-xs">
          下单后 48 小时内发货
        </div>
      </template>
    </RebornCollapse>
  </div>
</template>
