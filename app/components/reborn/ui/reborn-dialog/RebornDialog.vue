<script setup lang="ts">
import type { ButtonProps } from "../reborn-button/RebornButton.vue";
import { computed, nextTick, onBeforeUnmount, ref, useId, useSlots, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import theme from "./reborn-dialog.config";

/**
 * 对话框操作按钮类型
 * @description 可以是字符串（标签）、false（隐藏）或按钮属性对象
 */
type DialogActionButton = string | false | ButtonProps;

/**
 * RebornDialog UI 样式配置
 */
export interface RebornDialogUi {
  /** 触发器容器类名 */
  trigger?: string;
  /** 根容器类名 */
  root?: string;
  /** 遮罩层类名 */
  backdrop?: string;
  /** 弹窗外壳类名 */
  shell?: string;
  /** 弹窗面板类名 */
  panel?: string;
  /** 头部容器类名 */
  header?: string;
  /** 头部内容容器类名 */
  headerContent?: string;
  /** 标题类名 */
  title?: string;
  /** 描述类名 */
  description?: string;
  /** 关闭按钮类名 */
  close?: string;
  /** 主体类名 */
  body?: string;
  /** 底部容器类名 */
  footer?: string;
}

/**
 * RebornDialog 属性配置
 */
export interface RebornDialogProps {
  /**
   * 是否打开对话框
   * @default undefined
   */
  open?: boolean;
  /**
   * 对话框标题
   * @default ""
   */
  title?: string;
  /**
   * 对话框描述
   * @default ""
   */
  description?: string;
  /**
   * 关闭按钮配置
   * @description 可以是布尔值（是否显示默认按钮）或按钮属性对象
   * @default true
   */
  close?: boolean | ButtonProps;
  /**
   * 关闭按钮图标
   * @default "lucide:x"
   */
  closeIcon?: string;
  /**
   * 是否显示遮罩层
   * @default true
   */
  overlay?: boolean;
  /**
   * 是否可以通过点击遮罩层或按下 Esc 键关闭
   * @default true
   */
  dismissible?: boolean;
  /**
   * 内容是否可滚动
   * @default false
   */
  scrollable?: boolean;
  /**
   * 是否全屏显示
   * @default false
   */
  fullscreen?: boolean;
  /**
   * 是否可拖拽（非全屏模式下有效）
   * @default false
   */
  draggable?: boolean;
  /**
   * 取消按钮配置
   * @description 可以是字符串（标签）、false（隐藏）或按钮属性对象
   * @default "取消"
   */
  cancelBtn?: DialogActionButton;
  /**
   * 确认按钮配置
   * @description 可以是字符串（标签）、false（隐藏）或按钮属性对象
   * @default "确认"
   */
  confirmBtn?: DialogActionButton;
  /**
   * 关闭前的回调
   * @param done 调用此函数以完成关闭过程
   */
  beforeClose?: (done: () => void) => void;
  /**
   * 打开延迟（毫秒）
   * @default 0
   */
  openDelay?: number;
  /**
   * 关闭延迟（毫秒）
   * @default 0
   */
  closeDelay?: number;
  /**
   * 层级
   * @default 2400
   */
  zIndex?: number;
  /**
   * 是否锁定背景滚动
   * @default true
   */
  lockScroll?: boolean;
  /**
   * 自定义类名（作用于面板）
   */
  class?: any;
  /**
   * UI 样式透传配置
   */
  ui?: RebornDialogUi;
}

defineOptions({
  name: "RebornDialog",
  inheritAttrs: false,
});

const props = withDefaults(defineProps<RebornDialogProps>(), {
  open: undefined,
  title: "",
  description: "",
  close: true,
  closeIcon: "lucide:x",
  overlay: true,
  dismissible: true,
  scrollable: false,
  fullscreen: false,
  draggable: false,
  cancelBtn: "取消",
  confirmBtn: "确认",
  beforeClose: undefined,
  openDelay: 0,
  closeDelay: 0,
  zIndex: 2400,
  lockScroll: true,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 更新打开状态 */
  (e: "update:open", value: boolean): void;
  /** 打开事件 */
  (e: "open"): void;
  /** 打开完成事件 */
  (e: "opened"): void;
  /** 关闭事件 */
  (e: "close"): void;
  /** 关闭完成事件 */
  (e: "closed"): void;
  /** 打开时自动聚焦事件 */
  (e: "openAutoFocus"): void;
  /** 关闭时自动聚焦事件 */
  (e: "closeAutoFocus"): void;
  /** 点击确认按钮事件 */
  (e: "confirm"): void;
  /** 点击取消按钮事件 */
  (e: "cancel"): void;
}>();

const slots = useSlots();
const b = tv(theme);

const internalOpen = ref(false);
const mounted = ref(false);
const visible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const previousFocus = ref<HTMLElement | null>(null);

const titleId = `reborn-dialog-title-${useId().replace(/[^\w-]/g, "")}`;
const descriptionId = `reborn-dialog-description-${useId().replace(/[^\w-]/g, "")}`;

const dragOffset = ref({ x: 0, y: 0 });

let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let bodyLockTimer: ReturnType<typeof setTimeout> | null = null;
const initialPaddingState = { right: "", overflow: "", htmlOverflow: "" };

const isControlled = computed(() => props.open !== undefined);
const mergedOpen = computed(() =>
  isControlled.value ? Boolean(props.open) : internalOpen.value,
);

const headerVisible = computed(() =>
  Boolean(slots.header || props.title || props.description),
);

function normalizeActionButton(
  value: DialogActionButton,
  defaults: ButtonProps,
): ButtonProps | null {
  if (value === false) {
    return null;
  }

  if (typeof value === "string") {
    return {
      ...defaults,
      label: value,
    };
  }

  return {
    ...defaults,
    ...(value ?? {}),
    label: value?.label ?? defaults.label,
  };
}

const normalizedCancelButton = computed(() =>
  normalizeActionButton(props.cancelBtn, {
    label: "取消",
    color: "neutral",
    variant: "outline",
    size: "md",
  }),
);

const normalizedConfirmButton = computed(() =>
  normalizeActionButton(props.confirmBtn, {
    label: "确认",
    color: "primary",
    variant: "solid",
    size: "md",
  }),
);

const footerVisible = computed(() =>
  Boolean(slots.footer || normalizedCancelButton.value || normalizedConfirmButton.value),
);

const panelStyle = computed(() => {
  if (props.fullscreen) {
    return {};
  }

  return {
    transform: `translate(${dragOffset.value.x}px, ${dragOffset.value.y}px)`,
  };
});

const rootStyle = computed(() => ({
  zIndex: `${props.zIndex}`,
}));

const ui = computed(() => {
  const styles = b({
    overlay: props.overlay,
    scrollable: props.scrollable,
    fullscreen: props.fullscreen,
    draggable: props.draggable && !props.fullscreen,
  });

  return {
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, props.ui?.trigger) }),
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.ui?.root) }),
    backdrop: (opts?: { class?: any }) =>
      styles.backdrop({ class: cn(opts?.class, props.ui?.backdrop) }),
    shell: (opts?: { class?: any }) => styles.shell({ class: cn(opts?.class, props.ui?.shell) }),
    panel: (opts?: { class?: any }) =>
      styles.panel({ class: cn(opts?.class, props.class, props.ui?.panel) }),
    header: (opts?: { class?: any }) => styles.header({ class: cn(opts?.class, props.ui?.header) }),
    headerContent: (opts?: { class?: any }) =>
      styles.headerContent({ class: cn(opts?.class, props.ui?.headerContent) }),
    title: (opts?: { class?: any }) => styles.title({ class: cn(opts?.class, props.ui?.title) }),
    description: (opts?: { class?: any }) =>
      styles.description({ class: cn(opts?.class, props.ui?.description) }),
    close: (opts?: { class?: any }) => styles.close({ class: cn(opts?.class, props.ui?.close) }),
    body: (opts?: { class?: any }) => styles.body({ class: cn(opts?.class, props.ui?.body) }),
    footer: (opts?: { class?: any }) => styles.footer({ class: cn(opts?.class, props.ui?.footer) }),
  };
});

function clearTimers() {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }

  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function rememberActiveElement(element?: HTMLElement | null) {
  if (element) {
    previousFocus.value = element;
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (activeElement && !panelRef.value?.contains(activeElement)) {
    previousFocus.value = activeElement;
  }
}

function syncOpenState(value: boolean) {
  if (!isControlled.value) {
    internalOpen.value = value;
  }
  emit("update:open", value);
}

function openDialog() {
  rememberActiveElement(triggerRef.value);
  syncOpenState(true);
}

function closeDialog() {
  requestClose();
}

function doOpen() {
  clearTimers();
  dragOffset.value = { x: 0, y: 0 };
  mounted.value = true;
  emit("open");

  nextTick(() => {
    visible.value = true;
  });
}

function doClose() {
  clearTimers();
  emit("close");
  visible.value = false;
}

function requestClose() {
  const done = () => {
    syncOpenState(false);
  };

  if (props.beforeClose) {
    props.beforeClose(done);
    return;
  }

  done();
}

function onTriggerClick() {
  openDialog();
}

function onBackdropClick() {
  if (!props.dismissible) {
    return;
  }

  requestClose();
}

function onCloseClick() {
  requestClose();
}

function onCancelClick() {
  emit("cancel");
  requestClose();
}

function onConfirmClick() {
  emit("confirm");
}

function onOpened() {
  nextTick(() => {
    panelRef.value?.focus();
    emit("openAutoFocus");
    emit("opened");
  });
}

function onClosed() {
  if (mergedOpen.value) {
    return;
  }

  mounted.value = false;
  dragOffset.value = { x: 0, y: 0 };

  const focusTarget = previousFocus.value;
  if (focusTarget?.isConnected) {
    focusTarget.focus();
  }

  emit("closeAutoFocus");
  emit("closed");
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && visible.value && props.dismissible) {
    requestClose();
  }
}

function onHeaderMouseDown(event: MouseEvent) {
  if (!props.draggable || props.fullscreen || event.button !== 0) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target?.closest("button, a, input, textarea, select")) {
    return;
  }

  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = dragOffset.value.x;
  const initialY = dragOffset.value.y;

  const onMove = (moveEvent: MouseEvent) => {
    dragOffset.value = {
      x: initialX + moveEvent.clientX - startX,
      y: initialY + moveEvent.clientY - startY,
    };
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

watch(
  mergedOpen,
  (value) => {
    clearTimers();

    if (value) {
      rememberActiveElement();
      if (props.openDelay > 0) {
        openTimer = setTimeout(() => doOpen(), props.openDelay);
      } else {
        doOpen();
      }
      return;
    }

    if (!mounted.value) {
      return;
    }

    if (props.closeDelay > 0) {
      closeTimer = setTimeout(() => doClose(), props.closeDelay);
    } else {
      doClose();
    }
  },
  { immediate: true },
);

watch(
  () => mounted.value && props.lockScroll,
  (locked) => {
    if (typeof document === "undefined") {
      return;
    }

    const body = document.body;
    const html = document.documentElement;
    if (bodyLockTimer) {
      clearTimeout(bodyLockTimer);
      bodyLockTimer = null;
    }

    if (locked) {
      if (!body.hasAttribute("data-scroll-locked")) {
        const scrollbarWidth = window.innerWidth - html.clientWidth;
        initialPaddingState.right = body.style.paddingRight;
        initialPaddingState.overflow = body.style.overflow;
        initialPaddingState.htmlOverflow = html.style.overflow;
        if (scrollbarWidth > 0) {
          body.style.paddingRight = `${scrollbarWidth}px`;
        }
        body.style.overflow = "hidden";
        html.style.overflow = "hidden";
        body.setAttribute("data-scroll-locked", "1");
      } else {
        const lockCount = Number.parseInt(body.getAttribute("data-scroll-locked") || "1", 10);
        body.setAttribute("data-scroll-locked", `${lockCount + 1}`);
      }
      return;
    }

    bodyLockTimer = setTimeout(() => {
      if (!body.hasAttribute("data-scroll-locked")) {
        return;
      }

      const lockCount = Number.parseInt(body.getAttribute("data-scroll-locked") || "1", 10) - 1;
      if (lockCount <= 0) {
        body.style.paddingRight = initialPaddingState.right;
        body.style.overflow = initialPaddingState.overflow;
        html.style.overflow = initialPaddingState.htmlOverflow;
        body.removeAttribute("data-scroll-locked");
      } else {
        body.setAttribute("data-scroll-locked", `${lockCount}`);
      }
    }, 200);
  },
  { immediate: true },
);

watch(
  () => visible.value,
  (value) => {
    if (typeof document === "undefined") {
      return;
    }

    if (value) {
      document.addEventListener("keydown", onKeydown);
      return;
    }

    document.removeEventListener("keydown", onKeydown);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTimers();

  if (bodyLockTimer) {
    clearTimeout(bodyLockTimer);
  }

  if (typeof document !== "undefined") {
    document.removeEventListener("keydown", onKeydown);

    if (props.lockScroll && mounted.value) {
      const body = document.body;
      const html = document.documentElement;
      if (body.hasAttribute("data-scroll-locked")) {
        const lockCount = Number.parseInt(body.getAttribute("data-scroll-locked") || "1", 10) - 1;
        if (lockCount <= 0) {
          body.style.paddingRight = initialPaddingState.right;
          body.style.overflow = initialPaddingState.overflow;
          html.style.overflow = initialPaddingState.htmlOverflow;
          body.removeAttribute("data-scroll-locked");
        } else {
          body.setAttribute("data-scroll-locked", `${lockCount}`);
        }
      }
    }
  }
});

defineExpose({
  open: openDialog,
  close: closeDialog,
});
</script>

<template>
  <div v-if="$slots.default" ref="triggerRef" :class="ui.trigger()" @click="onTriggerClick">
    <slot :open="mergedOpen" />
  </div>

  <Teleport to="body">
    <div v-if="mounted" :class="ui.root()" :style="rootStyle" @wheel="(e) => !props.scrollable && e.preventDefault()">
      <RebornTransition :show="visible" name="fade" :duration="280" :appear="true"
        custom-class="absolute inset-0 transform-gpu">
        <div :class="ui.backdrop()" @click="onBackdropClick" @touchmove.prevent />
      </RebornTransition>

      <RebornTransition :show="visible" name="zoom-in" :duration="250" :appear="true"
        :custom-class="cn(ui.shell(), 'transform-gpu')" @after-enter="onOpened" @after-leave="onClosed">
        <div ref="panelRef" :class="cn(ui.panel(), 'will-change-transform')" :style="panelStyle" tabindex="-1"
          role="dialog" :aria-modal="true" :aria-labelledby="props.title && !$slots.header ? titleId : undefined"
          :aria-describedby="props.description && !$slots.header ? descriptionId : undefined" @click.stop>
          <div v-if="headerVisible" :class="ui.header()" @mousedown="onHeaderMouseDown">
            <div :class="ui.headerContent()">
              <slot name="header" :open="mergedOpen" :close="closeDialog">
                <h3 v-if="props.title" :id="titleId" :class="ui.title()">
                  {{ props.title }}
                </h3>
                <p v-if="props.description" :id="descriptionId" :class="ui.description()">
                  {{ props.description }}
                </p>
              </slot>
            </div>

            <img v-if="close" src="~/assets/images/icon/close.png" alt="" :class="ui.close()" @click="onCloseClick" />
          </div>

          <div :class="ui.body()">
            <slot name="content" :open="mergedOpen" :close="closeDialog" />
          </div>

          <div v-if="footerVisible" :class="ui.footer()">
            <slot name="footer" :open="mergedOpen" :close="closeDialog" :confirm="onConfirmClick"
              :cancel="onCancelClick">
              <RebornButton v-if="normalizedCancelButton" v-bind="normalizedCancelButton" @click="onCancelClick" />
              <RebornButton v-if="normalizedConfirmButton" v-bind="normalizedConfirmButton" @click="onConfirmClick" />
            </slot>
          </div>
        </div>
      </RebornTransition>
    </div>
  </Teleport>
</template>
