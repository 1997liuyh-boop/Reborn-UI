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
      <!-- 业务内容占位：只描边不填充，避免在弹窗面板内再叠一层表面 -->
      <div class="border-default text-dimmed rounded-ui-sm flex items-center justify-center border border-dashed py-10 text-sm">
        第一层业务内容区域
      </div>
    </template>
  </RebornDialog>
</template>
