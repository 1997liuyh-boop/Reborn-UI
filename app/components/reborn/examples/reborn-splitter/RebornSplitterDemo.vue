<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, shallowRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { splitterLayouts } from "~/components/reborn/ui/reborn-splitter/reborn-splitter.config";
import RebornSplitter from "~/components/reborn/ui/reborn-splitter/RebornSplitter.vue";
import RebornSplitterPanel from "~/components/reborn/ui/reborn-splitter/RebornSplitterPanel.vue";

/** 分隔容器的演示外框：必须给出明确的宽高，Splitter 根节点是 w-full h-full，父级没尺寸时会塌成内容宽度 */
const frameClass = "h-64 w-full";
/** 面板内文字的统一排版 */
const panelTextClass = "text-muted flex h-full w-full items-center justify-center p-2 text-center text-sm";

/** 尺寸数组保留一位小数，便于阅读 */
function formatSizes(sizes: number[]) {
  return `[${sizes.map((size) => size.toFixed(1)).join(", ")}]`;
}

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  layout: "horizontal",
  lazy: false,
  panelCount: 3,
  collapsible: true,
  resizable: true,
};

const state = shallowRef<Record<string, any>>({ ...defaultState });

/** 演练场最近一次 change 提交的尺寸，作为交互回显 */
const playgroundSizes = shallowRef("");

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  playgroundSizes.value = "";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "容器",
    children: [
      {
        label: "排列方向（layout）",
        key: "layout",
        component: "select" as const,
        defaultValue: "horizontal",
        props: { options: splitterLayouts.map((l) => ({ label: l === "horizontal" ? "水平 horizontal" : "垂直 vertical", value: l })) },
      },
      { label: "延迟提交（lazy）", key: "lazy", component: "checkbox" as const, defaultValue: false },
      {
        label: "面板数量",
        key: "panelCount",
        component: "input-number" as const,
        defaultValue: 3,
        props: { min: 2, max: 4 },
      },
    ],
  },
  {
    title: "首个面板",
    children: [
      { label: "可折叠（collapsible）", key: "collapsible", component: "checkbox" as const, defaultValue: true },
      { label: "可拖拽（resizable）", key: "resizable", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 布局形态变化后旧尺寸不再对应，用 key 重建 Splitter 并清空回显 */
const playgroundKey = computed(() => `${state.value.layout}-${state.value.panelCount}`);

function onPlaygroundChange(sizes: number[]) {
  playgroundSizes.value = formatSizes(sizes);
}

/** 传参明细：容器属性 + 逐个面板 */
const splitterCode = computed(() => {
  const s = state.value;
  const attrs: string[] = [];
  if (s.layout !== "horizontal") attrs.push(`layout="${s.layout}"`);
  if (s.lazy) attrs.push("lazy");
  const open = attrs.length ? `<RebornSplitter ${attrs.join(" ")}>` : "<RebornSplitter>";
  const firstAttrs = [s.collapsible ? "collapsible" : "", s.resizable ? "" : ':resizable="false"'].filter(Boolean).join(" ");
  const panels = Array.from({ length: s.panelCount }, (_, i) =>
    i === 0 && firstAttrs ? `  <RebornSplitterPanel ${firstAttrs}>面板 1</RebornSplitterPanel>` : `  <RebornSplitterPanel>面板 ${i + 1}</RebornSplitterPanel>`,
  );
  return `${open}\n${panels.join("\n")}\n</RebornSplitter>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 基础用法：首个面板的双向绑定尺寸（数字输入回写数字，单位是百分比） */
const navSize = shallowRef<number | string>(30);

/** 尺寸变化与边界通知：一条事件回显 */
interface EventLog {
  id: number;
  name: string;
  detail: string;
}

/** 事件日志，按时间倒序保留最近 6 条 */
const eventLogs = shallowRef<EventLog[]>([]);
let logSeq = 0;

/** resize 的派发次数：拖拽中逐帧累加，用来对照 change 只在提交时派发一次 */
const resizeCount = shallowRef(0);

/** 记录一条事件 */
function pushLog(name: string, detail: string) {
  eventLogs.value = [{ id: ++logSeq, name, detail }, ...eventLogs.value].slice(0, 6);
}

/** 布局提交：拖拽松手、折叠或展开之后 */
function onChange(sizes: number[], index: number) {
  pushLog("change", `${formatSizes(sizes)}，拖拽条 ${index}`);
}

/** 拖拽中某个面板进入 min / max 边界 */
function onLimit(index: number, boundary: "min" | "max", size: number) {
  pushLog("limit", `面板 ${index} 触及 ${boundary}，当前 ${size.toFixed(1)}%`);
}

/** 折叠或展开，collapsed 为操作之后的状态 */
function onCollapse(index: number, collapsed: boolean) {
  pushLog("collapse", `面板 ${index} ${collapsed ? "已折叠" : "已展开"}`);
}

/** 清空日志与 resize 计数 */
function clearLogs() {
  eventLogs.value = [];
  resizeCount.value = 0;
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="splitterCode"
      component-name="RebornSplitter"
      title="交互演练场"
      description="调节上方参数，拖动拖拽条或点击折叠按钮，查看分隔面板在不同方向与提交方式下的表现。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col gap-3">
        <div class="border-default rounded-lg border" :class="state.layout === 'vertical' ? 'h-80 w-full' : frameClass">
          <RebornSplitter :key="playgroundKey" :layout="state.layout" :lazy="state.lazy" @change="onPlaygroundChange">
            <RebornSplitterPanel
              v-for="i in state.panelCount"
              :key="i"
              :collapsible="i === 1 && state.collapsible"
              :resizable="i === 1 ? state.resizable : true"
            >
              <div :class="panelTextClass">面板 {{ i }}</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          最近一次 change：{{ playgroundSizes || "尚未调整" }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>size</code>
        的数字与字符串都按百分比解析，不传的面板平分剩余空间；<code>v-model:size</code>
        在拖拽、折叠后回写最新占比。
      </template>
      <DemoBlock layout="stack" tone="inset">
        <div :class="frameClass">
          <RebornSplitter>
            <RebornSplitterPanel v-model:size="navSize">
              <div :class="panelTextClass">导航 · {{ Number(navSize).toFixed(1) }}%</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div :class="panelTextClass">内容（平分剩余）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div :class="panelTextClass">属性（平分剩余）</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="排列方向与延迟提交">
      <template #description>
        <code>layout="vertical"</code>
        改为上下排列，容器需要明确高度；<code>lazy</code>
        开启后拖拽中只移动预览条，松手才提交尺寸，适合重绘成本高的面板。
      </template>
      <DemoBlock layout="grid" :columns="2" tone="inset">
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">layout="vertical"</span>
          <div class="h-72 w-full">
            <RebornSplitter layout="vertical">
              <RebornSplitterPanel :size="60">
                <div :class="panelTextClass">编辑</div>
              </RebornSplitterPanel>
              <RebornSplitterPanel>
                <div :class="panelTextClass">预览</div>
              </RebornSplitterPanel>
            </RebornSplitter>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">lazy</span>
          <div class="h-72 w-full">
            <RebornSplitter lazy>
              <RebornSplitterPanel>
                <div :class="panelTextClass">松手后才更新</div>
              </RebornSplitterPanel>
              <RebornSplitterPanel>
                <div :class="panelTextClass">松手后才更新</div>
              </RebornSplitterPanel>
            </RebornSplitter>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸限制与折叠">
      <template #description>
        <code>min</code>
        /
        <code>max</code>
        的数字按 px、字符串按百分比，拖拽到边界后不再移动；<code>collapsible</code>
        在拖拽条上放出折叠按钮，<code>#start-collapsible</code>
        只替换按钮内部内容。
      </template>
      <DemoBlock layout="stack" tone="inset" class="gap-6">
        <div :class="frameClass">
          <RebornSplitter>
            <RebornSplitterPanel size="30%" :min="120" max="60%" collapsible>
              <template #start-collapsible="{ collapsed }">
                <Icon :name="collapsed ? 'lucide:plus' : 'lucide:minus'" class="size-3" />
              </template>
              <div :class="panelTextClass">侧栏（120px ~ 60%）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div :class="panelTextClass">内容</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
        <div class="flex w-full flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">面板 2 设为 :resizable="false"</span>
          <div :class="frameClass">
            <RebornSplitter>
              <RebornSplitterPanel>
                <div :class="panelTextClass">面板 1</div>
              </RebornSplitterPanel>
              <RebornSplitterPanel :resizable="false">
                <div :class="panelTextClass">面板 2（两侧拖拽条锁定）</div>
              </RebornSplitterPanel>
              <RebornSplitterPanel>
                <div :class="panelTextClass">面板 3</div>
              </RebornSplitterPanel>
              <RebornSplitterPanel>
                <div :class="panelTextClass">面板 4</div>
              </RebornSplitterPanel>
            </RebornSplitter>
          </div>
        </div>
      </DemoBlock>
      <DemoNote>
        拖拽条只在左右两个面板都允许调整时可拖，因此 <code>resizable</code>
        为 <code>false</code> 锁住的是与该面板相邻的两条拖拽条，其余拖拽条照常可用。
      </DemoNote>
    </DemoSection>

    <DemoSection title="尺寸变化与边界通知">
      <template #description>
        拖到面板的 <code>min</code> / <code>max</code> 时派发一次 <code>limit</code>，停在边界上不重复派发；松手、折叠或展开后派发一次
        <code>change</code>，载荷是全部面板的最新尺寸。
      </template>
      <DemoBlock layout="stack" tone="inset">
        <div :class="frameClass">
          <RebornSplitter
            @resize="resizeCount++"
            @change="onChange"
            @limit="onLimit"
            @collapse="onCollapse"
          >
            <RebornSplitterPanel size="30%" :min="160" max="60%" collapsible>
              <div :class="panelTextClass">面板 1（min 160px，max 60%）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel min="15%">
              <div :class="panelTextClass">面板 2（min 15%）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel size="20%">
              <div :class="panelTextClass">面板 3</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
      <div class="mt-4 flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <RebornButton size="sm" variant="soft" color="neutral" @click="clearLogs">
            清空日志
          </RebornButton>
          <DemoNote tone="dimmed">
            resize 已派发 {{ resizeCount }} 次：它随拖拽逐帧派发，适合同步预览；保存布局请监听 change，一次拖拽只在松手时派发一次。
          </DemoNote>
        </div>
        <ul class="flex flex-col gap-1 font-mono text-xs">
          <li v-for="log in eventLogs" :key="log.id" class="text-muted break-all">
            <span class="text-primary">{{ log.name }}</span>
            {{ log.detail }}
          </li>
          <li v-if="!eventLogs.length" class="text-dimmed">
            拖动上面的拖拽条或点击折叠按钮，事件会按时间倒序出现在这里
          </li>
        </ul>
      </div>
    </DemoSection>
  </div>
</template>
