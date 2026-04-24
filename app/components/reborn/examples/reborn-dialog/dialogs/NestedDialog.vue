<script setup lang="ts">
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

/**
 * 嵌套流程对话框
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
    :title="title || '第一层对话框'"
    :description="description || '您可以点击下方按钮开启更深一层的交互。'"
    confirm-btn="下一步"
    cancel-btn="取消"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <slot />

    <template #content>
      <div class="py-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 italic">
        第一层业务内容区域
      </div>
    </template>
  </RebornDialog>
</template>
