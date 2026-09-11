<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants';
import type { ButtonProps } from '../reborn-button/RebornButton.vue';
import type { PopoverContentProps, PopoverProps } from '../reborn-popover/RebornPopover.vue';
import type { PopconfirmUi } from './reborn-popconfirm.config';
import type { Placement, PlacementAlias } from '~/lib/placement';
import { computed, nextTick, ref } from 'vue';
import { resolvePlacement } from '~/lib/placement';
import { tv } from '~/lib/tv';
import RebornButton from '../reborn-button/RebornButton.vue';
import RebornPopover from '../reborn-popover/RebornPopover.vue';
import theme from './reborn-popconfirm.config';

defineOptions({ name: 'RebornPopconfirm' });

const props = withDefaults(defineProps<PopconfirmProps>(), {
  confirmText: '确定', cancelText: '取消', confirmColor: 'primary', cancelColor: 'neutral',
  hideCancel: false, loading: false, arrow: true, portal: true, dismissible: true, defaultOpen: false,
  // placement 不给默认值，保持 undefined 才能识别「未传」并回落到旧的 content 写法。
  placement: undefined, sideOffset: undefined, content: undefined,
});

const emit = defineEmits<{
  /** 点击确认按钮时触发。 */
  (e: 'confirm'): void;
  /** 点击取消按钮时触发。 */
  (e: 'cancel'): void;
}>();

defineSlots<{
  /** 触发元素。 */
  default?: (props: { open: boolean }) => unknown;
  /** 自定义标题内容，优先于 title 属性。 */
  title?: () => unknown;
  /** 自定义描述内容，优先于 description 属性。 */
  description?: () => unknown;
  /** 自定义按钮区，参数提供确认与取消回调。 */
  footer?: (props: { confirm: () => void; cancel: () => void }) => unknown;
}>();

/** 气泡方位取值，与 reborn-tooltip 的 placement 完全一致（含驼峰别名）。 */
export type PopconfirmPlacement = Placement | PlacementAlias;

export interface PopconfirmProps {
  /** 标题文字，14px 标题色（gray-10）。 */
  title?: string;
  /** 描述文字，14px 辅助色（gray-8），与标题间隔 8px。 */
  description?: string;
  /** 确认按钮文字。 */
  confirmText?: string;
  /** 取消按钮文字。 */
  cancelText?: string;
  /** 确认按钮语义色，取值同按钮组件。 */
  confirmColor?: ButtonProps['color'];
  /** 取消按钮语义色，取值同按钮组件。 */
  cancelColor?: ButtonProps['color'];
  /** 隐藏取消按钮，仅保留确认。 */
  hideCancel?: boolean;
  /** 确认按钮加载中；加载时点击确认不会自动关闭气泡，配合 v-model:open 做异步确认。 */
  loading?: boolean;
  /** 出现方向与对齐方式，同时接受驼峰命名别名（topLeft 等），取值与 reborn-tooltip 一致；默认 top（触发器上方居中）。 */
  placement?: PopconfirmPlacement;
  /** 气泡与触发器的间距（px）。 */
  sideOffset?: number;
  /**
   * 旧的定位对象写法（side / align / sideOffset），等价于 placement + sideOffset，仅为兼容保留。
   * @deprecated 请改用 placement / sideOffset。
   */
  content?: PopoverContentProps;
  /** 是否显示指向触发器的箭头。 */
  arrow?: boolean;
  /** 传送目标，false 表示原地渲染。 */
  portal?: boolean | string;
  /** 点击外部是否关闭气泡。 */
  dismissible?: boolean;
  /** 非受控模式的初始显隐。 */
  defaultOpen?: boolean;
  /** 追加到触发器外层容器的类名。 */
  class?: ClassValue;
  /** 结构键样式覆盖；popover 键透传给底层气泡（wrapper/content/arrow 等）。 */
  ui?: PopconfirmUi & { popover?: PopoverProps['ui'] };
}

/** 未传保持 undefined 让底层气泡走非受控逻辑，含 Boolean 的模型必须显式给 undefined 默认值。 */
const open = defineModel<boolean>('open', { default: undefined });

const b = tv(theme);
const styles = b();

/**
 * 底层气泡的定位对象：placement 拆成 side / align 后交给 Popover，
 * 未传 placement 时回落到旧的 content 对象写法，两者都没有则默认在触发器上方居中。
 */
const popoverContent = computed<PopoverContentProps>(() => {
  const legacy = props.content ?? {};
  const { side, align } = props.placement
    ? resolvePlacement(props.placement)
    : { side: legacy.side ?? 'top', align: legacy.align ?? 'center' };

  return { side, align, sideOffset: props.sideOffset ?? legacy.sideOffset ?? 8 };
});

/** 内容内边距固定 12px 写进底层气泡，不依赖 Popover 默认值；调用方覆盖仍然生效。 */
const popoverUi = computed(() => ({
  ...props.ui?.popover,
  // 原阴影仅向下投射，同色背景上顶部轮廓不清；增加四周柔光，同时保留下方投影。
  content: ['p-[12px] shadow-[0_0_8px_rgb(0_0_0/0.12),0_8px_24px_rgb(0_0_0/0.12)]', props.ui?.popover?.content],
}));

const popoverRef = ref<InstanceType<typeof RebornPopover>>();

function close() {
  open.value = false;
  // 非受控且未绑定 v-model 时底层气泡自持状态，需要同步调用其暴露的关闭方法。
  popoverRef.value?.close();
}

function onCancel() {
  emit('cancel');
  close();
}

async function onConfirm() {
  emit('confirm');
  // 事件回调里设置的 loading 要到下一个 tick 才反映到 props，同步读会拿到旧值导致气泡提前关闭。
  await nextTick();
  if (!props.loading) close();
}

defineExpose({
  /** 手动关闭气泡。 */
  close,
});
</script>

<template>
  <RebornPopover
    ref="popoverRef" mode="click" :open="open" :default-open="defaultOpen" :content="popoverContent" :arrow="arrow"
    :portal="portal" :dismissible="dismissible" :class="props.class" :ui="popoverUi"
    @update:open="open = $event"
  >
    <template #default="{ open: isOpen }">
      <slot :open="isOpen" />
    </template>
    <template #content>
      <div data-popconfirm :class="styles.body({ class: props.ui?.body })">
        <div v-if="$slots.title || title || $slots.description || description" :class="styles.header({ class: props.ui?.header })">
          <div v-if="$slots.title || title" data-popconfirm-title :class="styles.title({ class: props.ui?.title })">
            <slot name="title">{{ title }}</slot>
          </div>
          <div v-if="$slots.description || description" data-popconfirm-description :class="styles.description({ class: props.ui?.description })">
            <slot name="description">{{ description }}</slot>
          </div>
        </div>
        <div data-popconfirm-footer :class="styles.footer({ class: props.ui?.footer })">
          <slot name="footer" :confirm="onConfirm" :cancel="onCancel">
            <RebornButton v-if="!hideCancel" size="sm" variant="outlined" :color="cancelColor" @click="onCancel">
              {{ cancelText }}
            </RebornButton>
            <RebornButton size="sm" :color="confirmColor" :loading="loading" @click="onConfirm">
              {{ confirmText }}
            </RebornButton>
          </slot>
        </div>
      </div>
    </template>
  </RebornPopover>
</template>
