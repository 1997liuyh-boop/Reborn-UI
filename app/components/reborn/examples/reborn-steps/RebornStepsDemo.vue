<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from '#components';
import { computed, defineComponent, h, ref } from 'vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornInputNumber from '~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue';
import { stepsColors, stepsDirections, stepsLineTypes, stepsPlacements, stepsSizes, stepsStatuses, stepsTypes } from '~/components/reborn/ui/reborn-steps/reborn-steps.config';
import RebornStep from '~/components/reborn/ui/reborn-steps/RebornStep.vue';
import RebornSteps from '~/components/reborn/ui/reborn-steps/RebornSteps.vue';
import RebornText from '~/components/reborn/ui/reborn-text/RebornText.vue';

/** 通用选项保留源码枚举，避免演示出现组件不支持的取值。 */
const options = (values: readonly string[]) => values.map(value => ({ label: value, value }));
/** 演示步骤共用的文案。 */
const items = [
  { title: '填写资料', description: '填写联系人与基本信息' },
  { title: '身份验证', description: '核对身份与联系方式' },
  { title: '确认信息', description: '检查本次提交的内容' },
  { title: '提交完成', description: '等待处理结果通知' },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认配置。 */
const defaultState: Record<string, any> = {
  active: 1,
  direction: 'horizontal',
  placement: '',
  width: '100%',
  space: '',
  processStatus: 'process',
  finishStatus: 'finish',
  progressEnabled: false,
  progressStep: 1,
  overallMode: false,
  progress: 45,
  overallProgress: 50,
  alignCenter: false,
  simple: false,
  size: 'md',
  type: 'default',
  lineType: 'solid',
  color: 'primary',
};
const state = ref<Record<string, any>>({ ...defaultState });
const lastChange = ref('尚未切换步骤');
/** 纯数字转为数值传递，其余输入保留为 CSS 长度。 */
function parseLength(input: unknown) {
  const value = String(input ?? '').trim();
  return value && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : value;
}
const playgroundWidth = computed(() => parseLength(state.value.width));
const playgroundSpace = computed(() => parseLength(state.value.space));
/** 留空时横向居中布局回退到下方，明确选择位置时保留该位置。 */
const playgroundPlacement = computed(() => state.value.placement || undefined);
/** 整体进度负责折算展示下标，单步进度可以独立覆盖圆环百分比。 */
const playgroundOverallProgress = computed(() => state.value.overallMode ? Number(state.value.overallProgress) : undefined);
/** 选中的步骤单独接收进度，其余步骤使用整体进度的折算结果。 */
function getPlaygroundProgress(index: number) {
  return state.value.progressEnabled && index === Number(state.value.progressStep) ? Number(state.value.progress) : undefined;
}
/** 演练场真实配置项。 */
const controls: any = [
  {
    title: '基础属性',
    children: [
      { label: '尺寸', key: 'size', component: 'select', defaultValue: 'md', props: { options: options(stepsSizes) } },
      { label: '外观类型', key: 'type', component: 'select', defaultValue: 'default', props: { options: options(stepsTypes) } },
      { label: '排列方向', key: 'direction', component: 'select', defaultValue: 'horizontal', props: { options: options(stepsDirections) } },
      { label: '主题色', key: 'color', component: 'select', defaultValue: 'primary', props: { options: options(stepsColors) } },
      { label: '连接线', key: 'lineType', component: 'select', defaultValue: 'solid', props: { options: options(stepsLineTypes) } },
    ],
  },
  {
    title: '状态',
    children: [
      { label: '当前下标（4 表示全部完成）', key: 'active', component: 'input-number', defaultValue: 1, props: { min: 0, max: items.length } },
      { label: '当前步骤状态', key: 'processStatus', component: 'select', defaultValue: 'process', props: { options: options(stepsStatuses) } },
      { label: '前序步骤状态', key: 'finishStatus', component: 'select', defaultValue: 'finish', props: { options: options(stepsStatuses) } },
    ],
  },
  {
    title: '进度',
    children: [
      { label: '设置单步进度', key: 'progressEnabled', component: 'checkbox', defaultValue: false },
      { label: '接收进度的步骤', key: 'progressStep', component: 'select', defaultValue: 1, props: { options: items.map((item, index) => ({ label: `${index}：${item.title}`, value: index })) } },
      { label: '使用整体进度（自动折算步骤）', key: 'overallMode', component: 'checkbox', defaultValue: false },
      { label: '所选步骤进度（%）', key: 'progress', component: 'input-number', defaultValue: 45, props: { min: 0, max: 100, step: 5 } },
      { label: '整体进度（%）', key: 'overallProgress', component: 'input-number', defaultValue: 50, props: { min: 0, max: 100, step: 5 } },
    ],
  },
  {
    title: '布局',
    children: [
      { label: '整体宽度（默认 100%，数字为 px）', key: 'width', component: 'input', defaultValue: '100%' },
      { label: '间距（留空自动，数字为 px，支持 25%）', key: 'space', component: 'input', defaultValue: '' },
      { label: '标题与描述位置', key: 'placement', component: 'select', defaultValue: '', props: { options: [{ label: '自动（横向居中时在下方）', value: '' }, ...options(stepsPlacements)] } },
      { label: '上下内容居中（横向）', key: 'alignCenter', component: 'checkbox', defaultValue: false },
      { label: '简洁模式（隐藏描述）', key: 'simple', component: 'checkbox', defaultValue: false },
    ],
  },
];

/** 记录实际的步骤变化事件。 */
function onPlaygroundChange(next: number, previous: number) {
  lastChange.value = `change：active ${previous} → ${next}`;
}
/** 通过外部按钮推进或回退演练场。 */
function movePlayground(offset: number) {
  state.value.active = Math.max(0, Math.min(items.length, Number(state.value.active) + offset));
}
/** 重置演练场配置与事件回显。 */
function resetState() {
  state.value = { ...defaultState };
  lastChange.value = '已重置配置';
}
/** 可复制代码完整列出当前演练轴。 */
const stepsCode = computed(() => {
  const value = state.value;
  const width = typeof playgroundWidth.value === 'number' ? `:width="${playgroundWidth.value}"` : `width="${playgroundWidth.value}"`;
  const space = typeof playgroundSpace.value === 'number' ? `:space="${playgroundSpace.value}"` : `space="${playgroundSpace.value}"`;
  const progress = playgroundOverallProgress.value !== undefined
    ? `\n    :overall-progress="${playgroundOverallProgress.value}"`
    : '';
  const placement = playgroundPlacement.value ? `\n    placement="${playgroundPlacement.value}"` : '';
  const steps = items.map((item, index) => {
    const stepProgress = getPlaygroundProgress(index);
    const parameter = stepProgress === undefined ? '' : ` :progress="${stepProgress}"`;
    return `    <RebornStep title="${item.title}" description="${item.description}"${parameter} />`;
  }).join('\n');
  return `<script setup lang="ts">\nimport { ref } from 'vue';\nconst active = ref(${value.active});\n<\/script>\n\n<template>\n  <RebornSteps\n    v-model:active="active"\n    direction="${value.direction}"${placement}\n    ${width}\n    ${space}\n    size="${value.size}"\n    type="${value.type}"\n    line-type="${value.lineType}"\n    color="${value.color}"\n    process-status="${value.processStatus}"\n    finish-status="${value.finishStatus}"${progress}\n    :align-center="${value.alignCenter}"\n    :simple="${value.simple}"\n  >\n${steps}\n  </RebornSteps>\n</template>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 基础流程的受控下标。 */
const basicActive = ref(0);
/** 基础流程最近一次真实切换。 */
const basicChange = ref('active = 0，从第一步开始');
/** 三种连接方式共用下标，便于观察前进与回退的动画。 */
const connectorActive = ref(1);
/** 当前步骤和整体进度分开控制，展示两种计算方式。 */
const progressItems = items.slice(0, 3);
const currentActive = ref(1);
const currentProgress = ref<number | null>(45);
const overallProgress = ref<number | null>(50);
/** 单步进度随当前下标传入，前序步骤完成、后续步骤等待。 */
function getCurrentProgress(index: number) {
  return index < currentActive.value ? 100 : index === currentActive.value ? currentProgress.value ?? 0 : 0;
}
/** 恢复单步进度示例最初的第二步和 45% 进度。 */
function resetCurrentProgress() {
  currentActive.value = 1;
  currentProgress.value = 45;
}
/** 每次移动一个步骤所占的整体份额，保留阶段内进度并限制边界。 */
function moveOverallProgress(offset: number) {
  overallProgress.value = Math.max(0, Math.min(100, (overallProgress.value ?? 0) + offset * 100 / progressItems.length));
}
/** 插槽示例独立控制步骤，观察四个插槽的作用域变化。 */
const slotActive = ref(1);
const slotItems = [
  { title: '创建订单', icon: 'lucide:clipboard-list', detail: '订单 RB-2026 已创建' },
  { title: '核验付款', icon: 'lucide:credit-card', detail: '核对付款金额与收款信息' },
  { title: '安排配送', icon: 'lucide:truck', detail: '付款确认后生成配送任务' },
];
/** 循环推进示例，最后一次点击重置流程。 */
function advanceBasic() {
  basicActive.value = basicActive.value === items.length ? 0 : basicActive.value + 1;
}
/** 组件图标与字符串图标并列演示。 */
const DeliveryIcon = defineComponent({
  name: 'StepsDeliveryIcon',
  setup: () => () => h(Icon, { name: 'lucide:truck' }),
});
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="stepsCode" component-name="RebornSteps" title="交互演练场"
      description="调节尺寸、状态、进度和布局，查看节点圆环与步骤之间的连接关系。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" />
          </template>
          重置配置
        </RebornButton>
      </template>
      <div class="flex w-full flex-col gap-6">
        <div class="w-full overflow-x-auto">
          <RebornSteps
            v-model:active="state.active" :direction="state.direction" :width="playgroundWidth"
            :space="playgroundSpace" :size="state.size" :type="state.type" :line-type="state.lineType"
            :color="state.color" :process-status="state.processStatus" :finish-status="state.finishStatus"
            :placement="playgroundPlacement" :align-center="state.alignCenter" :simple="state.simple"
            :overall-progress="playgroundOverallProgress" @change="onPlaygroundChange"
          >
            <RebornStep
              v-for="(item, index) in items" :key="item.title" :title="item.title"
              :description="item.description" :progress="getPlaygroundProgress(index)"
            />
          </RebornSteps>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <RebornButton
            size="sm" color="neutral" variant="outlined"
            :disabled="state.active <= 0 || state.overallMode" @click="movePlayground(-1)"
          >
            上一步
          </RebornButton>
          <RebornButton
            size="sm"
            :disabled="state.active >= items.length || state.overallMode"
            @click="movePlayground(1)"
          >
            下一步
          </RebornButton>
        </div>
        <DemoNote tone="dimmed">
          {{ lastChange }}；整体进度模式自动折算展示下标，不修改 <code>active</code>，也不触发 <code>change</code>。
          单步 <code>progress</code> 仅在该步骤当前处于 <code>process</code> 时显示，优先于整体折算百分比。
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础与状态流转">
      <template #description>通过 <code>v-model:active</code> 控制当前下标，前序、当前与后续步骤分别推导状态。</template>
      <DemoBlock layout="stack" class="gap-5">
        <RebornSteps
          v-model:active="basicActive"
          @change="(next, previous) => basicChange = `change：${previous} → ${next}`"
        >
          <RebornStep v-for="item in items" :key="item.title" :title="item.title" :description="item.description" />
        </RebornSteps>
        <div>
          <RebornButton size="sm" @click="advanceBasic">
            {{ basicActive === items.length ? '重新开始' : '下一步' }}
          </RebornButton>
        </div>
        <DemoNote tone="dimmed">{{ basicChange }}；<code>active</code> 等于步骤数量时，所有步骤使用完成状态。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="步骤进度">
      <template #description>
        单步 <code>RebornStep.progress</code> 表示该阶段的完成百分比；父级 <code>overall-progress</code>
        将整体百分比等分折算为完成步骤和当前步骤进度。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex w-full flex-col gap-4">
          <label class="flex flex-wrap items-center gap-3 text-base text-gray-10">
            当前步骤进度（%）
            <RebornInputNumber
              v-model="currentProgress" :min="0" :max="100" :step="5" size="sm" class="w-32"
              :disabled="currentActive >= progressItems.length"
              aria-label="当前步骤进度百分比"
            />
          </label>
          <RebornSteps v-model:active="currentActive">
            <RebornStep
              v-for="(item, index) in progressItems" :key="item.title" :title="item.title"
              :progress="getCurrentProgress(index)" :description="item.description"
            />
          </RebornSteps>
          <div class="flex flex-wrap items-center gap-2">
            <RebornButton size="sm" color="neutral" variant="outlined" :disabled="currentActive <= 0" @click="currentActive--">上一步</RebornButton>
            <RebornButton size="sm" :disabled="currentActive >= progressItems.length" @click="currentActive++">下一步</RebornButton>
            <RebornButton size="sm" color="neutral" variant="soft" @click="resetCurrentProgress">重置</RebornButton>
          </div>
          <DemoNote tone="dimmed">当前下标 {{ currentActive }}；每个步骤分别接收 <code>progress</code>，仅当前处理中步骤显示圆环；达到 100% 后仍由业务更新 <code>active</code>。</DemoNote>
        </div>
        <div class="flex w-full flex-col gap-4">
          <label class="flex flex-wrap items-center gap-3 text-base text-gray-10">
            整体进度（%）
            <RebornInputNumber
              v-model="overallProgress" :min="0" :max="100" :step="5" :precision="2" size="sm" class="w-32"
              aria-label="整体进度百分比"
            />
          </label>
          <RebornSteps :overall-progress="overallProgress ?? 0">
            <RebornStep title="填写资料" description="每个步骤占整体进度的三分之一" />
            <RebornStep title="核验资料" description="整体 50% 时，本步骤进度为 50%" />
            <RebornStep title="确认提交" description="整体 100% 时，三个步骤全部完成" />
          </RebornSteps>
          <div class="flex flex-wrap items-center gap-2">
            <RebornButton size="sm" color="neutral" variant="outlined" :disabled="(overallProgress ?? 0) <= 0" @click="moveOverallProgress(-1)">上一步</RebornButton>
            <RebornButton size="sm" :disabled="(overallProgress ?? 0) >= 100" @click="moveOverallProgress(1)">下一步</RebornButton>
            <RebornButton size="sm" color="neutral" variant="soft" @click="overallProgress = 50">重置</RebornButton>
          </div>
          <DemoNote tone="dimmed">上一步与下一步按整体的三分之一推进，重置回到 50%；默认根字号下，圆环与节点边缘相隔 3px，进度颜色跟随当前步骤主题色。</DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸">
      <template #description><code>size</code> 统一控制节点、标题和描述的尺寸，默认 <code>md</code>。</template>
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="size in stepsSizes" :key="size" class="flex flex-col gap-3 w-full">
          <p class="text-sm text-gray-7">{{ size.toUpperCase() }}</p>
          <RebornSteps :active="1" :size="size">
            <RebornStep
              v-for="item in items.slice(0, 3)" :key="item.title" :title="item.title"
              :description="item.description"
            />
          </RebornSteps>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="方向与间距">
      <template #description>
        <code>direction</code> 控制排列方向，<code>width</code> 控制整体宽度且默认
        <code>100%</code>，<code>space</code> 控制单步布局长度。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div class="overflow-x-auto w-full">
          <RebornSteps :active="1" :width="640">
            <RebornStep
              v-for="item in items.slice(0, 2)" :key="item.title" :title="item.title"
              :description="item.description"
            />
            <RebornStep title="提交申请" description="末项与前面的步骤共同分配可用宽度，较长的描述也能获得足够空间，按可用宽度换行。" />
          </RebornSteps>
        </div>
        <DemoNote tone="dimmed">
          上例将整体 <code>width</code> 设为 640px，各步骤共同分配可用宽度，末项不按标题宽度收缩；下例单独设置 <code>space</code>。
        </DemoNote>
        <div class="overflow-x-auto w-full">
          <RebornSteps :active="1" :space="180">
            <RebornStep
              v-for="item in items.slice(0, 3)" :key="item.title" :title="item.title"
              :description="item.description"
            />
          </RebornSteps>
        </div>
        <RebornSteps :active="1" direction="vertical" :space="96">
          <RebornStep
            v-for="item in items.slice(0, 3)" :key="item.title" :title="item.title"
            :description="item.description"
          />
        </RebornSteps>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题与描述位置">
      <template #description>
        <code>placement</code> 控制标题与描述相对节点的位置，支持上、下、左、右；单步设置优先于父级，排列方向仍由 <code>direction</code> 控制。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="placement in stepsPlacements" :key="placement" class="flex w-full flex-col gap-3 overflow-x-auto">
          <p class="text-sm text-gray-7">{{ placement }}</p>
          <RebornSteps :active="1" :placement="placement" :width="640">
            <RebornStep title="填写资料" description="补充基本信息" />
            <RebornStep title="身份验证" description="核对联系方式" />
            <RebornStep title="提交完成" description="接收处理通知" />
          </RebornSteps>
        </div>
        <div class="flex w-full flex-col gap-3 overflow-x-auto">
          <p class="text-sm text-gray-7">单步覆盖父级位置</p>
          <RebornSteps :active="1" placement="top" :width="640">
            <RebornStep title="继承上方" description="使用父级 top" />
            <RebornStep title="单步下方" description="当前步骤覆盖为 bottom" placement="bottom" />
            <RebornStep title="继承上方" description="其余步骤仍为 top" />
          </RebornSteps>
        </div>
        <DemoNote tone="dimmed">默认位于节点右侧；横向 <code>top</code> / <code>bottom</code> 默认左对齐，开启 <code>align-center</code> 后居中，仍保留显式选择的位置。纵向排列不受居中开关影响。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="居中对齐">
      <template #description><code>align-center</code> 让横向 <code>top</code> / <code>bottom</code> 的节点与文字居中；未指定 <code>placement</code> 时，内容位于节点下方。</template>
      <DemoBlock layout="stack">
        <RebornSteps :active="1" align-center>
          <RebornStep v-for="item in items" :key="item.title" :title="item.title" :description="item.description" />
        </RebornSteps>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="连接线样式">
      <template #description><code>line-type</code> 统一控制实线、原生虚线或箭头连接，切换步骤时连接器呈现过渡动画。</template>
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="lineType in stepsLineTypes" :key="lineType" class="flex flex-col gap-3 w-full">
          <p class="text-sm text-gray-7">{{ lineType }}</p>
          <RebornSteps :active="connectorActive" :line-type="lineType">
            <RebornStep v-for="item in items.slice(0, 3)" :key="item.title" :title="item.title" />
          </RebornSteps>
        </div>
        <div class="flex items-center gap-2">
          <RebornButton size="sm" color="neutral" variant="outlined" :disabled="connectorActive <= 0" @click="connectorActive--">上一步</RebornButton>
          <RebornButton size="sm" :disabled="connectorActive >= 3" @click="connectorActive++">下一步</RebornButton>
        </div>
        <DemoNote tone="dimmed">实线与虚线的主题色从前一步向后一步延展，回退时收回；箭头平滑变色。系统启用减少动态效果时关闭过渡。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="点状步骤">
      <template #description><code>type="dot"</code> 将序号节点替换为圆点，<code>size</code> 同时调整圆点与文字尺寸。</template>
      <DemoBlock layout="stack" class="gap-6">
        <RebornSteps v-for="size in stepsSizes" :key="size" :active="1" type="dot" :size="size">
          <RebornStep
            v-for="item in items.slice(0, 3)" :key="item.title" :title="item.title"
            :description="item.description"
          />
        </RebornSteps>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="简洁模式">
      <template #description><code>simple</code> 隐藏描述，适合只需展示阶段名称的流程摘要。</template>
      <DemoBlock layout="stack">
        <RebornSteps :active="1" simple>
          <RebornStep v-for="item in items" :key="item.title" :title="item.title" :description="item.description" />
        </RebornSteps>
        <DemoNote tone="dimmed">此处传入了 <code>description</code>，简洁模式会隐藏它，关闭后恢复显示。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="单步状态与颜色">
      <template #description>单步 <code>status</code> 覆盖父级推导状态，<code>color</code> 覆盖继承色；错误与成功状态优先使用语义色。</template>
      <DemoBlock layout="stack" class="gap-6">
        <RebornSteps :active="1" color="secondary">
          <RebornStep title="资料已收集" status="success" description="显式成功状态" />
          <RebornStep title="需要核对" status="error" color="warning" description="错误状态优先于单步配色" />
          <RebornStep title="人工复核" status="process" color="warning" description="单步主题色覆盖父级" />
          <RebornStep title="等待通知" />
        </RebornSteps>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义图标与内容">
      <template #description><code>icon</code> 接受图标名称或组件；同名插槽可替换节点图标、标题和描述。</template>
      <DemoBlock layout="stack">
        <RebornSteps :active="1">
          <RebornStep title="填写订单" icon="lucide:clipboard-list" description="字符串图标" />
          <RebornStep title="配送安排" :icon="DeliveryIcon" description="组件图标" />
          <RebornStep>
            <template #icon>
              <Icon name="lucide:package-check" />
            </template>
            <template #title><RebornText color="neutral">核对收货</RebornText></template>
            <template #description><span>订单 <strong class="font-medium">RB-2026</strong> 的收货信息</span></template>
          </RebornStep>
        </RebornSteps>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="插槽定制">
      <template #description>
        <code>icon</code>、<code>title</code>、<code>description</code> 与 <code>connector</code>
        分别覆盖节点、标题、描述与指示线，使用作用域参数响应步骤变化。
      </template>
      <DemoBlock layout="stack" class="gap-5">
        <RebornSteps v-model:active="slotActive" :ui="{ marker: 'bg-transparent text-brand-6', connector: 'h-4 mt-2' }">
          <RebornStep v-for="item in slotItems" :key="item.title">
            <template #icon="{ status }">
              <Icon :name="status === 'finish' ? 'lucide:check' : item.icon" class="size-5" :class="status === 'wait' ? 'text-gray-7' : 'text-brand-6'" />
            </template>
            <template #title="{ current }">
              <RebornText color="neutral" class="inline-flex flex-wrap items-center gap-2">
                {{ item.title }}
                <span v-if="current" class="text-sm">当前</span>
              </RebornText>
            </template>
            <template #description="{ index, status }">
              <span class="flex flex-col gap-2">
                <span>{{ item.detail }}</span>
                <span class="text-sm">第 {{ index + 1 }} 阶段，状态：{{ status }}</span>
              </span>
            </template>
            <template #connector="{ completed, direction }">
              <span
                class="flex w-full items-center gap-1 transition-colors duration-200 motion-reduce:transition-none"
                :class="completed ? 'text-brand-6' : 'text-gray-4'"
              >
                <span class="h-0.5 flex-1 rounded-full bg-current" />
                <Icon :name="direction === 'vertical' ? 'lucide:chevron-down' : 'lucide:chevrons-right'" class="size-3 shrink-0" />
              </span>
            </template>
          </RebornStep>
        </RebornSteps>
        <div class="flex flex-wrap items-center gap-2">
          <RebornButton size="sm" color="neutral" variant="outlined" :disabled="slotActive <= 0" @click="slotActive--">上一步</RebornButton>
          <RebornButton size="sm" :disabled="slotActive >= slotItems.length" @click="slotActive++">下一步</RebornButton>
          <RebornButton size="sm" color="neutral" variant="soft" @click="slotActive = 1">重置</RebornButton>
        </div>
        <DemoNote tone="dimmed">
          当前下标 {{ slotActive }}；节点只显示图标，标题使用中性色 <code>RebornText</code>；描述读取步骤状态，指示线按 <code>completed</code> 变色。末步不渲染指示线。
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
