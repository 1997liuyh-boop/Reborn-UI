<script lang="ts" setup generic="T">
import { useIntervalFn } from "@vueuse/core";
import { AnimatePresence, Motion } from "motion-v";
import { onMounted, shallowRef, watch } from "vue";

interface Props {
  /** 根节点追加的类名 */
  class?: string;
  /** 逐条进场的数据源，每一项交给 item 插槽渲染 */
  items?: T[];
  /** 相邻两条进场的间隔，单位毫秒 */
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  delay: 1000,
});

defineSlots<{
  /** 单条列表项：item 为该项数据，index 为它在 items 中的下标 */
  item?: (scope: { item: T; index: number }) => unknown;
}>();

// 当前窗口里的条目只记下标与唯一 key，渲染时再读 items，父组件改了某项内容也能跟随
interface DisplayedEntry {
  index: number;
  id: string;
}

const displayedItems = shallowRef<DisplayedEntry[]>([]);
let nextIndex = 0;
let sequence = 0;

/** 模板已校验索引边界，保留泛型项的精确类型。 */
function itemAt(index: number): T {
  return props.items[index]!;
}

/** 推进一步：窗口未满时追加一条，满了就移出最旧的一条再追加 */
function step() {
  const total = props.items.length;
  if (!total) {
    displayedItems.value = [];
    return;
  }
  const entry: DisplayedEntry = { index: nextIndex, id: `${nextIndex}-${sequence++}` };
  const current = displayedItems.value;
  displayedItems.value = current.length < total ? [...current, entry] : [...current.slice(1), entry];
  nextIndex = (nextIndex + 1) % total;
}

// 定时器归组件作用域所有，卸载时自动停止；immediateCallback 让启动时立刻进场第一条
const { resume } = useIntervalFn(step, () => props.delay, {
  immediate: false,
  immediateCallback: true,
});

onMounted(resume);

// 列表变短时丢弃越界条目并把游标夹回范围内；变长时窗口会在后续推进中自然扩大
watch(
  () => props.items.length,
  (total) => {
    if (!total) {
      displayedItems.value = [];
      nextIndex = 0;
      return;
    }
    displayedItems.value = displayedItems.value.filter(entry => entry.index < total);
    nextIndex %= total;
  },
);
</script>

<template>
  <div
    class="flex flex-col items-center gap-4"
    :class="[props.class]"
  >
    <!-- AnimatePresence 在非 wait 模式下就是 TransitionGroup，exit 离场动画才会生效 -->
    <AnimatePresence
      as="div"
      class="flex flex-col-reverse items-center gap-3"
      move-class="move"
    >
      <Motion
        v-for="data in displayedItems"
        :key="data.id"
        as="div"
        :initial="{ scale: 0, opacity: 0 }"
        :animate="{
          scale: 1,
          opacity: 1,
          y: 0,
        }"
        :exit="{
          scale: 0,
          opacity: 0,
          y: 0,
        }"
        :transition="{
          type: 'spring',
          stiffness: 350,
          damping: 40,
        }"
        class="mx-auto w-full"
      >
        <slot
          v-if="data.index < props.items.length"
          name="item"
          :item="itemAt(data.index)"
          :index="data.index"
        />
      </Motion>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.move {
  transition: transform 0.4s ease-out;
}
</style>
