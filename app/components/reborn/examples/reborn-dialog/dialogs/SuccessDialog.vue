<script setup lang="ts">
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";

/**
 * 成功提示对话框
 */
const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  title?: string;
  message?: string;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

function handleConfirm() {
  emit("confirm");
}
</script>

<template>
  <RebornDialog
    v-model:open="open"
    :title="title || '精简模式'"
    :close="false"
    :ui="{
      panel: 'max-w-[360px] rounded-3xl',
      header: 'border-0 pb-0',
      body: 'text-center pt-2 pb-6',
      footer: 'border-0 pt-0 justify-center pb-6',
    }"
    @confirm="handleConfirm"
  >
    <slot />

    <template #content>
      <div class="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
        <Icon name="lucide:check-circle-2" class="w-8 h-8" />
      </div>
      <h4 class="font-semibold text-gray-900 mb-1 text-base">操作已成功</h4>
      <p class="text-xs text-gray-500">{{ message || '您的设置已即时生效，无需额外操作。' }}</p>
    </template>

    <template #footer>
      <RebornButton label="好的，我知道了" color="primary" class="w-full" @click="open = false" />
    </template>
  </RebornDialog>
</template>
