<script setup lang="ts">
import type { EmptyUI } from "./reborn-empty.config";
import { computed, useSlots } from "vue";
import { cn } from "~/lib/utils";
import { EMPTY_DEFAULT_IMAGE, emptyTheme } from "./reborn-empty.config";

defineOptions({
  name: "RebornEmpty",
});

const props = withDefaults(defineProps<EmptyProps>(), {
  image: "",
  title: "",
  description: "",
  ui: () => ({}),
});

export interface EmptyProps {
  /**
   * 图片地址，可以是 URL、站内路径或 data URI。留空用内置默认插画；
   * 传 null 时不渲染图片区（除非提供了 image 插槽）
   * @defaultValue ''
   */
  image?: string | null;
  /**
   * 图片宽度，高度按原图比例自适应。数字按 px 处理，字符串原样写进行内样式（如 '6rem'）。
   * 不传时用主题里的默认宽度 48px
   */
  imageSize?: number | string;
  /**
   * 标题。写了 title 插槽时以插槽为准
   * @defaultValue ''
   */
  title?: string;
  /**
   * 描述。写了 description 插槽时以插槽为准
   * @defaultValue ''
   */
  description?: string;
  /** 追加到根元素的类名 */
  class?: any;
  /** 按结构键覆盖各节点样式 */
  ui?: EmptyUI;
}

const slots = useSlots();

/**
 * 三段都按需渲染：没内容的段直接不出现在 DOM 里，
 * 这样段间的 24px 间距不会因为空段变成 48px。
 */
const showImage = computed(() => props.image !== null || !!slots.image);
const showContent = computed(
  () => !!props.title || !!props.description || !!slots.title || !!slots.description,
);

/** image 留空走内置插画；传 null 表示这一段交给 image 插槽或整段不要 */
const imageSrc = computed(() =>
  props.image === null ? "" : props.image || EMPTY_DEFAULT_IMAGE,
);

/** image-size 只管宽度，高度由 h-auto 按原图比例推出来 */
const imageStyle = computed(() => {
  const size = props.imageSize;
  if (size === undefined || size === "")
    return undefined;
  return { width: typeof size === "number" ? `${size}px` : size };
});

const ui = computed(() => {
  const s = emptyTheme();
  return {
    root: () => s.root({ class: cn(props.ui.root, props.class) }),
    image: () => s.image({ class: cn(props.ui.image) }),
    imageGraphic: () => s.imageGraphic({ class: cn(props.ui.imageGraphic) }),
    content: () => s.content({ class: cn(props.ui.content) }),
    title: () => s.title({ class: cn(props.ui.title) }),
    description: () => s.description({ class: cn(props.ui.description) }),
    extra: () => s.extra({ class: cn(props.ui.extra) }),
  };
});
</script>

<template>
  <div :class="ui.root()">
    <div
      v-if="showImage"
      :class="ui.image()"
    >
      <slot name="image">
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :class="ui.imageGraphic()"
          :style="imageStyle"
          alt=""
        >
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
        v-if="props.description || slots.description"
        :class="ui.description()"
      >
        <slot name="description">{{ props.description }}</slot>
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
