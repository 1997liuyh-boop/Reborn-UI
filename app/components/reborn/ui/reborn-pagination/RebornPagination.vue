<script setup lang="ts">
import type { paginationSizes, PaginationUI } from "./reborn-pagination.config";
/**
 * RebornPagination 分页组件 (Web 版)
 * 支持布局组合、简洁模式、页码折叠与完整插槽定制。
 */
import { computed, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-pagination.config";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<PaginationProps>(), {
  total: 0,
  pagerCount: 7,
  layout: "prev, pager, next",
  pageSizes: () => [10, 20, 50, 100],
  size: "md",
  background: false,
  disabled: false,
  hideOnSinglePage: false,
  simple: false,
  prevText: "",
  nextText: "",
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 页码实际变化时触发 */
  (e: "current-change", page: number): void;
  /** 每页条数变化时触发 */
  (e: "size-change", size: number): void;
}>();

/**
 * 组件属性接口定义
 */
export interface PaginationProps {
  /** 数据总数 */
  total?: number;
  /** 页码按钮数量：需为不小于 5 的奇数，非法值自动钳制 */
  pagerCount?: number;
  /** 布局：逗号分隔的 token（prev/pager/next/jumper/total/sizes），未知 token 忽略 */
  layout?: string;
  /** 每页条数选项 */
  pageSizes?: number[];
  /** 尺寸：sm / md / lg */
  size?: (typeof paginationSizes)[number];
  /** 是否为页码按钮添加背景 */
  background?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 总页数不超过 1 时整组件隐藏 */
  hideOnSinglePage?: boolean;
  /** 简洁模式：忽略 layout，只渲染上一页/当前页-总页数/下一页 */
  simple?: boolean;
  /** 上一页按钮文字，不传显示箭头图标 */
  prevText?: string;
  /** 下一页按钮文字，不传显示箭头图标 */
  nextText?: string;
  /** 各部分 UI 自定义 */
  ui?: Partial<PaginationUI>;
  /** 自定义类名 */
  class?: any;
}

/** 当前页码双向绑定 */
const modelValue = defineModel<number>("modelValue", { default: 1 });
/** 每页条数双向绑定 */
const pageSizeModel = defineModel<number>("pageSize", { default: 10 });

const b = tv(theme);

/**
 * 规范化 pagerCount：不小于 5 的奇数
 */
const pagerCount = computed(() => {
  let count = Math.floor(Number(props.pagerCount)) || 7;
  if (count < 5) count = 5;
  if (count % 2 === 0) count += 1;
  return count;
});

/**
 * 总页数：至少 1 页
 */
const totalPages = computed(() => {
  const size = Math.max(1, Number(pageSizeModel.value) || 1);
  return Math.max(1, Math.ceil(props.total / size));
});

/**
 * 当前页：始终钳制在有效范围内
 */
const currentPage = computed(() => {
  const page = Math.floor(Number(modelValue.value)) || 1;
  return Math.min(Math.max(page, 1), totalPages.value);
});

/**
 * 折叠阈值的一半（用于省略号显隐判断）
 */
const halfPagerCount = computed(() => Math.floor((pagerCount.value - 1) / 2));

/**
 * 是否显示左侧省略号
 */
const showPrevMore = computed(
  () => totalPages.value > pagerCount.value && currentPage.value > pagerCount.value - halfPagerCount.value,
);

/**
 * 是否显示右侧省略号
 */
const showNextMore = computed(
  () => totalPages.value > pagerCount.value && currentPage.value < totalPages.value - halfPagerCount.value,
);

/**
 * 中间页码列表（不含首尾与省略号），折叠逻辑对齐 Element Plus
 */
const pagers = computed(() => {
  const total = totalPages.value;
  const count = pagerCount.value;
  const current = currentPage.value;
  const list: number[] = [];
  if (total <= count) return list;
  if (showPrevMore.value && !showNextMore.value) {
    const start = total - (count - 2);
    for (let i = start; i < total; i++) list.push(i);
  } else if (!showPrevMore.value && showNextMore.value) {
    for (let i = 2; i < count; i++) list.push(i);
  } else if (showPrevMore.value && showNextMore.value) {
    const offset = Math.floor(count / 2) - 1;
    for (let i = current - offset; i <= current + offset; i++) list.push(i);
  } else {
    for (let i = 2; i < total; i++) list.push(i);
  }
  return list;
});

/** 页码渲染项：页码或省略号 */
type PagerItem =
  | { type: "page"; key: string; page: number; active: boolean }
  | { type: "ellipsis"; key: string; direction: "prev" | "next" };

/**
 * 完整页码渲染列表（含首尾与省略号）
 */
const pagerList = computed<PagerItem[]>(() => {
  const total = totalPages.value;
  const count = pagerCount.value;
  const current = currentPage.value;
  const list: PagerItem[] = [];
  if (total <= count) {
    for (let i = 1; i <= total; i++) {
      list.push({ type: "page", key: `page-${i}`, page: i, active: i === current });
    }
    return list;
  }
  list.push({ type: "page", key: "page-1", page: 1, active: current === 1 });
  if (showPrevMore.value) list.push({ type: "ellipsis", key: "ellipsis-prev", direction: "prev" });
  for (const page of pagers.value) {
    list.push({ type: "page", key: `page-${page}`, page, active: page === current });
  }
  if (showNextMore.value) list.push({ type: "ellipsis", key: "ellipsis-next", direction: "next" });
  list.push({ type: "page", key: `page-${total}`, page: total, active: total === current });
  return list;
});

/** 合法布局 token */
const layoutTokens = ["prev", "pager", "next", "jumper", "total", "sizes"];

/** 解析后的布局 token 列表（忽略未知项） */
const layoutList = computed(() =>
  props.layout
    .split(",")
    .map((token) => token.trim())
    .filter((token) => layoutTokens.includes(token)),
);

/** 每页条数下拉选项 */
const sizeOptions = computed(() =>
  props.pageSizes.map((size) => ({ label: `${size} 条/页`, value: size })),
);

/**
 * 页码是否禁用：组件禁用或仅一页时不可交互
 */
const pagerDisabled = computed(() => props.disabled || totalPages.value <= 1);

/** 上一页按钮禁用态 */
const prevDisabled = computed(() => props.disabled || currentPage.value <= 1);

/** 下一页按钮禁用态 */
const nextDisabled = computed(() => props.disabled || currentPage.value >= totalPages.value);

/** 跳转输入框的值 */
const jumperValue = ref<number | null>(null);

/**
 * 设置当前页：钳制到有效范围，仅在实际变化时同步并触发事件
 */
function setPage(page: number) {
  const next = Math.min(Math.max(Math.floor(page) || 1, 1), totalPages.value);
  const current = Math.floor(Number(modelValue.value)) || 1;
  if (next === current) return;
  modelValue.value = next;
  emit("current-change", next);
}

/**
 * 将当前页钳制到有效范围，越界时同步并触发事件
 */
function clampPage() {
  const current = Math.floor(Number(modelValue.value)) || 1;
  const next = Math.min(Math.max(current, 1), totalPages.value);
  if (next !== current) {
    modelValue.value = next;
    emit("current-change", next);
  }
}

/** 上一页 */
function prev() {
  if (props.disabled) return;
  setPage(currentPage.value - 1);
}

/** 下一页 */
function next() {
  if (props.disabled) return;
  setPage(currentPage.value + 1);
}

/** 跳转到指定页 */
function jumpTo(page: number) {
  setPage(page);
}

/** 点击省略号：向对应方向跳 pagerCount - 2 页 */
function handleEllipsisJump(direction: "prev" | "next") {
  const step = pagerCount.value - 2;
  jumpTo(direction === "prev" ? currentPage.value - step : currentPage.value + step);
}

/** 确认跳转输入：钳制到 [1, totalPages]，跳转后清空输入框 */
function handleJumperConfirm(value: number | null) {
  if (value === null) return;
  jumpTo(value);
  jumperValue.value = null;
}

/** 处理每页条数变化：同步 model、触发事件并钳制当前页 */
function handleSizeChange(size: number) {
  pageSizeModel.value = size;
  emit("size-change", size);
  clampPage();
}

/** 外部修改当前页越界时自动钳制 */
watch(modelValue, () => clampPage());

/** 外部修改每页条数时钳制当前页 */
watch(pageSizeModel, () => clampPage());

/**
 * 样式映射：按激活/禁用态逐项生成
 */
const ui = computed(() => {
  const overrides = props.ui || {};
  const base = (opts: { active?: boolean; disabled?: boolean } = {}) => ({
    size: props.size,
    active: opts.active ?? false,
    background: props.background,
    disabled: opts.disabled ?? props.disabled,
    simple: props.simple,
  });
  return {
    root: (opts?: { class?: any }) =>
      b({ ...base(), active: false, disabled: props.disabled }).root({
        class: cn(opts?.class, props.class, overrides.root),
      }),
    pager: (opts?: { class?: any }) =>
      b({ ...base(), active: false, disabled: props.disabled }).pager({
        class: cn(opts?.class, overrides.pager),
      }),
    prev: (opts?: { disabled?: boolean; class?: any }) =>
      b({ ...base({ disabled: opts?.disabled ?? props.disabled }) }).button({
        class: cn(opts?.class, overrides.prev),
      }),
    next: (opts?: { disabled?: boolean; class?: any }) =>
      b({ ...base({ disabled: opts?.disabled ?? props.disabled }) }).button({
        class: cn(opts?.class, overrides.next),
      }),
    pagerItem: (opts?: { active?: boolean; disabled?: boolean; class?: any }) =>
      b({ ...base({ active: opts?.active, disabled: opts?.disabled }) }).button({
        class: cn(opts?.class, overrides.pagerItem, opts?.active ? overrides.pagerItemActive : undefined),
      }),
    ellipsis: (opts?: { class?: any }) =>
      b({ ...base(), active: false, disabled: props.disabled }).ellipsis({
        class: cn(opts?.class, overrides.ellipsis),
      }),
    jumper: (opts?: { class?: any }) =>
      b({ ...base(), active: false, disabled: props.disabled }).jumper({
        class: cn(opts?.class, overrides.jumper),
      }),
    total: (opts?: { class?: any }) =>
      b({ ...base(), active: false, disabled: props.disabled }).total({
        class: cn(opts?.class, overrides.total),
      }),
    sizes: (opts?: { class?: any }) =>
      b({ ...base(), active: false, disabled: props.disabled }).sizes({
        class: cn(opts?.class, overrides.sizes),
      }),
    simple: (opts?: { class?: any }) =>
      b({ ...base(), active: false, disabled: props.disabled }).simple({
        class: cn(opts?.class, overrides.simple),
      }),
    input: (opts?: { disabled?: boolean; class?: any }) =>
      b({ ...base(), active: false, disabled: opts?.disabled ?? props.disabled }).input({
        class: cn(opts?.class, overrides.input),
      }),
  };
});

defineExpose({
  /** 翻到上一页 */
  prev,
  /** 翻到下一页 */
  next,
});
</script>

<template>
  <nav v-if="!hideOnSinglePage || totalPages > 1" :class="ui.root()" aria-label="分页导航">
    <!-- 简洁模式：只渲染 上一页 / 当前页-总页数 / 下一页 -->
    <template v-if="simple">
      <!-- 上一页 -->
      <slot name="prev" :disabled="prevDisabled" :prev="prev">
        <button type="button" :class="ui.prev({ disabled: prevDisabled })" :disabled="prevDisabled" @click="prev">
          <Icon v-if="!prevText" name="lucide:chevron-left" class="size-4" />
          <span v-else>{{ prevText }}</span>
        </button>
      </slot>

      <!-- 当前页 / 总页数 -->
      <span :class="ui.simple()">{{ currentPage }} / {{ totalPages }}</span>

      <!-- 下一页 -->
      <slot name="next" :disabled="nextDisabled" :next="next">
        <button type="button" :class="ui.next({ disabled: nextDisabled })" :disabled="nextDisabled" @click="next">
          <Icon v-if="!nextText" name="lucide:chevron-right" class="size-4" />
          <span v-else>{{ nextText }}</span>
        </button>
      </slot>
    </template>

    <!-- 布局模式：按照 layout 顺序渲染各区块 -->
    <template v-else>
      <template v-for="token in layoutList" :key="token">
        <!-- 上一页 -->
        <slot v-if="token === 'prev'" name="prev" :disabled="prevDisabled" :prev="prev">
          <button type="button" :class="ui.prev({ disabled: prevDisabled })" :disabled="prevDisabled" @click="prev">
            <Icon v-if="!prevText" name="lucide:chevron-left" class="size-4" />
            <span v-else>{{ prevText }}</span>
          </button>
        </slot>

        <!-- 页码列表（含首尾与省略号） -->
        <div v-else-if="token === 'pager'" :class="ui.pager()">
          <template v-for="item in pagerList" :key="item.key">
            <!-- 省略号：点击向对应方向跳转 -->
            <span v-if="item.type === 'ellipsis'" :class="ui.ellipsis()" @click="handleEllipsisJump(item.direction)">
              •••
            </span>
            <!-- 页码项：可通过 #pager-item 插槽自定义 -->
            <slot v-else name="pager-item" :page="item.page" :active="item.active" :disabled="pagerDisabled">
              <button type="button" :class="ui.pagerItem({ active: item.active, disabled: pagerDisabled })"
                :disabled="pagerDisabled" @click="setPage(item.page)">
                {{ item.page }}
              </button>
            </slot>
          </template>
        </div>

        <!-- 下一页 -->
        <slot v-else-if="token === 'next'" name="next" :disabled="nextDisabled" :next="next">
          <button type="button" :class="ui.next({ disabled: nextDisabled })" :disabled="nextDisabled" @click="next">
            <Icon v-if="!nextText" name="lucide:chevron-right" class="size-4" />
            <span v-else>{{ nextText }}</span>
          </button>
        </slot>

        <!-- 跳转输入 -->
        <div v-else-if="token === 'jumper'" :class="ui.jumper()">
          <slot name="jumper" :current="currentPage" :total-pages="totalPages" :jump="jumpTo">
            <span>前往</span>

            <div :class="ui.input({ disabled })">
              <RebornInputNumber v-model="jumperValue" :size="size" :disabled="disabled" align="center"
                variant="outlined" :min="1" :max="totalPages" change-on-wheel hide-button
                @change="handleJumperConfirm" />
            </div>
            <span>页</span>
          </slot>
        </div>

        <!-- 总数 -->
        <span v-else-if="token === 'total'" :class="ui.total()">
          <slot name="total" :total="props.total">共 {{ props.total }} 条</slot>
        </span>

        <!-- 每页条数选择 -->
        <div v-else-if="token === 'sizes'" :class="ui.sizes()">
          <slot name="sizes" :page-size="pageSizeModel" :page-sizes="props.pageSizes" :change="handleSizeChange">
            <RebornSelect :model-value="pageSizeModel" :options="sizeOptions" :size="props.size"
              :disabled="props.disabled" :clearable="false" class="w-[110px]" @update:model-value="handleSizeChange" />
          </slot>
        </div>
      </template>
    </template>
  </nav>
</template>