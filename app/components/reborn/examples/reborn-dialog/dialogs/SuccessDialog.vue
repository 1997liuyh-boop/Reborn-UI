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
      panel: 'max-w-[360px] rounded-ui-lg',
      header: 'border-0 pb-0',
      body: 'text-center pt-2 pb-6',
      footer: 'border-0 pt-0 justify-center pb-6',
    }"
    @confirm="handleConfirm"
  >
    <slot />

    <template #content>
      <div class="bg-success/10 text-success mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
        <Icon name="lucide:check-circle-2" class="size-8" />
      </div>
      <h4 class="text-highlighted mb-1 text-base font-semibold">操作已成功</h4>
      <p class="text-muted text-xs">{{ message || '您的设置已即时生效，无需额外操作。' }}</p>
    </template>

    <template #footer>
      <RebornButton label="好的，我知道了" color="primary" class="w-full" @click="open = false" />
    </template>
  </RebornDialog>
</template>
