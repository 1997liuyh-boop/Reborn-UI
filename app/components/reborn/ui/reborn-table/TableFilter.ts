import type { PropType } from 'vue';
import type { TableColumn, TableFilter } from './table.types';
import { defineComponent, h, ref, shallowRef } from 'vue';
import RebornButton from '../reborn-button/RebornButton.vue';
import RebornCheckbox from '../reborn-checkbox/RebornCheckbox.vue';
import RebornPopover from '../reborn-popover/RebornPopover.vue';

/** 筛选面板先编辑草稿，确认后统一提交；弹层传送到 body，避免被滚动区域裁切。 */
export default defineComponent({
  name: 'RebornTableFilter',
  props: {
    column: { type: Object as PropType<TableColumn>, required: true },
    values: { type: Array as PropType<TableFilter['value'][]>, required: true },
    disabled: Boolean,
  },
  emits: { apply: (_values: TableFilter['value'][]) => true },
  setup(props, { emit }) {
    const open = shallowRef(false);
    const draft = ref<TableFilter['value'][]>([]);
    function changeOpen(value: boolean) {
      if (props.disabled) return;
      if (value) draft.value = [...props.values];
      open.value = value;
    }
    function apply(values = draft.value) {
      if (props.disabled) return;
      emit('apply', values);
      open.value = false;
    }
    return () => h(RebornPopover, {
      open: open.value, 'onUpdate:open': changeOpen, portal: true,
      placement: 'bottom-start', sideOffset: 4,
      ui: { content: 'p-3' },
    }, {
      default: () => h('button', {
        type: 'button', disabled: props.disabled, 'aria-label': `筛选${props.column.label ?? ''}`,
        'aria-expanded': open.value, 'aria-haspopup': 'dialog',
        class: ['inline-flex size-6 shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-primary', props.values.length ? 'text-primary' : 'text-gray-5 hover:text-gray-8'],
      }, [h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'aria-hidden': 'true' }, [h('path', { d: 'M4 5h16l-6 7v7l-4-2v-5z' })])]),
      content: () => h('div', { role: 'dialog', 'aria-label': `筛选${props.column.label ?? ''}`, class: 'min-w-[160px] text-base' }, [
        h('div', { class: 'flex max-h-[240px] flex-col gap-2 overflow-y-auto' }, props.column.filters?.map(option => h(RebornCheckbox, {
          key: `${typeof option.value}:${option.value}`, label: option.text, modelValue: draft.value.includes(option.value),
          'onUpdate:modelValue': (checked: unknown) => {
            if (props.column.filterMultiple === false) draft.value = checked ? [option.value] : [];
            else draft.value = checked ? [...draft.value, option.value] : draft.value.filter(value => value !== option.value);
          },
        }))),
        h('div', { class: 'mt-3 flex justify-between gap-3 border-t border-gray-3 pt-2' }, [
          h(RebornButton, { size: 'sm', variant: 'text', onClick: () => apply([]) }, () => '重置'),
          h(RebornButton, { size: 'sm', onClick: () => apply() }, () => '确定'),
        ]),
      ]),
    });
  },
});
