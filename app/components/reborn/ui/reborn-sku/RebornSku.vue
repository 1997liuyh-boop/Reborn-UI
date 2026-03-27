<script setup lang="ts">
import { computed } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-sku.config";
import RebornBadge from "../reborn-badge/RebornBadge.vue";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

/** 单个属性选项定义 */
export interface SkuOptionItem {
  [key: string]: any;
}

/** 属性组定义 */
export interface SkuOption {
  /** 属性组标题 */
  title?: string;
  /** 绑定到 modelValue 的 key */
  key: string;
  /** 选项列表中用于显示的字段名 */
  labelKey?: string;
  /** 选项列表中用于取值的字段名 */
  valueKey?: string;
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

export interface SkuProps {
  /** 属性组配置列表 */
  options?: SkuOption[];
  /** 双向绑定值，key 为 SkuOption.key，value 为选中的 valueKey 值（多选时为数组） */
  modelValue?: Record<string, any>;
  /** 自定义类名 */
  class?: any;
  /** UI 覆盖 */
  ui?: SkuUi;
}

const props = withDefaults(defineProps<SkuProps>(), {
  options: () => [],
  modelValue: () => ({}),
  ui: () => ({}),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<string, any>): void;
  (e: "change", key: string, value: any): void;
}>();

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

/** 判断某个选项是否被选中 */
function isSelected(option: SkuOption, item: SkuOptionItem): boolean {
  const current = props.modelValue?.[option.key];
  const val = option.valueKey ? item[option.valueKey] : item;
  if (option.multiple && Array.isArray(current)) {
    return current.some(c => isEqual(c, val));
  }
  return isEqual(current, val);
}

/** 点击某个属性值 */
function handleSelect(option: SkuOption, item: SkuOptionItem) {
  const val = option.valueKey ? item[option.valueKey] : item;
  const current = props.modelValue?.[option.key];
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

  const newValue = { ...props.modelValue, [option.key]: next };
  emit("update:modelValue", newValue);
  emit("change", option.key, next);
}
</script>

<template>
  <div :class="[ui.wrapper, props.class]">
    <template v-for="option in options" :key="option.key">
      <!-- slots 完全覆盖模式 -->
      <slot v-if="option.slots && option.slotsCover" :name="option.slots" :option="option" :modelValue="modelValue" />

      <!-- 默认渲染模式（可选插入自定义内容） -->
      <div v-else :class="ui.group">
        <div v-if="option.title" :class="ui.title">{{ option.title }}</div>

        <div :class="ui.list">
          <RebornBadge v-for="(item, index) in option.children" :key="index" size="md"
            :color="isSelected(option, item) ? 'primary' : 'neutral'" variant="soft" @click="handleSelect(option, item)"
            :class="ui.item" :ui="{ label: isSelected(option, item) ? '' : 'text-gray-7' }">
            <slot name="item" :item="item" :option="option" :selected="isSelected(option, item)">
              {{ option.labelKey ? item[option.labelKey] : item }}
            </slot>
          </RebornBadge>

          <!-- 如果没有完全覆盖 (slotsCover=false) 但提供了插槽，作为附加组件挂载在选项列表后方 (例如自定义输入框) -->
          <slot v-if="option.slots" :name="option.slots" :option="option" :modelValue="modelValue" />
        </div>
      </div>
    </template>
  </div>
</template>
