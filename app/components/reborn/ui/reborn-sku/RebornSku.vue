<script setup lang="ts">
import { computed } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-sku.config";
import RebornBadge from "../reborn-badge/RebornBadge.vue";


// 未声明的属性与监听（id、aria-*、data-*、style 等）按默认规则落到根容器

/** 单个属性选项定义 */
export interface SkuOptionItem {
  [key: string]: any;
}

/**
 * 属性组 children 的字段别名配置：后端字段名与默认的 label / value 不一致时配置，
 * 未配置的字段沿用默认名
 */
export interface SkuFieldNames {
  /** 展示文案字段名，默认 `label` */
  label?: string;
  /** 选项值字段名，默认 `value` */
  value?: string;
}

/** 属性组定义 */
export interface SkuOption {
  /** 属性组标题 */
  title?: string;
  /** 绑定到 modelValue 的 key */
  key: string;
  /** children 的字段别名配置，按这里给出的字段名去选项里取文案与值 */
  fieldNames?: SkuFieldNames;
  /** 是否支持多选 */
  multiple?: boolean;
  /** 自定义插槽名称 */
  slots?: string;
  /** slots 节点是否完全覆盖该属性组，为 true 时不渲染默认内容 */
  slotsCover?: boolean;
  /** 属性选项列表 */
  children?: SkuOptionItem[];
}

/** RebornSku UI 覆盖类型 */
export interface SkuUi {
  wrapper?: string;
  group?: string;
  title?: string;
  list?: string;
  item?: string;
}

/** item 插槽的作用域参数 */
export interface SkuItemSlotProps {
  /** 选项数据 */
  item: SkuOptionItem;
  /** 所属属性组 */
  option: SkuOption;
  /** 是否选中 */
  selected: boolean;
}

/** 属性组 slots 字段指定的动态插槽的作用域参数 */
export interface SkuGroupSlotProps {
  /** 所属属性组 */
  option: SkuOption;
  /** 当前选中结果（与 v-model 同值） */
  modelValue: Record<string, any>;
}

export interface SkuProps {
  /** 属性组配置列表 */
  options?: SkuOption[];
  /** 自定义类名 */
  class?: any;
  /** UI 覆盖 */
  ui?: SkuUi;
}

const props = withDefaults(defineProps<SkuProps>(), {
  options: () => [],
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 单个属性组选中值变化时触发，key 为该属性组的 key */
  (e: "change", key: string, value: any): void;
}>();

/**
 * 插槽类型拆成两部分再取交叉：同一个对象字面量里，具名的 item 必须兼容索引签名，
 * 只能把索引签名写成两种参数的联合，动态名调用时参数被推成两者的交叉而报错；
 * 交叉类型不做这项检查，动态名只按分组插槽参数检查，item 仍按自己的参数检查
 */
defineSlots<
  {
    /** 由属性组 slots 字段指定的动态插槽 */
    [name: string]: ((props: SkuGroupSlotProps) => any) | undefined;
  } & {
    /** 自定义单个选项内容 */
    item?: (props: SkuItemSlotProps) => any;
  }
>();

/**
 * 选中结果（v-model）：key 为 SkuOption.key，value 为选中项按 fieldNames.value 取到的值（多选时为数组）。
 * 不绑定时由 defineModel 在本地持有，点选同样生效；对象值每次整体替换，不就地修改
 */
const model = defineModel<Record<string, any>>({ default: () => ({}) });

const b = tv(theme);

const styles = b();
const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => ({
  wrapper: cn(styles.wrapper(), uiOverrides.value.wrapper),
  group: cn(styles.group(), uiOverrides.value.group),
  title: cn(styles.title(), uiOverrides.value.title),
  list: cn(styles.list(), uiOverrides.value.list),
  item: cn(styles.item(), uiOverrides.value.item),
}));

/** 深度判断两个值是否相等 (应对 value 是数组 [1000, 5000] 等情况) */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** 选项的值：按 fieldNames.value 取字段；运行时传入的字符串 / 数字直接作为值 */
function valueOf(option: SkuOption, item: SkuOptionItem): any {
  if (typeof item !== "object" || item === null) return item;
  return item[option.fieldNames?.value ?? "value"];
}

/** 选项的展示文案：按 fieldNames.label 取字段；运行时传入的字符串 / 数字直接展示 */
function labelOf(option: SkuOption, item: SkuOptionItem): any {
  if (typeof item !== "object" || item === null) return item;
  return item[option.fieldNames?.label ?? "label"];
}

/** 判断某个选项是否被选中 */
function isSelected(option: SkuOption, item: SkuOptionItem): boolean {
  const current = model.value?.[option.key];
  const val = valueOf(option, item);
  if (option.multiple && Array.isArray(current)) {
    return current.some(c => isEqual(c, val));
  }
  return isEqual(current, val);
}

/** 选项的 key：值是原始类型时带上类型前缀（避免 1 与 "1" 撞 key），值是对象或同值重复时才退回下标 */
function itemKeyOf(value: any, index: number, seen: Set<string>) {
  if (value !== null && (typeof value === "object" || typeof value === "function")) return `#${index}`;
  const key = `${typeof value}:${String(value)}`;
  if (seen.has(key)) return `${key}#${index}`;
  seen.add(key);
  return key;
}

/**
 * 渲染用的属性组与选项行：key、文案与选中态在这里按组一次算好。
 * 选中判断要做 JSON 序列化比较，此前模板里每个选项调用三次，现在只在选中结果或 options 变化时重算
 */
const groups = computed(() =>
  props.options.map((option) => {
    const seen = new Set<string>();
    const items = (option.children ?? []).map((item, index) => ({
      item,
      key: itemKeyOf(valueOf(option, item), index, seen),
      label: labelOf(option, item),
      selected: isSelected(option, item),
    }));
    return { option, items };
  }),
);

/** 点击某个属性值 */
function handleSelect(option: SkuOption, item: SkuOptionItem) {
  const val = valueOf(option, item);
  const current = model.value?.[option.key];
  let next: any;

  if (option.multiple) {
    const arr: any[] = Array.isArray(current) ? [...current] : [];
    const idx = arr.findIndex(c => isEqual(c, val));
    if (idx > -1) {
      arr.splice(idx, 1);
    } else {
      arr.push(val);
    }
    next = arr;
  } else {
    // 单选：再次点击取消选中
    next = isEqual(current, val) ? undefined : val;
  }

  // 对象整体替换；受控时赋值后同步读到的仍是旧值，事件载荷用本地算出的新值
  model.value = { ...model.value, [option.key]: next };
  emit("change", option.key, next);
}
</script>

<template>
  <div :class="[ui.wrapper, props.class]">
    <template v-for="{ option, items } in groups" :key="option.key">
      <!-- slots 完全覆盖模式 -->
      <slot v-if="option.slots && option.slotsCover" :name="option.slots" :option="option" :modelValue="model" />

      <!-- 默认渲染模式（可选插入自定义内容） -->
      <div v-else :class="ui.group">
        <div v-if="option.title" :class="ui.title">{{ option.title }}</div>

        <div :class="ui.list">
          <RebornBadge v-for="row in items" :key="row.key" size="md"
            :color="row.selected ? 'primary' : 'neutral'" variant="soft" @click="handleSelect(option, row.item)"
            :class="ui.item" :ui="{ label: row.selected ? '' : 'text-gray-7' }">
            <slot name="item" :item="row.item" :option="option" :selected="row.selected">
              {{ row.label }}
            </slot>
          </RebornBadge>

          <!-- 如果没有完全覆盖 (slotsCover=false) 但提供了插槽，作为附加组件挂载在选项列表后方 (例如自定义输入框) -->
          <slot v-if="option.slots" :name="option.slots" :option="option" :modelValue="model" />
        </div>
      </div>
    </template>
  </div>
</template>
