<script lang="ts" setup>
/**
 * RebornScrollbar 的内部子组件：只负责渲染纵横两条浮层滚动条。
 *
 * 滚动几何、悬停、滚动淡入与拖拽状态都只在这里读取。父组件渲染时不依赖这些状态，
 * 滚动和悬停只触发本组件更新，父组件的默认插槽不会随之逐帧重跑。
 * 状态对象由父组件持有、引用不变、就地修改字段，作为 prop 传入。
 */
import { computed } from "vue";

/** 单条滚动条的几何状态 */
export interface ScrollbarBarState {
  /** 内容是否溢出，决定该方向滚动条是否存在 */
  active: boolean;
  /** thumb 长度（px） */
  size: number;
  /** thumb 相对轨道起点的偏移（px） */
  offset: number;
}

/** 两条滚动条共用的可变状态 */
export interface ScrollbarBarsState {
  /** 纵向滚动条 */
  y: ScrollbarBarState;
  /** 横向滚动条 */
  x: ScrollbarBarState;
  /** 固定头部偏移下纵轨的 top，undefined 表示沿用 CSS 内缩定位 */
  yTrackTop: string | undefined;
  /** 固定头部偏移或极矮视窗下纵轨的 height，undefined 表示沿用 CSS 内缩定位 */
  yTrackHeight: string | undefined;
  /** 鼠标悬停在容器上 */
  hovering: boolean;
  /** 正在滚动中（非常驻模式的淡入） */
  scrolling: boolean;
  /** 当前正在拖拽的方向，null 表示未拖拽 */
  dragging: "y" | "x" | null;
}

interface Props {
  /** 父组件持有的状态对象 */
  state: ScrollbarBarsState;
  /** 是否常驻显示滚动条 */
  always: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /** 按下轨道空白处 */
  trackDown: [event: MouseEvent, axis: "y" | "x"];
  /** 按下 thumb 开始拖拽 */
  thumbDown: [event: MouseEvent, axis: "y" | "x"];
}>();

/** 滚动条是否可见：常驻、悬停或滚动中，且拖拽过程中始终可见 */
const visible = computed(() =>
  props.always || props.state.hovering || props.state.scrolling || props.state.dragging !== null,
);

const verticalTrackStyle = computed(() => ({
  top: props.state.yTrackTop,
  height: props.state.yTrackHeight,
}));
</script>

<template>
  <!-- 纵向滚动条浮层 -->
  <div
    v-show="state.y.active"
    class="reborn-scrollbar__bar reborn-scrollbar__bar--vertical"
    :class="{ 'is-visible': visible }"
    :style="verticalTrackStyle"
    @mousedown="emit('trackDown', $event, 'y')"
  >
    <div
      class="reborn-scrollbar__thumb"
      :class="{ 'is-dragging': state.dragging === 'y' }"
      :style="{ height: `${state.y.size}px`, transform: `translateY(${state.y.offset}px)` }"
      @mousedown="emit('thumbDown', $event, 'y')"
    />
  </div>

  <!-- 横向滚动条浮层 -->
  <div
    v-show="state.x.active"
    class="reborn-scrollbar__bar reborn-scrollbar__bar--horizontal"
    :class="{ 'is-visible': visible }"
    @mousedown="emit('trackDown', $event, 'x')"
  >
    <div
      class="reborn-scrollbar__thumb"
      :class="{ 'is-dragging': state.dragging === 'x' }"
      :style="{ width: `${state.x.size}px`, transform: `translateX(${state.x.offset}px)` }"
      @mousedown="emit('thumbDown', $event, 'x')"
    />
  </div>
</template>
