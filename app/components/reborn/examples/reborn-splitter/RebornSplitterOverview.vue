<script setup lang="ts">
/**
 * 总览卡片缩略：左右两栏分隔面板，左侧目录、右侧正文，中间分隔条带一枚拖拽手柄
 *
 * 分隔条默认只是 2px 灰线，缩略尺寸下不易察觉，这里通过 bar 插槽加上手柄让它一眼可辨。
 */

/** 左栏目录条目 */
const tree = [
  { icon: 'lucide:folder-open', width: 'w-12', active: false },
  { icon: 'lucide:file-text', width: 'w-10', active: true },
  { icon: 'lucide:file-text', width: 'w-8', active: false },
  { icon: 'lucide:folder', width: 'w-11', active: false },
]
</script>

<template>
  <div class="h-[120px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <RebornSplitter>
      <RebornSplitterPanel :size="38">
        <div class="flex h-full flex-col gap-2 bg-gray-2/60 p-2.5">
          <div
            v-for="(item, index) in tree"
            :key="index"
            class="flex items-center gap-1.5"
          >
            <Icon
              :name="item.icon"
              class="size-3 shrink-0"
              :class="item.active ? 'text-primary' : 'text-gray-6'"
            />
            <span
              class="h-1.5 rounded-sm"
              :class="[item.width, item.active ? 'bg-primary/50' : 'bg-gray-4']"
            />
          </div>
        </div>

        <template #bar>
          <span class="absolute flex h-7 w-3 items-center justify-center rounded-full border border-gray-4 bg-gray-1 shadow-sm">
            <Icon
              name="lucide:grip-vertical"
              class="size-3 text-gray-6"
            />
          </span>
        </template>
      </RebornSplitterPanel>

      <RebornSplitterPanel>
        <div class="flex h-full flex-col gap-2 p-3">
          <div class="h-2.5 w-16 rounded-sm bg-gray-4" />
          <div class="h-1.5 w-full rounded-sm bg-gray-2" />
          <div class="h-1.5 w-[85%] rounded-sm bg-gray-2" />
          <div class="h-1.5 w-[90%] rounded-sm bg-gray-2" />
          <div class="h-1.5 w-[60%] rounded-sm bg-gray-2" />
        </div>
      </RebornSplitterPanel>
    </RebornSplitter>
  </div>
</template>
