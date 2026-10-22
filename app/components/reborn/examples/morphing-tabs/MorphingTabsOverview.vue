<script setup lang="ts">
/**
 * 总览卡片缩略：选中的「首页」与其余标签拉开间距，未选中的「应用」「我的」黏连成一条
 *
 * 选中第一项：选中项两侧都拉开时三个标签会各自分离，看不出黏连；选首项能同时呈现分离与相连两种形态。组件内的滤镜定义放在一个默认 300×150 的 svg 里，
 * 不影响显示但会撑大占位，这里把它压成 0 尺寸（滤镜仍然生效）。
 * 标签文字用的 text-background 在本站没有对应令牌，外层补白色文字以贴近原设计。
 */
const tabs = ['首页', '应用', '我的']
</script>

<template>
  <div class="text-sm text-white [&_svg]:size-0">
    <MorphingTabs
      :tabs="tabs"
      active-tab="首页"
      :margin="12"
    />
  </div>
</template>
