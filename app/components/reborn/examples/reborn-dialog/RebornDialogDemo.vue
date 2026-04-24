<script setup lang="ts">
import { ref } from "vue";
import { useOverlay } from "~/composables/useOverlay";
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";
import EditProfileDialog from "./dialogs/EditProfileDialog.vue";
import NestedDialog from "./dialogs/NestedDialog.vue";
import UserAgreementDialog from "./dialogs/UserAgreementDialog.vue";
import CloudSyncDialog from "./dialogs/CloudSyncDialog.vue";
import DraggableDialog from "./dialogs/DraggableDialog.vue";
import SuccessDialog from "./dialogs/SuccessDialog.vue";

// 1. Playground 状态对象
const state = ref({
  title: "编辑个人资料",
  description: "在此修改您的个人账户信息，完成后点击保存。",
  overlay: true,
  dismissible: true,
  scrollable: false,
  fullscreen: false,
  draggable: false,
  close: true,
  closeIcon: "lucide:x",
  confirmBtn: "保存修改",
  cancelBtn: "取消",
  openDelay: 0,
  closeDelay: 0,
  zIndex: 2400,
  lockScroll: true,
});

// 2. Playground 控制面板配置
const controls = [
  {
    title: "基础内容",
    children: [
      { label: "标题文本", key: "title", component: "input" as const, defaultValue: "编辑个人资料" },
      { label: "描述文本", key: "description", component: "input" as const, defaultValue: "" },
      { label: "确认按钮", key: "confirmBtn", component: "input" as const, defaultValue: "确认" },
      { label: "取消按钮", key: "cancelBtn", component: "input" as const, defaultValue: "取消" },
    ],
  },
  {
    title: "交互行为",
    children: [
      { label: "显示遮罩", key: "overlay", component: "checkbox" as const, defaultValue: true },
      { label: "允许点击背景关闭", key: "dismissible", component: "checkbox" as const, defaultValue: true },
      { label: "允许滚动正文", key: "scrollable", component: "checkbox" as const, defaultValue: false },
      { label: "全屏显示", key: "fullscreen", component: "checkbox" as const, defaultValue: false },
      { label: "允许拖拽头部", key: "draggable", component: "checkbox" as const, defaultValue: false },
      { label: "显示关闭按钮", key: "close", component: "checkbox" as const, defaultValue: true },
      { label: "锁定背景滚动", key: "lockScroll", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "高级配置",
    children: [
      { label: "打开延迟(ms)", key: "openDelay", component: "input" as const, defaultValue: 0 },
      { label: "关闭延迟(ms)", key: "closeDelay", component: "input" as const, defaultValue: 0 },
      { label: "层级(z-index)", key: "zIndex", component: "input" as const, defaultValue: 2400 },
    ],
  },
];

// 3. 业务状态
const nestedOpen1 = ref(false);
const nestedOpen2 = ref(false);
const asyncOpen = ref(false);
const saving = ref(false);

function handleAsyncConfirm() {
  saving.value = true;
  setTimeout(() => {
    saving.value = false;
    asyncOpen.value = false;
  }, 2000);
}

// 4. useOverlay composables
const overlay = useOverlay();

// Playground overlay 实例 - 使用原始 RebornDialog
const playgroundDialog = overlay.create(RebornDialog, {
  props: state.value
});

// 编辑个人资料 overlay 实例 - 使用二次封装组件
const editProfileDialog = overlay.create(EditProfileDialog, {
  props: {}
});

// 嵌套弹窗 overlay 实例 - 使用二次封装组件
const nestedDialog = overlay.create(NestedDialog, {
  props: {}
});

// 用户协议 overlay 实例 - 使用二次封装组件
const userAgreementDialog = overlay.create(UserAgreementDialog, {
  props: {}
});

// 云端同步 overlay 实例 - 使用二次封装组件
const cloudSyncDialog = overlay.create(CloudSyncDialog, {
  props: {}
});

// 拖拽演示 overlay 实例 - 使用二次封装组件
const draggableDialog = overlay.create(DraggableDialog, {
  props: {}
});

// 成功提示 overlay 实例 - 使用二次封装组件
const successDialog = overlay.create(SuccessDialog, {
  props: {}
});

// 延迟打开/关闭演示 overlay 实例
const delayedDialog = overlay.create(RebornDialog, {
  props: {
    title: "延迟效果演示",
    description: "此对话框有 500ms 的打开和关闭延迟",
    openDelay: 500,
    closeDelay: 500,
    confirmBtn: "确定",
    cancelBtn: "取消"
  }
});

// 全屏模式演示 overlay 实例
const fullscreenDialog = overlay.create(RebornDialog, {
  props: {
    title: "全屏模式",
    description: "全屏显示的对话框，适合展示大量内容",
    fullscreen: true,
    confirmBtn: "关闭"
  }
});

// 自定义关闭按钮图标演示 overlay 实例
const customIconDialog = overlay.create(RebornDialog, {
  props: {
    title: "自定义关闭按钮",
    description: "使用不同的图标作为关闭按钮",
    closeIcon: "lucide:arrow-left",
    confirmBtn: "确定"
  }
});

// 打开 Playground Dialog
async function openPlaygroundDialog() {
  await playgroundDialog.open(state.value);
}

// 打开编辑个人资料 Dialog
async function openEditProfileDialog() {
  const result = await editProfileDialog.open();
  console.log("编辑个人资料结果:", result);
}

// 打开嵌套 Dialog
async function openNestedDialog() {
  await nestedDialog.open();
}

// 打开用户协议 Dialog
async function openUserAgreementDialog() {
  await userAgreementDialog.open();
}

// 打开云端同步 Dialog
async function openCloudSyncDialog() {
  const result = await cloudSyncDialog.open();

  // 如果用户点击了确认按钮
  if (result === 'confirm') {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 关闭弹窗
    cloudSyncDialog.close('synced');
    console.log("同步完成");
  }
}

// 打开拖拽 Dialog
async function openDraggableDialog() {
  await draggableDialog.open();
}

// 打开成功提示 Dialog
async function openSuccessDialog() {
  await successDialog.open();
}

// 打开延迟效果 Dialog
async function openDelayedDialog() {
  console.log("开始打开（延迟 500ms）...");
  await delayedDialog.open();
  console.log("已关闭（延迟 500ms）");
}

// 打开全屏模式 Dialog
async function openFullscreenDialog() {
  await fullscreenDialog.open();
}

// 打开自定义图标 Dialog
async function openCustomIconDialog() {
  await customIconDialog.open();
}

</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-12 space-y-16">
    <!-- Header -->
    <header class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon name="lucide:layout-template" class="w-6 h-6 text-primary" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dialog 对话框
        </h1>
      </div>
      <p class="text-lg text-gray-500 max-w-2xl">
        用于在当前页面中心弹出的模态窗体，承载表单编辑、信息确认等关键交互流程。
      </p>
    </header>

    <!-- Playground -->
    <Playground v-model="state" :controls="controls" component-name="RebornDialog" title="交互体验"
      description="调节属性实时预览 Dialog 的视觉效果与交互反馈。">
      <div class="space-y-3">
        <RebornDialog v-bind="state" @confirm="() => console.log('Confirm clicked')"
          @cancel="() => console.log('Cancel clicked')">
          <RebornButton label="打开对话框 (组件方式)" color="primary" variant="solid" shadow="md" />

          <template #content>
            <div class="space-y-4 py-2">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">姓氏</label>
                  <div
                    class="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center text-sm text-gray-600">
                  安</div>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">名字</label>
                  <div
                    class="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center text-sm text-gray-600">
                  重力</div>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-medium text-gray-400 uppercase tracking-wider">电子邮箱</label>
                <div
                  class="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center text-sm text-gray-600">
                antigravity@example.com</div>
              </div>
            </div>
          </template>
        </RebornDialog>

        <RebornButton label="打开对话框 (Composable)" color="secondary" variant="outline" @click="openEditProfileDialog" />
      </div>
    </Playground>

    <!-- Showcases -->
    <div class="space-y-8">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">更多示例</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Nested Dialogs -->
        <section
          class="p-8 rounded-[32px] border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl space-y-6">
          <div class="space-y-2">
            <h3 class="text-lg font-medium">嵌套弹窗</h3>
            <p class="text-sm text-gray-500">
              Dialog 支持多层嵌套，自动管理层级与遮罩，确保交互闭环。
            </p>
          </div>

          <div class="space-y-3">
            <RebornDialog v-model:open="nestedOpen1" title="第一层对话框" description="您可以点击下方按钮开启更深一层的交互。">
              <RebornButton label="开启嵌套流程 (组件方式)" color="neutral" variant="outline" class="w-full justify-center py-6" />

              <template #content>
                <div class="py-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 italic">
                  第一层业务内容区域
                </div>
              </template>

              <template #footer>
                <RebornDialog v-model:open="nestedOpen2" title="第二层确认" description="确定要执行这项操作吗？">
                  <RebornButton label="下一步" color="primary" />
                  <template #content>
                    <p class="text-sm text-orange-500 font-medium italic">
                      警告：此操作不可撤销，请谨慎处理。
                    </p>
                  </template>
                  <template #footer>
                    <RebornButton label="我已确认" color="primary" @click="nestedOpen2 = false; nestedOpen1 = false" />
                  </template>
                </RebornDialog>
              </template>
            </RebornDialog>

            <RebornButton label="开启嵌套流程 (Composable)" color="neutral" variant="soft" class="w-full justify-center py-6" @click="openNestedDialog" />
          </div>
        </section>

        <!-- Long Content -->
        <section
          class="p-8 rounded-[32px] border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl space-y-6">
          <div class="space-y-2">
            <h3 class="text-lg font-medium">长内容滚动</h3>
            <p class="text-sm text-gray-500">
              开启 scrollable 属性，使正文区域在高度受限时独立滚动。
            </p>
          </div>

          <div class="space-y-3">
            <RebornDialog title="用户服务协议" scrollable description="更新日期：2026年3月">
              <RebornButton label="阅读协议详情 (组件方式)" color="neutral" variant="soft" class="w-full justify-center py-6" />

              <template #content>
                <div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {{ longContent }}
                </div>
              </template>
            </RebornDialog>

            <RebornButton label="阅读协议详情 (Composable)" color="neutral" variant="outline" class="w-full justify-center py-6" @click="openUserAgreementDialog" />
          </div>
        </section>

        <!-- Async Logic -->
        <section
          class="p-8 rounded-[32px] border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl space-y-6">
          <div class="space-y-2">
            <h3 class="text-lg font-medium">异步关闭逻辑</h3>
            <p class="text-sm text-gray-500">
              配合 loading 状态，模拟后端接口请求成功后再关闭弹窗。
            </p>
          </div>

          <div class="space-y-3">
            <RebornDialog v-model:open="asyncOpen" title="同步云端设置" description="正在将您的配置上传至私有云端节点..."
              :confirm-btn="{ label: '立即同步', loading: saving }" :cancel-btn="saving ? false : '稍后再说'"
              @confirm="handleAsyncConfirm">
              <RebornButton label="执行同步 (组件方式)" color="secondary" variant="soft" class="w-full justify-center py-6" />

              <template #content>
                <div
                  class="flex items-center gap-4 p-4 rounded-xl bg-secondary/5 text-secondary border border-secondary/10">
                  <Icon name="lucide:cloud-upload" class="w-5 h-5 shrink-0" />
                  <span class="text-xs font-medium">系统检测到 3 项配置需要合并同步。</span>
                </div>
              </template>
            </RebornDialog>

            <RebornButton label="执行同步 (Composable)" color="secondary" variant="outline" class="w-full justify-center py-6" @click="openCloudSyncDialog" />
          </div>
        </section>

        <!-- Draggable & Custom UI -->
        <section
          class="p-8 rounded-[32px] border border-gray-100 bg-white/50 dark:bg-gray-900/10 backdrop-blur-xl space-y-6">
          <div class="space-y-2">
            <h3 class="text-lg font-medium">高级定制</h3>
            <p class="text-sm text-gray-500">
              支持拖拽模式（非全屏）以及通过 UI 属性进行精细化样式定制。
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-3">
              <RebornDialog title="自由拖拽" draggable description="按住标题区域即可平移位置。">
                <RebornButton label="拖拽演示 (组件)" variant="outline" class="justify-center border-dashed w-full" />
                <template #content>
                  <div class="py-8 text-center text-gray-400">
                    <Icon name="lucide:mouse-pointer-2" class="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p class="text-xs">该模式下弹窗不会锁定在屏幕正中</p>
                  </div>
                </template>
              </RebornDialog>

              <RebornButton label="拖拽演示 (Composable)" variant="soft" class="justify-center w-full" @click="openDraggableDialog" />
            </div>

            <div class="space-y-3">
              <RebornDialog title="精简模式" :ui="{
              panel: 'max-w-[360px] rounded-3xl',
              header: 'border-0 pb-0',
              body: 'text-center pt-2 pb-6',
              footer: 'border-0 pt-0 justify-center pb-6'
            }" :close="false">
                <RebornButton label="自定义 UI (组件)" variant="outline" class="justify-center border-dashed w-full" />
                <template #content>
                  <div
                    class="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
                  <Icon name="lucide:check-circle-2" class="w-8 h-8" />
                </div>
                <h4 class="font-semibold text-gray-900 mb-1 text-base">操作已成功</h4>
                <p class="text-xs text-gray-500">您的设置已即时生效，无需额外操作。</p>
              </template>
              <template #footer>
                <RebornButton label="好的，我知道了" color="primary" class="w-full" @click="() => { }" />
              </template>
            </RebornDialog>

            <RebornButton label="自定义 UI (Composable)" variant="soft" class="justify-center w-full" @click="openSuccessDialog" />
          </div>
        </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 模糊背景光效 */
.max-w-6xl::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 600px;
  background: radial-gradient(circle at center, rgba(var(--primary-rgb), 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}
</style>
