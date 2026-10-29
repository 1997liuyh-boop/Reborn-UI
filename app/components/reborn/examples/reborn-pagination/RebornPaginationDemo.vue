<script setup lang="ts">
import { DemoBlock, DemoItem, DemoNote, DemoSection, Icon, Playground } from '#components';
import { computed, ref, shallowRef } from 'vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornInput from '~/components/reborn/ui/reborn-input/RebornInput.vue';
import { paginationColors, paginationSizes } from "~/components/reborn/ui/reborn-pagination/reborn-pagination.config";
import RebornPagination from '~/components/reborn/ui/reborn-pagination/RebornPagination.vue';
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  page: 1,
  total: 100,
  pageSize: 10,
  pagerCount: 3,
  layout: "total,prev, pager, next,jumper,sizes",
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
        component: "input-number" as const,
        defaultValue: 100,
        props: { min: 0, max: 1000, step: 10 },
      },
      {
        label: "每页条数",
        key: "pageSize",
        component: "input-number" as const,
        defaultValue: 10,
        props: { min: 1, max: 100, step: 5 },
      },
      {
        // pagerCount 不小于 3 即可，奇偶均可；组件会把过小的值钳到 3
        label: "页码按钮数",
        key: "pagerCount",
        component: "input-number" as const,
        defaultValue: 3,
        props: { min: 3, max: 21, step: 1 },
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
        label: "语义色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: paginationColors.map((color) => ({ label: color, value: color })) },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: paginationSizes.map((s) => ({ label: s, value: s })) },
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
  const props: string[] = ['v-model="page"', `:total="${s.total}"`, 'v-model:page-size="pageSize"'];

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
const lastPage = shallowRef(0);
/** 最近一次 size-change 的每页条数 */
const lastSize = shallowRef(0);

function handleCurrentChange(page: number) {
  lastPage.value = page;
}

function handleSizeChange(size: number) {
  lastSize.value = size;
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 默认用法 */
const basicPage = shallowRef(1);
/** 背景模式 */
const bgPage = shallowRef(1);
/** 简洁模式 */
const simplePage = shallowRef(2);
/** 布局组合 */
const layoutPage = shallowRef(3);
const layoutSize = shallowRef(10);
/** 页码折叠 */
const foldPage = shallowRef(7);
/** 单页隐藏：total 小于 pageSize 时自动隐藏 */
const singleTotal = shallowRef(5);
const singlePage = shallowRef(1);
/** 插槽自定义 */
const slotPagerPage = shallowRef(3);
const slotArrowPage = shallowRef(3);
const slotExtraPage = shallowRef(3);
/** 自定义 #sizes 插槽：可选条数与插槽里的下拉选项同源 */
const slotPageSizes = [5, 10, 20];
const slotPageSizeOptions = slotPageSizes.map(value => ({ label: `${value} 条`, value }));
const layoutPageSizes = [5, 10, 20, 50];
const slotSize = shallowRef(10);

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
      title="交互演练场" description="调节上方参数实时查看反馈；总页数由 total 与 page-size 推导，pagerCount 控制页码折叠。"
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
          v-model="state.page" v-model:page-size="state.pageSize" :total="state.total"
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

    <DemoSection title="基础用法" description="传入 total 与 page-size，v-model 绑定当前页码，切换时触发 current-change。">
      <DemoBlock layout="stack" align="start">
        <RebornPagination v-model="basicPage" :total="50" @current-change="handleCurrentChange" />
        <DemoNote tone="dimmed">当前页：<code>{{ basicPage }}</code></DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="按钮背景与语义色：background 与 color">
      <template #description>
        <code>color</code> 控制激活页码的语义色；开启 <code>background</code> 时使用按钮 <code>soft</code> 配色，关闭时只显示对应文字色。未激活项保留灰阶。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem v-for="color in paginationColors" :key="color" :label="color" mono>
          <div class="flex flex-col items-start gap-3">
            <RebornPagination v-model="bgPage" :total="60" :color="color" background />
            <RebornPagination v-model="bgPage" :total="60" :color="color" />
          </div>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="简洁模式：simple 与翻页文字">
      <template #description>
        <code>simple</code> 忽略 <code>layout</code>，依次显示上一页、当前页输入框、斜杠、总页数和下一页，间距 8px；输入框固定宽 40px，使用 <code>outlined</code> 与 <code>sm</code>，回车或失焦跳页。<code>prev-text</code> 与 <code>next-text</code> 可把箭头换成文字。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="simple（默认箭头）" mono>
          <RebornPagination v-model="simplePage" :total="80" simple />
        </DemoItem>

        <DemoItem label="simple + prev-text / next-text" mono>
          <RebornPagination v-model="simplePage" :total="80" simple prev-text="上一页" next-text="下一页" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="布局组合：layout 与每页条数" description="layout 用逗号组合 prev / pager / next / jumper / total / sizes，未知 token 会被忽略。">
      <DemoBlock layout="stack" align="start">
        <RebornPagination
          v-model="layoutPage" v-model:page-size="layoutSize" :total="200" :page-sizes="layoutPageSizes"
          layout="prev, pager, next, jumper, total, sizes" @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
        <DemoNote tone="dimmed">
          当前页 <code>{{ layoutPage }}</code> · 每页 <code>{{ layoutSize }}</code> 条
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="页码折叠：pager-count" description="pagerCount 控制页码按钮数量（不小于 3 的整数，奇偶均可，过小的值钳到 3），超长时自动折叠并显示省略号，点击省略号向对应方向跳页。">
      <DemoBlock layout="row" align="center">
        <RebornPagination v-model="foldPage" :total="200" :pager-count="9" background />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="单页隐藏：hide-on-single-page" description="hideOnSinglePage 在总页数不超过 1 时整组件不渲染，点击按钮切换数据量观察显隐。">
      <DemoBlock layout="stack" align="start">
        <div class="flex flex-wrap items-center gap-6">
          <RebornPagination v-model="singlePage" :total="singleTotal" hide-on-single-page />
          <RebornButton size="sm" variant="soft" color="primary" @click="toggleSingleTotal">
            {{ singleTotal === 5 ? "切换为 100 条" : "切换为 5 条" }}
          </RebornButton>
        </div>
        <DemoNote tone="dimmed">当前 total：<code>{{ singleTotal }}</code></DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="插槽定制：接管翻页、页码与附加区" description="prev / next / pager-item / jumper / total / sizes 六个插槽均可完全接管默认内容。">
      <DemoBlock layout="stack" class="gap-6">
        <DemoItem>
          <template #label>
            圆形页码 · <code>#pager-item</code>
          </template>
          <RebornPagination v-model="slotPagerPage" :total="50" background>
            <!-- 两态都用 circle 变体、只换配色：形状不变，RebornButton 的 transition-all 就不会把圆角 / 内边距过渡成椭圆 -->
            <template #pager-item="{ page, active, disabled, select }">
              <RebornButton
                circle variant="filled" :color="active ? 'primary' : 'neutral'" size="sm" :disabled="disabled"
                :class="active ? undefined : 'bg-gray-2 text-gray-6 hover:bg-gray-3'" @click="select"
              >
                {{ page }}
              </RebornButton>
            </template>
          </RebornPagination>
        </DemoItem>

        <DemoItem>
          <template #label>
            自定义箭头 · <code>#prev</code> / <code>#next</code>
          </template>
          <RebornPagination v-model="slotArrowPage" :total="50">
            <template #prev="{ prev, disabled }">
              <RebornButton color="error" circle variant="filled" size="sm" :disabled="disabled" @click="prev">
                <Icon name="lucide:arrow-left" />
              </RebornButton>
            </template>
            <template #next="{ next, disabled }">
              <RebornButton color="error" circle variant="filled" size="sm" :disabled="disabled" @click="next">
                <Icon name="lucide:arrow-right" />
              </RebornButton>
            </template>
          </RebornPagination>
        </DemoItem>

        <DemoItem>
          <template #label>
            自定义 <code>#jumper</code> / <code>#total</code> / <code>#sizes</code>
          </template>
          <RebornPagination
            v-model="slotExtraPage" v-model:page-size="slotSize" :total="120" :page-sizes="slotPageSizes"
            layout="total, sizes, prev, pager, next, jumper"
          >
            <template #total="{ total }">
              <span class="text-primary text-xs font-medium">共 {{ total }} 条数据</span>
            </template>
            <template #sizes="{ pageSize, change }">
              <RebornSelect
                :model-value="pageSize" :options="slotPageSizeOptions"
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
        </DemoItem>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
