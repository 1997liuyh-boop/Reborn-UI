<script lang="ts" setup>
import {
  paginationColors,
  paginationModes,
  paginationSizes,
} from "~/components/reborn/ui/reborn-pagination/reborn-pagination.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  page: 1,
  total: 100,
  pageSize: 10,
  mode: "multi",
  color: "primary",
  size: "md",
  background: true,
  disabled: false,
});

/** 演练场控制面板配置 */
const controls = [
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
        defaultValue: 10,
        props: { min: 5, max: 50, step: 5 },
      },
      {
        label: "显示模式",
        key: "mode",
        component: "select" as const,
        defaultValue: "multi",
        props: {
          options: paginationModes.map((m) => ({
            label: m === "multi" ? "multi 页码列表" : "simple 简易",
            value: m,
          })),
        },
      },
    ],
  },
  {
    title: "外观与状态",
    children: [
      {
        label: "主题颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: paginationColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: paginationSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      { label: "选项背景", key: "background", component: "checkbox" as const, defaultValue: true },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const paginationCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="page"', `:total="${s.total}"`];

  if (s.pageSize !== 10) props.push(`:page-size="${s.pageSize}"`);
  if (s.mode !== "multi") props.push(`mode="${s.mode}"`);
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.background) props.push("background");
  if (s.disabled) props.push("disabled");

  return `<RebornPagination\n  ${props.join("\n  ")}\n  @change="onChange"\n/>`;
});

/** 最近一次 change 事件的页码，替代 console 输出 */
const lastPage = ref(0);

function handleChange(page: number) {
  lastPage.value = page;
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 文字型翻页按钮 */
const textPage = ref(1);

/** 自定义插槽演示 */
const slotPage = ref(3);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="paginationCode"
      component-name="RebornPagination"
      title="交互演练场"
      description="总页数由 total 与 page-size 推导；simple 模式只保留「当前页 / 总页数」，适合移动端窄屏。"
    >
      <div class="flex w-full flex-col items-center gap-4">
        <RebornPagination
          v-model="state.page"
          :total="state.total"
          :page-size="state.pageSize"
          :mode="state.mode"
          :color="state.color"
          :size="state.size"
          :background="state.background"
          :disabled="state.disabled"
          @change="handleChange"
        />

        <DemoNote tone="dimmed">
          当前页：<code>{{ state.page }}</code>
          <template v-if="lastPage">
            · 最近 <code>change</code> 事件：<code>{{ lastPage }}</code>
          </template>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="空数据兜底"
      description="total 为 0 时强制显示第 1 页，并同时禁用上下页按钮，避免出现「0 / 0」的异常态。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornPagination
          :total="0"
          :color="state.color"
          :size="state.size"
          :background="state.background"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="文字型翻页按钮"
      description="prev-text 与 next-text 会把默认的箭头图标替换为文字，按钮也会随之从正方形变为胶囊。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornPagination
          v-model="textPage"
          :total="50"
          prev-text="上一页"
          next-text="下一页"
          color="success"
          :size="state.size"
          :background="state.background"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自定义插槽"
      description="page / prev / next 三个作用域插槽可完全接管按钮结构，插槽参数提供页码、激活态与跳转方法。"
    >
      <DemoBlock layout="stack">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">圆形页码 · <code>#page</code></span>
          <RebornPagination
            v-model="slotPage"
            :total="50"
            color="primary"
          >
            <template #page="{ page, active, handlePageClick }">
              <RebornButton
                :variant="active ? 'solid' : 'circle'"
                :color="active ? 'primary' : 'neutral'"
                size="sm"
                @click="handlePageClick(page)"
              >
                {{ page }}
              </RebornButton>
            </template>
          </RebornPagination>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            自定义箭头 · <code>#prev</code> / <code>#next</code>
          </span>
          <RebornPagination
            v-model="slotPage"
            :total="50"
            color="error"
          >
            <template #prev="{ prev, disabled }">
              <RebornButton
                color="error"
                variant="circle"
                size="sm"
                :disabled="disabled"
                @click="prev"
              >
                <Icon name="lucide:arrow-left" />
              </RebornButton>
            </template>
            <template #next="{ next, disabled }">
              <RebornButton
                color="error"
                variant="circle"
                size="sm"
                :disabled="disabled"
                @click="next"
              >
                <Icon name="lucide:arrow-right" />
              </RebornButton>
            </template>
          </RebornPagination>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        simple 模式下另有 <code>#simpleContent</code> 插槽，可自定义「当前页 / 总页数」的展示形式。
      </DemoNote>
    </DemoSection>
  </div>
</template>
