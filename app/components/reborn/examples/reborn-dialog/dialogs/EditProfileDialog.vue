<script setup lang="ts">
import { h, resolveComponent } from "vue";
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
      <div class="space-y-4 py-2">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">姓氏</label>
            <div class="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center text-sm text-gray-600">
              安
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">名字</label>
            <div class="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center text-sm text-gray-600">
              重力
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">电子邮箱</label>
          <div class="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center text-sm text-gray-600">
            antigravity@example.com
          </div>
        </div>
      </div>
    </template>
  </RebornDialog>
</template>
