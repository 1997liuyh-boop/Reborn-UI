<script setup lang="ts">
import type { MentionOption } from "~/components/reborn/ui/reborn-mention";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, onBeforeUnmount, shallowRef } from 'vue';
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornMention from "~/components/reborn/ui/reborn-mention/RebornMention.vue";

/** 演示用的成员列表 */
const members: MentionOption[] = [
  { value: "张伟", label: "张伟", role: "前端" },
  { value: "李娜", label: "李娜", role: "设计" },
  { value: "王芳", label: "王芳", role: "产品" },
  { value: "刘洋", label: "刘洋", role: "后端" },
  { value: "陈静", label: "陈静", role: "测试", disabled: true },
  { value: "Alice", label: "Alice", role: "运营" },
];

/** 话题列表，配合 # 前缀使用 */
const topics: MentionOption[] = [
  { value: "版本发布", label: "版本发布" },
  { value: "需求评审", label: "需求评审" },
  { value: "线上问题", label: "线上问题" },
];

const prefixOptions = [
  { label: "@", value: "@" },
  { label: "#", value: "#" },
  { label: "@ 与 #", value: "both" },
];
const placementOptions = [
  { label: "向下 bottom", value: "bottom" },
  { label: "向上 top", value: "top" },
];
const typeOptions = [
  { label: "单行 text", value: "text" },
  { label: "多行 textarea", value: "textarea" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态：除 type 外与组件默认值一致 */
const defaultState: Record<string, any> = {
  type: "textarea",
  prefix: "@",
  placement: "bottom",
  showArrow: false,
  offset: 0,
  whole: false,
  loading: false,
};

const state = shallowRef<Record<string, any>>({ ...defaultState });
const playgroundValue = shallowRef("");
/** 演练场最近一次 select 事件的回显 */
const lastSelect = shallowRef("尚未选择");

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  playgroundValue.value = "";
  lastSelect.value = "尚未选择";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "输入框类型", key: "type", component: "select" as const, defaultValue: "textarea", props: { options: typeOptions } },
      { label: "触发前缀", key: "prefix", component: "select" as const, defaultValue: "@", props: { options: prefixOptions } },
    ],
  },
  {
    title: "下拉面板",
    children: [
      { label: "展开方向", key: "placement", component: "select" as const, defaultValue: "bottom", props: { options: placementOptions } },
      { label: "显示箭头", key: "showArrow", component: "checkbox" as const, defaultValue: false },
      { label: "额外偏移（px）", key: "offset", component: "slider" as const, defaultValue: 0, props: { min: 0, max: 24, step: 2 } },
      { label: "加载中", key: "loading", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "退格整体删除", key: "whole", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场实际传给组件的 prefix */
const playgroundPrefix = computed(() => (state.value.prefix === "both" ? ["@", "#"] : state.value.prefix));
/** 演练场的选项：# 前缀给话题，其余给成员 */
const playgroundPrefixUsed = shallowRef("@");
const playgroundOptions = computed(() => (playgroundPrefixUsed.value === "#" ? topics : members));

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const mentionCode = computed(() => {
  const s = state.value;
  return [
    "<RebornMention",
    "  v-model=\"value\"",
    "  :options=\"options\"",
    `  type="${s.type}"`,
    s.prefix === "both" ? "  :prefix=\"['@', '#']\"" : `  prefix="${s.prefix}"`,
    `  placement="${s.placement}"`,
    `  :show-arrow="${s.showArrow}"`,
    `  :offset="${s.offset}"`,
    `  :whole="${s.whole}"`,
    `  :loading="${s.loading}"`,
    "  placeholder=\"输入 @ 提及成员\"",
    "  @search=\"onSearch\"",
    "  @select=\"onSelect\"",
    "/>",
  ].join("\n");
});

// ─── 场景演示状态 ─────────────────────────────────────────────────

const basicValue = shallowRef("");
const multiValue = shallowRef("");
/** 多前缀一节：按前缀切换选项 */
const multiPrefix = shallowRef("@");
const multiOptions = computed(() => (multiPrefix.value === "#" ? topics : members));

/** 远程搜索：模拟接口延迟 */
const remoteValue = shallowRef("");
const remoteLoading = shallowRef(false);
const remoteOptions = shallowRef<MentionOption[]>([]);
let remoteTimer: ReturnType<typeof setTimeout> | undefined;

function onRemoteSearch(pattern: string) {
  remoteLoading.value = true;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(() => {
    remoteOptions.value = Array.from({ length: 5 }, (_, i) => {
      const name = `${pattern || "用户"}${i + 1}`;
      return { value: name, label: name };
    });
    remoteLoading.value = false;
  }, 600);
}

/** 整体删除一节 */
const wholeValue = shallowRef("请 @张伟 和 @李娜 一起看下");
const wholeLog = shallowRef("尚未删除");
const customWholeValue = shallowRef("负责人：@任意名字 ");
const customWholeLog = shallowRef("尚未删除");

/** 自定义选项一节 */
const slotValue = shallowRef("");

/** 面板位置一节 */
const placeValue = shallowRef("");
const arrowValue = shallowRef("");
/** 卸载时取消模拟远程请求，避免回写已卸载实例。 */
onBeforeUnmount(() => clearTimeout(remoteTimer));
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="mentionCode" component-name="RebornMention"
      title="交互演练场" description="调节上方参数后在输入框里输入 @（或 #），查看下拉面板的位置、箭头与整体删除行为。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full max-w-md flex-col gap-3">
        <RebornMention
          v-model="playgroundValue" :options="playgroundOptions" :type="state.type" :prefix="playgroundPrefix"
          :placement="state.placement" :show-arrow="state.showArrow" :offset="state.offset" :whole="state.whole"
          :loading="state.loading" :rows="3" placeholder="输入 @ 提及成员"
          @search="(_, prefix) => (playgroundPrefixUsed = prefix)"
          @select="(option, prefix) => (lastSelect = `select：${prefix}${option.value}`)"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          {{ lastSelect }}；当前值：{{ playgroundValue || '（空）' }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        输入 <code>@</code> 唤起候选列表，检索词按选项文本筛选；选中后插入 <code>@选项值</code> 并补一个空格。上下键移动、Enter 选中、Esc 收起，禁用项会被跳过。
      </template>
      <DemoBlock layout="stack">
        <RebornMention v-model="basicValue" :options="members" placeholder="输入 @ 试试" class="max-w-md" />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          v-model：{{ basicValue || '（空）' }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多个前缀">
      <template #description>
        <code>prefix</code> 传数组时任一字符都能触发；<code>search</code> 事件的第二个参数是命中的前缀，据此切换选项来源。
      </template>
      <DemoBlock layout="stack">
        <RebornMention
          v-model="multiValue" :options="multiOptions" :prefix="['@', '#']" placeholder="@ 提及成员，# 关联话题"
          class="max-w-md" @search="(_, prefix) => (multiPrefix = prefix)"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多行文本">
      <template #description>
        <code>type="textarea"</code> 等输入框属性原样透传给 RebornInput；多行时面板锚定在前缀所在的那一行，跟着前缀走，而不是固定在输入框下方。
      </template>
      <DemoBlock layout="stack">
        <RebornMention
          :options="members" type="textarea" :rows="4" placeholder="换几行再输入 @，面板会出现在那一行下面"
          class="max-w-md"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="远程搜索与加载">
      <template #description>
        <code>:filter-option="false"</code> 关闭本地筛选，在 <code>search</code> 回调里请求数据并回填 <code>options</code>；请求期间开 <code>loading</code>，面板即使没有选项也会展开。
      </template>
      <DemoBlock layout="stack">
        <RebornMention
          v-model="remoteValue" :options="remoteOptions" :filter-option="false" :loading="remoteLoading"
          placeholder="输入 @ 后接任意文字，模拟 600ms 请求" class="max-w-md" @search="onRemoteSearch"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="整体删除">
      <template #description>
        <code>whole</code> 开启后，光标紧跟在「@选项值 + 空格」之后按退格，整段一次删掉并派发 <code>whole-remove</code>；它只认 <code>options</code> 里存在的值，其他规则用 <code>check-is-whole</code> 自己判断。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col gap-2">
          <RebornMention
            v-model="wholeValue" :options="members" whole
            @whole-remove="(pattern, prefix) => (wholeLog = `whole-remove：${prefix}${pattern}`)"
          />
          <DemoNote tone="dimmed" class="font-mono text-xs">
            whole · {{ wholeLog }}
          </DemoNote>
        </div>
        <div class="flex flex-col gap-2">
          <RebornMention
            v-model="customWholeValue" :options="members" :check-is-whole="(pattern) => pattern.length > 0"
            @whole-remove="(pattern, prefix) => (customWholeLog = `whole-remove：${prefix}${pattern}`)"
          />
          <DemoNote tone="dimmed" class="font-mono text-xs">
            check-is-whole · {{ customWholeLog }}
          </DemoNote>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        把光标放到「@张伟 」的空格后面按退格试试；右边的「@任意名字」不在 options 里，靠 check-is-whole 一样能整体删除。
      </DemoNote>
    </DemoSection>

    <DemoSection title="自定义选项与面板">
      <template #description>
        <code>#label</code> 作用域插槽拿到 <code>item</code> / <code>index</code> 自定义每一行；<code>#header</code> / <code>#footer</code> 固定在列表上下方，列表滚动时不动。
      </template>
      <DemoBlock layout="stack">
        <RebornMention v-model="slotValue" :options="members" placeholder="输入 @ 查看自定义选项" class="max-w-md">
          <template #label="{ item }">
            <span class="flex w-full items-center gap-2">
              <span class="bg-brand-1 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-sm">
                {{ String(item.label).slice(0, 1) }}
              </span>
              <span class="truncate">{{ item.label }}</span>
              <span class="ml-auto shrink-0 text-sm text-gray-5">{{ item.role }}</span>
            </span>
          </template>
          <template #header>
            项目成员
          </template>
          <template #footer>
            共 {{ members.length }} 人，灰色为已离职
          </template>
        </RebornMention>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="面板位置">
      <template #description>
        <code>placement="top"</code> 向上展开，放不下时自动翻到另一侧；<code>show-arrow</code> 加一个指向前缀的箭头，<code>offset</code> 在默认间距之上再拉开距离。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col gap-2">
          <RebornMention v-model="placeValue" :options="members" placement="top" placeholder="向上展开" />
          <span class="font-mono text-xs text-gray-6">placement="top"</span>
        </div>
        <div class="flex flex-col gap-2">
          <RebornMention v-model="arrowValue" :options="members" show-arrow :offset="4" placeholder="带箭头" />
          <span class="font-mono text-xs text-gray-6">show-arrow :offset="4"</span>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
