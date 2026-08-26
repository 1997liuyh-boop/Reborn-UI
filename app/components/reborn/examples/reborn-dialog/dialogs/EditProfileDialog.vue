<script setup lang="ts">
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

/**
 * 编辑个人资料对话框
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

/** 演示用的只读表单字段 */
const profileFields = [
  { label: "姓氏", value: "安" },
  { label: "名字", value: "重力" },
  { label: "电子邮箱", value: "antigravity@example.com" },
];

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
    :title="title || '编辑个人资料'"
    :description="description || '在此修改您的个人账户信息，完成后点击保存。'"
    confirm-btn="保存修改"
    cancel-btn="取消"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <slot />

    <template #content>
      <!-- 只读字段列表：靠分隔线区分行，不额外铺底色 -->
      <div class="divide-default flex flex-col divide-y">
        <div v-for="field in profileFields" :key="field.label" class="flex items-center justify-between gap-4 py-2.5">
          <span class="text-muted text-sm">{{ field.label }}</span>
          <span class="text-highlighted text-sm font-medium">{{ field.value }}</span>
        </div>
      </div>
    </template>
  </RebornDialog>
</template>
