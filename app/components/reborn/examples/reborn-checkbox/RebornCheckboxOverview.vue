<script setup lang="ts">
/**
 * 总览卡片缩略：已勾选的复选框
 */
import { ref } from 'vue'
import RebornCheckbox from '~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue'

const remember = ref(true)
</script>

<template>
  <RebornCheckbox
    v-model="remember"
    label="记住密码"
  />
</template>
