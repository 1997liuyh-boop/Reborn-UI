<script setup lang="ts">
import { shallowRef } from 'vue';

/**
 * 总览卡片缩略：四条待办组成的可排序列表，第二条正被拖起
 *
 * 拖起的样子只在真实拖动时出现，缩略图在插槽里给第二项直接套上抬起样式（投影、主色描边、轻微倾斜）。
 */

/** 待办列表，color 为优先级圆点颜色 */
const tasks = shallowRef([
  { id: 1, name: '整理需求文档', color: 'bg-error' },
  { id: 2, name: '评审交互稿', color: 'bg-warning' },
  { id: 3, name: '联调登录接口', color: 'bg-primary' },
  { id: 4, name: '编写测试用例', color: 'bg-success' },
])

/** 模拟正被拖起的那一项 */
const liftedId = 2
</script>

<template>
  <RebornDraggable
    v-model="tasks"
    class-name="w-[180px] gap-2!"
  >
    <template #item="{ item }">
      <div
        class="flex h-6 items-center gap-2 rounded-md border bg-gray-1 px-2 text-xs"
        :class="item.id === liftedId ? 'relative z-1 translate-x-2 -rotate-2 border-primary shadow-lg' : 'border-gray-3'"
      >
        <Icon
          name="lucide:grip-vertical"
          class="size-3.5 shrink-0 text-gray-5"
        />
        <span
          class="size-1.5 shrink-0 rounded-full"
          :class="item.color"
        />
        <span class="truncate text-gray-9">{{ item.name }}</span>
        <Icon
          v-if="item.id === liftedId"
          name="lucide:grab"
          class="ml-auto size-3.5 shrink-0 text-primary"
        />
      </div>
    </template>
  </RebornDraggable>
</template>
