<script setup lang="ts">
import type { Placement } from "~/lib/placement";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from '#components';
import { computed, ref, shallowRef, useTemplateRef } from 'vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornPopconfirm from "~/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import { placements } from "~/lib/placement";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态：除 arrow / sideOffset 外与组件默认值一致 */
const defaultState: Record<string, any> = {
  placement: "bottom",
  sideOffset: 12,
  mode: "click",
  arrow: true,
  modal: false,
  dismissible: true,
  closeOnScroll: true,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场气泡的显隐，回显在预览区 */
const playgroundOpen = shallowRef(false);

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "位置",
    children: [
      { label: "方位 placement", key: "placement", component: "select" as const, defaultValue: "bottom", props: { options: placements.map(p => ({ label: p, value: p })) } },
      { label: "间距 sideOffset（px）", key: "sideOffset", component: "slider" as const, defaultValue: 12, props: { min: 0, max: 40, step: 1 } },
      { label: "显示箭头", key: "arrow", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "交互行为",
    children: [
      {
        label: "触发模式",
        key: "mode",
        component: "select" as const,
        defaultValue: "click",
        props: { options: [{ label: "点击 click", value: "click" }, { label: "悬停 hover", value: "hover" }] },
      },
      { label: "点击外部关闭 dismissible", key: "dismissible", component: "checkbox" as const, defaultValue: true },
      { label: "滚动关闭 closeOnScroll", key: "closeOnScroll", component: "checkbox" as const, defaultValue: true },
      { label: "遮罩 modal", key: "modal", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const popoverCode = computed(() => {
  const s = state.value;
  return [
    "<RebornPopover",
    `  placement="${s.placement}"`,
    `  :side-offset="${s.sideOffset}"`,
    `  mode="${s.mode}"`,
    `  :arrow="${s.arrow}"`,
    `  :dismissible="${s.dismissible}"`,
    `  :close-on-scroll="${s.closeOnScroll}"`,
    `  :modal="${s.modal}"`,
    ">",
    "  <RebornButton label=\"点击触发\" />",
    "  <template #content>…</template>",
    "</RebornPopover>",
  ].join("\n");
});

// ─── 方位、对齐与箭头 ───────────────────────────────────────────

/** 十二个方位按「上 / 左 / 右 / 下」四组排开，每组依次是 start / 居中 / end */
const placementGroups: Record<"top" | "left" | "right" | "bottom", Placement[]> = {
  top: ["top-start", "top", "top-end"],
  left: ["left-start", "left", "left-end"],
  right: ["right-start", "right", "right-end"],
  bottom: ["bottom-start", "bottom", "bottom-end"],
};

// ─── 点击外部、滚动与遮罩 ───────────────────────────────────────

/** 嵌套浮层示例里的下拉框选值 */
const nestedSelect = shallowRef("week");
const nestedOptions = [
  { label: "本周", value: "week" },
  { label: "本月", value: "month" },
  { label: "本年", value: "year" },
];
/** 嵌套 Popconfirm 的确认次数 */
const nestedConfirmCount = shallowRef(0);

// ─── 受控与手动关闭 ─────────────────────────────────────────────

/** v-model:open 绑定的显隐状态 */
const controlledOpen = shallowRef(false);
/** 通过 ref 调用 expose 出来的 close() */
const popoverRef = useTemplateRef<InstanceType<typeof RebornPopover>>("popoverRef");

// ─── 场景演示数据 ───────────────────────────────────────────────

const profile = {
  name: "Antigravity AI",
  role: "Senior Code Architect",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100",
  followers: "12.5k",
  following: "482",
  bio: "专注构建具有生命力的 UI 系统，用代码探索设计的边界。",
};

const colors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

const selectedColor = shallowRef(colors[0]);

const actions = [
  { icon: "lucide:edit-3", label: "编辑项目", color: "text-primary" },
  { icon: "lucide:share-2", label: "分享链接", color: "text-info" },
  { icon: "lucide:copy", label: "复制 ID", color: "text-muted" },
  { icon: "lucide:trash-2", label: "删除记录", color: "text-error" },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="popoverCode" component-name="RebornPopover"
      title="交互演练场" description="调节方位、间距与关闭方式，点击按钮后再滚动页面或点击外部，查看气泡的定位与收起时机。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-4 py-16">
        <RebornPopover
          v-model:open="playgroundOpen" :mode="state.mode" :placement="state.placement" :side-offset="state.sideOffset"
          :arrow="state.arrow" :modal="state.modal" :dismissible="state.dismissible"
          :close-on-scroll="state.closeOnScroll"
        >
          <RebornButton
            size="lg" :variant="state.mode === 'hover' ? 'soft' : 'filled'"
            :label="state.mode === 'hover' ? '悬停触发' : '点击触发'" class="min-w-[140px]"
          />

          <!-- 浮层自带表面样式（底色 + 描边 + 圆角），内容区不再叠盒子 -->
          <template #content>
            <div class="w-60 space-y-2">
              <div class="text-gray-10 flex items-center gap-2 font-medium">
                <Icon name="lucide:settings-2" class="text-primary size-5" />
                <span>实时配置预览</span>
              </div>
              <p class="text-gray-8 text-sm">
                placement：<code>{{ state.placement }}</code>，间距 {{ state.sideOffset }}px
              </p>
            </div>
          </template>
        </RebornPopover>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          open：{{ playgroundOpen }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>默认插槽放触发器，<code>#content</code> 插槽放气泡内容；默认点击触发、向下弹出、点击外部关闭。</template>
      <DemoBlock>
        <RebornPopover>
          <RebornButton label="点击打开" />
          <template #content>
            <p class="text-muted w-56 text-sm leading-relaxed">
              气泡自带底色、边框与内边距，内容区直接放文字即可。
            </p>
          </template>
        </RebornPopover>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="方位、对齐与箭头">
      <template #description>
        <code>placement</code> 是「方向-对齐」写法：<code>top</code> / <code>bottom</code> / <code>left</code> / <code>right</code> 决定弹出方向，后缀 <code>-start</code> / <code>-end</code> 决定与触发器的起点或终点对齐，不带后缀为居中。下面每个按钮都开了 <code>arrow</code>：居中时箭头指向触发器中心，<code>start</code> / <code>end</code> 时箭头停在气泡对应一端的内缩处。
      </template>
      <DemoBlock layout="stack" align="center">
        <div class="grid grid-cols-[auto_auto_auto] items-center gap-x-6 gap-y-3 py-6">
          <!-- 上方一行：top-start / top / top-end -->
          <div class="col-span-3 flex justify-center gap-3">
            <RebornPopover v-for="item in placementGroups.top" :key="item" :placement="item" arrow>
              <RebornButton variant="outlined" class="w-28" :label="item" />
              <template #content>
                <span class="text-sm">placement="{{ item }}"</span>
              </template>
            </RebornPopover>
          </div>
          <!-- 左侧一列 -->
          <div class="flex flex-col gap-3">
            <RebornPopover v-for="item in placementGroups.left" :key="item" :placement="item" arrow>
              <RebornButton variant="outlined" class="w-28" :label="item" />
              <template #content>
                <span class="text-sm">placement="{{ item }}"</span>
              </template>
            </RebornPopover>
          </div>
          <div class="w-48" />
          <!-- 右侧一列 -->
          <div class="flex flex-col gap-3">
            <RebornPopover v-for="item in placementGroups.right" :key="item" :placement="item" arrow>
              <RebornButton variant="outlined" class="w-28" :label="item" />
              <template #content>
                <span class="text-sm">placement="{{ item }}"</span>
              </template>
            </RebornPopover>
          </div>
          <!-- 下方一行：bottom-start / bottom / bottom-end -->
          <div class="col-span-3 flex justify-center gap-3">
            <RebornPopover v-for="item in placementGroups.bottom" :key="item" :placement="item" arrow>
              <RebornButton variant="outlined" class="w-28" :label="item" />
              <template #content>
                <span class="text-sm">placement="{{ item }}"</span>
              </template>
            </RebornPopover>
          </div>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        主轴放不下时会自动翻到对侧（如靠近视口底部的 bottom 翻成 top），箭头随之换到另一边；间距用 <code>sideOffset</code> 调整，默认 8px。
      </DemoNote>
    </DemoSection>

    <DemoSection title="悬停触发与显隐延迟">
      <template #description><code>mode="hover"</code> 改为悬停触发；<code>openDelay</code> 过滤鼠标路过时的误触发，<code>closeDelay</code>（默认 120ms）给鼠标从触发器移到气泡留出时间。</template>
      <DemoBlock>
        <RebornPopover
          mode="hover"
          :open-delay="150"
          :close-delay="200"
          arrow
        >
          <span class="text-muted cursor-help text-sm underline decoration-dotted">悬停查看说明</span>
          <template #content>
            <p class="w-52 text-sm">悬停 150ms 后打开，移出 200ms 后关闭；鼠标移入气泡内不会关闭。</p>
          </template>
        </RebornPopover>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="受控与手动关闭">
      <template #description><code>v-model:open</code> 由外部持有显隐状态；气泡内的操作完成后通过 ref 调用 <code>close()</code> 收起。</template>
      <DemoBlock>
        <RebornPopover
          ref="popoverRef"
          v-model:open="controlledOpen"
          placement="top"
        >
          <RebornButton :label="controlledOpen ? '已打开' : '点击打开'" />
          <template #content>
            <div class="flex w-56 flex-col gap-3">
              <p class="text-muted text-sm">确认后调用 close() 收起气泡。</p>
              <RebornButton
                size="sm"
                label="完成"
                @click="popoverRef?.close()"
              />
            </div>
          </template>
        </RebornPopover>
        <RebornButton variant="outlined" label="外部打开" :disabled="controlledOpen" @click="controlledOpen = true" />
        <RebornButton variant="outlined" label="外部关闭" @click="controlledOpen = false" />
        <DemoNote tone="dimmed">点击外部会在 pointerdown 时先关闭气泡，外部按钮应写入明确的目标状态。</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="点击外部、滚动与遮罩">
      <template #description>
        默认点击外部或滚动页面就收起（<code>dismissible</code>、<code>closeOnScroll</code> 都为 true）；关掉 <code>closeOnScroll</code> 后气泡跟着触发器移动，关掉 <code>dismissible</code> 后只能再次点击触发器或调用 <code>close()</code>；<code>modal</code> 铺一层遮罩，点击遮罩同样按 <code>dismissible</code> 决定。
      </template>
      <DemoBlock>
        <RebornPopover arrow>
          <RebornButton label="默认：点外部 / 滚动即收起" />
          <template #content>
            <p class="w-52 text-sm">打开后滚动页面或点击空白处，气泡都会收起。</p>
          </template>
        </RebornPopover>
        <RebornPopover arrow :close-on-scroll="false">
          <RebornButton variant="outlined" label="滚动时跟随" />
          <template #content>
            <p class="w-52 text-sm">:close-on-scroll="false"：滚动页面时气泡跟着按钮移动，点击外部仍会收起。</p>
          </template>
        </RebornPopover>
        <RebornPopover arrow :dismissible="false" :close-on-scroll="false">
          <RebornButton variant="outlined" label="只能点触发器关闭" />
          <template #content>
            <p class="w-52 text-sm">点击外部、滚动都不会收起，再次点击按钮才关闭。</p>
          </template>
        </RebornPopover>
        <RebornPopover modal>
          <RebornButton variant="soft" label="带遮罩" />
          <template #content>
            <p class="w-48 text-sm">点击遮罩关闭。</p>
          </template>
        </RebornPopover>
      </DemoBlock>
      <DemoBlock>
        <RebornPopover arrow placement="bottom-start">
          <RebornButton variant="soft" color="neutral" label="气泡里嵌套下拉框与确认框" />
          <template #content>
            <div class="flex w-64 flex-col gap-3">
              <RebornSelect v-model="nestedSelect" :options="nestedOptions" />
              <RebornPopconfirm title="确定重置统计吗？" @confirm="nestedConfirmCount++">
                <RebornButton size="sm" variant="outlined" color="error" label="重置统计" />
              </RebornPopconfirm>
              <p class="text-gray-6 text-sm">已重置 {{ nestedConfirmCount }} 次</p>
            </div>
          </template>
        </RebornPopover>
      </DemoBlock>
      <DemoNote tone="dimmed">
        下拉框的选项面板与确认框都传送到了 body，不是气泡的 DOM 后代；它们会向外层气泡登记自己，在里面点选不会被当成「点击外部」把外层关掉。
      </DemoNote>
    </DemoSection>

    <DemoSection title="复合内容：资料卡、调色盘与操作菜单">
      <template #description>浮层内容完全由 <code>#content</code> 插槽决定，可承载资料卡、调色盘、操作菜单等复合交互。</template>
      <DemoBlock layout="grid" align="center">
        <!-- 场景一：个人资料卡 -->
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">个人资料卡 · 点击头像</span>
          <RebornPopover
            placement="top"
            :side-offset="16"
            arrow
          >
            <img
              :src="profile.avatar"
              class="border-default size-20 cursor-pointer rounded-full border object-cover transition-transform duration-300 hover:scale-105 active:scale-95"
            >

            <template #content>
              <div class="w-72 space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <img
                    :src="profile.avatar"
                    class="rounded-xl size-16 object-cover"
                  >
                  <div class="flex gap-2">
                    <RebornButton
                      size="sm"
                      variant="soft"
                      color="neutral"
                      label="Message"
                    />
                    <RebornButton
                      size="sm"
                      color="primary"
                      label="Follow"
                    />
                  </div>
                </div>
                <div>
                  <h4 class="text-highlighted text-lg font-bold">{{ profile.name }}</h4>
                  <p class="text-muted text-sm">{{ profile.role }}</p>
                </div>
                <p class="text-muted text-sm leading-relaxed">{{ profile.bio }}</p>
                <div class="divide-default flex gap-6 divide-x">
                  <div>
                    <div class="text-highlighted text-lg font-bold">{{ profile.followers }}</div>
                    <div class="text-dimmed text-xs">Followers</div>
                  </div>
                  <div class="pl-6">
                    <div class="text-highlighted text-lg font-bold">{{ profile.following }}</div>
                    <div class="text-dimmed text-xs">Following</div>
                  </div>
                </div>
              </div>
            </template>
          </RebornPopover>
        </div>

        <!-- 场景二：轻量调色盘 -->
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">轻量调色盘 · 点击色块</span>
          <RebornPopover
            placement="bottom"
            :side-offset="12"
            arrow
          >
            <div
              class="border-default hover:border-primary flex cursor-pointer items-center gap-3 rounded-full border p-2 pr-4 transition-colors"
            >
              <span
                class="size-8 rounded-full"
                :style="{ backgroundColor: selectedColor }"
              />
              <span class="font-mono text-sm font-medium tracking-tighter uppercase">{{ selectedColor }}</span>
              <Icon
                name="lucide:chevron-down"
                class="text-dimmed ml-auto size-4"
              />
            </div>

            <template #content>
              <div class="w-44 space-y-3">
                <div class="text-dimmed text-xs font-bold tracking-wider uppercase">Select accent</div>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="c in colors"
                    :key="c"
                    type="button"
                    class="rounded-sm size-8 transition-transform hover:scale-110 active:scale-90"
                    :class="{ 'ring-primary ring-2 ring-offset-2': selectedColor === c }"
                    :style="{ backgroundColor: c }"
                    @click="selectedColor = c"
                  />
                </div>
                <RebornButton
                  class="w-full"
                  size="sm"
                  variant="soft"
                  color="primary"
                  label="Confirm accent"
                />
              </div>
            </template>
          </RebornPopover>
        </div>

        <!-- 场景三：悬停操作菜单 -->
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">操作菜单 · <code>mode="hover"</code></span>
          <RebornPopover
            placement="right-start"
            :side-offset="12"
            arrow
            mode="hover"
          >
            <RebornButton
              color="neutral"
              circle variant="filled"
              size="lg"
            >
              <template #leading>
                <Icon
                  name="lucide:more-vertical"
                  class="size-6"
                />
              </template>
            </RebornButton>

            <template #content>
              <div class="divide-default flex w-44 flex-col divide-y">
                <div class="flex flex-col">
                  <button
                    v-for="action in actions"
                    :key="action.label"
                    type="button"
                    class="rounded-sm group hover:bg-primary/5 flex w-full items-center gap-3 px-2 py-2 text-left text-sm transition-colors"
                  >
                    <Icon
                      :name="action.icon"
                      :class="['size-4 transition-transform group-hover:scale-110', action.color]"
                    />
                    <span class="text-muted font-medium">{{ action.label }}</span>
                  </button>
                </div>
                <button
                  type="button"
                  class="rounded-sm text-dimmed hover:bg-primary/5 mt-1 flex w-full items-center gap-3 px-2 py-2 text-left text-sm transition-colors"
                >
                  <Icon
                    name="lucide:info"
                    class="size-4"
                  />
                  <span>查看详情</span>
                </button>
              </div>
            </template>
          </RebornPopover>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="菜单模式（仅 UniApp）">
      <template #description>UniApp 端不传 <code>#content</code> 插槽时，<code>displayMode="menu"</code> 把 <code>title</code> 数组渲染成可点击菜单，点击项触发 <code>menuclick</code>。</template>
      <DemoBlock>
        <DemoNote tone="dimmed">
          Web 端没有 <code>title</code> / <code>displayMode</code>，菜单内容直接写进 <code>#content</code> 插槽（见上一节的操作菜单）；UniApp 端的写法见文档「菜单模式（仅 UniApp）」一节的代码。
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
