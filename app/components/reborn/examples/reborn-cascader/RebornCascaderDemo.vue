<script setup lang="ts">
import type { CascaderOption } from "~/components/reborn/ui/reborn-cascader/reborn-cascader.config";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, watch } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import {
  cascaderSizes,
  cascaderVariants,
} from "~/components/reborn/ui/reborn-cascader/reborn-cascader.config";
import RebornCascader from "~/components/reborn/ui/reborn-cascader/RebornCascader.vue";
import RebornCascaderPanel from "~/components/reborn/ui/reborn-cascader/RebornCascaderPanel.vue";

/** 三级地区数据，全部 demo 共用 */
const options: CascaderOption[] = [
  {
    label: "浙江省",
    value: "zhejiang",
    children: [
      {
        label: "杭州市",
        value: "hangzhou",
        children: [
          { label: "西湖区", value: "xihu" },
          { label: "余杭区", value: "yuhang" },
          { label: "滨江区", value: "binjiang" },
        ],
      },
      {
        label: "宁波市",
        value: "ningbo",
        children: [
          { label: "海曙区", value: "haishu" },
          { label: "江北区", value: "jiangbei" },
        ],
      },
      {
        label: "温州市",
        value: "wenzhou",
        children: [
          { label: "鹿城区", value: "lucheng" },
          { label: "瓯海区", value: "ouhai", disabled: true },
        ],
      },
    ],
  },
  {
    label: "江苏省",
    value: "jiangsu",
    children: [
      {
        label: "南京市",
        value: "nanjing",
        children: [
          { label: "玄武区", value: "xuanwu" },
          { label: "秦淮区", value: "qinhuai" },
        ],
      },
      {
        label: "苏州市",
        value: "suzhou",
        children: [
          { label: "姑苏区", value: "gusu" },
          { label: "吴中区", value: "wuzhong" },
        ],
      },
    ],
  },
  {
    label: "上海市",
    value: "shanghai",
    children: [
      { label: "黄浦区", value: "huangpu" },
      { label: "浦东新区", value: "pudong" },
      { label: "徐汇区", value: "xuhui" },
    ],
  },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  multiple: false,
  pathMode: false,
  checkStrictly: false,
  expandTrigger: "click",
  expandChild: false,
  allowSearch: false,
  allowClear: true,
  maxTagCount: 0,
  size: "md",
  variant: "outlined",
  disabled: false,
  error: false,
  loading: false,
};

const state = ref<Record<string, any>>({ ...defaultState });
const playgroundValue = ref<any>(undefined);

// 值的形态由 multiple / path-mode 共同决定，切换后旧值必然对不上，直接清空
watch(
  () => [state.value.multiple, state.value.pathMode],
  () => {
    playgroundValue.value = state.value.multiple ? [] : undefined;
  },
);

function resetState() {
  state.value = { ...defaultState };
  playgroundValue.value = undefined;
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "选择模式",
    children: [
      { label: "多选（multiple）", key: "multiple", component: "checkbox" as const, defaultValue: false },
      { label: "绑定值为路径（path-mode）", key: "pathMode", component: "checkbox" as const, defaultValue: false },
      { label: "严格选择（check-strictly）", key: "checkStrictly", component: "checkbox" as const, defaultValue: false },
      {
        label: "展开方式（expand-trigger）",
        key: "expandTrigger",
        component: "select" as const,
        defaultValue: "click",
        props: {
          options: [
            { label: "点击 click", value: "click" },
            { label: "悬停 hover", value: "hover" },
          ],
        },
      },
      { label: "自动展开子菜单（expand-child）", key: "expandChild", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "输入与标签",
    children: [
      { label: "允许搜索（allow-search）", key: "allowSearch", component: "checkbox" as const, defaultValue: false },
      { label: "允许清除（allow-clear）", key: "allowClear", component: "checkbox" as const, defaultValue: true },
      {
        label: "最多显示标签数（max-tag-count，0 为不限制）",
        key: "maxTagCount",
        component: "input-number" as const,
        defaultValue: 0,
        props: { min: 0, max: 6 },
      },
    ],
  },
  {
    title: "外观与状态",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: cascaderSizes.map(s => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "形态变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: { options: cascaderVariants.map(v => ({ label: v, value: v })) },
      },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "错误状态", key: "error", component: "checkbox" as const, defaultValue: false },
      { label: "加载状态", key: "loading", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角的传参明细里补上 options 与占位符 */
const codeExtras = [`  :options="options"`, `  placeholder="请选择地区"`];

/** 演练场当前选中值的可读回显 */
const playgroundText = computed(() => {
  const value = playgroundValue.value;
  if (value === undefined || (Array.isArray(value) && value.length === 0)) return "未选择";
  return JSON.stringify(value);
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 基础用法：值模式只存最末一级的值 */
const basicValue = ref<any>("jiangbei");
/** 基础用法：路径模式存整条路径 */
const pathValue = ref<any>(["zhejiang", "ningbo", "jiangbei"]);
/** 最近一次 change 的回显 */
const lastChange = ref("");

/** 展开方式：悬停展开 */
const hoverValue = ref<any>(undefined);
/** 自动展开到最深一级 */
const expandChildValue = ref<any>(undefined);
/** 可选任意层级 */
const strictValue = ref<any>("hangzhou");

/** 多选：父子关联，绑定值落在叶子上 */
const multipleValue = ref<any[]>(["xihu", "yuhang"]);
/** 多选：父子不关联，各级独立勾选 */
const multipleStrictValue = ref<any[]>(["hangzhou", "xihu"]);

/** 搜索：整条路径参与匹配 */
const searchValue = ref<any>(undefined);
/** 搜索：只展示该级文本 */
const searchLabelOnlyValue = ref<any>(undefined);
/** 搜索关键词，受控展示 */
const keyword = ref("");

/** 异步加载的数据源，done 回传的子节点会写回这里的选项对象 */
const lazyOptions = ref<CascaderOption[]>([
  { label: "浙江省", value: "zhejiang", isLeaf: false },
  { label: "江苏省", value: "jiangsu", isLeaf: false },
]);
const lazyValue = ref<any>(undefined);

/** 模拟请求：第二级返回城市，第三级返回区县 */
function loadMore(option: CascaderOption, done: (children?: CascaderOption[]) => void) {
  setTimeout(() => {
    if (option.value === "zhejiang") {
      done([
        { label: "杭州市", value: "hangzhou", isLeaf: false },
        { label: "宁波市", value: "ningbo", isLeaf: false },
      ]);
      return;
    }
    if (option.value === "jiangsu") {
      done([{ label: "南京市", value: "nanjing", isLeaf: false }]);
      return;
    }
    done([
      { label: `${option.label}·城区`, value: `${option.value}-city`, isLeaf: true },
      { label: `${option.label}·郊区`, value: `${option.value}-suburb`, isLeaf: true },
    ]);
  }, 600);
}

/** 独立面板的绑定值 */
const panelValue = ref<any>("xihu");

function onChange(value: any) {
  lastChange.value = value === undefined ? "未选择" : JSON.stringify(value);
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code-extras="codeExtras" component-name="RebornCascader"
      title="交互演练场" description="调节左侧参数，实时查看级联选择器的表现。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full max-w-[360px] flex-col gap-3">
        <RebornCascader
          v-model="playgroundValue" :options="options" :multiple="state.multiple"
          :path-mode="state.pathMode" :check-strictly="state.checkStrictly"
          :expand-trigger="state.expandTrigger" :expand-child="state.expandChild"
          :allow-search="state.allowSearch" :allow-clear="state.allowClear"
          :max-tag-count="state.maxTagCount" :size="state.size" :variant="state.variant"
          :disabled="state.disabled" :error="state.error" :loading="state.loading"
          placeholder="请选择地区"
        />
        <DemoNote tone="dimmed">当前值：{{ playgroundText }}</DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="基础用法"
      description="默认绑定最末一级选项的值；开启 path-mode 后绑定值变成从根到叶的整条路径。"
    >
      <DemoBlock layout="stack">
        <RebornCascader
          v-model="basicValue" :options="options" placeholder="请选择地区" allow-clear
          @change="onChange"
        />
        <RebornCascader
          v-model="pathValue" :options="options" path-mode placeholder="路径模式" allow-clear
        />
        <DemoNote tone="dimmed">
          值模式：{{ JSON.stringify(basicValue) }} · 路径模式：{{ JSON.stringify(pathValue) }}
          {{ lastChange ? ` · 最近一次 change：${lastChange}` : "" }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="展开方式与可选层级"
      description="expand-trigger 决定下一级是点开还是悬停展开；check-strictly 放开「只能选叶子」的限制，非叶子节点点一下即选中、同时继续展开。"
    >
      <DemoBlock layout="stack">
        <RebornCascader
          v-model="hoverValue" :options="options" expand-trigger="hover" placeholder="悬停展开下一级"
        />
        <RebornCascader
          v-model="strictValue" :options="options" check-strictly placeholder="任意层级都可选中"
        />
        <RebornCascader
          v-model="expandChildValue" :options="options" expand-child placeholder="自动展开到最深一级"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="多选与父子关联"
      description="多选在选项前渲染 RebornCheckbox。默认父子关联：勾父节点会写入它名下全部叶子，只勾一部分时父节点显示半选；开启 check-strictly 后各级独立勾选，也就不再有半选。"
    >
      <DemoBlock layout="stack">
        <RebornCascader
          v-model="multipleValue" :options="options" multiple allow-clear placeholder="父子关联"
        />
        <RebornCascader
          v-model="multipleStrictValue" :options="options" multiple check-strictly allow-clear
          placeholder="父子不关联"
        />
        <RebornCascader
          v-model="multipleValue" :options="options" multiple :max-tag-count="2"
          placeholder="最多显示 2 个标签"
        />
        <DemoNote tone="dimmed">
          关联模式：{{ JSON.stringify(multipleValue) }} · 严格模式：{{ JSON.stringify(multipleStrictValue) }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="搜索"
      description="allow-search 把触发器变成输入框，命中的选项拍平成一列；多选默认已开启。search-option-only-label 只显示选项自身文本，不显示整条路径。"
    >
      <DemoBlock layout="stack">
        <RebornCascader
          v-model="searchValue" v-model:input-value="keyword" :options="options" allow-search
          allow-clear placeholder="输入区县名试试"
        />
        <RebornCascader
          v-model="searchLabelOnlyValue" :options="options" allow-search search-option-only-label
          placeholder="搜索结果只显示该级文本"
        />
        <DemoNote tone="dimmed">当前关键词：{{ keyword || "（空）" }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="异步加载"
      description="传入 load-more 即开启懒加载：展开非叶子节点时调用它，done 回传的子节点会写回该选项。数据未标 isLeaf 时组件无从判断能否继续展开，必须自己标。"
    >
      <DemoBlock layout="stack">
        <RebornCascader
          v-model="lazyValue" :options="lazyOptions" :load-more="loadMore" allow-clear
          placeholder="展开后异步取下一级"
        />
        <DemoNote tone="dimmed">当前值：{{ lazyValue ?? "未选择" }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="尺寸、形态与状态"
      description="尺寸与形态和 reborn-select 共用同一套档位；error 画红框，disabled 锁交互，loading 把箭头换成转圈并把面板改成加载态。"
    >
      <DemoBlock layout="stack">
        <div v-for="s in cascaderSizes" :key="s" class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">{{ s }}</span>
          <RebornCascader :options="options" :size="s" placeholder="请选择地区" />
        </div>
        <div v-for="v in cascaderVariants" :key="v" class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">{{ v }}</span>
          <RebornCascader :options="options" :variant="v" placeholder="请选择地区" />
        </div>
        <RebornCascader :options="options" error placeholder="错误状态" />
        <RebornCascader :options="options" disabled placeholder="禁用状态" />
        <RebornCascader :options="options" loading placeholder="加载中" />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="独立面板"
      description="RebornCascaderPanel 就是下拉里的那块面板，可以直接放进页面当常驻控件用；bordered 决定它自带不自带外框。"
    >
      <DemoBlock layout="stack">
        <RebornCascaderPanel v-model="panelValue" :options="options" />
        <DemoNote tone="dimmed">当前值：{{ panelValue ?? "未选择" }}</DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
