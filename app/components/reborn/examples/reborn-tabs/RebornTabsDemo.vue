<script setup lang="ts">
import type { TabKey } from "~/components/reborn/ui/reborn-tabs/reborn-tabs.config";
import {
  tabsColors,
  tabsOverflows,
  tabsPositions,
  tabsSizes,
  tabsTypes,
} from "~/components/reborn/ui/reborn-tabs/reborn-tabs.config";
import RebornTabPane from "~/components/reborn/ui/reborn-tabs/RebornTabPane.vue";
import RebornTabs from "~/components/reborn/ui/reborn-tabs/RebornTabs.vue";

const typeOptions = tabsTypes.map((t) => ({ label: t, value: t }));
const sizeOptions = tabsSizes.map((s) => ({ label: s, value: s }));
const positionOptions = tabsPositions.map((p) => ({ label: p, value: p }));
const colorOptions = tabsColors.map((c) => ({ label: c, value: c }));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  type: "line",
  size: "md",
  position: "top",
  color: "primary",
  editable: false,
  showAddButton: false,
  animation: false,
  hideContent: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场选中的标签 */
const playKey = ref<TabKey>("overview");
/** change 触发次数，让切换「有回应」 */
const changeCount = ref(0);
const tabsProps = ref({
  position: "top",
  type: "line",
  size: "md",
});

function resetState() {
  state.value = { ...defaultState };
  playKey.value = "overview";
  changeCount.value = 0;
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "外观",
    children: [
      {
        label: "类型",
        key: "type",
        component: "select" as const,
        defaultValue: "line",
        props: { options: typeOptions },
      },
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: sizeOptions },
      },
      {
        label: "位置",
        key: "position",
        component: "select" as const,
        defaultValue: "top",
        props: { options: positionOptions },
      },
      {
        label: "主题色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: colorOptions },
      },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "可编辑模式", key: "editable", component: "checkbox" as const, defaultValue: false },
      {
        label: "显示增加按钮",
        key: "showAddButton",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "内容过渡动画",
        key: "animation",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "隐藏内容区",
        key: "hideContent",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const tabsCode = computed(() => {
  const s = state.value;
  const attrs = [
    `v-model:active-key="activeKey"`,
    `type="${s.type}"`,
    `size="${s.size}"`,
    `position="${s.position}"`,
    `color="${s.color}"`,
    `:editable="${s.editable}"`,
    `:show-add-button="${s.showAddButton}"`,
    `:animation="${s.animation}"`,
    `:hide-content="${s.hideContent}"`,
  ];
  return `<RebornTabs\n  ${attrs.join("\n  ")}\n>\n  <RebornTabPane key="overview" title="概览">概览内容</RebornTabPane>\n  <RebornTabPane key="detail" title="明细">明细内容</RebornTabPane>\n</RebornTabs>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 不同类型演示：六种类型共用一个选中项，切换类型时选中位置不变才好对比 */
const typeKey = ref<TabKey>("all");
/** 禁用演示 */
const disabledKey = ref<TabKey>("normal");
/** 标题插槽演示 */
const titleSlotKey = ref<TabKey>("inbox");
/** 额外内容演示 */
const extraKey = ref<TabKey>("inbox");
/** 触发方式演示 */
const hoverKey = ref<TabKey>("day");
/** 渲染策略演示 */
const lazyKey = ref<TabKey>("first");
const destroyKey = ref<TabKey>("first");
/** 切换动画演示：三组面板刻意不等高，才看得出内容区的高度过渡 */
const liquidRoundedKey = ref<TabKey>("brief");
const liquidCapsuleKey = ref<TabKey>("brief");
const liquidPlainKey = ref<TabKey>("brief");
/** 撑满高度演示 */
const justifyKey = ref<TabKey>("list");
/** 样式定制演示 */
const styledKey = ref<TabKey>("all");
/** 样式定制首个演示的选中项，与 ui 覆写演示分开，避免两组标签的 key 空间互相干扰 */
const styledColorKey = ref<TabKey>("top");

/** 滚动定位演示：标签超出一屏时才能看出差别 */
const scrollModes = ["auto", "start", "center", "end"] as const;
const scrollMode = ref<(typeof scrollModes)[number]>("auto");
const scrollKey = ref<TabKey>("12");
const scrollPanes = Array.from({ length: 40 }, (_, index) => ({
  key: `${index + 1}`,
  title: `标签 ${index + 1}`,
}));

/** 溢出导航演示：overflow 之外再叠位置 / 尺寸 / 类型 / 选中项滚动落点，验证三种方案在各形态下的表现 */
const overflowProps = ref({
  overflow: "arrows" as (typeof tabsOverflows)[number],
  position: "top" as (typeof tabsPositions)[number],
  size: "md" as (typeof tabsSizes)[number],
  type: "line" as (typeof tabsTypes)[number],
  scrollPosition: "auto" as (typeof scrollModes)[number],
});
const overflowKey = ref<TabKey>("1");
const overflowPanes = Array.from({ length: 24 }, (_, index) => ({
  key: `${index + 1}`,
  title: `标签 ${index + 1}`,
}));

/** 撑开标签演示：数量少时均分头部宽度，两种形态对比 */
const stretchLineKey = ref<TabKey>("all");
const stretchCapsuleKey = ref<TabKey>("day");

/** 拖拽排序演示：头部顺序由组件内部维护，sort 事件里拿到松手后的完整顺序 */
const dragKey = ref<TabKey>("home");
const dragPanes = [
  { key: "home", title: "首页" },
  { key: "monitor", title: "监控" },
  { key: "report", title: "报表" },
  { key: "setting", title: "设置" },
];
/** 最近一次 sort 事件的载荷，为空表示还没拖过 */
const sortedKeys = ref<TabKey[]>([]);

// ─── 可编辑模式 ─────────────────────────────────────────────────

/** 可编辑模式的标签数据，增删都发生在这个数组上 */
const editablePanes = ref([
  { key: "order", title: "订单" },
  { key: "refund", title: "退款" },
  { key: "invoice", title: "发票" },
]);
const editableKey = ref<TabKey>("order");

/** 新标签的编号来源，避免复用已删除的 key */
let seed = 0;

/** 组件只抛事件不动数据，新增标签由页面自己决定插在哪 */
function handleAdd() {
  seed++;
  editablePanes.value.push({ key: `custom-${seed}`, title: `新标签 ${seed}` });
}

/** 删除后若移除的正是当前项，则回退到相邻标签 */
function handleDelete(key: TabKey) {
  const index = editablePanes.value.findIndex((item) => item.key === key);
  if (index === -1) return;
  editablePanes.value.splice(index, 1);
  if (editableKey.value !== key) return;
  const fallback = editablePanes.value[index] ?? editablePanes.value[index - 1];
  editableKey.value = fallback ? fallback.key : "";
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="tabsCode" component-name="RebornTabs" title="交互演练场"
      description="调节左侧参数，实时查看标签页表现。左右位置会把布局转成横向。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full min-w-0 flex-col gap-4">
        <div
          :class="{
            'h-56': state.position === 'left' || state.position === 'right',
            'bg-gray-2 p-2': state.type === 'card-fill',
          }"
        >
          <RebornTabs
            v-model:active-key="playKey" :type="state.type" :size="state.size" :position="state.position"
            :color="state.color" :editable="state.editable" :show-add-button="state.showAddButton"
            :animation="state.animation" :hide-content="state.hideContent" class="h-full" @change="changeCount++"
          >
            <RebornTabPane key="overview" title="概览">
              <p class="text-muted text-sm">概览内容</p>
            </RebornTabPane>
            <RebornTabPane key="detail" title="明细">
              <p class="text-muted text-sm">明细内容</p>
            </RebornTabPane>
            <RebornTabPane key="log" title="日志">
              <p class="text-muted text-sm">日志内容</p>
            </RebornTabPane>
          </RebornTabs>
        </div>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          active-key: '{{ playKey }}' · change × {{ changeCount }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="不同类型">
      <template #description> 通过 <code>type</code> 可以设置标签的类型。 </template>
      <DemoBlock layout="stack">
        <RebornRadioGroup v-model="tabsProps.position" type="button">
          <RebornRadio v-for="position in tabsPositions" :key="position" :value="position">
            {{ position }}
          </RebornRadio>
        </RebornRadioGroup>
        <RebornRadioGroup v-model="tabsProps.type" type="button" variant="filled" color="error">
          <RebornRadio v-for="type in tabsTypes" :key="type" :value="type">
            {{ type }}
          </RebornRadio>
        </RebornRadioGroup>
        <div class="w-full">
          <RebornTabs
            v-model:active-key="typeKey" :type="tabsProps.type" :position="tabsProps.position" :ui="{
              tabSlider: tabsProps.type === 'card-fill' ? 'bg-gray-2' : '',
              content: tabsProps.type === 'card-fill' ? 'bg-gray-2' : '',
            }"
          >
            <RebornTabPane key="all" title="全部">
              <p class="text-muted text-sm">全部内容</p>
            </RebornTabPane>
            <RebornTabPane key="doing" title="进行中">
              <p class="text-muted text-sm">进行中内容</p>
            </RebornTabPane>
            <RebornTabPane key="done" title="已完成">
              <p class="text-muted text-sm">已完成内容</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="禁用">
      <template #description>
        <code>tab-pane</code> 的
        <code>disabled</code> 让该标签既不响应点击也不响应悬停，指示器不会移过去。
      </template>
      <DemoBlock layout="stack">
        <RebornTabs v-model:active-key="disabledKey">
          <RebornTabPane key="normal" title="可用">
            <p class="text-muted text-sm">可用内容</p>
          </RebornTabPane>
          <RebornTabPane key="locked" title="已锁定" disabled>
            <p class="text-muted text-sm">锁定内容</p>
          </RebornTabPane>
          <RebornTabPane key="other" title="其他">
            <p class="text-muted text-sm">其他内容</p>
          </RebornTabPane>
        </RebornTabs>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="可编辑">
      <template #description>
        <code>editable</code> 给每个标签补上关闭按钮，<code>show-add-button</code>
        再补一个新增按钮。组件只抛 <code>add</code> /
        <code>delete</code> 事件，增删与删除后的选中项都由外部数据决定。固定标签可单独设
        <code>:closable="false"</code>。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <RebornTabs
          v-model:active-key="editableKey" type="card-gutter" editable show-add-button @add="handleAdd"
          @delete="handleDelete"
        >
          <RebornTabPane v-for="pane in editablePanes" :key="pane.key" :title="pane.title">
            <p class="text-muted text-sm">{{ pane.title }} 的内容</p>
          </RebornTabPane>
        </RebornTabs>
        <DemoNote tone="dimmed">
          当前标签：{{ editablePanes.map((item) => item.title).join(" / ") || "已全部关闭" }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题插槽">
      <template #description>
        <code>tab-pane</code> 的
        <code>title</code> 插槽接管标题渲染，用于在标题里放图标或徽标；纯文本时用
        <code>title</code> 属性即可。
      </template>
      <DemoBlock layout="stack">
        <div>
          <RebornTabs v-model:active-key="titleSlotKey" type="card-gutter">
            <RebornTabPane key="inbox">
              <template #title>
                <span class="inline-flex items-center gap-1.5">
                  <Icon name="lucide:inbox" size="14" />
                  收件箱
                  <span class="bg-error text-inverted rounded-full px-1.5 text-[10px] leading-4">3</span>
                </span>
              </template>
              <p class="text-muted text-sm">收件箱内容</p>
            </RebornTabPane>
            <RebornTabPane key="sent">
              <template #title>
                <span class="inline-flex items-center gap-1.5">
                  <Icon name="lucide:send" size="14" />
                  已发送
                </span>
              </template>
              <p class="text-muted text-sm">已发送内容</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="额外内容">
      <template #description>
        <code>left-extra</code> 插槽挂在标签栏起始侧、<code>right-extra</code>
        挂在末尾，分别用来放标题和与整块内容相关的操作；水平方向即左右两端，垂直方向即顶部与底部。
      </template>
      <DemoBlock layout="stack">
        <RebornTabs v-model:active-key="extraKey">
          <template #left-extra>
            <span class="text-highlighted mr-2 text-sm font-medium">邮箱</span>
          </template>
          <template #right-extra>
            <RebornButton size="sm" variant="text" color="neutral">
              <template #leading>
                <Icon name="lucide:refresh-cw" size="12" />
              </template>
              刷新
            </RebornButton>
          </template>
          <RebornTabPane key="inbox" title="收件箱">
            <p class="text-muted text-sm">收件箱内容</p>
          </RebornTabPane>
          <RebornTabPane key="sent" title="已发送">
            <p class="text-muted text-sm">已发送内容</p>
          </RebornTabPane>
        </RebornTabs>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="滚动定位">
      <template #description>
        标签超出容器宽度时头部可横向滚动。<code>scroll-position</code> 默认
        <code>auto</code>，只在选中项被挡住时补上 差值；<code>start</code> / <code>center</code> /
        <code>end</code> 每次切换都对到固定位置；传数字则直接指定 滚动距离。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <RebornButton
            v-for="mode in scrollModes" :key="mode" size="sm"
            :variant="scrollMode === mode ? 'filled' : 'outlined'" :color="scrollMode === mode ? 'primary' : 'neutral'"
            @click="scrollMode = mode"
          >
            {{ mode }}
          </RebornButton>
        </div>
        <RebornTabs v-model:active-key="scrollKey" :scroll-position="scrollMode">
          <RebornTabPane v-for="pane in scrollPanes" :key="pane.key" :title="pane.title">
            <p class="text-muted text-sm">{{ pane.title }} 的内容</p>
          </RebornTabPane>
        </RebornTabs>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="溢出导航">
      <template #description>
        默认溢出后只能靠滚轮或触摸滑动，没有任何可点的入口。<code>overflow="arrows"</code>
        在头部两端补一对箭头按钮分步滚动，适合鼠标为主的场景；<code>overflow="dropdown"</code>
        在头部末尾补一个下拉选标，列表只含被滚出可视区域的标签——看得见的直接点头部即可，点选后该标签滚回可视区域并从列表中消失。两种方案的按钮都只在标签真正溢出时渲染，未溢出时与默认表现一致；滚动容器两端的标签会渐隐成透明，滚过哪端、哪端就有滑进按钮下面的层次感，滚到端点即恢复实心。「定位」一组是
        <code>scroll-position</code>：切换标签后选中项的滚动落点，对三种导航方式都生效——默认
        <code>scroll</code> 没有可点按钮，选中项的自动定位就是它唯一的导航手段。
      </template>
      <DemoBlock layout="stack">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-dimmed w-8 shrink-0 text-xs">导航</span>
          <RebornRadioGroup v-model="overflowProps.overflow" type="button">
            <RebornRadio v-for="mode in tabsOverflows" :key="mode" :value="mode">
              {{ mode }}
            </RebornRadio>
          </RebornRadioGroup>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-dimmed w-8 shrink-0 text-xs">位置</span>
          <RebornRadioGroup v-model="overflowProps.position" type="button">
            <RebornRadio v-for="position in tabsPositions" :key="position" :value="position">
              {{ position }}
            </RebornRadio>
          </RebornRadioGroup>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-dimmed w-8 shrink-0 text-xs">尺寸</span>
          <RebornRadioGroup v-model="overflowProps.size" type="button">
            <RebornRadio v-for="size in tabsSizes" :key="size" :value="size">
              {{ size }}
            </RebornRadio>
          </RebornRadioGroup>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-dimmed w-8 shrink-0 text-xs">类型</span>
          <RebornRadioGroup v-model="overflowProps.type" type="button" variant="filled" color="error">
            <RebornRadio v-for="type in tabsTypes" :key="type" :value="type">
              {{ type }}
            </RebornRadio>
          </RebornRadioGroup>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-dimmed w-8 shrink-0 text-xs">定位</span>
          <RebornRadioGroup v-model="overflowProps.scrollPosition" type="button">
            <RebornRadio v-for="mode in scrollModes" :key="mode" :value="mode">
              {{ mode }}
            </RebornRadio>
          </RebornRadioGroup>
        </div>
        <!-- 左右位置滚动依赖外层定高，与「位置与方向」小节的约束一致 -->
        <div
          class="w-full"
          :class="{ 'h-56': overflowProps.position === 'left' || overflowProps.position === 'right' }"
        >
          <RebornTabs
            v-model:active-key="overflowKey"
            :overflow="overflowProps.overflow"
            :position="overflowProps.position"
            :size="overflowProps.size"
            :type="overflowProps.type"
            :scroll-position="overflowProps.scrollPosition"
            class="h-full"
            :ui="{
              tabSlider: overflowProps.type === 'card-fill' ? 'bg-gray-2' : '',
              content: overflowProps.type === 'card-fill' ? 'bg-gray-2' : '',
            }"
          >
            <RebornTabPane v-for="pane in overflowPanes" :key="pane.key" :title="pane.title">
              <p class="text-muted text-sm">{{ pane.title }} 的内容</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="撑开标签">
      <template #description>
        <code>stretch</code>
        让标签均分头部宽度、标题居中，适合数量固定的少量标签占满整行的版式；仅水平方向生效。标签总宽超出容器时不会挤压标题，仍回到滚动浏览。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex w-full min-w-0 flex-col gap-2">
          <p class="text-dimmed text-xs italic">type="line" + stretch</p>
          <RebornTabs v-model:active-key="stretchLineKey" stretch>
            <RebornTabPane key="all" title="全部">
              <p class="text-muted text-sm">全部内容</p>
            </RebornTabPane>
            <RebornTabPane key="doing" title="进行中">
              <p class="text-muted text-sm">进行中内容</p>
            </RebornTabPane>
            <RebornTabPane key="done" title="已完成">
              <p class="text-muted text-sm">已完成内容</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
        <div class="flex w-full min-w-0 flex-col gap-2">
          <p class="text-dimmed text-xs italic">type="capsule" + stretch</p>
          <RebornTabs v-model:active-key="stretchCapsuleKey" type="capsule" stretch>
            <RebornTabPane key="day" title="日">
              <p class="text-muted text-sm">按日统计</p>
            </RebornTabPane>
            <RebornTabPane key="week" title="周">
              <p class="text-muted text-sm">按周统计</p>
            </RebornTabPane>
            <RebornTabPane key="month" title="月">
              <p class="text-muted text-sm">按月统计</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="拖拽排序">
      <template #description>
        <code>draggable</code> 允许按住标签头左右拖动调整顺序，禁用标签不可拖动。顺序改动只发生在头部渲染层，松手后组件通过
        <code>sort</code> 事件给出完整的新顺序，需要持久化时由外部保存；组件不改任何数据。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornTabs v-model:active-key="dragKey" type="card-gutter" draggable @sort="sortedKeys = $event">
          <RebornTabPane v-for="pane in dragPanes" :key="pane.key" :title="pane.title">
            <p class="text-muted text-sm">{{ pane.title }} 的内容</p>
          </RebornTabPane>
        </RebornTabs>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          sort: {{ sortedKeys.length ? sortedKeys.join(" → ") : "还没拖过" }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="触发方式">
      <template #description>
        <code>trigger="hover"</code>
        让鼠标移入即切换，适合内容轻、需要快速预览的场景。触控端没有悬停，该值等同
        <code>click</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornTabs v-model:active-key="hoverKey" trigger="hover" type="rounded">
          <RebornTabPane key="day" title="日">
            <p class="text-muted text-sm">按日统计</p>
          </RebornTabPane>
          <RebornTabPane key="week" title="周">
            <p class="text-muted text-sm">按周统计</p>
          </RebornTabPane>
          <RebornTabPane key="month" title="月">
            <p class="text-muted text-sm">按月统计</p>
          </RebornTabPane>
        </RebornTabs>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="渲染策略">
      <template #description>
        默认所有面板一次性挂载并保留。<code>lazy-load</code> 推迟到首次展示再挂载；<code>destroy-on-hidden</code>
        则离开就销毁，面板里的临时状态会一并丢掉。两者可按单个 <code>tab-pane</code> 单独开启。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex min-w-0 flex-col gap-2">
          <p class="text-dimmed text-xs italic">lazy-load</p>
          <RebornTabs v-model:active-key="lazyKey" lazy-load>
            <RebornTabPane key="first" title="首个">
              <input class="border-default w-full rounded-md border px-3 py-1.5 text-sm" placeholder="输入后切走再回来，内容还在">
            </RebornTabPane>
            <RebornTabPane key="second" title="次个">
              <p class="text-muted text-sm">第一次点进来才挂载</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
        <div class="flex min-w-0 flex-col gap-2">
          <p class="text-dimmed text-xs italic">destroy-on-hidden</p>
          <RebornTabs v-model:active-key="destroyKey" destroy-on-hidden>
            <RebornTabPane key="first" title="首个">
              <input class="border-default w-full rounded-md border px-3 py-1.5 text-sm" placeholder="输入后切走再回来，内容已清空">
            </RebornTabPane>
            <RebornTabPane key="second" title="次个">
              <p class="text-muted text-sm">每次进入都是新的</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="切换动画">
      <template #description>
        <code>rounded</code> / <code>capsule</code>
        的选中底板移动时会先拉成两个标签的并集、再收拢到目标并回弹。拉伸不只是观感：这两种类型的选中标题是反色的，底板在行程中同时盖住旧标签与新标签，两边的标题才不会有一段时间悬在页面底色上。这段形变只看
        <code>type</code>，不受 <code>animation</code> 控制。<code>animation</code>
        管的是另外两件事，且对所有类型生效——内容切换叠上缩放、位移与模糊，内容区高度也跟着过渡。下面三组面板刻意不等高，切换时留意高度是渐变而不是跳变。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex min-w-0 flex-col gap-2">
          <p class="text-dimmed text-xs italic">type="rounded" + animation</p>
          <RebornTabs v-model:active-key="liquidRoundedKey" type="rounded" animation>
            <RebornTabPane key="brief" title="摘要">
              <p class="text-muted text-sm">两行文字的面板。</p>
              <p class="text-muted text-sm">切到「明细」会明显变高。</p>
            </RebornTabPane>
            <RebornTabPane key="detail" title="明细">
              <p v-for="index in 7" :key="index" class="text-muted text-sm">
                第 {{ index }} 行明细
              </p>
            </RebornTabPane>
            <RebornTabPane key="note" title="备注">
              <p class="text-muted text-sm">只有一行。</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
        <div class="flex min-w-0 flex-col gap-2">
          <p class="text-dimmed text-xs italic">type="capsule" + animation</p>
          <RebornTabs v-model:active-key="liquidCapsuleKey" type="capsule" animation>
            <RebornTabPane key="brief" title="摘要">
              <p class="text-muted text-sm">白色滑块在灰底轨道内移动，形变同样生效。</p>
            </RebornTabPane>
            <RebornTabPane key="detail" title="明细">
              <p v-for="index in 5" :key="index" class="text-muted text-sm">
                第 {{ index }} 行明细
              </p>
            </RebornTabPane>
            <RebornTabPane key="note" title="备注">
              <p class="text-muted text-sm">悬停时底板不动，点击真正切换时才有拉伸回弹的形变。</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
        <div class="flex min-w-0 flex-col gap-2">
          <p class="text-dimmed text-xs italic">type="line" + animation</p>
          <RebornTabs v-model:active-key="liquidPlainKey" animation>
            <RebornTabPane key="brief" title="摘要">
              <p class="text-muted text-sm">
                下划线类型没有底板，但内容的复合过渡与高度过渡照样生效。
              </p>
            </RebornTabPane>
            <RebornTabPane key="detail" title="明细">
              <p v-for="index in 6" :key="index" class="text-muted text-sm">
                第 {{ index }} 行明细
              </p>
            </RebornTabPane>
            <RebornTabPane key="note" title="备注">
              <p class="text-muted text-sm">高度过渡的那段时间内容区会裁剪溢出，面板里别放需要溢出的浮层。</p>
            </RebornTabPane>
          </RebornTabs>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="撑满高度">
      <template #description>
        <code>justify</code>
        让内容区吃掉容器剩余高度，配合定高外层做「头部固定、内容自己滚动」的版式，只在水平
        方向生效。
      </template>
      <DemoBlock layout="stack">
        <div class="h-56">
          <RebornTabs v-model:active-key="justifyKey" justify>
            <RebornTabPane key="list" title="列表">
              <div class="bg-elevated flex h-full items-center justify-center rounded-md">
                <p class="text-muted text-sm">内容区已撑满剩余高度</p>
              </div>
            </RebornTabPane>
            <RebornTabPane key="chart" title="图表">
              <div class="bg-elevated flex h-full items-center justify-center rounded-md">
                <p class="text-muted text-sm">图表占位</p>
              </div>
            </RebornTabPane>
          </RebornTabs>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="样式定制">
      <template #description>
        <code>color</code> 落成色板的语义类名，指示器、选中态文字与胶囊底色取同一档色值； 需要 7
        个语义色之外的色值时不用逐个改
        <code>ui</code> 键，在根节点改写对应的色板变量即可；更细的调整再用
        <code>ui</code> 按槽位覆写。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <RebornTabs
          v-model:active-key="styledColorKey" :class="styledColorKey === 'top' ? '[--color-primary:#FF2442]' : '[--color-primary:#3491FA]'
          "
        >
          <RebornTabPane v-for="i in positionOptions" :key="i.value" :title="i.label">
            <div class="text-muted p-10 text-center text-sm">{{ i.label }}内容</div>
          </RebornTabPane>
        </RebornTabs>
        <RebornTabs
          v-model:active-key="styledKey" :ui="{
            indicator: 'h-1 rounded-none bg-linear-to-r from-blue-500 via-purple-500 to-pink-500',
            tab: 'tracking-wide',
          }"
        >
          <RebornTabPane key="all" title="全部">
            <p class="text-muted text-sm">全部内容</p>
          </RebornTabPane>
          <RebornTabPane key="doing" title="进行中">
            <p class="text-muted text-sm">进行中内容</p>
          </RebornTabPane>
        </RebornTabs>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
