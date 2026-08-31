<script setup lang="ts">
import { computed } from "vue";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import theme, {
  fieldTriggerColors,
  fieldTriggerSizes,
  fieldTriggerVariants,
} from "./reborn-field-trigger.config";
import type { FieldTriggerUI } from "./reborn-field-trigger.config";

defineOptions({ name: "RebornFieldTrigger" });

export interface FieldTriggerProps {
  /** 已选值的展示文案 */
  displayText?: string;
  /** 无选中值时的占位文案 */
  placeholder?: string;
  /** 下拉是否处于展开态，用于 data-state 描边与箭头旋转 */
  isOpen?: boolean;
  disabled?: boolean;
  /** 是否显示清空按钮（悬停时盖在箭头之上，不额外占位） */
  clearable?: boolean;
  size?: (typeof fieldTriggerSizes)[number];
  color?: (typeof fieldTriggerColors)[number];
  /** 形态变体：描边 / 填充 / 无边框 / 下划线 */
  variant?: (typeof fieldTriggerVariants)[number];
  /** 右侧图标名，默认向下箭头 */
  icon?: string;
  class?: any;
  ui?: FieldTriggerUI;
  bordered?: boolean;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 展开时箭头是否旋转 */
  arrowAnimation?: boolean;
  /** 是否为错误态（红色描边） */
  error?: boolean;
}

const props = withDefaults(defineProps<FieldTriggerProps>(), {
  displayText: "",
  placeholder: "",
  isOpen: false,
  disabled: false,
  clearable: true,
  size: "md",
  color: "primary",
  variant: "outlined",
  icon: "lucide:chevron-down",
  bordered: true,
  showArrow: true,
  arrowAnimation: true,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
  (e: "clear", event: Event): void;
}>();

const b = tv(theme);

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    variant: props.variant,
    open: props.isOpen && props.arrowAnimation,
    disabled: props.disabled,
    bordered: props.bordered,
    clearable: props.clearable,
    error: props.error,
  });

  return {
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
    triggerText: (opts?: { class?: any }) =>
      styles.triggerText({ class: cn(opts?.class, uiOverrides.value.triggerText) }),
    triggerIconWrapper: (opts?: { class?: any }) =>
      styles.triggerIconWrapper({ class: cn(opts?.class, uiOverrides.value.triggerIconWrapper) }),
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    clearBtn: (opts?: { class?: any }) =>
      styles.clearBtn({ class: cn(opts?.class, uiOverrides.value.clearBtn) }),
    arrow: (opts?: { class?: any }) =>
      styles.arrow({ class: cn(opts?.class, uiOverrides.value.arrow) }),
  };
});

function handleClear(event: Event) {
  emit("clear", event);
}
</script>

<template>
  <div :class="ui.trigger({ class: props.class })" :data-state="isOpen ? 'open' : 'closed'"
    @click="emit('click', $event)">
    <!-- cover：整体接管触发器内容，连清空按钮与箭头一并交由调用方绘制 -->
    <slot name="cover" :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="ui"
      v-if="$slots.cover" />
    <template v-else>
      <slot :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="ui">
        <span v-if="displayText" :class="ui.triggerText()">{{ displayText }}</span>
        <span v-else :class="ui.placeholder()">
          {{ placeholder }}
        </span>
      </slot>

      <!-- 尾部图标区：箭头与清空按钮重叠在同一格子里，悬停时交替显隐，宽度恒定不抖动 -->
      <div v-if="showArrow || clearable" :class="ui.triggerIconWrapper()">
        <Icon v-if="showArrow" :name="icon" :class="ui.arrow()" />
        <span v-if="clearable" :class="ui.clearBtn({ class: showArrow ? undefined : 'static flex' })"
          @click.stop="handleClear">
          <Icon name="lucide:x" class="size-full" />
        </span>
      </div>
    </template>
  </div>
</template>
