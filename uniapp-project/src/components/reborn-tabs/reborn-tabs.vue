<script setup lang="ts">
import { computed, ref, watch, onMounted, getCurrentInstance, nextTick, type PropType } from "vue";
import { tv } from '@/lib/tv';
import { cn } from '@/lib/utils';
import theme, { tabsOrientations, tabsSizes, tabsTypes, tabsVariants } from "./reborn-tabs.config";

defineOptions({
  name: "reborn-tabs",
  inheritAttrs: false,
});

const b = tv(theme);

export interface TabsItem {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  modelValue?: string | number;
  list?: TabsItem[];
  type?: typeof tabsTypes[number];
  size?: typeof tabsSizes[number];
  variant?: typeof tabsVariants[number];
  orientation?: typeof tabsOrientations[number];
  fill?: boolean;
  disabled?: boolean;
  class?: any;
}

const props = withDefaults(defineProps<TabsProps>(), {
  list: () => [],
  type: "line",
  size: "md",
  variant: "primary",
  orientation: "horizontal",
  fill: false,
  disabled: false,
});

const emit = defineEmits(["update:modelValue", "change"]);
const { proxy } = getCurrentInstance()!;

const active = ref(props.modelValue);
const itemRects = ref<any[]>([]);
const tabRect = ref<any>({ left: 0, top: 0, width: 0, height: 0 });
const indicatorStyle = ref({});
const scrollLeft = ref(0);
const scrollTop = ref(0);

const ui = computed(() => {
  const styles = b({
    type: props.type,
    size: props.size,
    variant: props.variant,
    orientation: props.orientation,
    fill: props.fill
  });

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class) }),
    list: (opts?: { class?: any }) => styles.list({ class: cn(opts?.class) }),
    item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class) }),
    text: (opts?: { class?: any }) => styles.text({ class: cn(opts?.class) }),
    indicator: (opts?: { class?: any }) => styles.indicator({ class: cn(opts?.class) }),
    content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class) }),
    scroll: (opts?: { class?: any }) => styles.scroll({ class: cn(opts?.class) }),
  };
});

// Update logic extracted from cl-tabs
function getRects() {
  uni.createSelectorQuery()
    .in(proxy)
    .selectAll(".rb-tabs__item")
    .boundingClientRect((res) => {
      if (Array.isArray(res)) {
        itemRects.value = res;
        updateIndicator();
      }
    })
    .exec();
}

function updateContainerRect() {
  uni.createSelectorQuery()
    .in(proxy)
    .select(".rb-tabs__list") // Measure the scroll container/list
    .boundingClientRect((res) => {
      if (res) {
        tabRect.value = res;
        getRects();
      }
    })
    .exec();
}

function updateIndicator() {
  if (itemRects.value.length === 0) return;

  const index = props.list.findIndex(item => item.value === active.value);
  if (index === -1) return;

  const item = itemRects.value[index];
  const container = tabRect.value;

  // Relative position
  // Since item.left is relative to viewport usually in SelectorQuery unless customized?
  // Actually SelectorQuery returns viewport relative coordinates.
  // So relative left = item.left - container.left + scrollLeft of container (if separate).
  // But here we might just need relative position in the flex container.
  // If container is relative, indicator is absolute.
  // We need 'left' relative to container.

  // In cl-tabs logic: x = item.left - tabLeft ... 

  let left = item.left - container.left;
  let top = item.top - container.top;

  // Update scroll position to center the item
  if (props.orientation === 'horizontal') {
    // Center: left - (containerWidth/2) + (itemWidth/2)
    // Add current scrollLeft to calculate target scroll position?
    // Actually scroll-view :scroll-left expects absolute scroll value.
    // We know item.left is viewport relative. 
    // We probably need to track scroll state or just approximate.
    // Actually if we use scroll-into-view it's easier.
    // But for indicator we need pixel values.

    // Wait, cl-tabs sets `scrollLeft.value`.
    // x = item.left - (tabWidth - itemWidth) / 2 - tabLeft.
    // But item.left changes as we scroll? 
    // Only if we re-measure?
    // SelectorQuery returns current position.

    // For indicator:
    // logic: `transform: translateX(...)`
    // We need the offset from the start of the list content.
    // Because the indicator is inside the scrolling container? 
    // cl-tabs puts indicator INSIDE scroll-view -> view -> inner.
    // Yes, if indicator is inside the scrollable content, it moves with it.
    // So we just need its position relative to the first item (left=0).
    // Since `item.left` is screen relative, `item.left - container.left` gives visual offset.
    // But if container is scrolled, visual offset is smaller than actual offset from content start.
    // BUT `cl-tabs` re-calculates on mount/update. 

    // Let's assume the indicator is inside `rb-tabs__list`.
    // If sticky or scrollable, `left` style should be `(item.left - items[0].left)`.

    if (itemRects.value.length > 0) {
      const firstItem = itemRects.value[0];
      // If we scroll, firstItem.left changes. 
      // Ideally we want relative to the list container's content origin.
      // If index=0, left=0.
      // If index=1, left = item1.width.

      // Simplest way: sum widths of previous items + gutters?
      // Or use `offsetLeft` if available (not in uni-app v2 easily).

      // Let's use the difference from the first item, assuming first item is at 0 (or padding).
      // But if scrolled, first item might be off screen (negative relative to container).

      // cl-tabs logic:
      // sliderLeft = item.left - tabLeft. 
      // This assumes `sliderLeft` is relative to `tabLeft`.
      // AND the slider is inside a container that DOES NOT SCROLL itself but is transformed? 
      // In cl-tabs: `scroll-view` > `view class="cl-tabs__inner"` > `slider`.
      // If `cl-tabs__inner` is the scroll content, then `slider` moves with items.
      // Then `sliderLeft` should be relative to `cl-tabs__inner` start.

      // To get absolute offset in scroll view:
      // Can we use `item.dataset` or just index?
      // Actually, `item.left - container.left` gives visual position.
      // If we add `currentScrollLeft`, we get absolute position.
      // But we don't always know `currentScrollLeft` accurately without listening to scroll events constantly.

      // Alternative: `cl-tabs` uses `item.left - tabLeft`. 
      // This implies `slider` is fixed relative to SCREEN/Container?
      // No, `slider` has `transform: translateX(...)`.
      // If `slider` is sibling of items, and parent scrolls, `slider` scrolls too.
      // If we set `left: 100px` on slider, it stays at 100px from parent start.
      // So if parent scrolls, slider moves with content. Correct.
      // So we need `100px` to be the distance from Start of Content.

      // How to get Distance from Start of Content using Rects?
      // `item.left` (screen) - `firstItem.left` (screen) + `padding`.
      // This works regardless of scroll position!
      // `dist = item.left - firstItem.left`. 
      // (plus whatever initial offset/padding the list has).

      const offset = item.left - itemRects.value[0].left;
      // Add initial padding if any? standard config has no left padding on list, but items might have padding.

      if (props.type === 'line' || props.type === 'segment') {
        indicatorStyle.value = {
          width: `${item.width}px`,
          height: props.type === 'line' ? '2px' : '100%',
          transform: `translateX(${offset}px)`
        };
      }

      // Scroll Line centering
      // Target scroll left:
      // visual center of item should be at visual center of container.
      // itemCenter = item.left + item.width/2.
      // containerCenter = container.left + container.width/2.
      // delta = itemCenter - containerCenter.
      // newScrollLeft = currentScrollLeft + delta.
      // But we don't have currentScrollLeft easily.
      // However, `scroll-into-view` handles this!
      // I will use `scroll-into-view` with an ID, much easier/performant.
    }
  }
}

function onChange(index: number) {
  const item = props.list[index];
  if (item.disabled || props.disabled) return;

  active.value = item.value;
  emit("update:modelValue", item.value);
  emit("change", item.value);

  // Defer update to allow render
  nextTick(() => {
    updateIndicator();
  });
}

watch(() => props.modelValue, (val) => {
  active.value = val;
  nextTick(updateIndicator);
});

watch(() => props.list, () => {
  nextTick(() => {
    updateContainerRect();
  });
}, { deep: true });

onMounted(() => {
  // wait for render
  setTimeout(() => {
    updateContainerRect();
  }, 100);
});

// Expose refresh for parent to call if needed (e.g. if tabs shown after being hidden)
defineExpose({
  refresh: updateContainerRect
});

</script>

<template>
  <view :class="ui.root({ class: props.class })">
    <scroll-view :class="ui.list()" scroll-x scroll-with-animation :scroll-into-view="`tab-item-${active}`"
      :show-scrollbar="false" class="rb-tabs__list" enable-flex>
      <view v-for="(item, index) in props.list" :key="item.value" :id="`tab-item-${item.value}`"
        :class="ui.item({ class: 'rb-tabs__item' })" :data-state="active === item.value ? 'active' : 'inactive'"
        @tap="onChange(index)">
        <view :class="ui.text()" :data-state="active === item.value ? 'active' : 'inactive'">
          {{ item.label }}
        </view>
      </view>

      <!-- Indicator -->
      <view v-if="props.type !== 'card'" :class="ui.indicator()" :style="indicatorStyle" />
    </scroll-view>
  </view>
</template>

<style scoped>
/* Ensure scroll view content container behaves correctly for flex items */
:deep(.uni-scroll-view-content) {
  display: flex;
}
</style>
