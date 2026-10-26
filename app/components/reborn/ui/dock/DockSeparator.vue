<script setup lang="ts">
import type { DataOrientation } from "./types";
import { inject, shallowRef } from "vue";
import { ORIENTATION_INJECTION_KEY } from "./injectionKeys";

// 缺省值与 Dock 的默认方向一致；注入的是引用，Dock 切换方向后随之更新（模板中自动解包）
const orientation = inject(ORIENTATION_INJECTION_KEY, shallowRef<DataOrientation>("horizontal"));
</script>

<template>
  <div
    class="bg-secondary relative block"
    :class="[orientation === 'vertical' ? 'h-0.5 w-4/5' : 'h-4/5 w-0.5']"
  />
</template>
