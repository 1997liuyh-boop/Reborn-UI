<script setup lang="ts">
/**
 * 总览卡片缩略：已选中「选项二」的下拉选择，面板在触发器下方展开
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：展开时触发器描边变为主色，
 * 面板贴在触发器正下方，选中项为主色浅底、主色文字并带对勾。
 * 开启 clearable 时有值的触发器右侧显示清空图标（无值时才显示下拉箭头）。
 */
const options = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' },
]
const selected = '2'
</script>

<template>
  <div class="flex w-[184px] flex-col gap-1">
    <!-- 触发器：展开态描边为主色 -->
    <div class="flex h-8 items-center rounded-lg border border-primary bg-gray-1 px-2.5">
      <span class="flex-1 truncate text-xs text-gray-9">选项二</span>
      <Icon
        name="lucide:circle-x"
        class="size-4 text-gray-5"
      />
    </div>
    <!-- 面板：圆角描边加投影，选项之间以细线分隔 -->
    <div class="overflow-hidden rounded-lg border border-gray-3 bg-gray-1 shadow-lg">
      <div
        v-for="item in options"
        :key="item.value"
        class="flex h-7 items-center justify-between border-b border-gray-2 px-3 text-xs last:border-b-0"
        :class="[
          item.value === selected ? 'bg-primary/10 font-medium text-primary' : 'text-gray-8',
        ]"
      >
        <span class="flex-1 truncate">{{ item.label }}</span>
        <Icon
          v-if="item.value === selected"
          name="lucide:check"
          class="size-3.5 text-primary"
        />
      </div>
    </div>
  </div>
</template>
