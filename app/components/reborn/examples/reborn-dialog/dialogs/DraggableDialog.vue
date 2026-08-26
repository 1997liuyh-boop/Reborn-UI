<script setup lang="ts">
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

/**
 * 拖拽演示对话框
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
    :title="title || '自由拖拽'"
    :description="description || '按住标题区域即可平移位置。'"
    draggable
    confirm-btn="确定"
    cancel-btn="取消"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <slot />

    <template #content>
      <div class="text-dimmed flex flex-col items-center gap-2 py-6 text-center">
        <Icon name="lucide:mouse-pointer-2" class="size-8 opacity-40" />
        <p class="text-xs">该模式下弹窗不会锁定在屏幕正中</p>
      </div>
    </template>
  </RebornDialog>
</template>
