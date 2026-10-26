<script setup lang="ts">
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

/**
 * 云端同步对话框
 */
const open = defineModel<boolean>("open", { default: undefined });

interface Props {
  title?: string;
  description?: string;
  confirmBtn?: { label?: string; loading?: boolean };
}
defineProps<Props>();

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
    v-model="open"
    :title="title || '同步云端设置'"
    :describe="description || '正在将您的配置上传至私有云端节点...'"
    :confirm-btn="{ label: '立即同步', ...confirmBtn }"
    cancel-btn="稍后再说"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #trigger>
      <slot />
    </template>

    <template #default>
      <!-- 弹窗面板内的语义提示条，属原子标记而非嵌套容器 -->
      <div class="bg-secondary/10 text-secondary rounded-lg flex items-center gap-3 p-3">
        <Icon name="lucide:cloud-upload" class="size-5 shrink-0" />
        <span class="text-xs font-medium">系统检测到 3 项配置需要合并同步。</span>
      </div>
    </template>
  </RebornDialog>
</template>
