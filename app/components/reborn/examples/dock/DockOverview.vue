<script setup lang="ts">
/**
 * 总览卡片缩略：静止状态的 Dock 栏，一个独立图标、分隔线与三个应用图标
 *
 * 放大效果只在鼠标移入时由组件计算，缩略图禁用交互，保留静止排布即可辨认；
 * 组件自带 mt-8 会让 Dock 偏离卡片中心，这里清零后整体缩小以放进卡片宽度；
 * 边框未指定颜色时取文字色，显得过重，经 class 换成浅灰边框。
 */
</script>

<template>
  <Dock class="mt-0! scale-[0.82] border-gray-3 text-gray-9">
    <DockIcon>
      <Icon
        name="simple-icons:github"
        class="size-full"
      />
    </DockIcon>
    <DockSeparator />
    <DockIcon>
      <Icon
        name="logos:google-drive"
        class="size-full"
      />
    </DockIcon>
    <DockIcon>
      <Icon
        name="logos:notion-icon"
        class="size-full"
      />
    </DockIcon>
    <DockIcon>
      <Icon
        name="logos:whatsapp-icon"
        class="size-full"
      />
    </DockIcon>
  </Dock>
</template>
