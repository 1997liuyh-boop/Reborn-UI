<template>
  <!-- 弹窗根容器，使用 Teleport 决定是否挂载到 body -->
  <Teleport :to="teleportedTarget" :disabled="!isTeleported">
    <!-- 遮罩层组件 -->
    <RebornOverlay v-if="rendered && actualModal" :model-value="overlayVisible" :z-index="actualZIndex"
      :close-on-click-overlay="actualCloseOnClick && (!modalPenetrable || actualModal)" :lock-scroll="lockScroll"
      :custom-class="computedOverlayClass" :custom-style="computedOverlayStyle" @update:model-value="handleOverlayClick"
      @after-leave="onOverlayClosed" />

    <!-- 弹出层面板过渡动画 -->
    <!-- 居中位置使用 Flex 容器辅助，避免 transform 冲突 -->
    <!-- 弹出层容器：居中时使用 Flex 容器辅助以隔离 transform 冲突，非居中时作为透明包装器 -->
    <div v-if="rendered" :class="ui.wrapper()" :style="`z-index:${actualZIndex + 1}`">
      <RebornTransition class="pointer-events-auto" :show="modelValue" :name="transitionName" :duration="duration"
        :appear="true" :lazy-render="lazyRender"
        :custom-class="ui.root({ class: [props.class, props.customClass], round: props.round })"
        :custom-style="`${panelRootStyle}; ${customStyle}`" @after-enter="onOpened" @after-leave="onClosed">
        <!-- 缩放拉伸把手 (仅非居中位置可用) -->
        <div v-if="resizable && actualPosition !== 'center'" :class="ui.resizer()" @mousedown="onDragStart"
          @touchstart="onDragStart" />

        <header v-if="showHeader" :class="[ui.header(), headerClass]" :aria-level="headerAriaLevel">
          <slot name="header">
            <span :class="ui.title()" role="heading">{{ title }}</span>
          </slot>
          <RebornButton v-if="showClose" variant="soft" @click="handleClose" :class="ui.closeBtn()" color="neutral"
            circle>
            <Icon name="lucide:x" class="w-5 h-5" />
          </RebornButton>
        </header>

        <div :class="[ui.body(), bodyClass]" v-if="contentRendered">
          <slot />
        </div>

        <footer v-if="$slots.footer" :class="[ui.footer(), footerClass]">
          <slot name="footer" />
        </footer>
      </RebornTransition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import RebornOverlay from '../reborn-overlay/RebornOverlay.vue';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import type { TransitionName } from '../reborn-transition/reborn-transition.config';
import theme from './reborn-popup.config';
import { tv } from '~/lib/tv';

export interface RebornPopupProps {
  /** 是否将弹出层插入至 body 节点 */
  appendToBody?: boolean;
  /** 指定弹出层插入的节点 */
  appendTo?: string | HTMLElement;
  /** 是否在出现时将 body 滚动锁定 */
  lockScroll?: boolean;
  /** 关闭前的回调，会暂停关闭 */
  beforeClose?: (done: (cancel?: boolean) => void) => void;
  /** 是否可以通过点击遮罩层关闭 */
  closeOnClickModal?: boolean;
  /** 是否可以通过点击遮罩层关闭 (别名) */
  maskClosable?: boolean;
  /** 是否可以通过按下 ESC 键关闭 */
  closeOnPressEscape?: boolean;
  /** 开启延迟，单位毫秒 */
  openDelay?: number;
  /** 关闭延迟，单位毫秒 */
  closeDelay?: number;
  /** 关闭时是否销毁内部元素 */
  destroyOnClose?: boolean;
  /** 是否需要遮罩层 */
  modal?: boolean;
  /** 是否需要遮罩层 (别名) */
  showMask?: boolean;
  /** 遮罩层是否可穿透（即不处理任何鼠标事件） */
  modalPenetrable?: boolean;
  /** 弹出层的位置，支持 top, bottom, left, right, center */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** 自定义过渡动画名称 */
  transition?: string;
  /** 是否可以通过拖拽调整大小 */
  resizable?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 弹出层的大小（宽度或高度，取决于方向） */
  size?: number | string;
  /** 弹出层的标题 */
  title?: string;
  /** 是否显示头部（包含标题和关闭按钮） */
  showHeader?: boolean;
  /** 是否显示遮罩层对应的圆角 */
  round?: boolean;
  /** 遮罩层的自定义类名 */
  modalClass?: string;
  /** 根元素的自定义类名 (别名) */
  customClass?: string;
  /** 根元素的自定义样式 (别名) */
  customStyle?: string;
  /** 遮罩层的自定义样式 */
  modalStyle?: string;
  /** 头部的自定义类名 */
  headerClass?: string;
  /** 内容主体的自定义类名 */
  bodyClass?: string;
  /** 底部页脚的自定义类名 */
  footerClass?: string;
  /** 弹出层的层级 z-index */
  zIndex?: number;
  /** 弹出层的层级 z-index (别名) */
  overlayZIndex?: number;
  /** 动画时长 (单位ms) */
  duration?: number;
  /** 是否开启底部安全区域适配 */
  safeAreaInsetBottom?: boolean;
  /** 是否开启顶部安全区域适配 */
  safeAreaInsetTop?: boolean;
  /** 是否在显示时才渲染内容 */
  lazyRender?: boolean;
  /** 头部标题的 aria-level 属性 */
  headerAriaLevel?: string;
  /** 自定义根元素类名 */
  class?: any;
}

/** 是否显示弹出层 */
const modelValue = defineModel<boolean>({ default: false });

const props = withDefaults(defineProps<RebornPopupProps>(), {
  appendToBody: false,
  appendTo: 'body',
  lockScroll: true,
  closeOnClickModal: true,
  maskClosable: undefined,
  closeOnPressEscape: true,
  openDelay: 0,
  closeDelay: 0,
  destroyOnClose: false,
  modal: true,
  showMask: undefined,
  modalPenetrable: false,
  position: 'bottom',
  transition: '',
  resizable: false,
  showClose: true,
  size: '30%',
  title: '',
  showHeader: true,
  round: true,
  modalClass: '',
  modalStyle: '',
  customClass: '',
  customStyle: '',
  headerClass: '',
  bodyClass: '',
  footerClass: '',
  zIndex: 2000,
  overlayZIndex: 0,
  duration: 350,
  safeAreaInsetBottom: true,
  safeAreaInsetTop: true,
  lazyRender: true,
  headerAriaLevel: '2'
});

const emit = defineEmits<{
  /** 打开弹出层 */
  (e: 'open'): void;
  /** 已打开弹出层 */
  (e: 'opened'): void;
  /** 关闭弹出层 */
  (e: 'close'): void;
  /** 已关闭弹出层 */
  (e: 'closed'): void;
  /** 点击遮罩层 */
  (e: 'click-modal'): void;
  /** 自动聚焦至打开状态 */
  (e: 'open-auto-focus'): void;
  /** 自动聚焦至关闭状态 */
  (e: 'close-auto-focus'): void;
  /** 开始拖拽缩放 */
  (e: 'resize-start'): void;
  /** 拖拽缩放中 */
  (e: 'resize', size: number): void;
  /** 结束拖拽缩放 */
  (e: 'resize-end'): void;
}>();

const overlayVisible = ref(false);
const rendered = ref(false);
const contentRendered = ref(false);
let openTimer: any = null;
let closeTimer: any = null;
let closeFallbackTimer: any = null;

const teleportedTarget = computed(() => {
  if (props.appendTo && props.appendTo !== 'body') return props.appendTo as any;
  return 'body';
});

const isTeleported = computed(() => {
  if (props.appendTo && props.appendTo !== 'body') return true;
  return props.appendToBody;
});

const actualPosition = computed(() => props.position);
const actualModal = computed(() => props.showMask ?? props.modal);
const actualCloseOnClick = computed(() => props.maskClosable ?? props.closeOnClickModal);
const actualZIndex = computed(() => props.overlayZIndex || props.zIndex);

const transitionName = computed<TransitionName>(() => {
  if (props.transition) return props.transition as TransitionName;
  // 特殊处理 center，因为 slide-center 不存在，只有 popup-center
  if (actualPosition.value === 'center') return 'zoom-in';
  if (actualPosition.value === 'top') return 'slide-down';
  if (actualPosition.value === 'bottom') return 'slide-up';
  return `slide-${actualPosition.value}` as TransitionName;
});

const ui = computed(() => {
  return tv(theme)({ position: actualPosition.value as any });
});

const computedOverlayClass = computed(() => {
  let classes = props.modalClass || '';
  if (!actualModal.value) {
    classes += ' !bg-transparent';
    if (props.modalPenetrable) {
      classes += ' pointer-events-none';
    }
  }
  return classes;
});

const computedOverlayStyle = computed(() => {
  return props.modalStyle || '';
});

// 尺寸和缩放逻辑
const dynamicSize = ref<string | null>(null);
const isResizing = ref(false);

const isHorizontal = computed(() => actualPosition.value === 'left' || actualPosition.value === 'right');
const targetSize = computed(() => dynamicSize.value ?? (typeof props.size === 'number' ? `${props.size}px` : props.size));

const panelRootStyle = computed(() => {
  let style = '';
  if (isHorizontal.value || actualPosition.value === 'center') {
    style = `width:${targetSize.value};`;
  } else {
    style = `height:${targetSize.value};`;
  }

  // 安全区域适配 (针对移动端 Web)
  if (props.safeAreaInsetTop && actualPosition.value === 'top') {
    style += 'padding-top:env(safe-area-inset-top);';
  }
  if (props.safeAreaInsetBottom && actualPosition.value === 'bottom') {
    style += 'padding-bottom:env(safe-area-inset-bottom);';
  }

  return style;
});


// 缩放处理器
const onDragStart = (e: MouseEvent | TouchEvent) => {
  if (!props.resizable || actualPosition.value === 'center') return;
  e.preventDefault();
  isResizing.value = true;
  emit('resize-start');

  let startPos = 0;
  if ('touches' in e && (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
    const touchEvent = e as TouchEvent;
    startPos = (actualPosition.value === 'left' || actualPosition.value === 'right') ? touchEvent.touches[0]!.clientX : touchEvent.touches[0]!.clientY;
  } else if ('clientX' in e) {
    const mouseEvent = e as MouseEvent;
    startPos = (actualPosition.value === 'left' || actualPosition.value === 'right') ? mouseEvent.clientX : mouseEvent.clientY;
  }

  // 解析当前计算出的尺寸基准
  let startSize = 0;
  if (targetSize.value.endsWith('px')) {
    startSize = parseFloat(targetSize.value);
  } else {
    // 如果是百分比，则粗略回退计算基准
    startSize = isHorizontal.value ? window.innerWidth * (parseFloat(targetSize.value) / 100) : window.innerHeight * (parseFloat(targetSize.value) / 100);
  }

  let animationFrameId: number;

  const onMove = (moveEvent: MouseEvent | TouchEvent) => {
    if (!isResizing.value) return;

    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(() => {
      let currentPos = 0;
      if ('touches' in moveEvent && (moveEvent as TouchEvent).touches && (moveEvent as TouchEvent).touches.length > 0) {
        const touchEvent = moveEvent as TouchEvent;
        currentPos = (actualPosition.value === 'left' || actualPosition.value === 'right') ? touchEvent.touches[0]!.clientX : touchEvent.touches[0]!.clientY;
      } else if ('clientX' in moveEvent) {
        const mouseEvent = moveEvent as MouseEvent;
        currentPos = (actualPosition.value === 'left' || actualPosition.value === 'right') ? mouseEvent.clientX : mouseEvent.clientY;
      }

      let diff = currentPos - startPos;
      if (actualPosition.value === 'right' || actualPosition.value === 'bottom') {
        diff = -diff;
      }

      const newSize = Math.max(100, Math.min(window.innerWidth, startSize + diff));
      dynamicSize.value = `${newSize}px`;
      emit('resize', newSize);

      // 在拖拽期间立即更新行内样式，不等待过渡跟踪包装器，因为它会覆盖。
      const popupEl = document.querySelector('.reborn-popup-wrapper') as HTMLElement; // 这里写法略简陋，后续可优化
    });
  };

  const importEnd = () => {
    isResizing.value = false;
    emit('resize-end');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', importEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', importEnd);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', importEnd);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', importEnd);
};

const doOpen = () => {
  if (overlayVisible.value) return;
  clearTimeout(closeFallbackTimer);
  rendered.value = true;
  contentRendered.value = true;
  overlayVisible.value = true;
  emit('open');
};

const doClose = () => {
  if (!overlayVisible.value && !rendered.value) return;
  // 保持 overlayVisible 为 true，使遮罩层 DOM 保持渲染，
  // 直到弹出层面板的离开过渡动画播放完成。
  // 它将在动画结束后通过 onClosed() 设置为 false。
  emit('close');

  // 增加冗余回调，确保即使 Transition 组件在某些环境下未触发 after-leave，也能关闭遮罩层
  clearTimeout(closeFallbackTimer);
  closeFallbackTimer = setTimeout(() => {
    if (overlayVisible.value) {
      onClosed();
    }
  }, (typeof props.duration === 'number' ? props.duration : 350) + 100);
};

watch(modelValue, (val) => {
  if (val) {
    clearTimeout(closeTimer);
    if (props.openDelay && props.openDelay > 0) {
      openTimer = setTimeout(() => doOpen(), props.openDelay);
    } else {
      doOpen();
    }
  } else {
    clearTimeout(openTimer);
    if (props.closeDelay && props.closeDelay > 0) {
      closeTimer = setTimeout(() => doClose(), props.closeDelay);
    } else {
      doClose();
    }
  }
}, { immediate: true });

const handleClose = () => {
  if (props.beforeClose) {
    props.beforeClose((cancel?: boolean) => {
      if (!cancel) {
        modelValue.value = false;
      }
    });
  } else {
    modelValue.value = false;
  }
};

const handleOverlayClick = (val: boolean) => {
  if (!val) {
    emit('click-modal');
    if (actualCloseOnClick.value) {
      if (!props.modalPenetrable || actualModal.value) {
        handleClose();
      }
    }
  }
};

const onOpened = () => {
  emit('opened');
  emit('open-auto-focus');
};

const onClosed = () => {
  if (!overlayVisible.value) return;
  // 弹出层面板的离开过渡动画现已完成，
  // 现在隐藏遮罩层使其淡出。
  clearTimeout(closeFallbackTimer);
  overlayVisible.value = false;
  if (!actualModal.value) {
    rendered.value = false;
  }
  emit('closed');
  emit('close-auto-focus');
  dynamicSize.value = null;
  if (props.destroyOnClose) {
    contentRendered.value = false;
  }
};

const onOverlayClosed = () => {
  if (props.destroyOnClose) {
    rendered.value = false;
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.closeOnPressEscape && modelValue.value) {
    handleClose();
  }
};

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  clearTimeout(closeFallbackTimer);
});

defineExpose({
  handleClose
});
</script>
