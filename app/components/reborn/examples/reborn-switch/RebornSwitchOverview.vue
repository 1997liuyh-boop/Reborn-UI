<script setup lang="ts">
/**
 * 总览卡片缩略：打开状态的开关
 */
import { ref } from 'vue'
import RebornSwitch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue'

const enabled = ref(true)
</script>

<template>
  <RebornSwitch v-model="enabled" />
</template>
