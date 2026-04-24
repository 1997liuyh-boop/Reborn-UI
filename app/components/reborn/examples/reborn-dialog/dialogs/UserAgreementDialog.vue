<script setup lang="ts">
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

/**
 * 用户协议对话框
 */
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  title?: string;
  description?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const longContent = Array.from({ length: 15 }, (_, i) =>
  `这是第 ${i + 1} 段演示文本。Dialog 组件支持在内容过多时开启 scrollable 模式，此时面板高度会被限制，正文区域将独立滚动，而页头和页脚始终保持固定在视口中。`
).join('\n\n');

function handleConfirm() {
  emit("confirm");
}

function handleCancel() {
  emit("cancel");
}
</script>

<template>
  <RebornDialog
    v-model:open="open"
    :title="title || '用户服务协议'"
    :description="description || '更新日期：2026年3月'"
    confirm-btn="我已阅读"
    cancel-btn="关闭"
    scrollable
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <slot />

    <template #content>
      <div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
        {{ longContent }}
      </div>
    </template>
  </RebornDialog>
</template>
