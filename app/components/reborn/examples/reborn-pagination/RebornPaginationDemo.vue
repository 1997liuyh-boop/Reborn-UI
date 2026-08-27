<script setup lang="ts">
import { paginationColors, paginationSizes } from "~/components/reborn/ui/reborn-pagination/reborn-pagination.config";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  page: 1,
  total: 100,
  pageSize: 10,
  pagerCount: 3,
  layout: "prev, pager, next,jumper,total,sizes",
  pageSizes: "10,20,50,100",
  size: "md",
  color: "primary",
  background: false,
  disabled: false,
  simple: false,
  hideOnSinglePage: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** pageSizes 由逗号分隔字符串解析为数字数组 */
const parsedPageSizes = computed(() =>
  String(state.value.pageSizes)
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n) && n > 0),
);

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "数据规模",
    children: [
      {
        label: "数据总数",
        key: "total",
        component: "slider" as const,
        defaultValue: 100,
        props: { min: 0, max: 200, step: 10 },
      },
      {
        label: "每页条数",
        key: "pageSize",
        component: "slider" as const,
        defaultValue: 3,
        props: { min: 5, max: 50, step: 1 },
      },
      {
        label: "页码按钮数",
        key: "pagerCount",
        component: "slider" as const,
        defaultValue: 3,
        props: { min: 2, max: 5, step: 1 },
      },
      {
        label: "布局组合",
        key: "layout",
        component: "input" as const,
        defaultValue: "prev, pager, next,jumper,total,sizes",
      },
      {
        label: "每页条数选项",
        key: "pageSizes",
        component: "input" as const,
        defaultValue: "10,20,50,100",
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
        props: { options: paginationSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "主题颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: paginationColors.map((c) => ({ label: c, value: c })) },
      },
      { label: "页码背景", key: "background", component: "checkbox" as const, defaultValue: false },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "简洁模式", key: "simple", component: "checkbox" as const, defaultValue: false },
      { label: "单页隐藏", key: "hideOnSinglePage", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值），布尔项带值输出保证可直接拷贝 */
const paginationCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="page"', `:total="${s.total}"`, `:page-size="${s.pageSize}"`];

  props.push(`layout="${s.layout}"`);
  props.push(`:page-sizes="[${parsedPageSizes.value.join(", ")}]"`);
  props.push(`size="${s.size}"`);
  props.push(`color="${s.color}"`);
  props.push(`:background="${s.background}"`);
  props.push(`:disabled="${s.disabled}"`);
  props.push(`:simple="${s.simple}"`);
  props.push(`:hide-on-single-page="${s.hideOnSinglePage}"`);
  props.push(`:pager-count="${s.pagerCount}"`);

  return `<RebornPagination\n  ${props.join("\n  ")}\n  @current-change="handleCurrentChange"\n  @size-change="handleSizeChange"\n/>`;
});

/** 最近一次 current-change 的页码 */
const lastPage = ref(0);
/** 最近一次 size-change 的每页条数 */
const lastSize = ref(0);

function handleCurrentChange(page: number) {
  lastPage.value = page;
}

function handleSizeChange(size: number) {
  lastSize.value = size;
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 默认用法 */
const basicPage = ref(1);
/** 主题颜色 */
const colorPage = ref(1);
/** 背景模式 */
const bgPage = ref(1);
/** 简洁模式 */
const simplePage = ref(2);
/** 布局组合 */
const layoutPage = ref(3);
const layoutSize = ref(10);
/** 页码折叠 */
const foldPage = ref(7);
/** 单页隐藏：total 小于 pageSize 时自动隐藏 */
const singleTotal = ref(5);
const singlePage = ref(1);
/** 插槽自定义 */
const slotPage = ref(3);
const slotSize = ref(10);

/** 切换单页隐藏演示的 total */
function toggleSingleTotal() {
  singleTotal.value = singleTotal.value === 5 ? 100 : 5;
}

/** 自定义 jumper：从输入框读取页码并跳转 */
function jumpFromInput(e: Event, jump: (page: number) => void) {
  const target = e.target as HTMLInputElement;
  jump(Number(target.value));
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="paginationCode" component-name="RebornPagination"
      title="交互演练场" description="调节左侧参数实时查看反馈；总页数由 total 与 page-size 推导，pagerCount 控制页码折叠。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-4">
        <RebornPagination
          v-model="state.page" :total="state.total" :page-size="state.pageSize"
          :pager-count="state.pagerCount" :layout="state.layout" :page-sizes="parsedPageSizes" :size="state.size"
          :color="state.color" :background="state.background" :disabled="state.disabled" :simple="state.simple"
          :hide-on-single-page="state.hideOnSinglePage" @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />

        <DemoNote tone="dimmed">
          当前页：<code>{{ state.page }}</code>
          <template v-if="lastPage">
            · 最近 <code>current-change</code>：<code>{{ lastPage }}</code>
          </template>
          <template v-if="lastSize">
            · 最近 <code>size-change</code>：<code>{{ lastSize }}</code>
          </template>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="默认用法" description="传入 total 与 page-size，v-model 绑定当前页码，切换时触发 current-change。">
      <DemoBlock layout="row" align="center">
        <RebornPagination v-model="basicPage" :total="50" @current-change="handleCurrentChange" />
      </DemoBlock>
      <DemoNote tone="dimmed">当前页：<code>{{ basicPage }}</code></DemoNote>
    </DemoSection>

    <DemoSection title="主题颜色" description="color 控制激活页码与悬停高亮，取值与按钮/徽章同一套语义色。">
      <DemoBlock layout="stack" align="start" class="gap-4">
        <RebornPagination
          v-for="c in paginationColors" :key="c" v-model="colorPage" :total="50" :color="c"
          background
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="背景模式" description="background 为页码按钮添加浅色背景，激活页码使用当前主题色高亮。">
      <DemoBlock layout="row" align="center">
        <RebornPagination v-model="bgPage" :total="60" background />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="简洁模式" description="simple 忽略 layout，只保留上一页 / 当前页-总页数 / 下一页；prev-text 与 next-text 可把箭头换成文字。">
      <DemoBlock layout="row" align="center" class="gap-6">
        <RebornPagination v-model="simplePage" :total="80" simple />
        <RebornPagination v-model="simplePage" :total="80" simple prev-text="上一页" next-text="下一页" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="布局组合" description="layout 用逗号组合 prev / pager / next / jumper / total / sizes，未知 token 会被忽略。">
      <DemoBlock layout="stack" align="center" class="gap-4">
        <RebornPagination
          v-model="layoutPage" v-model:page-size="layoutSize" :total="200" :page-sizes="[5, 10, 20, 50]"
          layout="prev, pager, next, jumper, total, sizes" @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
        <DemoNote tone="dimmed">
          当前页 <code>{{ layoutPage }}</code> · 每页 <code>{{ layoutSize }}</code> 条
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="页码折叠" description="pagerCount 控制页码按钮数量（需为不小于 5 的奇数），超长时自动折叠并显示省略号，点击省略号向对应方向跳页。">
      <DemoBlock layout="row" align="center">
        <RebornPagination v-model="foldPage" :total="200" :pager-count="9" background />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="单页隐藏" description="hideOnSinglePage 在总页数不超过 1 时整组件不渲染，点击按钮切换数据量观察显隐。">
      <DemoBlock layout="row" align="center" class="gap-6">
        <RebornPagination v-model="singlePage" :total="singleTotal" hide-on-single-page />
        <RebornButton size="sm" variant="soft" color="primary" @click="toggleSingleTotal">
          {{ singleTotal === 5 ? "切换为 100 条" : "切换为 5 条" }}
        </RebornButton>
      </DemoBlock>
      <DemoNote tone="dimmed">当前 total：<code>{{ singleTotal }}</code></DemoNote>
    </DemoSection>

    <DemoSection title="插槽自定义" description="prev / next / pager-item / jumper / total / sizes 六个插槽均可完全接管默认内容。">
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">圆形页码 · <code>#pager-item</code></span>
          <RebornPagination v-model="slotPage" :total="50" background>
            <template #pager-item="{ page, active, disabled }">
              <RebornButton
                :variant="active ? 'solid' : 'circle'" :color="active ? 'primary' : 'neutral'" size="sm"
                :disabled="disabled" @click="slotPage = page"
              >
                {{ page }}
              </RebornButton>
            </template>
          </RebornPagination>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">自定义箭头 · <code>#prev</code> / <code>#next</code></span>
          <RebornPagination v-model="slotPage" :total="50">
            <template #prev="{ prev, disabled }">
              <RebornButton color="error" variant="circle" size="sm" :disabled="disabled" @click="prev">
                <Icon name="lucide:arrow-left" />
              </RebornButton>
            </template>
            <template #next="{ next, disabled }">
              <RebornButton color="error" variant="circle" size="sm" :disabled="disabled" @click="next">
                <Icon name="lucide:arrow-right" />
              </RebornButton>
            </template>
          </RebornPagination>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            自定义 <code>#jumper</code> / <code>#total</code> / <code>#sizes</code>
          </span>
          <RebornPagination
            v-model="slotPage" v-model:page-size="slotSize" :total="120" :page-sizes="[5, 10, 20]"
            layout="total, sizes, prev, pager, next, jumper"
          >
            <template #total="{ total }">
              <span class="text-primary text-xs font-medium">共 {{ total }} 条数据</span>
            </template>
            <template #sizes="{ pageSize, pageSizes, change }">
              <RebornSelect
                :model-value="pageSize" :options="pageSizes.map((n) => ({ label: `${n } 条/页`, value: n }))"
                size="sm" class="w-[110px]" :clearable="false" @update:model-value="change"
              />
            </template>
            <template #jumper="{ current, totalPages, jump }">
              <RebornInput
                :model-value="String(current)" type="number" size="sm" class="!w-[56px]"
                @keyup.enter="jumpFromInput($event, jump)"
              />
              <span class="text-dimmed text-xs">/ {{ totalPages }} 页</span>
            </template>
          </RebornPagination>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>