<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import theme, { dropdownSizes, dropdownColors } from "./reborn-dropdown.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";

defineOptions({ inheritAttrs: false });

export interface DropdownProps {
  /** 是否呈现为按钮组（左侧功能按钮 + 右侧触发按钮） */
  splitButton?: boolean;
  /** 点击菜单项后是否自动隐藏下拉 */
  hideOnClick?: boolean;
  /** 触发方式：hover 悬浮 / click 点击 */
  trigger?: "hover" | "click";
  /** hover 模式下打开延迟（ms），避免误触 */
  openDelay?: number;
  /** hover 模式下关闭延迟（ms），允许鼠标移回 */
  closeDelay?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 尺寸 */
  size?: (typeof dropdownSizes)[number];
  /** 主题颜色 */
  color?: (typeof dropdownColors)[number];
  /** 弹出位置 */
  placement?: "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";
  /** 自定义类名 */
  class?: any;
  /** UI 局部重写 */
  ui?: Partial<{
    wrapper: ClassValue;
    trigger: ClassValue;
    splitMain: ClassValue;
    splitArrow: ClassValue;
    dropdown: ClassValue;
    item: ClassValue;
    divider: ClassValue;
    icon: ClassValue;
    label: ClassValue;
  }>;
}

const props = withDefaults(defineProps<DropdownProps>(), {
  splitButton: false,
  hideOnClick: true,
  trigger: "hover",
  openDelay: 100,
  closeDelay: 200,
  disabled: false,
  size: "md",
  color: "primary",
  placement: "bottom-start",
});

const emit = defineEmits<{
  /** 菜单项被点击时触发，参数为该项的 command 值 */
  (e: "command", key: string): void;
  /** 下拉展开/收起状态变化 */
  (e: "visible-change", visible: boolean): void;
}>();

// --- 状态与表单注入 ---
const { disabled: formDisabled, size: formSize } = useFormInject(props);
const isDisabled = computed(() => formDisabled.value || props.disabled);
const isOpen = ref(false);
const triggerRef = ref<any>(null);

let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

// --- 核心逻辑 ---
function clearAllTimers() {
  if (openTimer) { clearTimeout(openTimer); openTimer = null }
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}

function open() {
  if (isDisabled.value) return
  clearAllTimers()
  if (!isOpen.value) {
    isOpen.value = true
    emit("visible-change", true)
  }
}

function close(immediate = false) {
  clearAllTimers()
  const delay = immediate ? 0 : (props.trigger === "hover" ? props.closeDelay : 0)
  if (delay <= 0) {
    isOpen.value = false
    emit("visible-change", false)
    return
  }
  closeTimer = setTimeout(() => {
    isOpen.value = false
    emit("visible-change", false)
  }, delay)
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function handleItemClick(command: string) {
  emit("command", command)
  if (props.hideOnClick) {
    close(true)
  }
}

// --- 事件监听 ---
function onMouseEnter() {
  if (props.trigger !== "hover") return
  clearAllTimers()
  if (!isOpen.value && props.openDelay! > 0) {
    openTimer = setTimeout(open, props.openDelay)
  } else {
    open()
  }
}

function onMouseLeave() {
  if (props.trigger !== "hover") return
  clearAllTimers()
  close()
}

function onTriggerClick() {
  if (props.trigger === "click") toggle()
}

function onKeydown(e: KeyboardEvent) {
  if (isDisabled.value) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggle();
  } else if (e.key === "Escape" && isOpen.value) {
    close(true);
  }
}

function onClickOutside(e: MouseEvent) {
  if (!isOpen.value) return;
  const el = triggerRef.value?.$el
  if (el && !el.contains(e.target as Node)) {
    close(true);
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside, true);
  clearAllTimers();
});

// --- 样式计算 ---
const b = tv(theme);
const overrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: formSize.value || props.size,
    color: props.color,
    placement: props.placement,
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, overrides.value.wrapper) }),
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, overrides.value.trigger) }),
    splitMain: (opts?: { class?: any }) =>
      styles.splitMain({ class: cn(opts?.class, overrides.value.splitMain) }),
    splitArrow: (opts?: { class?: any }) =>
      styles.splitArrow({ class: cn(opts?.class, overrides.value.splitArrow) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, overrides.value.dropdown) }),
    item: (opts?: { class?: any }) =>
      styles.item({ class: cn(opts?.class, overrides.value.item) }),
    divider: (opts?: { class?: any }) =>
      styles.divider({ class: cn(opts?.class, overrides.value.divider) }),
    icon: (opts?: { class?: any }) =>
      styles.icon({ class: cn(opts?.class, overrides.value.icon) }),
    label: (opts?: { class?: any }) =>
      styles.label({ class: cn(opts?.class, overrides.value.label) }),
  };
});

provide("reborn-dropdown", {
  handleItemClick,
  ui,
});

defineExpose({
  isOpen,
  open,
  close,
  toggle,
});
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <RebornSelectTrigger ref="triggerRef" :is-open="isOpen" :disabled="isDisabled" :size="formSize || size"
      :color="color" :bordered="false" :show-arrow="false" :ui="{
        /* 覆盖底层组件的默认样式，仅保留定位能力，具体样式由内部插槽决定 */
        trigger: 'bg-transparent p-0',
        dropdown: 'w-auto!',
      }" @toggle="onTriggerClick" @keydown="onKeydown">
      <!-- 使用 cover 完全接管触发器样式 -->
      <template #cover>
        <div v-if="splitButton" class="flex h-full w-full items-center overflow-hidden">
          <div :class="ui.splitMain()" class="flex-1">
            <slot />
          </div>
          <div :class="ui.splitArrow()" @click.stop="toggle">
            <Icon name="lucide:chevron-down"
              :class="cn('size-4 transition-transform duration-200', isOpen && 'rotate-180')" />
          </div>
        </div>
        <div v-else :class="ui.trigger()" class="h-full w-full">
          <slot />
        </div>
      </template>

      <template #content>
        <!-- 将 Dropdown 自身的面板样式应用在这里，避免与底层组件冲突 -->
        <div :class="ui.dropdown()" role="menu">
          <slot name="dropdown" />
        </div>
      </template>
    </RebornSelectTrigger>
  </div>
</template>
