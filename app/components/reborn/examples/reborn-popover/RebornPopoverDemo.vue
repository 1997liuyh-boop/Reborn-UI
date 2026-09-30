<script setup lang="ts">
import { ref } from "vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref({
  side: "bottom" as "top" | "bottom" | "left" | "right",
  align: "center" as "start" | "center" | "end",
  mode: "click" as "click" | "hover",
  arrow: true,
  modal: false,
  dismissible: true,
  sideOffset: 12,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "位置与对齐",
    children: [
      {
        label: "显示方位",
        key: "side",
        component: "select" as const,
        defaultValue: "bottom",
        props: {
          options: [
            { label: "Top (顶部)", value: "top" },
            { label: "Bottom (底部)", value: "bottom" },
            { label: "Left (左侧)", value: "left" },
            { label: "Right (右侧)", value: "right" },
          ],
        },
      },
      {
        label: "对齐方式",
        key: "align",
        component: "select" as const,
        defaultValue: "center",
        props: {
          options: [
            { label: "Start (对齐起点)", value: "start" },
            { label: "Center (居中)", value: "center" },
            { label: "End (对齐终点)", value: "end" },
          ],
        },
      },
      {
        label: "偏移距离",
        key: "sideOffset",
        component: "slider" as const,
        defaultValue: 12,
        props: { min: 0, max: 40, step: 1 },
      },
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
        props: {
          options: [
            { label: "Click (点击)", value: "click" },
            { label: "Hover (悬停)", value: "hover" },
          ],
        },
      },
      { label: "显示箭头", key: "arrow", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "高级配置",
    children: [
      { label: "模态模式 (Modal)", key: "modal", component: "checkbox" as const, defaultValue: false },
      { label: "点击外部关闭", key: "dismissible", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

// ─── 受控与手动关闭 ─────────────────────────────────────────────

/** v-model:open 绑定的显隐状态 */
const controlledOpen = ref(false);
/** 通过 ref 调用 expose 出来的 close() */
const popoverRef = ref<{ close: () => void } | null>(null);

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

const selectedColor = ref(colors[0]);

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
      v-model="state"
      :controls="controls"
      component-name="RebornPopover"
      title="交互演练场"
      description="调节方位、对齐与触发方式，实时观察浮层的定位与出入场动画。"
    >
      <RebornPopover
        :mode="state.mode"
        :content="{ side: state.side, align: state.align, sideOffset: state.sideOffset }"
        :arrow="state.arrow"
        :modal="state.modal"
        :dismissible="state.dismissible"
      >
        <RebornButton
          size="lg"
          :variant="state.mode === 'hover' ? 'soft' : 'filled'"
          :label="state.mode === 'hover' ? '悬浮体验' : '点击触发'"
          class="min-w-[140px]"
        />

        <!-- 浮层自带表面样式（bg + border + rounded），内容区不再叠盒子 -->
        <template #content>
          <div class="w-64 space-y-3">
            <div class="text-primary flex items-center gap-2 font-bold">
              <Icon
                name="lucide:settings-2"
                class="size-5"
              />
              <span>实时配置预览</span>
            </div>
            <p class="text-muted text-sm leading-relaxed">
              当前定位：<code>{{ state.side }} - {{ state.align }}</code>
            </p>
            <div class="flex flex-wrap gap-2">
              <RebornBadge
                v-if="state.arrow"
                label="Arrow"
                size="xs"
                variant="soft"
                color="info"
              />
              <RebornBadge
                v-if="state.modal"
                label="Modal"
                size="xs"
                variant="soft"
                color="warning"
              />
              <RebornBadge
                v-if="!state.dismissible"
                label="Locked"
                size="xs"
                variant="soft"
                color="error"
              />
            </div>
          </div>
        </template>
      </RebornPopover>
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
      <template #description><code>content.side</code> 决定弹出方向，<code>content.align</code> 决定交叉轴对齐，<code>content.sideOffset</code> 是与触发器的间距；<code>arrow</code> 打开箭头后，<code>start</code> / <code>end</code> 的箭头停在气泡两端内缩处，<code>center</code> 才指向触发器中心。</template>
      <DemoBlock>
        <RebornPopover
          v-for="side in (['top', 'bottom', 'left', 'right'] as const)"
          :key="side"
          :content="{ side, align: 'center', sideOffset: 8 }"
          arrow
        >
          <RebornButton variant="outlined" :label="side" />
          <template #content>
            <span class="text-sm">side: {{ side }}</span>
          </template>
        </RebornPopover>
      </DemoBlock>
      <DemoBlock>
        <RebornPopover
          v-for="align in (['start', 'center', 'end'] as const)"
          :key="align"
          :content="{ side: 'bottom', align, sideOffset: 8 }"
          arrow
        >
          <RebornButton variant="soft" :label="`bottom-${align}`" />
          <template #content>
            <p class="w-48 text-sm">align: {{ align }}，注意箭头落点的差别。</p>
          </template>
        </RebornPopover>
      </DemoBlock>
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
          :content="{ side: 'top' }"
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
        <RebornButton
          variant="outlined"
          :label="controlledOpen ? '外部关闭' : '外部打开'"
          @click="controlledOpen = !controlledOpen"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="遮罩与点击外部关闭">
      <template #description><code>modal</code> 打开时在页面上铺一层半透明遮罩，点击遮罩按 <code>dismissible</code> 决定是否关闭；<code>dismissible</code> 为 false 时点击外部不再关闭，只能再次点击触发器或调用 <code>close()</code>。</template>
      <DemoBlock>
        <RebornPopover modal>
          <RebornButton label="带遮罩" />
          <template #content>
            <p class="w-48 text-sm">点击遮罩关闭。</p>
          </template>
        </RebornPopover>
        <RebornPopover :dismissible="false">
          <RebornButton variant="outlined" label="点击外部不关闭" />
          <template #content>
            <p class="w-48 text-sm">再次点击触发器才会关闭。</p>
          </template>
        </RebornPopover>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="复合内容：资料卡、调色盘与操作菜单">
      <template #description>浮层内容完全由 <code>#content</code> 插槽决定，可承载资料卡、调色盘、操作菜单等复合交互。</template>
      <DemoBlock layout="grid" align="center">
        <!-- 场景一：个人资料卡 -->
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">个人资料卡 · 点击头像</span>
          <RebornPopover
            :content="{ side: 'top', align: 'center', sideOffset: 16 }"
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
            :content="{ side: 'bottom', align: 'center', sideOffset: 12 }"
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
            :content="{ side: 'right', align: 'start', sideOffset: 12 }"
            arrow
            mode="hover"
          >
            <RebornButton
              color="neutral"
              variant="circle"
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
