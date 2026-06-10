<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import theme, { selectColors, selectSizes } from "./reborn-select-trigger.config";

defineOptions({ inheritAttrs: false });

export interface SelectTriggerProps {
  displayText?: string;
  placeholder?: string;
  isOpen?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  size?: (typeof selectSizes)[number];
  color?: (typeof selectColors)[number];
  icon?: string;
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    trigger: ClassValue;
    triggerText: ClassValue;
    triggerIconWrapper: ClassValue;
    placeholder: ClassValue;
    clearBtn: ClassValue;
    arrow: ClassValue;
    dropdown: ClassValue;
    dropdownInner: ClassValue;
  }>;
  bordered?: boolean;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 展开时箭头是否旋转 */
  arrowAnimation?: boolean;
  scrollToActive?: (instant?: boolean) => void;
  error?: boolean;
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  displayText: "",
  placeholder: "",
  isOpen: false,
  disabled: false,
  clearable: true,
  size: "md",
  color: "primary",
  icon: "lucide:chevron-down",
  bordered: true,
  showArrow: true,
  arrowAnimation: true,
});

const emit = defineEmits<{
  (e: "toggle"): void;
  (e: "clear", event: Event): void;
  (e: "keydown", event: KeyboardEvent): void;
  (e: "enter"): void;
  (e: "afterEnter"): void;
}>();

const isOpening = ref(false);
const transitionRef = ref<any>(null);
const dropdownInnerRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const isUpward = ref(false);

function updatePlacement() {
  if (!wrapperRef.value) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const threshold = 280;

  if (spaceBelow < threshold && spaceAbove > spaceBelow) {
    isUpward.value = true;
  } else {
    isUpward.value = false;
  }
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll, true);
  window.addEventListener("resize", handleScroll, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll, true);
  window.removeEventListener("resize", handleScroll, true);
});

function handleScroll() {
  if (props.isOpen) {
    updatePlacement();
  }
}

watch(
  () => props.isOpen,
  (v) => {
    if (v) {
      isOpening.value = true;
      updatePlacement();
    }
  },
);

const b = tv(theme);

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    open: props.isOpen && props.arrowAnimation,
    disabled: props.disabled,
    placement: isUpward.value ? "top" : "bottom",
    bordered: props.bordered,
    error: props.error,
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
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
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
    dropdownInner: (opts?: { class?: any }) =>
      styles.dropdownInner({ class: cn(opts?.class, uiOverrides.value.dropdownInner) }),
  };
});

function handleClear(event: Event) {
  emit("clear", event);
}

/**
 * enter：外层高度已展开，内层列表可测量，在此同步定位已选项（首帧即正确）
 */
function onEnter() {
  const alignActive = () => {
    try {
      props.scrollToActive?.(true);
    } catch (e) {
      console.error("[RebornSelectTrigger] Error in scrollToActive:", e);
    }
  };
  emit("enter");
  nextTick(() => {
    alignActive();
    requestAnimationFrame(alignActive);
  });
}

function onAfterEnter() {
  isOpening.value = false;
  emit("afterEnter");
}

defineExpose({
  dropdownRef: computed(() => dropdownInnerRef.value),
  dropdownScrollRef: computed(() => transitionRef.value?.el),
  isOpening,
});
</script>

<template>
  <div
    ref="wrapperRef"
    :class="ui.wrapper({ class: props.class })"
    tabindex="0"
    @keydown="emit('keydown', $event)"
  >
    <div
      :class="ui.trigger()"
      :data-state="isOpen ? 'open' : 'closed'"
      @click="emit('toggle')"
    >
      <slot
        name="cover"
        :displayText="displayText"
        :placeholder="placeholder"
        :isOpen="isOpen"
        :ui="ui"
        v-if="$slots.cover"
      />
      <template v-else>
        <slot
          :displayText="displayText"
          :placeholder="placeholder"
          :isOpen="isOpen"
          :ui="ui"
        >
          <span
            v-if="displayText"
            :class="ui.triggerText()"
            >{{ displayText }}</span
          >
          <span
            v-else
            :class="ui.placeholder()"
          >
            {{ placeholder }}
          </span>
        </slot>

        <div :class="ui.triggerIconWrapper()">
          <span
            v-if="clearable"
            :class="ui.clearBtn()"
            @click.stop="handleClear"
          >
            <Icon
              name="lucide:x"
              class="size-full"
            />
          </span>
          <Icon
            v-else-if="showArrow"
            :name="icon"
            :class="ui.arrow()"
          />
        </div>
      </template>
    </div>

    <RebornTransition
      ref="transitionRef"
      :show="isOpen"
      :duration="{ enter: 300, leave: 200 }"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @after-leave="isOpening = false"
      :custom-class="ui.dropdown()"
      name="select-collapse"
    >
      <div
        ref="dropdownInnerRef"
        :class="ui.dropdownInner()"
      >
        <slot name="content" />
      </div>
    </RebornTransition>
  </div>
</template>
