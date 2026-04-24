<script setup lang="ts">
import { ref } from "vue";
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

/**
 * 云端同步对话框
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

const saving = ref(false);

function handleConfirm() {
  saving.value = true;
  emit("confirm");
}

function handleCancel() {
  emit("cancel");
}

function resetState() {
  saving.value = false;
}

// 暴露重置方法
defineExpose({
  resetState,
  saving,
});
</script>

<template>
  <RebornDialog
    v-model:open="open"
    :title="title || '同步云端设置'"
    :description="description || '正在将您的配置上传至私有云端节点...'"
    :confirm-btn="{ label: saving ? '正在同步...' : '立即同步', loading: saving }"
    :cancel-btn="saving ? false : '稍后再说'"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <slot />

    <template #content>
      <div class="flex items-center gap-4 p-4 rounded-xl bg-secondary/5 text-secondary border border-secondary/10">
        <Icon name="lucide:cloud-upload" class="w-5 h-5 shrink-0" />
        <span class="text-xs font-medium">系统检测到 3 项配置需要合并同步。</span>
      </div>
    </template>
  </RebornDialog>
</template>
