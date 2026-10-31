<script setup lang="ts">
import type { GuideStep } from "~/components/reborn/ui/reborn-guide/RebornGuide.vue";
import type { Placement } from "~/lib/placement";
import { DemoBlock, DemoNote, DemoSection, Playground } from "#components";
import { computed, markRaw, shallowRef, useTemplateRef } from 'vue';
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { guideColors, guideModes, guidePlacements } from "~/components/reborn/ui/reborn-guide/reborn-guide.config";
import RebornGuide from "~/components/reborn/ui/reborn-guide/RebornGuide.vue";
import RebornGuideCustomStep from "./RebornGuideCustomStep.vue";

type Scenario = "playground" | "basic" | "indicator" | "cover" | "children" | "component";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场全部可调参数。 */
const defaultState = {
  color: "" as "" | (typeof guideColors)[number],
  mode: "popup" as "popup" | "dialog",
  placement: "bottom" as Placement,
  indicator: "counter" as "counter" | "dots",
  showOverlay: true,
  hideCounter: false,
  hidePrev: false,
  hideSkip: true,
};
const state = shallowRef({ ...defaultState });
const current = shallowRef(-1);
const scenario = shallowRef<Scenario>("playground");
const scenarioIndicator = shallowRef<"counter" | "dots">("counter");
const lastEvent = shallowRef("尚未开始");
const targetClicks = shallowRef(0);
const playgroundTarget = useTemplateRef<HTMLElement>("playgroundTarget");
const basicTarget = useTemplateRef<HTMLElement>("basicTarget");
const actionTarget = useTemplateRef<HTMLElement>("actionTarget");
const indicatorTarget = useTemplateRef<HTMLElement>("indicatorTarget");
const coverTarget = useTemplateRef<HTMLElement>("coverTarget");
const parentTarget = useTemplateRef<HTMLElement>("parentTarget");
const nestedTarget = useTemplateRef<HTMLElement>("nestedTarget");
const componentTarget = useTemplateRef<HTMLElement>("componentTarget");

/** 控件直接绑定引导实例，不另外覆盖演练场的步骤定位。 */
const controls = [
  {
    title: "基础属性",
    children: [
      { label: "面板颜色", key: "color", component: "select" as const, defaultValue: "", props: { options: [{ label: "默认（不传）", value: "" }, ...guideColors.map(value => ({ label: value, value }))] } },
      { label: "展示模式", key: "mode", component: "select" as const, defaultValue: "popup", props: { options: guideModes.map(value => ({ label: value === "popup" ? "浮层" : "对话框", value })) } },
      { label: "浮层方向", key: "placement", component: "select" as const, defaultValue: "bottom", props: { options: guidePlacements.map(value => ({ label: value, value })) } },
      { label: "步骤指示", key: "indicator", component: "select" as const, defaultValue: "counter", props: { options: [{ label: "数字", value: "counter" }, { label: "点状", value: "dots" }] } },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "显示遮罩", key: "showOverlay", component: "checkbox" as const, defaultValue: true },
      { label: "隐藏步骤指示", key: "hideCounter", component: "checkbox" as const, defaultValue: false },
      { label: "隐藏上一步", key: "hidePrev", component: "checkbox" as const, defaultValue: false },
      { label: "隐藏跳过", key: "hideSkip", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 可复制代码同时展示步骤级定位与组件级配置。 */
const guideCode = computed(() => `<RebornGuide
  v-model:current="current"${state.value.color ? `\n  color="${state.value.color}"` : ""}
  :steps="[{ element: '#target', title: '功能介绍', body: '阅读后继续。', placement: '${state.value.placement}' }]"
  mode="${state.value.mode}"
  indicator="${state.value.indicator}"
  :show-overlay="${state.value.showOverlay}"
  :hide-counter="${state.value.hideCounter}"
  :hide-prev="${state.value.hidePrev}"
  :hide-skip="${state.value.hideSkip}"
/>`);

/** 关闭引导并重置所有演练参数及交互回显。 */
function resetState() {
  current.value = -1;
  state.value = { ...defaultState };
  lastEvent.value = "尚未开始";
  targetClicks.value = 0;
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 使用内嵌插图，避免封面依赖外部图片服务。 */
const cover = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240"><rect width="480" height="240" fill="#eaf2ff"/><rect x="90" y="42" width="300" height="156" rx="16" fill="white"/><rect x="114" y="66" width="140" height="12" rx="6" fill="#3b82f6"/><rect x="114" y="98" width="252" height="10" rx="5" fill="#dbeafe"/><rect x="114" y="122" width="204" height="10" rx="5" fill="#dbeafe"/><rect x="290" y="150" width="76" height="24" rx="6" fill="#3b82f6"/></svg>')}`;
/** 组件对象保持原始引用，避免被步骤数组转换为响应式代理。 */
const customStep = markRaw(RebornGuideCustomStep);
/** 统一维护引导实例，切换场景时只替换步骤数据。 */
const steps = computed<GuideStep[]>(() => {
  switch (scenario.value) {
    case "playground":
      return [
        { element: () => playgroundTarget.value, title: "查看面板布局", body: "关闭按钮独占一行，标题、描述和操作区依次排列。", placement: state.value.placement },
        { element: () => playgroundTarget.value, title: "结束本次引导", body: "引导期间页面保持静止；关闭后恢复滚动与目标交互。", placement: state.value.placement },
      ];
    case "basic":
      return [
        { element: () => basicTarget.value, title: "先了解工作区", body: "当前目标会自动滚动到视口中央，说明面板沿目标边缘定位。", placement: "bottom" },
        { element: () => actionTarget.value, title: "查看操作入口", body: "引导期间点击此处不会触发目标按钮，完成后可再次点击验证。", placement: "top", finishButtonProps: { label: "开始使用" } },
      ];
    case "indicator":
      return [
        { element: () => indicatorTarget.value, title: "选择步骤指示", body: "数字显示当前步骤与总数；点状显示当前进度。", nextButtonProps: { label: "查看设置" } },
        { element: () => indicatorTarget.value, title: "逐步定义按钮", body: "当前步骤可单独指定上一步和下一步的按钮文案。", prevButtonProps: { label: "返回介绍" }, nextButtonProps: { label: "确认设置" } },
        { element: () => indicatorTarget.value, title: "准备就绪", body: "最后一步使用完成按钮，也能按步骤自定义文案。", prevButtonProps: { label: "修改设置" }, finishButtonProps: { label: "我知道了" } },
      ];
    case "cover":
      return [
        { element: () => coverTarget.value, title: "快速认识工作区", body: "可选封面使用 8px 圆角，与标题保留 16px 间距。", cover, coverAlt: "工作区示意图", nextButtonProps: { label: "阅读使用提示" } },
        { element: () => coverTarget.value, title: "保留默认操作区", content: "featureBody", finishButtonProps: { label: "阅读完成" } },
      ];
    case "children":
      return [{
        element: () => parentTarget.value,
        title: "父步骤：了解设置",
        body: "父步骤先显示，随后按深度优先顺序进入子步骤。",
        nextButtonProps: { label: "查看子步骤" },
        children: [
          { title: "子步骤：沿用目标", body: "未填写 element 时，子步骤继续使用父步骤的目标。" },
          {
            element: () => nestedTarget.value,
            title: "子步骤：滚动容器",
            body: "这个目标原本在滚动容器下方，进入步骤后会自动滚动到可见位置。",
            chidren: [{ title: "兼容 chidren 写法", body: "chidren 是 children 的兼容别名；当前例子共计 4 步。", finishButtonProps: { label: "结束子步骤" } }],
          },
        ],
      }];
    case "component":
      return [
        { element: () => componentTarget.value, component: customStep, componentProps: { heading: "选择你的工作方式", description: "这一整块面板由独立 Vue 组件渲染，内部可以维护自己的交互状态。" } },
        { element: () => componentTarget.value, component: customStep, componentProps: { heading: "自定义流程已就绪", description: "组件通过传入的 prev、finish、close 方法控制引导，无需访问外部实例。" } },
      ];
  }
  return [];
});

/** 场景示例固定基础行为，演练场参数只影响演练场。 */
const guideOptions = computed(() => scenario.value === "playground"
  ? { ...state.value, color: state.value.color || undefined }
  : { color: undefined, mode: "popup" as const, indicator: scenarioIndicator.value, showOverlay: true, hideCounter: false, hidePrev: false, hideSkip: true });

/** 选定场景后从第一步开始。 */
function startGuide(nextScenario: Scenario, indicator: "counter" | "dots" = "counter") {
  scenario.value = nextScenario;
  scenarioIndicator.value = indicator;
  lastEvent.value = "已开始：第 1 步";
  current.value = 0;
}

/** 回显实际切换到的扁平步骤索引。 */
function onChange(index: number) {
  if (index >= 0) lastEvent.value = `已切换：第 ${index + 1} 步`;
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col" data-guide-demo>
    <Playground v-model="state" :controls="controls" :code="guideCode" component-name="RebornGuide" title="交互演练场" description="调节面板颜色、方向、步骤指示与操作按钮，再开始引导查看效果。">
      <template #tag>
        <RebornButton size="sm" color="neutral" variant="soft" @click="resetState">重置配置</RebornButton>
      </template>
      <div class="flex w-full flex-col items-center gap-4">
        <div ref="playgroundTarget" class="w-full max-w-sm rounded-lg border border-gray-4 bg-gray-1 p-4" data-guide-target="playground">
          <p class="text-base font-medium text-gray-10">演练场目标</p>
          <p class="mt-2 text-base text-gray-8">引导激活后，目标保持可见，页面与目标交互会被锁定。</p>
        </div>
        <RebornButton @click="startGuide('playground')">开始演练引导</RebornButton>
        <DemoNote tone="dimmed" data-guide-event>{{ lastEvent }}</DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础引导" class="relative z-50">
      <template #description>通过 <code>steps</code> 与 <code>v-model:current</code> 启动流程，切换时自动居中目标并锁定页面交互。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornButton class="self-start" @click="startGuide('basic')">体验基础引导</RebornButton>
        <div ref="basicTarget" class="rounded-lg border border-gray-4 p-4" data-guide-target="basic">
          <p class="text-base font-medium text-gray-10">项目工作区</p>
          <p class="mt-2 text-base text-gray-8">在这里查看项目概况，再了解具体操作入口。</p>
        </div>
        <div ref="actionTarget" class="self-start rounded-lg border border-gray-4 p-4" data-guide-target="action">
          <RebornButton color="neutral" variant="outlined" @click="targetClicks++">目标操作按钮</RebornButton>
        </div>
        <DemoNote tone="dimmed" data-guide-clicks>目标已点击 {{ targetClicks }} 次；引导中的点击不会增加计数。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="步骤指示与按钮" class="relative z-40">
      <template #description><code>indicator</code> 切换数字或点状进度，每一步的按钮配置可覆盖默认文案。</template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap gap-2">
          <RebornButton @click="startGuide('indicator', 'counter')">数字步骤</RebornButton>
          <RebornButton variant="outlined" @click="startGuide('indicator', 'dots')">点状步骤</RebornButton>
        </div>
        <div ref="indicatorTarget" class="rounded-lg border border-gray-4 p-4 text-base text-gray-8" data-guide-target="indicator">三步流程：介绍 → 设置 → 完成。上一步、下一步与完成文案分别随步骤变化。</div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="封面与内容插槽" class="relative z-30">
      <template #description><code>cover</code> 添加封面，<code>content</code> 指定正文插槽并保留默认标题、步骤指示与按钮。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornButton class="self-start" @click="startGuide('cover')">查看封面与插槽</RebornButton>
        <div ref="coverTarget" class="rounded-lg border border-gray-4 p-4 text-base text-gray-8" data-guide-target="cover">第一步展示封面与文字，第二步展示带清单的自定义正文。</div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="子步骤与自动居中" class="relative z-20">
      <template #description><code>children</code> 或兼容写法 <code>chidren</code> 定义子步骤，计数包含所有层级，未指定目标时继承父目标。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornButton class="self-start" @click="startGuide('children')">开始父子步骤</RebornButton>
        <div ref="parentTarget" class="rounded-lg border border-gray-4 p-4 text-base text-gray-8" data-guide-target="parent">父步骤和第一个子步骤共用此目标。</div>
        <div class="h-56 overflow-y-auto rounded-lg border border-gray-4 p-4" data-guide-scroll-container>
          <div class="flex h-64 items-start text-base text-gray-8">下方还有一个子步骤目标，开始引导后会自动滚动至该处。</div>
          <div ref="nestedTarget" class="rounded-lg border border-dashed border-primary bg-primary/5 p-4 text-base text-gray-10" data-guide-target="nested">滚动容器中的子步骤目标</div>
          <div class="h-64" aria-hidden="true" />
        </div>
        <DemoNote tone="dimmed">顺序为父步骤 → 继承目标的子步骤 → 容器内子步骤 → 兼容写法的孙步骤，共 4 步。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="整步自定义组件" class="relative z-10">
      <template #description><code>component</code> 替换当前面板的全部内容，<code>componentProps</code> 传入业务数据，导航方法由引导注入。</template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornButton class="self-start" @click="startGuide('component')">体验自定义面板</RebornButton>
        <div ref="componentTarget" class="rounded-lg border border-gray-4 p-4 text-base text-gray-8" data-guide-target="component">自定义组件拥有自己的布局和交互，外层仍负责定位、遮罩和滚动锁定。</div>
      </DemoBlock>
    </DemoSection>

    <RebornGuide v-model:current="current" :steps="steps" :color="guideOptions.color" :mode="guideOptions.mode" :indicator="guideOptions.indicator" :show-overlay="guideOptions.showOverlay" :hide-counter="guideOptions.hideCounter" :hide-prev="guideOptions.hidePrev" :hide-skip="guideOptions.hideSkip" @change="onChange" @finish="lastEvent = '已完成引导'" @skip="lastEvent = '已跳过引导'" @close="lastEvent = '已关闭引导'">
      <template #featureBody="{ current: stepNumber, total }">
        <div class="flex flex-col gap-2">
          <p>当前为第 {{ stepNumber }} / {{ total }} 步，只替换正文区域。</p>
          <ul class="list-inside list-disc space-y-2">
            <li>标题和关闭按钮继续使用默认布局。</li>
            <li>步骤指示与操作按钮保持可用。</li>
          </ul>
        </div>
      </template>
    </RebornGuide>
  </div>
</template>
