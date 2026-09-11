<script setup lang="ts">
import type { PlaygroundControlGroup } from '~/components/common/play-ground/Playground.vue';
import type { ProgressFlowDirection, ProgressGradient, ProgressSegment, ProgressSize, ProgressStatus, ProgressType } from '~/components/reborn/ui/reborn-progress/reborn-progress.config';
import { computed, ref } from 'vue';
import DemoBlock from '~/components/common/demo/DemoBlock.vue';
import DemoNote from '~/components/common/demo/DemoNote.vue';
import DemoSection from '~/components/common/demo/DemoSection.vue';
import Playground from '~/components/common/play-ground/Playground.vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import { progressFlowDirections, progressSizes, progressStatuses, progressTypes } from '~/components/reborn/ui/reborn-progress/reborn-progress.config';
import RebornProgress from '~/components/reborn/ui/reborn-progress/RebornProgress.vue';

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 主要属性轴的默认状态。 */
const defaultState = {
  percent: 60, type: 'line' as ProgressType, size: 'md' as ProgressSize,
  status: 'default' as ProgressStatus, steps: 0, textInside: false, showText: true,
  strokeColor: '', customFormat: false,
  striped: false, stripedFlow: false, duration: 3, flowDirection: 'normal' as ProgressFlowDirection,
};
const state = ref({ ...defaultState });

/** 重置所有演练轴。 */
function resetState() {
  state.value = { ...defaultState };
}

/** 面板覆盖形态、尺寸、进度、状态、步骤、配色与文字。 */
const controls: PlaygroundControlGroup[] = [
  { title: '基础属性', children: [
    { label: '形态', key: 'type', component: 'select', defaultValue: 'line', props: { options: progressTypes.map(value => ({ label: value, value })) } },
    { label: '尺寸', key: 'size', component: 'select', defaultValue: 'md', props: { options: progressSizes.map(value => ({ label: value.toUpperCase(), value })) } },
    { label: '百分比', key: 'percent', component: 'slider', defaultValue: 60, props: { min: 0, max: 100, step: 1 } },
    { label: '步骤数（0 为连续）', key: 'steps', component: 'input-number', defaultValue: 0, props: { min: 0, max: 20, step: 1 } },
    { label: '自定义颜色（留空用状态色）', key: 'strokeColor', component: 'input', defaultValue: '' },
    { label: '流动方向（normal 从左往右）', key: 'flowDirection', component: 'select', defaultValue: 'normal', props: { options: progressFlowDirections.map(value => ({ label: value, value })) } },
  ] },
  { title: '条纹（仅直线形态）', children: [
    { label: '条纹装饰', key: 'striped', component: 'checkbox', defaultValue: false },
    { label: '条纹流动', key: 'stripedFlow', component: 'checkbox', defaultValue: false },
    { label: '流动周期（秒）', key: 'duration', component: 'input-number', defaultValue: 3, props: { min: 1, max: 30, step: 1 } },
  ] },
  { title: '状态与文字', children: [
    { label: '状态', key: 'status', component: 'select', defaultValue: 'default', props: { options: progressStatuses.map(value => ({ label: value, value })) } },
    { label: '显示文字', key: 'showText', component: 'checkbox', defaultValue: true },
    { label: '直线内部文字', key: 'textInside', component: 'checkbox', defaultValue: false },
    { label: '自定义文字格式', key: 'customFormat', component: 'checkbox', defaultValue: false },
  ] },
];

/** 自定义文案使用当前百分比，不依赖演练场状态。 */
function formatPercent(percentage: number) {
  return `${percentage} / 100`;
}

/** 完整参数代码，可复制到真实页面。 */
const progressCode = computed(() => {
  const s = state.value;
  return `<RebornProgress\n  :percent="${s.percent}"\n  type="${s.type}"\n  size="${s.size}"\n  status="${s.status}"\n  :steps="${s.steps}"\n  :text-inside="${s.textInside}"\n  :show-text="${s.showText}"\n  :striped="${s.striped}"\n  :striped-flow="${s.stripedFlow}"\n  :duration="${s.duration}"\n  flow-direction="${s.flowDirection}"\n  :stroke-color='${JSON.stringify(s.strokeColor || undefined) || 'undefined'}'\n  :format="${s.customFormat ? `(percentage) => percentage + ' / 100'` : 'undefined'}"\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 渐变色标锚定完整轨道，与当前百分比无关。 */
const gradient: ProgressGradient = { angle: 90, stops: [{ offset: 0, color: '#108ee9' }, { offset: 50, color: '#6366f1' }, { offset: 100, color: '#87d068' }] };
/** 累计终点划分三个固定颜色区间。 */
const segments: ProgressSegment[] = [{ percentage: 30, color: '#108ee9' }, { percentage: 65, color: '#f59e0b' }, { percentage: 100, color: '#22c55e' }];
/** 逐步骤颜色，可少于步骤数，剩余步骤回退到状态色。 */
const stepColors = ['#108ee9', '#108ee9', '#ffccc7'];
/** 模拟用户控制的上传任务。 */
const taskPercent = ref(35);
/** 记录任务操作，展示交互确实已响应。 */
const lastAction = ref('等待操作');

/** 手动推进任务，不创建后台定时器。 */
function advanceTask() {
  taskPercent.value = Math.min(100, taskPercent.value + 10);
  lastAction.value = `任务推进至 ${taskPercent.value}%`;
}

/** 重新开始任务。 */
function resetTask() {
  taskPercent.value = 0;
  lastAction.value = '任务已重置';
}
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground v-model="state" :controls="controls" :code="progressCode" component-name="RebornProgress" title="交互演练场" description="切换形态、步骤数、状态和文字设置，实时查看进度变化。">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading><span class="icon-[lucide--rotate-ccw] size-[12px]" /></template>
          重置配置
        </RebornButton>
      </template>
      <div class="flex w-full min-w-0 flex-col items-center gap-8 overflow-x-auto py-4">
        <RebornProgress :percent="state.percent" :type="state.type" :size="state.size" :status="state.status" :steps="state.steps" :text-inside="state.textInside" :show-text="state.showText" :striped="state.striped" :striped-flow="state.stripedFlow" :duration="state.duration" :flow-direction="state.flowDirection" :stroke-color="state.strokeColor || undefined" :format="state.customFormat ? formatPercent : undefined" class="max-w-[360px]" />
        <DemoNote tone="dimmed" class="font-mono text-xs">当前 {{ state.percent }}% · {{ state.type }} · {{ state.status }} · {{ state.steps || '连续' }}</DemoNote>
      </div>
    </Playground>

    <DemoSection title="直线进度条" description="三档高度严格为 6px、8px、16px。状态由业务显式控制，不随百分比自动改变。">
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="size in progressSizes" :key="size" class="flex w-full flex-col gap-4">
          <DemoNote tone="dimmed">{{ size.toUpperCase() }}</DemoNote>
          <RebornProgress v-for="status in progressStatuses" :key="status" :size="size" :status="status" :percent="status === 'success' ? 100 : 60" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="圆环进度条" description="外径 48px / 76px / 114px，成功与失败状态在中央显示对应图标。">
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="size in progressSizes" :key="size" class="flex flex-wrap items-center gap-8">
          <DemoNote tone="dimmed" class="w-[30px]">{{ size.toUpperCase() }}</DemoNote>
          <RebornProgress v-for="status in progressStatuses" :key="status" type="circle" :size="size" :status="status" :percent="status === 'success' ? 100 : 60" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="仪表盘形进度条" description="底部保留 90° 缺口，尺寸、文字和状态图标与普通圆环一致。">
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="size in progressSizes" :key="size" class="flex flex-wrap items-center gap-8">
          <DemoNote tone="dimmed" class="w-[30px]">{{ size.toUpperCase() }}</DemoNote>
          <RebornProgress v-for="status in progressStatuses" :key="status" type="dashboard" :size="size" :status="status" :percent="status === 'success' ? 100 : 60" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="步骤进度条" description="节点间隔 2px；小号节点宽 2px，中号和大号节点宽 32px 且带 2px 圆角。当前节点可部分填充。">
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="size in progressSizes" :key="size" class="flex flex-wrap items-center gap-8">
          <DemoNote tone="dimmed" class="w-[30px]">{{ size.toUpperCase() }}</DemoNote>
          <RebornProgress :size="size" :steps="5" :percent="60" />
          <RebornProgress :size="size" :steps="5" :percent="60" :stroke-color="stepColors" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="步骤进度圈" description="环厚 6px / 8px / 16px，沿圆弧留出 2px 间距，支持逐节点配色。">
      <DemoBlock layout="grid" class="gap-8">
        <RebornProgress v-for="size in progressSizes" :key="size" type="circle" :size="size" :steps="5" :percent="60" :stroke-color="stepColors" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="仪表盘步骤进度圈" description="底部开口与步骤节点组合，支持全部尺寸和状态。">
      <DemoBlock layout="grid" class="gap-8">
        <RebornProgress v-for="size in progressSizes" :key="size" type="dashboard" :size="size" :steps="5" :percent="60" :stroke-color="stepColors" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义渐变色" description="设置角度与百分比色标，连续、步骤、圆环和仪表盘均可使用。">
      <DemoBlock layout="stack" class="gap-8">
        <RebornProgress :percent="80" size="lg" :stroke-color="gradient" />
        <RebornProgress :percent="80" :steps="10" :stroke-color="gradient" />
        <div class="flex flex-wrap items-center gap-8">
          <RebornProgress type="circle" size="lg" :percent="80" :stroke-color="gradient" />
          <RebornProgress type="dashboard" size="lg" :percent="80" :stroke-color="gradient" />
          <RebornProgress type="circle" size="lg" :steps="12" :percent="80" :stroke-color="gradient" />
          <RebornProgress type="dashboard" size="lg" :steps="12" :percent="80" :stroke-color="gradient" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="分段颜色" description="按累计终点绘制固定区间；只着色到当前进度。分段之间无间隔，每一段只在行进方向一侧带圆弧，流动方向反转时圆弧换边。">
      <DemoBlock layout="stack" class="gap-8">
        <RebornProgress size="lg" :percent="85" :segments="segments" />
        <RebornProgress size="lg" :percent="85" :segments="segments" flow-direction="reverse" />
        <RebornProgress :steps="10" :percent="85" :segments="segments" />
        <div class="flex flex-wrap items-center gap-8">
          <RebornProgress type="circle" size="lg" :percent="85" :segments="segments" />
          <RebornProgress type="dashboard" size="lg" :percent="85" :segments="segments" />
          <RebornProgress type="dashboard" size="lg" :steps="10" :percent="85" :segments="segments" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="流动方向" description="flow-direction 设为 reverse 时，直线从右往左填充，圆环与仪表盘逆时针绘制，分段圆弧与条纹流向随之翻转。">
      <DemoBlock layout="stack" class="gap-8">
        <RebornProgress size="lg" :percent="60" flow-direction="reverse" />
        <RebornProgress :steps="5" :percent="60" flow-direction="reverse" />
        <div class="flex flex-wrap items-center gap-8">
          <RebornProgress type="circle" size="lg" :percent="60" flow-direction="reverse" />
          <RebornProgress type="dashboard" size="lg" :percent="60" flow-direction="reverse" />
          <RebornProgress type="circle" size="lg" :percent="85" :segments="segments" flow-direction="reverse" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="条纹进度条" description="striped 叠加条纹装饰，striped-flow 让条纹流动，duration 控制一个周期的秒数，条纹流向跟随 flow-direction；仅直线形态生效，系统开启减少动态效果时自动停止流动。">
      <DemoBlock layout="stack" class="gap-8">
        <RebornProgress size="lg" :percent="70" striped />
        <RebornProgress size="lg" :percent="70" striped striped-flow />
        <RebornProgress size="lg" :percent="70" striped striped-flow :duration="1" flow-direction="reverse" />
        <RebornProgress size="lg" :percent="85" striped striped-flow :segments="segments" />
        <RebornProgress size="lg" :steps="8" :percent="70" striped striped-flow />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="内嵌文字与格式化" description="textInside 改变直线文字位置，format 改变内容；不自动增高轨道，建议内嵌文字使用 lg。">
      <DemoBlock layout="stack" class="gap-8">
        <RebornProgress size="lg" :percent="60" text-inside />
        <RebornProgress size="lg" :percent="60" text-inside :format="formatPercent" />
        <RebornProgress :percent="60" :format="formatPercent" />
        <RebornProgress type="circle" size="lg" :percent="60" :format="formatPercent" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="任务组合与作用域插槽" description="业务推进进度，插槽读取 percent/status；默认插槽优先于 format 和状态图标。">
      <DemoBlock layout="stack" class="gap-6">
        <RebornProgress :percent="taskPercent" :status="taskPercent === 100 ? 'success' : 'default'" aria-label="文件上传进度">
          <template #default="{ percent, status }"><span class="text-[12px]">{{ status === 'success' ? '上传完成' : `已上传 ${percent}%` }}</span></template>
        </RebornProgress>
        <div class="flex flex-wrap gap-3">
          <RebornButton size="sm" :disabled="taskPercent === 100" @click="advanceTask">推进 10%</RebornButton>
          <RebornButton size="sm" variant="outlined" color="neutral" @click="resetTask">重新开始</RebornButton>
        </div>
        <DemoNote tone="dimmed">{{ lastAction }}</DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>

