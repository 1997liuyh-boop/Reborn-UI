<script setup lang="ts">
/**
 * 演练场参数表单里的单个控件。标签与问号提示由 Playground 的表单项负责，这里只渲染控件本体。
 * 控件类型由配置的 component 决定；值由 Playground 统一持有，这里只读入并派发更新。
 */
import type { PlaygroundControlItem } from "./Playground.vue";
import { tv } from "tailwind-variants";
import { computed } from "vue";
import RebornColorPicker from "~/components/reborn/ui/reborn-color-picker/RebornColorPicker.vue";
import RebornInputNumber from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
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

/** 布尔项在竖排表单里用开关呈现；配置里给勾选框写的 ui / label 对开关无意义，不透传 */
const switchProps = computed(() => {
    const { ui: _ui, label: _label, ...rest } = props.item.props ?? {};
    return rest;
});
</script>

<template>
  <!-- 配置里的 checkbox 即布尔参数：标签已在表单项上，这里只放一个开关 -->
  <RebornSwitch
    v-if="item.component === 'checkbox'"
    :model-value="!!value" v-bind="switchProps" size="lg" :aria-label="item.label"
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
    :model-value="value" v-bind="item.props" class="w-full" size="md"
    @update:model-value="emit('update:value', $event)"
  />
</template>
