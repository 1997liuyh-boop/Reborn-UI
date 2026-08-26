<script setup lang="ts">
/** 基础列表：可自由拖拽排序 */
const list1 = ref([
  { name: "项目 1", color: "bg-red-500" },
  { name: "项目 2", color: "bg-blue-500" },
  { name: "项目 3", color: "bg-green-500" },
  { name: "项目 4", color: "bg-yellow-500" },
]);

/** 部分禁用列表：item.disabled 为 true 的项不可拖动，但仍可被其它项挤开 */
const list2 = ref([
  { name: "A", color: "bg-purple-500" },
  { name: "B", color: "bg-pink-500", disabled: true },
  { name: "C", color: "bg-indigo-500" },
  { name: "D", color: "bg-cyan-500", disabled: true },
  { name: "E", color: "bg-teal-500" },
  { name: "F", color: "bg-orange-500" },
]);

/** 最近一次 start 事件拖起的项，替代 console 输出 */
const lastStart = ref("");

/** 最近一次 change 事件后的顺序 */
const lastOrder = ref("");

function handleStart(payload: { index: number; item: { name: string } }) {
  lastStart.value = payload.item.name;
}

function handleChange(newList: { name: string }[]) {
  lastOrder.value = newList.map((i) => i.name).join(" → ");
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="v-model 双向绑定列表数据，拖拽结束后触发 change 事件并回传新顺序。"
    >
      <DemoBlock layout="stack">
        <RebornDraggable
          v-model="list1"
          class-name="flex flex-wrap gap-2"
          @start="handleStart"
          @change="handleChange"
        >
          <template #item="{ item }">
            <div
              class="rounded-ui-sm flex h-16 items-center px-4 text-white"
              :class="item.color"
            >
              {{ item.name }}
            </div>
          </template>
        </RebornDraggable>

        <DemoNote tone="dimmed">
          <template v-if="lastOrder">
            最近拖起：<code>{{ lastStart }}</code> · 当前顺序：<code>{{ lastOrder }}</code>
          </template>
          <template v-else> 拖动任意色块即可重新排序。 </template>
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="禁用部分项目"
      description="在数据项上标记 disabled 即可锁定该项，被锁定的项不可拖起，鼠标样式也会同步变化。"
    >
      <DemoBlock layout="stack">
        <RebornDraggable
          v-model="list2"
          class-name="flex flex-wrap gap-2"
        >
          <template #item="{ item }">
            <div
              class="rounded-ui-sm flex h-16 w-16 items-center justify-center text-white"
              :class="item.color"
            >
              {{ item.name }}
            </div>
          </template>
        </RebornDraggable>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="整体禁用"
      description="组件级 disabled 会一次性锁定所有项，常用于只读态或提交过程中。"
    >
      <DemoBlock layout="stack">
        <RebornDraggable
          v-model="list1"
          disabled
          class-name="flex flex-wrap gap-2"
        >
          <template #item="{ item }">
            <div
              class="rounded-ui-sm flex h-16 items-center px-4 text-white"
              :class="item.color"
            >
              {{ item.name }}
            </div>
          </template>
        </RebornDraggable>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
