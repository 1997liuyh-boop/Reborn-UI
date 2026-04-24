<script setup lang="ts">
import { useOverlay } from '~/composables/useOverlay';
import RebornDialog from '~/components/reborn/ui/reborn-dialog/RebornDialog.vue';
import RebornPopup from '~/components/reborn/ui/reborn-popup/RebornPopup.vue';

const overlay = useOverlay();

// 创建 Dialog 实例
const dialog = overlay.create(RebornDialog, {
  props: {
    title: '确认操作',
    description: '这是一个确认对话框',
  },
});

// 创建 Popup 实例
const popup = overlay.create(RebornPopup, {
  props: {
    position: 'bottom',
    title: '底部弹出',
    round: true,
  },
});

// 打开 Dialog
async function openDialog() {
  const result = await dialog.open({
    title: '自定义标题',
    description: '这是自定义描述内容',
  });
  console.log('Dialog 关闭，返回值:', result);
}

// 关闭 Dialog
function closeDialog() {
  dialog.close('用户手动关闭');
}

// 更新 Dialog props
function updateDialog() {
  dialog.patch({
    title: '更新后的标题',
    description: '这是更新后的描述',
  });
}

// 打开 Popup
function openPopup() {
  popup.open({
    title: '底部弹出菜单',
  });
}

// 关闭 Popup
function closePopup() {
  popup.close();
}

// 关闭所有
function closeAll() {
  overlay.closeAll();
}

// 检查状态
function checkStatus() {
  console.log('Dialog 状态:', overlay.isOpen(dialog.id));
  console.log('Popup 状态:', overlay.isOpen(popup.id));
  console.log('所有 overlays:', overlay.overlays);
}
</script>

<template>
  <div class="p-8 space-y-4">
    <h2 class="text-2xl font-bold mb-6">useOverlay 使用示例</h2>

    <div class="space-y-2">
      <h3 class="text-lg font-semibold">Dialog 操作</h3>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          @click="openDialog"
        >
          打开 Dialog
        </button>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          @click="closeDialog"
        >
          关闭 Dialog
        </button>
        <button
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          @click="updateDialog"
        >
          更新 Props
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-lg font-semibold">Popup 操作</h3>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          @click="openPopup"
        >
          打开 Popup
        </button>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          @click="closePopup"
        >
          关闭 Popup
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-lg font-semibold">全局操作</h3>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          @click="closeAll"
        >
          关闭所有
        </button>
        <button
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          @click="checkStatus"
        >
          检查状态
        </button>
      </div>
    </div>
  </div>
</template>
