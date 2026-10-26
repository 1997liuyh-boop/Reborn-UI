<script setup lang="ts">
import { shallowRef } from "vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";

/**
 * 总览卡片缩略：已勾选的复选框
 */

const remember = shallowRef(true);
</script>

<template>
  <RebornCheckbox v-model="remember" label="记住密码" />
</template>
