<script setup lang="ts">
import type { NotificationHandle } from "~/components/reborn/ui/reborn-notification";
import { h } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { notification } from "~/components/reborn/ui/reborn-notification";
import {
  notificationPositions,
  notificationTypes,
} from "~/components/reborn/ui/reborn-notification/reborn-notification.config";

const typeOptions = [
  { label: "无类型（不显示图标）", value: "" },
  ...notificationTypes.map(t => ({ label: t, value: t })),
];
const positionOptions = notificationPositions.map(p => ({ label: p, value: p }));
/** 侧边飘带选项：空串表示不显示 */
const ribbonOptions = [
  { label: "不显示", value: "" },
  { label: "贴左 left", value: "left" },
  { label: "贴右 right", value: "right" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  title: "部署完成",
  message: "订单服务已发布到生产环境，耗时 42 秒。",
  type: "success",
  position: "top-right",
  ribbon: "",
  duration: 4500,
  showClose: true,
  pauseOnHover: true,
  progress: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 事件回显，让预览区的交互「有回应」 */
const lastEvent = ref("尚无事件");

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  lastEvent.value = "尚无事件";
  notification.destroy();
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "内容与外观",
    children: [
      { label: "标题 title", key: "title", component: "input" as const, defaultValue: "部署完成" },
      {
        label: "正文 message",
        key: "message",
        component: "input" as const,
        defaultValue: "订单服务已发布到生产环境，耗时 42 秒。",
      },
      {
        label: "通知类型",
        key: "type",
        component: "select" as const,
        defaultValue: "success",
        props: { options: typeOptions },
      },
      {
        label: "弹出位置",
        key: "position",
        component: "select" as const,
        defaultValue: "top-right",
        props: { options: positionOptions },
      },
      {
        label: "侧边飘带",
        key: "ribbon",
        component: "select" as const,
        defaultValue: "",
        props: { options: ribbonOptions },
      },
      { label: "显示关闭按钮", key: "showClose", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "行为",
    children: [
      {
        label: "自动关闭时长（毫秒，0 不自动关闭）",
        key: "duration",
        component: "slider" as const,
        defaultValue: 4500,
        props: { min: 0, max: 10000, step: 500 },
      },
      { label: "显示倒计时进度条", key: "progress", component: "checkbox" as const, defaultValue: false },
      { label: "悬停暂停计时", key: "pauseOnHover", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const notificationCode = computed(() => {
  const s = state.value;
  const config: string[] = [
    `title: '${s.title}'`,
    `message: '${s.message}'`,
    `position: '${s.position}'`,
    `ribbon: ${s.ribbon ? `'${s.ribbon}'` : false}`,
    `duration: ${s.duration}`,
    `showClose: ${s.showClose}`,
    `progress: ${s.progress}`,
    `pauseOnHover: ${s.pauseOnHover}`,
  ];
  const method = s.type || "open";
  return `notification.${method}({\n  ${config.join(",\n  ")},\n})`;
});

/** 按当前演练场配置弹出一条通知 */
function fireFromPlayground() {
  const s = state.value;
  const options = {
    title: s.title,
    message: s.message,
    position: s.position,
    ribbon: s.ribbon || false,
    duration: s.duration,
    showClose: s.showClose,
    progress: s.progress,
    pauseOnHover: s.pauseOnHover,
    onClose: () => {
      lastEvent.value = "onClose：通知已关闭";
    },
    onClick: () => {
      lastEvent.value = "onClick：面板被点击";
    },
  };
  if (s.type) notification[s.type as (typeof notificationTypes)[number]](options);
  else notification.open(options);
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 常驻通知的实例句柄：duration 为 0 时只能靠句柄手动关闭 */
const stickyHandle = ref<NotificationHandle | null>(null);

/** 弹出常驻通知并保存句柄 */
function fireSticky() {
  if (stickyHandle.value) return;
  stickyHandle.value = notification.warning({
    title: "存在未保存的更改",
    message: "duration 设为 0，通知不会自动消失，需手动调用句柄的 close()。",
    duration: 0,
    onClose: () => {
      stickyHandle.value = null;
    },
  });
}

/** 用句柄关闭常驻通知 */
function closeSticky() {
  stickyHandle.value?.close();
}

/** 同 key 原位更新：先常驻提示，再变成成功态并开始倒计时 */
function fireKeyDemo() {
  notification.info({
    key: "sync-task",
    title: "正在同步",
    message: "共 128 个文件，正在上传…",
    duration: 0,
  });
  setTimeout(() => {
    notification.success({
      key: "sync-task",
      title: "同步完成",
      message: "128 个文件已全部上传。",
      duration: 3000,
      progress: true,
    });
  }, 1500);
}

/** 富文本正文：把 message 作为 HTML 片段渲染 */
function fireHtmlDemo() {
  notification.open({
    title: "版本更新",
    message: "已升级至 <strong>v2.4.0</strong>，查看<em> 更新日志 </em>了解详情。",
    dangerouslyUseHTMLString: true,
    duration: 6000,
  });
}

/** VNode 正文 + 底部操作区：正文独立成段，与头部间隔 20px */
function fireVNodeDemo() {
  notification.info({
    title: "李工 邀请你加入项目",
    message: () =>
      h("div", { class: "flex flex-col gap-1" }, [
        h("span", "项目：Reborn-UI 组件库重构"),
        h("span", { class: "text-gray-6" }, "角色：协作者（可编辑）"),
      ]),
    duration: 0,
    footer: () =>
      h("div", { class: "flex gap-2" }, [
        h(RebornButton, { size: "sm", variant: "soft", color: "neutral" }, () => "稍后处理"),
        h(RebornButton, { size: "sm" }, () => "接受邀请"),
      ]),
  });
}

/** 自定义图标与关闭图标：未设置 type 时 icon 才会生效 */
function fireCustomIconDemo() {
  notification.open({
    title: "已加入收藏夹",
    message: "可在「我的收藏」中查看。",
    icon: "lucide:bookmark-check",
    closeIcon: "lucide:minus",
    duration: 5000,
    ui: { icon: "size-[24px] text-brand-6" },
  });
}

/** 系统级通知：走浏览器原生 Notification，页面切到后台也能看到 */
async function fireSystemDemo() {
  const result = await notification.system({
    title: "构建完成",
    message: "Reborn-UI 文档站已发布，点击返回页面查看。",
    tag: "reborn-demo-system",
    onClick: () => {
      lastEvent.value = "onClick：来自系统级通知";
    },
  });
  lastEvent.value = `system()：通道 ${result.channel}，授权 ${result.permission}`;
}

/** 系统级通知的定时收回与静默 */
async function fireSystemSilentDemo() {
  const result = await notification.system({
    title: "静默提醒",
    message: "silent 不播放提示音，duration 3 秒后主动收回。",
    silent: true,
    duration: 3000,
    tag: "reborn-demo-system",
  });
  lastEvent.value = `system()：通道 ${result.channel}，授权 ${result.permission}`;
}

/** 点击整块面板触发回调 */
function fireClickableDemo() {
  notification.open({
    title: "有 3 条新的评论",
    message: "点击这块面板查看（onClick 回调）。",
    duration: 6000,
    onClick: () => {
      lastEvent.value = "onClick：来自「可点击通知」";
      notification.success("已跳转到评论列表");
    },
  });
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="notificationCode" component-name="notification"
      title="交互演练场" description="notification 为命令式 API，调节左侧参数后点击按钮触发；悬停在通知上可暂停自动关闭计时。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-6">
        <div class="flex flex-wrap items-center justify-center gap-3">
          <RebornButton @click="fireFromPlayground">弹出通知</RebornButton>
          <RebornButton variant="outlined" color="neutral" @click="notification.destroy()">
            关闭全部
          </RebornButton>
        </div>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          {{ lastEvent }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基本用法">
      <template #description>
        四个类型方法对应四种语义色与默认图标；<code>notification.open</code> 不带类型，即无图标、无着色。
        默认 <code>4500</code> 毫秒后自动关闭。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton @click="notification.success({ title: '保存成功', message: '草稿已同步到云端。' })">
          Success
        </RebornButton>
        <RebornButton color="error" @click="notification.error({ title: '提交失败', message: '网络异常，请稍后重试。' })">
          Error
        </RebornButton>
        <RebornButton color="warning" @click="notification.warning({ title: '额度即将用尽', message: '本月剩余调用次数不足 5%。' })">
          Warning
        </RebornButton>
        <RebornButton color="info" @click="notification.info({ title: '新版本可用', message: '重启应用后生效。' })">
          Info
        </RebornButton>
        <RebornButton color="neutral" variant="outlined" @click="notification.open({ title: '纯文本通知', message: '没有类型时不显示图标。' })">
          Open
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="弹出位置">
      <template #description>
        <code>position</code> 支持屏幕四角；顶部两角向下堆叠，底部两角向上堆叠，新通知始终贴着锚定边。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton
          v-for="p in notificationPositions" :key="p" variant="outlined"
          @click="notification.info({ title: p, message: `这条通知弹在 ${p}。`, position: p })"
        >
          {{ p }}
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="倒计时进度条">
      <template #description>
        <code>progress</code> 设为 <code>true</code> 显示默认进度条；传对象可自定义 <code>strokeColor</code> /
        <code>size</code> / <code>striped</code> / <code>stripedFlow</code>。
        开启 <code>pauseOnHover</code>（默认开启）时，悬停会同时冻结计时器与进度条动画。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton @click="notification.success({ title: '默认进度条', message: '进度条颜色跟随通知类型。', progress: true })">
          默认进度条
        </RebornButton>
        <RebornButton
          variant="soft"
          @click="notification.info({ title: '加粗条纹', message: '轨道 6px + 流动条纹。', duration: 8000, progress: { size: 6, striped: true, stripedFlow: true } })"
        >
          条纹流动
        </RebornButton>
        <RebornButton
          variant="soft" color="secondary"
          @click="notification.open({ title: '自定义颜色', message: '悬停面板可暂停倒计时。', duration: 8000, progress: { strokeColor: '#7c3aed' } })"
        >
          自定义颜色
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="侧边飘带">
      <template #description>
        <code>ribbon</code> 在面板内边加一条 3px 竖条，颜色取 <code>type</code> 的语义色（未设 <code>type</code> 时用主色）：
        <code>true</code> 或 <code>'left'</code> 贴左，<code>'right'</code> 贴右。飘带压在面板内边距上，不挤占正文宽度。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton @click="notification.success({ title: '发布成功', message: '飘带贴左，颜色跟随 success。', ribbon: true })">
          飘带贴左
        </RebornButton>
        <RebornButton color="error" @click="notification.error({ title: '构建失败', message: '飘带贴右，颜色跟随 error。', ribbon: 'right' })">
          飘带贴右
        </RebornButton>
        <RebornButton
          color="warning" variant="soft"
          @click="notification.warning({ title: '配额告急', message: '飘带与倒计时进度条可以同时开启。', ribbon: 'left', progress: true, duration: 8000 })"
        >
          飘带 + 进度条
        </RebornButton>
        <RebornButton
          color="neutral" variant="outlined"
          @click="notification.open({ title: '无类型通知', message: '没有 type 时飘带取主色。', ribbon: 'left' })"
        >
          无类型（主色）
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="富文本与自定义正文">
      <template #description>
        <code>message</code> 为字符串时贴在标题下方（间隔 8px）；开启 <code>dangerouslyUseHTMLString</code>
        会按 HTML 片段渲染。传 VNode 或返回 VNode 的函数时，正文独立成段（与头部间隔 20px），
        可配合本库扩展的 <code>footer</code> 放置操作按钮。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton variant="outlined" @click="fireHtmlDemo">HTML 片段正文</RebornButton>
        <RebornButton variant="outlined" @click="fireVNodeDemo">VNode 正文 + 底部按钮</RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义图标与点击回调">
      <template #description>
        <code>icon</code> 支持图标名或 VNode，但设置了 <code>type</code> 时会被类型图标覆盖；
        <code>closeIcon</code> 同理可换。绑定 <code>onClick</code> 后整块面板可点击（光标变为手型）。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton variant="soft" @click="fireCustomIconDemo">自定义图标</RebornButton>
        <RebornButton variant="soft" @click="fireClickableDemo">可点击通知</RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="手动关闭与更新">
      <template #description>
        方法返回实例句柄，调用 <code>close()</code> 关闭当前通知；传相同 <code>key</code> 会原位更新内容并重置计时；
        <code>notification.destroy(key)</code> 按 key 关闭，不传 key 则关闭全部。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton @click="fireSticky">弹出常驻通知</RebornButton>
        <RebornButton variant="outlined" :disabled="!stickyHandle" @click="closeSticky">
          句柄 close() 关闭
        </RebornButton>
        <RebornButton variant="soft" @click="fireKeyDemo">同 key 原位更新</RebornButton>
        <RebornButton color="error" variant="outlined" @click="notification.destroy('sync-task')">
          destroy('sync-task')
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="系统级通知">
      <template #description>
        <code>notification.system()</code> 调用浏览器原生 Notification 在操作系统层面弹出提示，页面切到后台甚至最小化时依然可见。
        首次点击会请求授权；被拒绝或环境不支持（需 HTTPS / localhost）时默认回退为站内通知，返回值的
        <code>channel</code> 告知实际通道。切到其他窗口后再触发，效果更直观。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornButton @click="fireSystemDemo">弹出系统级通知</RebornButton>
        <RebornButton variant="soft" @click="fireSystemSilentDemo">静默 + 3 秒收回</RebornButton>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
