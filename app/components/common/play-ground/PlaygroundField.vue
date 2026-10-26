<script setup lang="ts">
/**
 * 演练场里的单个控件：输入类上方显示标签，勾选项直接显示为整行可点的状态控件。
 * 控件类型由配置的 component 决定；值由 Playground 统一持有，这里只读入并派发更新。
 */
import type { PlaygroundControlItem } from "./Playground.vue";
import { tv } from "tailwind-variants";
import { computed } from "vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornColorPicker from "~/components/reborn/ui/reborn-color-picker/RebornColorPicker.vue";
import RebornInputNumber from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue";
import config from "./play-ground.config";

interface PlaygroundFieldProps {
    /** 控件配置；select 的选项已由 Playground 归一化到 normalizedProps */
    item: PlaygroundControlItem & { normalizedProps?: Record<string, any> };
    /** 当前值 */
    value: any;
}

const props = defineProps<PlaygroundFieldProps>();

const emit = defineEmits<{
    /** 控件改值 */
    "update:value": [value: any];
}>();

const ui = computed(() => tv(config)());
</script>

<template>
  <label v-if="item.component !== 'checkbox'" :class="ui.fieldLabel()">
    {{ item.label }}
    <span v-if="item.component === 'slider'" :class="ui.fieldValue()">
      {{ value }}
    </span>
  </label>
  <RebornCheckbox
    v-if="item.component === 'checkbox'"
    :model-value="value" :label="item.label" v-bind="item.props" size="sm"
    :ui="{ ...item.props?.ui, wrapper: ui.checkboxControl(), label: ui.checkboxLabel(), control: ui.checkboxIndicator() }"
    @update:model-value="emit('update:value', $event)"
  />
  <!-- 兼容历史 demo 误传 items：RebornSelect 正式字段是 options -->
  <RebornSelect
    v-else-if="item.component === 'select'"
    :model-value="value" v-bind="props.item.normalizedProps" class="w-full" size="md"
    @update:model-value="emit('update:value', $event)"
  />
  <RebornInput
    v-else-if="item.component === 'input'"
    :model-value="value" v-bind="item.props" size="md"
    @update:model-value="emit('update:value', $event)"
  />
  <div v-else-if="item.component === 'slider'" :class="ui.sliderControl()">
    <RebornSlider
      :model-value="value" v-bind="item.props" class="w-full" size="md"
      @update:model-value="emit('update:value', $event)"
    />
  </div>
  <RebornColorPicker
    v-else-if="item.component === 'color-picker'"
    :model-value="value" v-bind="item.props" size="md"
    @update:model-value="emit('update:value', $event)"
  />
  <RebornInputNumber
    v-else-if="item.component === 'input-number'"
    :model-value="value" v-bind="item.props" size="md"
    @update:model-value="emit('update:value', $event)"
  />
</template>
