<script lang="ts">
export default {
  name: 'reborn-root-portal',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared'
  }
}
</script>

<script lang="ts" setup>
</script>

<template>
  <!-- #ifdef H5 -->
  <teleport to="body">
    <slot />
  </teleport>
  <!-- #endif -->
  <!-- #ifdef MP-WEIXIN || MP-ALIPAY -->
  <!-- #ifndef MP-DINGTALK -->
  <root-portal>
    <slot />
  </root-portal>
  <!-- #endif -->
  <!-- #endif -->
  <!-- #ifdef APP-PLUS -->
  <view>
    <slot />
  </view>
  <!-- #endif -->
  <!-- #ifndef H5 || MP-WEIXIN || MP-ALIPAY || APP-PLUS -->
  <slot />
  <!-- #endif -->
</template>

<!-- #ifdef APP-PLUS -->
<script module="render" lang="renderjs">
export default {
  mounted() {
    if (this.$ownerInstance.$el) {
      (document.querySelector('uni-app') || document.body).appendChild(this.$ownerInstance.$el)
    }
  },
  beforeDestroy() {
    if (this.$ownerInstance.$el) {
      (document.querySelector('uni-app') || document.body).removeChild(this.$ownerInstance.$el)
    }
  }
}
</script>
<!-- #endif -->
