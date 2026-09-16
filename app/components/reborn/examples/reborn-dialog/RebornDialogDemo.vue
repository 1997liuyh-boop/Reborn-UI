<script setup lang="ts">
import { ref } from "vue";
import { useOverlay } from "~/composables/useOverlay";
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";
import { Modal } from "~/components/reborn/ui/reborn-dialog";
import EditProfileDialog from "./dialogs/EditProfileDialog.vue";
import NestedDialog from "./dialogs/NestedDialog.vue";
import UserAgreementDialog from "./dialogs/UserAgreementDialog.vue";
import CloudSyncDialog from "./dialogs/CloudSyncDialog.vue";
import DraggableDialog from "./dialogs/DraggableDialog.vue";
import SuccessDialog from "./dialogs/SuccessDialog.vue";

// 1. Playground 状态对象（属性命名对齐 Element Plus Dialog）
const state = ref({
  title: "编辑个人资料",
  describe: "在此修改您的个人账户信息，完成后点击保存。",
  width: "",
  top: "15vh",
  modal: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showClose: true,
  scrollable: false,
  fullscreen: false,
  draggable: false,
  overflow: false,
  center: false,
  alignCenter: false,
  destroyOnClose: false,
  closeIcon: "lucide:x",
  transition: "scale",
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
      { label: "描述文本 describe", key: "describe", component: "input" as const, defaultValue: "" },
      { label: "宽度 width（如 480px / 60%）", key: "width", component: "input" as const, defaultValue: "" },
      { label: "顶部距离 top", key: "top", component: "input" as const, defaultValue: "15vh" },
      {
        label: "过渡动画 transition",
        key: "transition",
        component: "select" as const,
        defaultValue: "scale",
        props: {
          options: [
            { label: "缩放 scale", value: "scale" },
            { label: "滑动 slide", value: "slide" },
            { label: "淡入淡出 fade", value: "fade" },
            { label: "弹跳 bounce", value: "bounce" },
          ],
        },
      },
      { label: "确认按钮", key: "confirmBtn", component: "input" as const, defaultValue: "确认" },
      { label: "取消按钮", key: "cancelBtn", component: "input" as const, defaultValue: "取消" },
    ],
  },
  {
    title: "交互行为",
    children: [
      { label: "显示遮罩 modal", key: "modal", component: "checkbox" as const, defaultValue: true },
      { label: "点击遮罩关闭", key: "closeOnClickModal", component: "checkbox" as const, defaultValue: true },
      { label: "按 ESC 关闭", key: "closeOnPressEscape", component: "checkbox" as const, defaultValue: true },
      { label: "显示关闭按钮 show-close", key: "showClose", component: "checkbox" as const, defaultValue: true },
      { label: "允许滚动正文", key: "scrollable", component: "checkbox" as const, defaultValue: false },
      { label: "全屏显示", key: "fullscreen", component: "checkbox" as const, defaultValue: false },
      { label: "允许拖拽头部", key: "draggable", component: "checkbox" as const, defaultValue: false },
      { label: "拖拽可超出可视区 overflow", key: "overflow", component: "checkbox" as const, defaultValue: false },
      { label: "头尾居中 center", key: "center", component: "checkbox" as const, defaultValue: false },
      { label: "垂直居中 align-center", key: "alignCenter", component: "checkbox" as const, defaultValue: false },
      { label: "关闭时销毁内容", key: "destroyOnClose", component: "checkbox" as const, defaultValue: false },
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
const layoutOpen = ref(false);
const layoutMode = ref<"top" | "alignCenter" | "center">("top");
const transitionOpen = ref(false);
const transitionMode = ref<"scale" | "slide" | "fade" | "bounce">("scale");

/** 打开过渡动画演示：scale 缩放 / slide 滑动 / fade 淡入淡出 / bounce 弹跳 */
function openTransitionDialog(mode: "scale" | "slide" | "fade" | "bounce") {
  transitionMode.value = mode;
  transitionOpen.value = true;
}

/** 关闭后重开一次，回放当前过渡动画的入场效果 */
function replayTransition() {
  transitionOpen.value = false;
  setTimeout(() => {
    transitionOpen.value = true;
  }, 300);
}

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

/** 打开布局演示：top 顶部落位 / align-center 垂直居中 / center 头尾居中 */
function openLayoutDialog(mode: "top" | "alignCenter" | "center") {
  layoutMode.value = mode;
  layoutOpen.value = true;
}

// ─── Modal 命令式调用 ───────────────────────────────────────────

function openModalInfo() {
  Modal.info({
    title: "版本更新提示",
    content: "检测到新版本 v2.4.0，包含性能优化与若干问题修复，建议尽快更新体验。",
    cancelText: "稍后再说",
    okText: "立即更新",
  });
}

function openModalSuccess() {
  Modal.success({
    title: "发布成功",
    content: "组件文档已发布至生产环境，全站缓存将在 5 分钟内刷新。",
  });
}

function openModalWarning() {
  Modal.warning({
    title: "存储空间不足",
    content: "当前工作区剩余空间不足 5%，请及时清理历史构建产物。",
  });
}

function openModalError() {
  Modal.error({
    title: "同步失败",
    content: "与远端仓库的连接超时，请检查网络后重试。",
  });
}

function openModalConfirm() {
  Modal.confirm({
    title: "确认删除该分支？",
    content: "删除后分支上的未合并提交将无法恢复，此操作不可撤销。",
    okText: "删除",
    onOk: (close) => {
      console.log("已确认删除");
      close();
    },
    onCancel: (close) => {
      console.log("已取消");
      close();
    },
  });
}

/** onBeforeOk 异步门控：确定按钮进入 loading，两秒后 done(true) 关闭 */
function openModalAsyncConfirm() {
  Modal.confirm({
    title: "提交审核",
    content: "点击确定后将模拟 2 秒的异步提交，期间确定按钮保持 loading；失败场景可 done(false) 仅结束加载。",
    okText: "提交",
    onBeforeOk: (done) => {
      setTimeout(() => done(true), 2000);
    },
  });
}

/** 批量弹出后一键销毁，模拟路由切换场景 */
function openModalBatch() {
  Modal.info({ title: "第一个确认框", content: "3 秒后 Modal.destroyAll() 将统一销毁。", top: "10vh", alignCenter: false });
  Modal.warning({ title: "第二个确认框", content: "无需持有实例句柄即可被批量销毁。", top: "26vh", alignCenter: false });
  setTimeout(() => Modal.destroyAll(), 3000);
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
      description="调节左侧属性，实时预览 Dialog 的视觉效果与交互反馈；属性命名与 Element Plus Dialog 对齐。">
      <DemoBlock>
        <RebornDialog v-bind="state" @confirm="() => console.log('Confirm clicked')"
          @cancel="() => console.log('Cancel clicked')">
          <template #trigger>
            <RebornButton label="打开对话框（组件式）" color="primary" variant="filled" />
          </template>

          <!-- 只读字段列表：靠分隔线区分行，不额外铺底色 -->
          <div class="divide-default flex flex-col divide-y">
            <div v-for="field in profileFields" :key="field.label"
              class="flex items-center justify-between gap-4 py-2.5">
              <span class="text-muted text-sm">{{ field.label }}</span>
              <span class="text-highlighted text-sm font-medium">{{ field.value }}</span>
            </div>
          </div>
        </RebornDialog>

        <RebornButton label="打开对话框（服务式）" color="secondary" variant="outlined" @click="openPlaygroundDialog" />
        <RebornButton label="二次封装组件" color="neutral" variant="soft" @click="openEditProfileDialog" />
      </DemoBlock>
    </Playground>

    <DemoSection title="Modal 命令式调用"
      description="Modal.info / success / warning / error / confirm 直接以函数打开确认框；onBeforeOk 支持返回 false 阻断或 done 异步关闭，onOk / onCancel 返回 Promise 时 resolve 关闭、reject 保持；Modal.destroyAll() 可在路由切换等场景批量销毁。">
      <DemoBlock>
        <RebornButton label="Modal.info" color="info" variant="soft" @click="openModalInfo" />
        <RebornButton label="Modal.success" color="success" variant="soft" @click="openModalSuccess" />
        <RebornButton label="Modal.warning" color="warning" variant="soft" @click="openModalWarning" />
        <RebornButton label="Modal.error" color="error" variant="soft" @click="openModalError" />
        <RebornButton label="Modal.confirm" color="primary" variant="outlined" @click="openModalConfirm" />
        <RebornButton label="onBeforeOk 异步关闭" color="primary" variant="outlined" @click="openModalAsyncConfirm" />
        <RebornButton label="destroyAll 批量销毁" color="neutral" variant="outlined" @click="openModalBatch" />
      </DemoBlock>
      <DemoNote tone="dimmed" class="mt-3">confirm 的回调结果会打印在浏览器控制台。</DemoNote>
    </DemoSection>

    <DemoSection title="布局与对齐"
      description="默认按 top（15vh）顶部落位；align-center 改为水平垂直居中；center 让 header 与 footer 内容居中排列；width 支持数字（px）或任意 CSS 宽度。">
      <DemoBlock>
        <RebornButton label="top: 8vh 顶部落位" variant="outlined" @click="openLayoutDialog('top')" />
        <RebornButton label="align-center 垂直居中" variant="outlined" @click="openLayoutDialog('alignCenter')" />
        <RebornButton label="center 头尾居中 + width 360" variant="outlined" @click="openLayoutDialog('center')" />

        <RebornDialog v-model="layoutOpen" title="布局演示"
          :description="layoutMode === 'top' ? '当前按 top: 8vh 顶部落位。' : layoutMode === 'alignCenter' ? '当前为 align-center 垂直居中。' : '当前 center 头尾居中，宽度 360px。'"
          :top="layoutMode === 'top' ? '8vh' : '15vh'" :align-center="layoutMode !== 'top'"
          :center="layoutMode === 'center'" :width="layoutMode === 'center' ? 360 : ''" confirm-btn="知道了"
          :cancel-btn="false">
          <p class="text-muted text-sm">切换不同按钮可对比三种布局形态的差异。</p>
        </RebornDialog>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="过渡动画"
      description="transition 支持四种语义预设：scale 缩放（默认，带回弹）/ slide 滑动（自上方滑入）/ fade 淡入淡出 / bounce 弹跳（关键帧入场）；也接受任意 RebornTransition 过渡名或属性对象。">
      <DemoBlock>
        <RebornButton label="scale 缩放" color="primary" variant="outlined" @click="openTransitionDialog('scale')" />
        <RebornButton label="slide 滑动" color="primary" variant="outlined" @click="openTransitionDialog('slide')" />
        <RebornButton label="fade 淡入淡出" color="primary" variant="outlined" @click="openTransitionDialog('fade')" />
        <RebornButton label="bounce 弹跳" color="primary" variant="outlined" @click="openTransitionDialog('bounce')" />

        <RebornDialog v-model="transitionOpen" title="过渡动画演示" :transition="transitionMode"
          :describe="`当前动画：${transitionMode}，重新打开可回放入场效果。`" align-center confirm-btn="再看一次" cancel-btn="关闭"
          @confirm="replayTransition">
          <p class="text-muted text-sm">关闭时同样带有对应的离场动画，可用 ESC / 遮罩点击观察。</p>
        </RebornDialog>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="嵌套弹窗" description="Dialog 支持多层嵌套，自动管理层级与遮罩，确保交互闭环。">
      <DemoBlock>
        <RebornDialog v-model="nestedOpen1" title="第一层对话框" description="您可以点击下方按钮开启更深一层的交互。">
          <template #trigger>
            <RebornButton label="开启嵌套流程（组件式）" color="neutral" variant="outlined" />
          </template>

          <!-- 业务内容占位：只描边不填充，避免在弹窗面板内再叠一层表面 -->
          <div
            class="border-default text-dimmed rounded-lg flex items-center justify-center border border-dashed py-10 text-sm">
            第一层业务内容区域
          </div>

          <template #footer>
            <RebornDialog v-model="nestedOpen2" title="第二层确认" description="确定要执行这项操作吗？">
              <template #trigger>
                <RebornButton label="下一步" color="primary" />
              </template>
              <p class="text-warning text-sm font-medium">警告：此操作不可撤销，请谨慎处理。</p>
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
          <template #trigger>
            <RebornButton label="阅读协议详情（组件式）" color="neutral" variant="soft" />
          </template>

          <div class="text-muted text-sm leading-relaxed whitespace-pre-wrap">
            {{ longContent }}
          </div>
        </RebornDialog>

        <RebornButton label="阅读协议详情（服务式）" color="neutral" variant="outlined" @click="openUserAgreementDialog" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="异步关闭逻辑" description="confirmBtn 传入对象可携带 loading 状态，模拟后端请求成功后再关闭弹窗。">
      <DemoBlock>
        <RebornDialog v-model="asyncOpen" title="同步云端设置" description="正在将您的配置上传至私有云端节点..."
          :confirm-btn="{ label: '立即同步', loading: saving }" :cancel-btn="saving ? false : '稍后再说'"
          @confirm="handleAsyncConfirm">
          <template #trigger>
            <RebornButton label="执行同步（组件式）" color="secondary" variant="soft" />
          </template>

          <!-- 弹窗面板内的语义提示条，属原子标记而非嵌套容器 -->
          <div class="bg-secondary/10 text-secondary rounded-lg flex items-center gap-3 p-3">
            <Icon name="lucide:cloud-upload" class="size-5 shrink-0" />
            <span class="text-xs font-medium">系统检测到 3 项配置需要合并同步。</span>
          </div>
        </RebornDialog>

        <RebornButton label="执行同步（服务式）" color="secondary" variant="outlined" @click="openCloudSyncDialog" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="拖拽与样式定制" description="draggable 允许按住标题区域平移，默认限制在可视区内，开启 overflow 后可拖出屏幕；ui 对象可精细重写面板、页头与页脚。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">自由拖拽 · <code>draggable</code> / <code>overflow</code></span>
          <DemoBlock>
            <RebornDialog title="自由拖拽" draggable description="按住标题区域即可平移位置（默认不出可视区）。">
              <template #trigger>
                <RebornButton label="拖拽演示（组件式）" variant="outlined" />
              </template>
              <div class="text-dimmed flex flex-col items-center gap-2 py-6 text-center">
                <Icon name="lucide:mouse-pointer-2" class="size-8 opacity-40" />
                <p class="text-xs">该模式下弹窗不会锁定在屏幕正中</p>
              </div>
            </RebornDialog>

            <RebornDialog title="可拖出屏幕" draggable overflow description="开启 overflow 后拖动范围可超出可视区。">
              <template #trigger>
                <RebornButton label="overflow 拖拽" variant="soft" />
              </template>
              <p class="text-dimmed py-6 text-center text-xs">试着把弹窗拖出屏幕边缘，再用页脚按钮关闭。</p>
            </RebornDialog>

            <RebornButton label="拖拽演示（服务式）" variant="soft" @click="openDraggableDialog" />
          </DemoBlock>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">精简模式 · <code>ui</code> 深度重写</span>
          <DemoBlock>
            <RebornDialog :show-close="false" title="精简模式" :ui="{
              panel: 'max-w-[360px] rounded-3xl',
              header: 'border-0 pb-0',
              body: 'text-center pt-2 pb-6',
              footer: 'border-0 pt-0 justify-center pb-6',
            }">
              <template #trigger>
                <RebornButton label="自定义 UI（组件式）" variant="outlined" />
              </template>
              <div
                class="bg-success/10 text-success mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                <Icon name="lucide:check-circle-2" class="size-8" />
              </div>
              <h4 class="text-highlighted mb-1 text-base font-semibold">操作已成功</h4>
              <p class="text-muted text-xs">您的设置已即时生效，无需额外操作。</p>
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
