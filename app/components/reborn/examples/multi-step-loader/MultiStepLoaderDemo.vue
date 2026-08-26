<script setup lang="ts">
/** 单个步骤的描述 */
interface Step {
  /** 步骤进行中显示的文案 */
  text: string;
  /** 步骤完成后替换显示的文案 */
  afterText?: string;
  /** 为 true 时停在该步等待外部把它置为 false 才继续 */
  async?: boolean;
  /** 该步停留时长（毫秒），默认取组件的 defaultDuration */
  duration?: number;
  /** 该步激活时执行的回调 */
  action?: () => void;
}

/** 定时模式的开关 */
const timedLoading = ref(false);
/** 异步模式的开关 */
const asyncLoading = ref(false);

/** 异步模式下三个业务步骤各自的进行中状态 */
const pending = reactive({
  payment: false,
  order: false,
  mail: false,
});

/** 最近一次的流程事件，替代 alert 与 console 输出 */
const lastEvent = ref("暂无");

/** 定时模式：每一步固定停留一段时间后自动推进 */
const timedSteps = computed<Step[]>(() => [
  { text: "校验支付信息", duration: 2000 },
  { text: "保存订单", duration: 1500 },
  { text: "发送确认邮件", duration: 2500 },
  { text: "处理业务请求", duration: 1800 },
  { text: "收尾清理", duration: 1000 },
  {
    text: "即将跳转",
    duration: 1000,
    action: () => {
      lastEvent.value = "定时流程已走完，触发跳转回调";
      timedLoading.value = false;
    },
  },
]);

/** 异步模式：async 为 true 时该步会一直等待，直到外部把它改为 false */
const asyncSteps = computed<Step[]>(() => [
  { text: "校验支付信息", async: pending.payment, afterText: "支付已验证" },
  { text: "保存订单", async: pending.order, afterText: "订单已保存" },
  { text: "发送确认邮件", async: pending.mail, afterText: "邮件已发送" },
  {
    text: "即将跳转",
    duration: 1000,
    action: () => {
      lastEvent.value = "异步流程已走完，触发跳转回调";
      asyncLoading.value = false;
    },
  },
]);

function handleStateChange(index: number) {
  lastEvent.value = `state-change · 进入第 ${index + 1} 步`;
}

function handleComplete() {
  lastEvent.value = "complete · 全部步骤已完成";
}

/** 切换定时模式 */
function toggleTimed() {
  timedLoading.value = !timedLoading.value;
}

/** 用 setTimeout 模拟三个耗时不等的异步任务 */
function settle(key: keyof typeof pending, delay: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      pending[key] = false;
      resolve();
    }, delay);
  });
}

async function startAsync() {
  asyncLoading.value = true;
  pending.payment = true;
  pending.order = true;
  pending.mail = true;

  await settle("payment", 2000);
  await settle("order", 3000);
  await settle("mail", 2500);
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="定时推进"
      description="每一步通过 duration 指定停留时长，到点自动进入下一步；prevent-close 开启后遮罩期间不可手动关闭，只能等流程走完。"
    >
      <DemoBlock layout="stack">
        <RebornButton
          color="primary"
          variant="solid"
          :label="timedLoading ? '停止流程' : '开始定时流程'"
          @click="toggleTimed"
        />

        <MultiStepLoader
          :steps="timedSteps"
          :loading="timedLoading"
          :prevent-close="true"
          @state-change="handleStateChange"
          @complete="handleComplete"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="等待异步任务"
      description="把某一步的 async 设为 true，流程会停在该步直到外部改回 false；配合 afterText 可在完成后替换文案，适合真实接口调用。"
    >
      <DemoBlock layout="stack">
        <RebornButton
          color="primary"
          variant="outline"
          label="开始异步流程"
          :disabled="asyncLoading"
          @click="startAsync"
        />

        <MultiStepLoader
          :steps="asyncSteps"
          :loading="asyncLoading"
          @state-change="handleStateChange"
          @complete="handleComplete"
          @close="asyncLoading = false"
        />

        <DemoNote tone="dimmed">
          最近事件：<code>{{ lastEvent }}</code>
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
