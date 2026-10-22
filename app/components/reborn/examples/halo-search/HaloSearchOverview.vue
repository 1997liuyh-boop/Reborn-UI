<script setup lang="ts">
/**
 * 总览卡片缩略：深色搜索框，四周一圈紫粉色流光描边，右侧是搜索按钮
 *
 * 组件宽约 314px，整体缩小放进卡片；光晕层用 z-index:-1 垫在下面，
 * 外层需要 relative z-0 自成层叠上下文（同 Demo），否则光晕会掉到卡片底色后面。
 */
</script>

<template>
  <div class="relative z-0 scale-[0.64]">
    <HaloSearch />
  </div>
</template>
