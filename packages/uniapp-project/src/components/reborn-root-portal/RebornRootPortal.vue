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
  <!-- H5端使用 teleport -->
  <teleport to="body">
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN || MP-ALIPAY -->
    <!-- #ifndef MP-DINGTALK -->
    <!-- 小程序使用 root-portal -->
    <root-portal>
      <!-- #endif -->
      <!-- #endif -->
      <view>
        <slot />
      </view>
      <!-- #ifdef MP-WEIXIN || MP-ALIPAY -->
      <!-- #ifndef MP-DINGTALK -->
    </root-portal>
    <!-- #endif -->
    <!-- #endif -->
    <!-- #ifdef H5 -->
  </teleport>
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
