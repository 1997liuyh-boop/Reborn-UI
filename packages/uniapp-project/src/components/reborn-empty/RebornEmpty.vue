<script setup lang="ts">
import type { EmptyUI } from './reborn-empty.config'
import { computed, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { EMPTY_DEFAULT_IMAGE, emptyTheme } from './reborn-empty.config'

// 小程序端启用虚拟节点与全局样式类，保证 tailwind 工具类可作用到组件内
defineOptions({
  name: 'RebornEmpty',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<EmptyProps>(), {
  image: '',
  title: '',
  description: '',
  customClass: '',
  ui: () => ({}),
})

export interface EmptyProps {
  /**
   * 图片地址，可以是网络地址、/static 路径或 data URI。留空用内置默认插画；
   * 传 null 时不渲染图片区（除非提供了 image 插槽）
   * @defaultValue ''
   */
  image?: string | null
  /**
   * 图片宽度，高度按原图比例自适应。数字按 rpx 处理，字符串原样写进行内样式（如 '120px'）。
   * 不传时用主题里的默认宽度 96rpx
   */
  imageSize?: number | string
  /**
   * 标题。写了 title 插槽时以插槽为准
   * @defaultValue ''
   */
  title?: string
  /**
   * 描述。写了 description 插槽时以插槽为准
   * @defaultValue ''
   */
  description?: string
  /** 追加到根元素的类名 */
  customClass?: string
  /** 按结构键覆盖各节点样式 */
  ui?: EmptyUI
}

const slots = useSlots()

/**
 * 三段都按需渲染：没内容的段直接不出现在节点树里，
 * 这样段间的 48rpx 间距不会因为空段变成 96rpx。
 */
const showImage = computed(() => props.image !== null || !!slots.image)
const showContent = computed(
  () => !!props.title || !!props.description || !!slots.title || !!slots.description,
)

/** image 留空走内置插画；传 null 表示这一段交给 image 插槽或整段不要 */
const imageSrc = computed(() =>
  props.image === null ? '' : props.image || EMPTY_DEFAULT_IMAGE,
)

/** image-size 只管宽度，高度由 image 的 widthFix 按原图比例推出来 */
const imageStyle = computed(() => {
  const size = props.imageSize
  if (size === undefined || size === '')
    return ''
  return `width:${typeof size === 'number' ? `${size}rpx` : size}`
})

const ui = computed(() => {
  const s = emptyTheme()
  return {
    root: () => s.root({ class: cn(props.ui.root, props.customClass) }),
    image: () => s.image({ class: cn(props.ui.image) }),
    imageGraphic: () => s.imageGraphic({ class: cn(props.ui.imageGraphic) }),
    content: () => s.content({ class: cn(props.ui.content) }),
    title: () => s.title({ class: cn(props.ui.title) }),
    description: () => s.description({ class: cn(props.ui.description) }),
    extra: () => s.extra({ class: cn(props.ui.extra) }),
  }
})
</script>

<template>
  <view :class="ui.root()">
    <view v-if="showImage" :class="ui.image()">
      <slot name="image">
        <!-- widthFix：只认宽度，高度按原图比例算，所以样式里不能给 image 设高 -->
        <image
          v-if="imageSrc"
          :src="imageSrc"
          :class="ui.imageGraphic()"
          :style="imageStyle"
          mode="widthFix"
        />
      </slot>
    </view>

    <view v-if="showContent" :class="ui.content()">
      <view v-if="props.title || slots.title" :class="ui.title()">
        <slot name="title">
          {{ props.title }}
        </slot>
      </view>
      <view v-if="props.description || slots.description" :class="ui.description()">
        <slot name="description">
          {{ props.description }}
        </slot>
      </view>
    </view>

    <view v-if="slots.extra" :class="ui.extra()">
      <slot name="extra" />
    </view>
  </view>
</template>
