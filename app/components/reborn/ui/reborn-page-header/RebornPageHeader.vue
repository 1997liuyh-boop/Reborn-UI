<script setup lang="ts">
import type { Component } from "vue";
import type { PageHeaderUI } from "./reborn-page-header.config";
import { computed } from "vue";
import { cn } from "~/lib/utils";
import { pageHeaderTheme } from "./reborn-page-header.config";

export interface PageHeaderProps {
  /**
   * 返回区的图标：Iconify 图标名或组件；传空字符串不显示图标
   * @defaultValue 'lucide:arrow-left'
   */
  icon?: string | Component;
  /**
   * 主标题；为空时显示「返回」
   * @defaultValue ''
   */
  title?: string;
  /**
   * 标题右侧的内容，与标题之间用竖线分隔；为空且未传 #content 插槽时不渲染分割线
   * @defaultValue ''
   */
  content?: string;
  /** 追加到根容器的类名 */
  class?: any;
  /** 按结构键覆盖各节点样式 */
  ui?: PageHeaderUI;
}

defineOptions({
  name: "RebornPageHeader",
});

const props = withDefaults(defineProps<PageHeaderProps>(), {
  icon: "lucide:arrow-left",
  title: "",
  content: "",
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 点击返回区（图标 + 标题）或在返回区按下 Enter / 空格时触发 */
  back: [event: MouseEvent | KeyboardEvent];
}>();

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" && event.key !== " ")
    return;
  // 空格默认会滚动页面
  event.preventDefault();
  emit("back", event);
}

const ui = computed(() => {
  const s = pageHeaderTheme();
  const o = props.ui;
  return {
    root: () => s.root({ class: cn(o.root, props.class) }),
    breadcrumb: () => s.breadcrumb({ class: o.breadcrumb }),
    header: () => s.header({ class: o.header }),
    left: () => s.left({ class: o.left }),
    back: () => s.back({ class: o.back }),
    icon: () => s.icon({ class: o.icon }),
    title: () => s.title({ class: o.title }),
    divider: () => s.divider({ class: o.divider }),
    content: () => s.content({ class: o.content }),
    extra: () => s.extra({ class: o.extra }),
    main: () => s.main({ class: o.main }),
  };
});
</script>

<template>
  <div :class="ui.root()">
    <div v-if="$slots.breadcrumb" :class="ui.breadcrumb()">
      <slot name="breadcrumb" />
    </div>

    <div :class="ui.header()">
      <div :class="ui.left()">
        <div :class="ui.back()" role="button" tabindex="0" @click="emit('back', $event)" @keydown="handleKeydown">
          <!-- 插槽有无在渲染期判断：slots 不是响应式对象，放进 computed 会一直缓存首次结果 -->
          <div v-if="$slots.icon || icon" :class="ui.icon()" aria-hidden="true">
            <slot name="icon">
              <Icon v-if="typeof icon === 'string'" :name="icon" class="size-6" />
              <component :is="icon" v-else class="size-6" />
            </slot>
          </div>
          <div :class="ui.title()">
            <slot name="title">
              {{ title || '返回' }}
            </slot>
          </div>
        </div>

        <template v-if="$slots.content || content">
          <div :class="ui.divider()" aria-hidden="true" />
          <div :class="ui.content()">
            <slot name="content">
              {{ content }}
            </slot>
          </div>
        </template>
      </div>

      <div v-if="$slots.extra" :class="ui.extra()">
        <slot name="extra" />
      </div>
    </div>

    <div v-if="$slots.default" :class="ui.main()">
      <slot />
    </div>
  </div>
</template>
