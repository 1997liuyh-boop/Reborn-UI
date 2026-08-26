<script setup lang="ts">
/** 基础用法的展开状态 */
const visible = ref(false);

/** 手风琴：每一项独立维护展开状态 */
const panels = ref([
  {
    title: "组件是什么",
    open: true,
    content:
      "RebornCollapse 只负责折叠区域的高度过渡与状态管理，触发器与内容都由插槽提供，不预设任何视觉样式，便于嵌入各类业务卡片。",
  },
  {
    title: "如何控制展开",
    open: false,
    content:
      "通过 v-model 双向绑定展开状态；也可以监听 toggle 事件在展开或收起时执行额外逻辑，例如懒加载内容。",
  },
  {
    title: "向上展开",
    open: false,
    content:
      "position 设为 top 时内容向上方展开，配合 absolute 可让内容脱离文档流悬浮显示，适合底部工具栏场景。",
  },
]);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="默认插槽是触发器，可通过作用域参数 open 拿到当前状态；content 插槽是折叠内容，高度过渡由组件自动计算。"
    >
      <DemoBlock layout="stack">
        <RebornCollapse
          v-model="visible"
          custom-class="w-full"
        >
          <template #default="{ open }">
            <div
              class="border-default rounded-ui-sm flex cursor-pointer items-center justify-between border px-4 py-3"
            >
              <span class="text-default text-sm font-medium">点击展开 / 收起</span>
              <Icon
                name="lucide:chevron-down"
                class="text-muted size-4 transition-transform duration-200"
                :class="{ 'rotate-180': open }"
              />
            </div>
          </template>

          <template #content>
            <div class="text-muted space-y-2 px-4 py-3 text-sm leading-relaxed">
              <p>
                张若虚（约公元 660—约公元 720），唐代诗人，扬州（今属江苏）人，曾任兖州兵曹，生卒年与字号均已不详。
              </p>
              <p>
                其诗仅存两首于《全唐诗》中，《春江花月夜》抒写离情别绪与人生感慨，意境空明、韵律悠扬，素有「孤篇盖全唐」之誉。
              </p>
            </div>
          </template>
        </RebornCollapse>

        <DemoNote tone="dimmed">
          当前状态：<code>{{ visible ? "展开" : "收起" }}</code>
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="组合成手风琴"
      description="每一项各自持有一份状态即可组合出列表；这里用一条分隔线代替卡片外壳，避免层层嵌套的背景块。"
    >
      <DemoBlock layout="stack">
        <div class="divide-default border-default rounded-ui-md w-full divide-y border">
          <RebornCollapse
            v-for="panel in panels"
            :key="panel.title"
            v-model="panel.open"
            custom-class="w-full"
          >
            <template #default="{ open }">
              <div class="flex cursor-pointer items-center justify-between px-4 py-3">
                <span class="text-default text-sm font-medium">{{ panel.title }}</span>
                <Icon
                  name="lucide:chevron-down"
                  class="text-muted size-4 transition-transform duration-200"
                  :class="{ 'rotate-180': open }"
                />
              </div>
            </template>

            <template #content>
              <p class="text-muted px-4 pb-3 text-sm leading-relaxed">
                {{ panel.content }}
              </p>
            </template>
          </RebornCollapse>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
