<script setup lang="ts">
import { Icon } from "#components";
import fieldTheme from "~/components/reborn/ui/reborn-field-trigger/reborn-field-trigger.config";
import { tv } from "~/lib/tv";

/** 缩略图只复用触发框主题，不创建浮层、Teleport 或全局监听。 */
const styles = tv(fieldTheme)({ size: "sm", variant: "outlined", color: "primary" });
</script>

<template>
  <div class="w-full max-w-[210px]">
    <div :class="styles.trigger()" aria-hidden="true">
      <span :class="styles.triggerText()">浙江 / 杭州 / 西湖</span>
      <span :class="styles.triggerIconWrapper()"><Icon name="lucide:chevron-down" :class="styles.arrow()" /></span>
    </div>
  </div>
</template>
