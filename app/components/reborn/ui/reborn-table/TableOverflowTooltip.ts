import type { ClassValue } from 'tailwind-variants';
import type { PropType } from 'vue';
import type { TableCellScope, TableTooltipFormatter, TableTooltipOptions, TableTooltipScope } from './table.types';
import { computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, onUpdated, shallowRef } from 'vue';
import { cn } from '~/lib/utils';
import RebornTooltip from '../reborn-tooltip/RebornTooltip.vue';
import { TABLE_OVERFLOW_KEY } from './table.overflow';

/** 只为溢出的普通单元格提供提示，文本取自实际渲染结果而非原始字段。 */
export default defineComponent({
  name: 'TableOverflowTooltip',
  props: {
    scope: { type: Object as PropType<TableCellScope>, required: true },
    cellValue: { type: null },
    options: { type: Object as PropType<TableTooltipOptions>, default: () => ({}) },
    formatter: Function as PropType<TableTooltipFormatter>,
    contentClass: { type: [String, Array, Object] as PropType<ClassValue> },
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const anchor = shallowRef<HTMLElement>();
    const element = shallowRef<HTMLElement>();
    const tooltip = shallowRef<InstanceType<typeof RebornTooltip>>();
    const activated = shallowRef(false);
    const overflow = shallowRef(false);
    const content = shallowRef('');
    const describedBy = shallowRef<string>();
    const disabled = computed(() => props.disabled || props.options.disabled || !overflow.value);
    const scope = computed<TableTooltipScope>(() => ({ ...props.scope, cellValue: props.cellValue, content: content.value }));
    let observer: ResizeObserver | undefined;
    const registry = inject(TABLE_OVERFLOW_KEY, null);
    let unregister: (() => void) | undefined;
    let hovered = false;
    let focused = false;
    let disposed = false;

    function measure() {
      const node = element.value;
      if (!node) return;
      overflow.value = node.clientWidth > 0 && (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight);
      content.value = node.textContent ?? '';
    }
    function open() {
      measure();
      if (disabled.value) return;
      // 表格可能有数百个溢出单元格，仅在首次交互时创建完整浮层实例。
      activated.value = true;
      // 同一事件中先更新 disabled，再走 Tooltip 自身的延时与焦点逻辑。
      nextTick(() => { if (!disposed && (hovered || focused) && !disabled.value) tooltip.value?.open(); });
    }
    onMounted(() => {
      measure();
      if (registry && element.value) unregister = registry.observe(element.value, measure);
      else if (typeof ResizeObserver !== 'undefined' && element.value) {
        observer = new ResizeObserver(measure);
        observer.observe(element.value);
      }
    });
    // 首次交互会重新测量；仅已创建提示的单元格跟随内容更新，避免整表反复读布局。
    onUpdated(() => { if (activated.value) measure(); });
    onBeforeUnmount(() => { disposed = true; observer?.disconnect(); unregister?.(); });

    return () => h('span', {
      ref: anchor, class: cn('block min-w-0 w-full', props.options.ui?.wrapper),
      onMouseenter: () => { hovered = true; open(); },
      onMouseleave: () => { hovered = false; },
      onFocusin: () => { focused = true; open(); },
      onFocusout: () => { focused = false; },
    }, [
      // 触发元素始终保留，按需创建浮层不会重挂载插槽或打断键盘焦点。
      h('span', { class: cn('block min-w-0 w-full max-w-full', props.options.ui?.trigger) }, [
        h('span', { ref: element, 'data-table-overflow': '', class: cn('block truncate', props.contentClass), tabindex: !disabled.value ? 0 : undefined, 'aria-describedby': describedBy.value }, slots.default?.()),
      ]),
      activated.value ? h(RebornTooltip, {
        ...props.options, ref: tooltip, disabled: disabled.value, trigger: ['hover', 'focus'],
        virtualTriggering: true, virtualRef: anchor.value,
        // 虚拟触发器关联在外层，实际可聚焦的文本也需要同一描述。
        onOpen: () => nextTick(() => { if (!disposed) describedBy.value = anchor.value?.getAttribute('aria-describedby') ?? undefined; }),
        onClose: () => { describedBy.value = undefined; },
      }, { content: () => slots.content?.(scope.value) ?? props.formatter?.(scope.value) ?? content.value }) : null,
    ]);
  },
});
