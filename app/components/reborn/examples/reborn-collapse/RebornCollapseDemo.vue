<script setup lang="ts">
/** 基础用法的展开状态 */
const visible = ref(false);

/** 向上展开示例的展开状态 */
const topVisible = ref(false);

/** 浮层模式：向上 / 向下两个面板各自的展开状态 */
const floatTop = ref(false);
const floatBottom = ref(false);

/** 禁用与事件：禁用开关、展开状态与最近一次 toggle 回显 */
const lockDisabled = ref(false);
const lockVisible = ref(false);
const lastToggle = ref<string>("尚未触发");

/** toggle 事件回调：只在点击触发区时派发，禁用时不派发 */
function onToggle(value: boolean) {
  lastToggle.value = value ? "toggle(true)：已展开" : "toggle(false)：已收起";
}

/** 多面板列表：每一项独立维护展开状态 */
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
              class="border-default rounded-lg flex cursor-pointer items-center justify-between border px-4 py-3"
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
      title="展开方向：向上展开"
      description="position 设为 top 时，折叠区渲染在触发区上方，内容从触发区向上推开；它仍在文档流中，展开会把触发区往下挤。"
    >
      <DemoBlock layout="stack">
        <RebornCollapse
          v-model="topVisible"
          position="top"
          custom-class="w-full"
        >
          <template #default="{ open }">
            <div
              class="border-default rounded-lg flex cursor-pointer items-center justify-between border px-4 py-3"
            >
              <span class="text-default text-sm font-medium">向上展开</span>
              <Icon
                name="lucide:chevron-up"
                class="text-muted size-4 transition-transform duration-200"
                :class="{ 'rotate-180': open }"
              />
            </div>
          </template>

          <template #content>
            <p class="text-muted px-4 py-3 text-sm leading-relaxed">
              折叠区位于触发区之上。收起时内容朝触发区方向裁切，因为内层加了 flex-col justify-end，把底边锚定在触发区边缘。
            </p>
          </template>
        </RebornCollapse>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="浮层模式：脱离文档流"
      description="absolute 开启后折叠区绝对定位在触发区上方或下方，展开不再撑开页面；动画改为 transform 平移，面板只朝触发区一个方向收起。"
    >
      <DemoBlock layout="grid" class="gap-4 sm:grid-cols-2">
        <div class="border-default rounded-xl flex h-56 w-full flex-col justify-end border border-dashed p-3">
          <RebornCollapse
            v-model="floatTop"
            position="top"
            absolute
            custom-class="w-full"
          >
            <template #default="{ open }">
              <div
                class="border-default rounded-lg flex cursor-pointer items-center justify-between border px-4 py-3"
              >
                <span class="text-default text-sm font-medium">position="top"</span>
                <Icon
                  name="lucide:chevron-up"
                  class="text-muted size-4 transition-transform duration-200"
                  :class="{ 'rotate-180': open }"
                />
              </div>
            </template>

            <template #content>
              <div class="bg-default border-default rounded-lg mb-2 border p-3 shadow-sm">
                <p class="text-muted text-sm">悬浮在触发区上方，适合底部工具栏</p>
              </div>
            </template>
          </RebornCollapse>
        </div>

        <div class="border-default rounded-xl h-56 w-full border border-dashed p-3">
          <RebornCollapse
            v-model="floatBottom"
            absolute
            custom-class="w-full"
          >
            <template #default="{ open }">
              <div
                class="border-default rounded-lg flex cursor-pointer items-center justify-between border px-4 py-3"
              >
                <span class="text-default text-sm font-medium">position="bottom"</span>
                <Icon
                  name="lucide:chevron-down"
                  class="text-muted size-4 transition-transform duration-200"
                  :class="{ 'rotate-180': open }"
                />
              </div>
            </template>

            <template #content>
              <div class="bg-default border-default rounded-lg mt-2 border p-3 shadow-sm">
                <p class="text-muted text-sm">悬浮在触发区下方，覆盖后续内容而不推开它</p>
              </div>
            </template>
          </RebornCollapse>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        浮层会覆盖相邻内容，外层需要预留空间或确保没有被裁切的 overflow-hidden 祖先。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="禁用与事件"
      description="disabled 让点击触发区不再切换，但 v-model 仍可在外部改写；toggle 事件只在点击触发区切换成功时派发，载荷是切换后的状态。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-2">
          <RebornSwitch
            v-model="lockDisabled"
            size="sm"
          />
          <span class="text-muted text-sm">disabled</span>
        </div>
        <RebornCollapse
          v-model="lockVisible"
          :disabled="lockDisabled"
          custom-class="w-full"
          @toggle="onToggle"
        >
          <template #default="{ open }">
            <div
              class="border-default rounded-lg flex items-center justify-between border px-4 py-3"
              :class="lockDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
            >
              <span class="text-default text-sm font-medium">{{ lockDisabled ? "已禁用" : "点击切换" }}</span>
              <Icon
                name="lucide:chevron-down"
                class="text-muted size-4 transition-transform duration-200"
                :class="{ 'rotate-180': open }"
              />
            </div>
          </template>

          <template #content>
            <p class="text-muted px-4 py-3 text-sm leading-relaxed">
              组件不给触发区加任何禁用样式，禁用外观需要在插槽里自己写。
            </p>
          </template>
        </RebornCollapse>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          {{ lastToggle }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="组合：多面板列表"
      description="每一项各自持有一份状态即可组合出列表，多项可以同时展开；组件没有内置互斥，需要手风琴效果时在外部改写其余项的 v-model。这里用一条分隔线代替卡片外壳，避免层层嵌套的背景块。"
    >
      <DemoBlock layout="stack">
        <div class="divide-default border-default rounded-xl w-full divide-y border">
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
