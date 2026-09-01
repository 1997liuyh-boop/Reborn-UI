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

/** 演示用的长文本，用来撑出需要独立滚动的正文区域 */
const longContent = Array.from(
  { length: 15 },
  (_, i) =>
    `这是第 ${i + 1} 段演示文本。Dialog 组件支持在内容过多时开启 scrollable 模式，此时面板高度会被限制，正文区域将独立滚动，而页头和页脚始终保持固定在视口中。`,
).join("\n\n");

/** 演练场中展示的只读表单字段，用来说明 Dialog 常见的承载内容 */
const profileFields = [
  { label: "姓氏", value: "安" },
  { label: "名字", value: "重力" },
  { label: "电子邮箱", value: "antigravity@example.com" },
];

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
  props: state.value,
});

// 编辑个人资料 overlay 实例 - 使用二次封装组件
const editProfileDialog = overlay.create(EditProfileDialog, {
  props: {},
});

// 嵌套弹窗 overlay 实例 - 使用二次封装组件
const nestedDialog = overlay.create(NestedDialog, {
  props: {},
});

// 用户协议 overlay 实例 - 使用二次封装组件
const userAgreementDialog = overlay.create(UserAgreementDialog, {
  props: {},
});

// 云端同步 overlay 实例 - 使用二次封装组件
const cloudSyncDialog = overlay.create(CloudSyncDialog, {
  props: {},
});

// 拖拽演示 overlay 实例 - 使用二次封装组件
const draggableDialog = overlay.create(DraggableDialog, {
  props: {},
});

// 成功提示 overlay 实例 - 使用二次封装组件
const successDialog = overlay.create(SuccessDialog, {
  props: {},
});

// 延迟打开/关闭演示 overlay 实例
const delayedDialog = overlay.create(RebornDialog, {
  props: {
    title: "延迟效果演示",
    description: "此对话框有 500ms 的打开和关闭延迟",
    openDelay: 500,
    closeDelay: 500,
    confirmBtn: "确定",
    cancelBtn: "取消",
  },
});

// 全屏模式演示 overlay 实例
const fullscreenDialog = overlay.create(RebornDialog, {
  props: {
    title: "全屏模式",
    description: "全屏显示的对话框，适合展示大量内容",
    fullscreen: true,
    confirmBtn: "关闭",
  },
});

// 自定义关闭按钮图标演示 overlay 实例
const customIconDialog = overlay.create(RebornDialog, {
  props: {
    title: "自定义关闭按钮",
    description: "使用不同的图标作为关闭按钮",
    closeIcon: "lucide:arrow-left",
    confirmBtn: "确定",
  },
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
  if (result === "confirm") {
    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 关闭弹窗
    cloudSyncDialog.close("synced");
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
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" component-name="RebornDialog" title="交互演练场"
      description="调节左侧属性，实时预览 Dialog 的视觉效果与交互反馈。">
      <DemoBlock>
        <RebornDialog v-bind="state" @confirm="() => console.log('Confirm clicked')"
          @cancel="() => console.log('Cancel clicked')">
          <RebornButton label="打开对话框（组件式）" color="primary" variant="filled" />

          <template #content>
            <!-- 只读字段列表：靠分隔线区分行，不额外铺底色 -->
            <div class="divide-default flex flex-col divide-y">
              <div v-for="field in profileFields" :key="field.label"
                class="flex items-center justify-between gap-4 py-2.5">
                <span class="text-muted text-sm">{{ field.label }}</span>
                <span class="text-highlighted text-sm font-medium">{{ field.value }}</span>
              </div>
            </div>
          </template>
        </RebornDialog>

        <RebornButton label="打开对话框（服务式）" color="secondary" variant="outlined" @click="openPlaygroundDialog" />
        <RebornButton label="二次封装组件" color="neutral" variant="soft" @click="openEditProfileDialog" />
      </DemoBlock>
    </Playground>

    <DemoSection title="嵌套弹窗" description="Dialog 支持多层嵌套，自动管理层级与遮罩，确保交互闭环。">
      <DemoBlock>
        <RebornDialog v-model:open="nestedOpen1" title="第一层对话框" description="您可以点击下方按钮开启更深一层的交互。">
          <RebornButton label="开启嵌套流程（组件式）" color="neutral" variant="outlined" />

          <template #content>
            <!-- 业务内容占位：只描边不填充，避免在弹窗面板内再叠一层表面 -->
            <div class="border-default text-dimmed rounded-ui-sm flex items-center justify-center border border-dashed py-10 text-sm">
              第一层业务内容区域
            </div>
          </template>

          <template #footer>
            <RebornDialog v-model:open="nestedOpen2" title="第二层确认" description="确定要执行这项操作吗？">
              <RebornButton label="下一步" color="primary" />
              <template #content>
                <p class="text-warning text-sm font-medium">警告：此操作不可撤销，请谨慎处理。</p>
              </template>
              <template #footer>
                <RebornButton label="我已确认" color="primary" @click="nestedOpen2 = false; nestedOpen1 = false" />
              </template>
            </RebornDialog>
          </template>
        </RebornDialog>

        <RebornButton label="开启嵌套流程（服务式）" color="neutral" variant="soft" @click="openNestedDialog" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="长内容滚动" description="开启 scrollable 属性，使正文区域在高度受限时独立滚动，页头与页脚保持固定。">
      <DemoBlock>
        <RebornDialog title="用户服务协议" scrollable description="更新日期：2026年3月">
          <RebornButton label="阅读协议详情（组件式）" color="neutral" variant="soft" />

          <template #content>
            <div class="text-muted text-sm leading-relaxed whitespace-pre-wrap">
              {{ longContent }}
            </div>
          </template>
        </RebornDialog>

        <RebornButton label="阅读协议详情（服务式）" color="neutral" variant="outlined" @click="openUserAgreementDialog" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="异步关闭逻辑" description="confirmBtn 传入对象可携带 loading 状态，模拟后端请求成功后再关闭弹窗。">
      <DemoBlock>
        <RebornDialog v-model:open="asyncOpen" title="同步云端设置" description="正在将您的配置上传至私有云端节点..."
          :confirm-btn="{ label: '立即同步', loading: saving }" :cancel-btn="saving ? false : '稍后再说'"
          @confirm="handleAsyncConfirm">
          <RebornButton label="执行同步（组件式）" color="secondary" variant="soft" />

          <template #content>
            <!-- 弹窗面板内的语义提示条，属原子标记而非嵌套容器 -->
            <div class="bg-secondary/10 text-secondary rounded-ui-sm flex items-center gap-3 p-3">
              <Icon name="lucide:cloud-upload" class="size-5 shrink-0" />
              <span class="text-xs font-medium">系统检测到 3 项配置需要合并同步。</span>
            </div>
          </template>
        </RebornDialog>

        <RebornButton label="执行同步（服务式）" color="secondary" variant="outlined" @click="openCloudSyncDialog" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="拖拽与样式定制" description="draggable 允许按住标题区域平移；ui 对象可精细重写面板、页头与页脚。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">自由拖拽 · <code>draggable</code></span>
          <DemoBlock>
            <RebornDialog title="自由拖拽" draggable description="按住标题区域即可平移位置。">
              <RebornButton label="拖拽演示（组件式）" variant="outlined" />
              <template #content>
                <div class="text-dimmed flex flex-col items-center gap-2 py-6 text-center">
                  <Icon name="lucide:mouse-pointer-2" class="size-8 opacity-40" />
                  <p class="text-xs">该模式下弹窗不会锁定在屏幕正中</p>
                </div>
              </template>
            </RebornDialog>

            <RebornButton label="拖拽演示（服务式）" variant="soft" @click="openDraggableDialog" />
          </DemoBlock>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">精简模式 · <code>ui</code> 深度重写</span>
          <DemoBlock>
            <RebornDialog :close="false" title="精简模式" :ui="{
              panel: 'max-w-[360px] rounded-ui-lg',
              header: 'border-0 pb-0',
              body: 'text-center pt-2 pb-6',
              footer: 'border-0 pt-0 justify-center pb-6',
            }">
              <RebornButton label="自定义 UI（组件式）" variant="outlined" />
              <template #content>
                <div class="bg-success/10 text-success mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                  <Icon name="lucide:check-circle-2" class="size-8" />
                </div>
                <h4 class="text-highlighted mb-1 text-base font-semibold">操作已成功</h4>
                <p class="text-muted text-xs">您的设置已即时生效，无需额外操作。</p>
              </template>
              <template #footer>
                <RebornButton label="好的，我知道了" color="primary" class="w-full" />
              </template>
            </RebornDialog>

            <RebornButton label="自定义 UI（服务式）" variant="soft" @click="openSuccessDialog" />
          </DemoBlock>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="服务式调用" description="useOverlay 创建的实例可在任意逻辑中直接唤起，无需在模板里预先占位。">
      <DemoBlock>
        <RebornButton label="延迟 500ms 开关" color="neutral" variant="outlined" @click="openDelayedDialog" />
        <RebornButton label="全屏模式" color="neutral" variant="outlined" @click="openFullscreenDialog" />
        <RebornButton label="自定义关闭图标" color="neutral" variant="outlined" @click="openCustomIconDialog" />
      </DemoBlock>
      <DemoNote tone="dimmed" class="mt-3">延迟示例的开关时机会打印在浏览器控制台。</DemoNote>
    </DemoSection>
  </div>
</template>
