<script setup lang="ts">
import type { ResultIcon, ResultUI } from "./reborn-result.config";
import { computed, useSlots } from "vue";
import { cn } from "~/lib/utils";
import { RESULT_ICON_COLOR, RESULT_ICON_NAME, resultTheme } from "./reborn-result.config";

defineOptions({
  name: "RebornResult",
});

const props = withDefaults(defineProps<ResultProps>(), {
  title: "",
  subTitle: "",
  icon: "info",
  ui: () => ({}),
});

export interface ResultProps {
  /**
   * 标题。写了 title 插槽时以插槽为准
   * @defaultValue ''
   */
  title?: string;
  /**
   * 副标题。写了 sub-title 插槽时以插槽为准
   * @defaultValue ''
   */
  subTitle?: string;
  /**
   * 图标类型，决定默认字形与配色。传 null 时不渲染图标区（除非提供了 icon 插槽）
   * @defaultValue 'info'
   */
  icon?: ResultIcon | null;
  /** 追加到根元素的类名 */
  class?: any;
  /** 按结构键覆盖各节点样式 */
  ui?: ResultUI;
}

const slots = useSlots();

/**
 * 三段都按需渲染：没内容的段直接不出现在 DOM 里，
 * 这样段间的 24px 间距不会因为空段变成 48px。
 */
const showIcon = computed(() => props.icon !== null || !!slots.icon);
const showContent = computed(
  () => !!props.title || !!props.subTitle || !!slots.title || !!slots["sub-title"],
);

/** icon 为 null 时底板不着色，交给 icon 插槽自己决定样式 */
const styles = computed(() =>
  resultTheme({
    color: props.icon ? RESULT_ICON_COLOR[props.icon] : undefined,
    bare: props.icon === null,
  }),
);

const ui = computed(() => {
  const s = styles.value;
  return {
    root: () => s.root({ class: cn(props.ui.root, props.class) }),
    icon: () => s.icon({ class: cn(props.ui.icon) }),
    iconGlyph: () => s.iconGlyph({ class: cn(props.ui.iconGlyph) }),
    content: () => s.content({ class: cn(props.ui.content) }),
    title: () => s.title({ class: cn(props.ui.title) }),
    subTitle: () => s.subTitle({ class: cn(props.ui.subTitle) }),
    extra: () => s.extra({ class: cn(props.ui.extra) }),
  };
});
</script>

<template>
  <div :class="ui.root()">
    <div
      v-if="showIcon"
      :class="ui.icon()"
    >
      <slot name="icon">
        <Icon
          v-if="props.icon"
          :name="RESULT_ICON_NAME[props.icon]"
          :class="ui.iconGlyph()"
        />
      </slot>
    </div>

    <div
      v-if="showContent"
      :class="ui.content()"
    >
      <div
        v-if="props.title || slots.title"
        :class="ui.title()"
      >
        <slot name="title">{{ props.title }}</slot>
      </div>
      <div
        v-if="props.subTitle || slots['sub-title']"
        :class="ui.subTitle()"
      >
        <slot name="sub-title">{{ props.subTitle }}</slot>
      </div>
    </div>

    <div
      v-if="slots.extra"
      :class="ui.extra()"
    >
      <slot name="extra" />
    </div>
  </div>
</template>
