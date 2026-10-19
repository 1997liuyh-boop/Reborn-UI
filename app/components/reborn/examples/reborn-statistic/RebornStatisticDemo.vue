<script setup lang="ts">
import type { PlaygroundControlGroup } from '~/components/common/play-ground/Playground.vue';
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from '#components';
import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornCountdown from '~/components/reborn/ui/reborn-countdown/RebornCountdown.vue';
import RebornStatistic from '~/components/reborn/ui/reborn-statistic/RebornStatistic.vue';

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场涵盖数字格式和文本修饰；辅助开关只控制示例中的格式化函数与样式。 */
const defaultState = {
  value: 1234567.89,
  title: '累计收入',
  precision: 2,
  animated: true,
  duration: 1500,
  decimalSeparator: '.',
  groupSeparator: ',',
  prefix: '¥',
  suffix: '元',
  customFormatter: false,
  emphasized: false,
};
const state = ref({ ...defaultState });
/** 读取公开的格式化显示值。 */
const statisticRef = ref<InstanceType<typeof RebornStatistic>>();
/** 原生输入框默认有字符宽度，收为零后由 flex 分配空间，避免撑开演练场窄栏。 */
const inputControlProps = { ui: { input: 'w-0' } };
/** 自定义格式化示例：将数值换算成万，不再应用默认分隔符与精度。 */
function formatTenThousand(value: number) {
  return `${(value / 10000).toFixed(2)} 万`;
}
/** 重置全部演练参数。 */
function resetState() {
  state.value = { ...defaultState };
}
/** 演练场参数分组。 */
const controls: PlaygroundControlGroup[] = [
  { title: '基础属性', children: [
    { label: '数字内容', key: 'value', component: 'input-number', defaultValue: defaultState.value, props: inputControlProps },
    { label: '数字标题', key: 'title', component: 'input', defaultValue: defaultState.title, props: inputControlProps },
    { label: '小数位数', key: 'precision', component: 'input-number', defaultValue: 2, props: { ...inputControlProps, min: 0, max: 20, step: 1 } },
    { label: '小数点符号', key: 'decimalSeparator', component: 'input', defaultValue: '.', props: inputControlProps },
    { label: '千分位符号（可留空）', key: 'groupSeparator', component: 'input', defaultValue: ',', props: inputControlProps },
  ] },
  { title: '文本与样式', children: [
    { label: '前缀', key: 'prefix', component: 'input', defaultValue: '¥', props: inputControlProps },
    { label: '后缀', key: 'suffix', component: 'input', defaultValue: '元', props: inputControlProps },
    { label: '按万自定义格式化', key: 'customFormatter', component: 'checkbox', defaultValue: false, codeIgnore: true },
    { label: '数字区使用主题色', key: 'emphasized', component: 'checkbox', defaultValue: false, codeIgnore: true },
  ] },
  { title: '数字动画', children: [
    { label: '连续计数', key: 'animated', component: 'checkbox', defaultValue: true },
    { label: '计数时长（毫秒）', key: 'duration', component: 'input-number', defaultValue: 1500, props: { ...inputControlProps, min: 0, max: 5000, step: 100 } },
  ] },
];
/** 当前配置对应的可复制代码，保留默认值以便核对。 */
const statisticCode = computed(() => {
  const s = state.value;
  const formatter = s.customFormatter ? '\n  :formatter="value => (value / 10000).toFixed(2) + \' 万\'"' : '';
  return `<RebornStatistic\n  :value="${s.value}"\n  title="${s.title}"\n  :precision="${s.precision}"\n  :animated="${s.animated}"\n  :duration="${s.duration}"\n  decimal-separator="${s.decimalSeparator}"\n  group-separator="${s.groupSeparator}"\n  prefix="${s.prefix}"\n  suffix="${s.suffix}"${formatter}\n  :value-style="${s.emphasized ? "{ color: 'var(--color-primary-6)' }" : '{}'}"\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 采用参考示例的交易量，挂载后从零连续增长，重播仅重建该实例。 */
const transactionValue = ref(172000);
const transactionKey = ref(0);
/** 目标在客户端初始化，避免服务端与浏览器使用不同时钟。 */
const activityTarget = ref<number>();
const vipTarget = ref<number>();
const nextMonthTarget = ref<dayjs.Dayjs>();
const shortTarget = ref<number>();
const shortRemaining = ref(0);
const shortFinished = ref(false);
/** 会员倒计时单独重置为两天，不影响其余示例。 */
function resetVip() {
  vipTarget.value = Date.now() + 2 * 86400000;
}
/** 短倒计时可重复开始，便于看到结束事件后的状态。 */
function restartShortCountdown() {
  shortFinished.value = false;
  shortTarget.value = Date.now() + 5000;
}
onMounted(() => {
  activityTarget.value = Date.now() + 7 * 3600000;
  nextMonthTarget.value = dayjs().add(1, 'month').startOf('month');
  resetVip();
  restartShortCountdown();
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="statisticCode" component-name="RebornStatistic"
      title="交互演练场" description="调节数值、精度和分隔符，查看默认格式与自定义格式化的优先关系。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading><Icon name="lucide:rotate-ccw" size="12" /></template>
          重置配置
        </RebornButton>
      </template>
      <div class="flex w-full min-w-0 flex-col items-start gap-6">
        <RebornStatistic
          ref="statisticRef" :value="state.value" :title="state.title" :precision="state.precision"
          :animated="state.animated" :duration="state.duration"
          :decimal-separator="state.decimalSeparator" :group-separator="state.groupSeparator" :prefix="state.prefix"
          :suffix="state.suffix" :formatter="state.customFormatter ? formatTenThousand : undefined"
          :value-style="state.emphasized ? { color: 'var(--color-primary-6)' } : undefined"
        />
        <div class="flex flex-wrap gap-2">
          <RebornButton size="sm" variant="soft" @click="state.value += 100">增加 100</RebornButton>
          <RebornButton size="sm" variant="soft" color="neutral" @click="state.value -= 100">减少 100</RebornButton>
        </div>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          displayValue：{{ statisticRef?.displayValue }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础统计">
      <template #description><code>value</code> 默认是 0，<code>title</code> 描述指标；不传标题时不保留空白行。</template>
      <DemoBlock layout="grid" :columns="3">
        <RebornStatistic title="活跃用户" :value="268500" suffix="人" />
        <RebornStatistic title="今日订单" :value="1386" suffix="笔" />
        <RebornStatistic title="待处理任务" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="数字动画">
      <template #description><code>animated</code> 默认开启，首次从 0 连续计数到目标；<code>duration</code> 默认 1500 毫秒，更新目标时从当前数值衔接。</template>
      <DemoBlock layout="grid" :columns="2">
        <RebornStatistic :key="transactionKey" title="累计交易量" :value="transactionValue" suffix="笔" />
        <RebornStatistic title="关闭动画" :value="transactionValue" suffix="笔" :animated="false" />
      </DemoBlock>
      <div class="mt-4 flex flex-wrap gap-2">
        <RebornButton size="sm" variant="soft" @click="transactionValue += 10000">增加 10,000</RebornButton>
        <RebornButton size="sm" variant="soft" color="neutral" @click="transactionValue -= 10000">减少 10,000</RebornButton>
        <RebornButton size="sm" variant="soft" color="neutral" @click="transactionKey++">重播计数</RebornButton>
      </div>
      <DemoNote tone="dimmed" class="mt-3">与参考页累计交易量相同，默认从 0 计数到 172,000；系统开启“减少动态效果”、时长为 0 或传入自定义格式化函数时直接显示结果。</DemoNote>
    </DemoSection>

    <DemoSection title="精度与分隔符">
      <template #description><code>precision</code> 控制四舍五入的小数位数，<code>groupSeparator</code> 为空时关闭千分位分组。</template>
      <DemoBlock layout="grid" :columns="3">
        <RebornStatistic title="默认分组" :value="1234567.895" :precision="2" />
        <RebornStatistic title="交换分隔符" :value="1234567.895" :precision="2" decimal-separator="," group-separator="." />
        <RebornStatistic title="不使用分组" :value="1234567.895" :precision="3" group-separator="" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义格式化">
      <template #description><code>formatter</code> 接收原始数值，返回结果直接显示，精度和分隔符不会再次加工。</template>
      <DemoBlock layout="grid" :columns="2">
        <RebornStatistic title="以万为单位" :value="1234567.89" :formatter="formatTenThousand" />
        <RebornStatistic title="转化率" :value="0.8675" :formatter="value => `${(value * 100).toFixed(2)}%`" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题与前后缀">
      <template #description><code>title</code>、<code>prefix</code> 和 <code>suffix</code> 都支持同名插槽，图标与单位可单独排版。</template>
      <DemoBlock layout="grid" :columns="2">
        <RebornStatistic title="销售额" :value="9860.5" :precision="2" prefix="¥" suffix="元" />
        <RebornStatistic :value="7.8" :precision="1">
          <template #title><span class="inline-flex items-center gap-1">较昨日增长 <Icon name="lucide:info" class="size-3.5" /></span></template>
          <template #prefix><Icon name="lucide:trending-up" class="size-5 text-success-6" /></template>
          <template #suffix><span class="text-base text-gray-8">%</span></template>
        </RebornStatistic>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="样式与组合布局">
      <template #description><code>valueStyle</code> 覆盖整个数字区，<code>ui</code> 按内部节点覆盖 Tailwind 类名，指标之间的布局由父容器控制。</template>
      <DemoBlock layout="grid" :columns="2">
        <RebornStatistic title="本月收入" :value="68235.5" :precision="2" prefix="¥" :value-style="{ color: 'var(--color-success-6)' }" />
        <RebornStatistic title="目标完成率" :value="92" suffix="%" :ui="{ content: 'text-3xl', suffix: 'text-base text-gray-8' }" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="倒计时">
      <template #description>使用 <code>RebornCountdown</code>，<code>value</code> 是目标时间；<code>format</code> 控制时间单位，更新目标即可重新开始。</template>
      <DemoBlock layout="grid" :columns="2">
        <RebornCountdown title="距离活动开始" :value="activityTarget" />
        <div class="flex flex-col items-start gap-3">
          <RebornCountdown title="会员剩余时长" :value="vipTarget" />
          <RebornButton size="sm" variant="soft" @click="resetVip">重置为 2 天</RebornButton>
        </div>
        <div class="flex flex-col items-start gap-3">
          <RebornCountdown :value="nextMonthTarget" format="DD [天] HH:mm:ss">
            <template #title><span class="inline-flex items-center gap-1"><Icon name="lucide:calendar" class="size-4" /> 距离下月开始</span></template>
          </RebornCountdown>
          <DemoNote tone="dimmed">目标日期：{{ nextMonthTarget?.format('YYYY-MM-DD') }}</DemoNote>
        </div>
        <div class="flex flex-col items-start gap-3">
          <RebornCountdown title="5 秒倒计时" :value="shortTarget" @change="shortRemaining = $event" @finish="shortFinished = true" />
          <RebornButton size="sm" variant="soft" @click="restartShortCountdown">重新开始 5 秒</RebornButton>
          <DemoNote tone="dimmed">{{ shortFinished ? '倒计时已结束' : `剩余 ${shortRemaining} 毫秒` }}</DemoNote>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed" class="mt-3">默认格式累计小时，两天显示为 48 小时；加入 DD 则拆分为天与小时。倒计时按实际时间更新，不使用统计数值的插值动画。</DemoNote>
    </DemoSection>
  </div>
</template>
