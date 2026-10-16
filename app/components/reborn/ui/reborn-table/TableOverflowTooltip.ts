import type { ClassValue } from 'tailwind-variants';
import type { PropType } from 'vue';
import type { TableCellScope, TableTooltipFormatter, TableTooltipOptions, TableTooltipScope } from './table.types';
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { cn } from '~/lib/utils';
import RebornTooltip from '../reborn-tooltip/RebornTooltip.vue';

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
    const anchor = ref<HTMLElement>();
    const element = ref<HTMLElement>();
    const tooltip = ref<InstanceType<typeof RebornTooltip>>();
    const activated = ref(false);
    const overflow = ref(false);
    const content = ref('');
    const describedBy = ref<string>();
    const disabled = computed(() => props.disabled || props.options.disabled || !overflow.value);
    const scope = computed<TableTooltipScope>(() => ({ ...props.scope, cellValue: props.cellValue, content: content.value }));
    let observer: ResizeObserver | undefined;
    let contentObserver: MutationObserver | undefined;
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
      if (typeof ResizeObserver !== 'undefined' && element.value) {
        observer = new ResizeObserver(measure);
        observer.observe(element.value);
      }
      // 插槽子组件能独立更新而不触发本层 updated，且截断容器尺寸可能完全不变。
      if (typeof MutationObserver !== 'undefined' && element.value) {
        contentObserver = new MutationObserver(measure);
        contentObserver.observe(element.value, { childList: true, characterData: true, subtree: true });
      }
    });
    onUpdated(measure);
    onBeforeUnmount(() => { disposed = true; observer?.disconnect(); contentObserver?.disconnect(); });

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
