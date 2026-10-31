<script setup lang="ts">
import type { TimelineItemData } from "~/components/reborn/ui/reborn-timeline/reborn-timeline.config"
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components"
import { computed, ref, shallowRef } from "vue"
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue"
import { TIMELINE_PRESET_COLORS, timelineSizes, timelineVariants } from "~/components/reborn/ui/reborn-timeline/reborn-timeline.config"
import RebornTimeline from "~/components/reborn/ui/reborn-timeline/RebornTimeline.vue"
import RebornTimelineItem from "~/components/reborn/ui/reborn-timeline/RebornTimelineItem.vue"

/** 入职流程示例数据：默认插槽模式下用 v-for 书写节点 */
const activities: TimelineItemData[] = [
  { content: '提交入职资料', timestamp: '2026-09-01', color: 'success', icon: 'lucide:check' },
  { content: '完成背景调查', timestamp: '2026-09-03', color: 'success', icon: 'lucide:check' },
  { content: '签署劳动合同', timestamp: '2026-09-05', color: 'error', icon: 'lucide:x' },
  { content: '领取办公设备', timestamp: '2026-09-08', color: 'warning', icon: 'lucide:check' },
]

const directionOptions = [
  { label: '竖向 vertical', value: 'vertical' },
  { label: '横向 horizontal', value: 'horizontal' },
]
const sizeLabels = { sm: 'sm（8px）', md: 'md（12px）', lg: 'lg（16px）' }
const sizeOptions = timelineSizes.map(size => ({ label: sizeLabels[size], value: size }))
const variantOptions = timelineVariants.map(variant => ({ label: variant === 'solid' ? '实心 solid' : '空心 outlined', value: variant }))
const labelPositionOptions = [
  { label: '右侧 right', value: 'right' },
  { label: '左侧 left', value: 'left' },
]
const placementOptions = [
  { label: '下方 bottom', value: 'bottom' },
  { label: '上方 top', value: 'top' },
  { label: '左侧 left', value: 'left' },
  { label: '右侧 right', value: 'right' },
]
const colorOptions = [
  ...Object.keys(TIMELINE_PRESET_COLORS).map(color => ({ label: color, value: color })),
  { label: '自定义 #f59e0b', value: '#f59e0b' },
]

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  direction: 'vertical',
  size: 'md',
  variant: 'solid',
  reverse: false,
  labelPosition: 'right',
  placement: 'bottom',
  color: 'primary',
  loading: false,
}

const state = shallowRef<Record<string, any>>({ ...defaultState })

/** 演练场节点列表：可追加节点，用来观察插槽模式下增删节点后的连接线、倒序与列轨道是否同步 */
const playgroundActivities = ref([...activities])
const MAX_ACTIVITIES = 8

function appendActivity() {
  const day = 8 + playgroundActivities.value.length - activities.length + 1
  playgroundActivities.value.push({
    content: `新增动态 ${playgroundActivities.value.length + 1}`,
    timestamp: `2026-09-${String(day).padStart(2, '0')}`,
    color: 'neutral',
    icon: 'lucide:more-horizontal',
  })
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState }
  playgroundActivities.value = [...activities]
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: '布局',
    children: [
      { label: '时间轴方向', key: 'direction', component: 'select' as const, defaultValue: 'vertical', props: { options: directionOptions } },
      { label: '倒序排列', key: 'reverse', component: 'checkbox' as const, defaultValue: false },
      {
        label: '内容侧（仅竖向生效）',
        key: 'labelPosition',
        component: 'select' as const,
        defaultValue: 'right',
        props: { options: labelPositionOptions },
      },
    ],
  },
  {
    title: '时间戳',
    children: [
      { label: '时间戳位置', key: 'placement', component: 'select' as const, defaultValue: 'bottom', props: { options: placementOptions } },
    ],
  },
  {
    title: '节点',
    children: [
      { label: '节点尺寸', key: 'size', component: 'select' as const, defaultValue: 'md', props: { options: sizeOptions } },
      { label: '节点形态', key: 'variant', component: 'select' as const, defaultValue: 'solid', props: { options: variantOptions } },
      { label: '节点颜色', key: 'color', component: 'select' as const, defaultValue: 'primary', props: { options: colorOptions } },
      { label: '最后一个节点加载中', key: 'loading', component: 'checkbox' as const, defaultValue: false },
    ],
  },
]

/** 演练场右上角展示的传参明细（时间线无 v-model，需手动拼接）：完整列出当前所有参数（含默认值） */
const timelineCode = computed(() => {
  const s = state.value
  const itemProps: string[] = [
    ':key="activity.timestamp"',
    ':timestamp="activity.timestamp"',
    ':icon="activity.icon"',
    `color="${s.color}"`,
    `label-position="${s.labelPosition}"`,
    `placement="${s.placement}"`,
    `:loading="${s.loading ? 'index === activities.length - 1' : 'false'}"`,
  ]
  return [
    '<RebornTimeline',
    `  direction="${s.direction}"`,
    `  size="${s.size}"`,
    `  variant="${s.variant}"`,
    `  :reverse="${s.reverse}"`,
    '>',
    '  <RebornTimelineItem',
    '    v-for="(activity, index) in activities"',
    ...itemProps.map(p => `    ${p}`),
    '  >',
    '    {{ activity.content }}',
    '  </RebornTimelineItem>',
    '</RebornTimeline>',
  ].join('\n')
})

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 基础用法：用户示例中的倒序开关 */
const reverse = shallowRef(false)

/** 数据驱动：content 默认按文本渲染，接口数据直接传入即可，不会被当作 HTML 解析 */
const releaseItems: TimelineItemData[] = [
  { key: 'plan', timestamp: '2026-09-01', content: '确定 v1.2.0 发布范围', color: 'neutral' },
  { key: 'dev', timestamp: '2026-09-10', content: '完成开发并合入 main 分支', color: 'success' },
  { key: 'test', timestamp: '2026-09-18', content: '回归测试发现 2 个阻塞问题', color: 'error' },
  { key: 'release', timestamp: '2026-09-25', content: '灰度发布中', loading: true },
]

/** 节点颜色：七个预设色跟随主题配置，另附一个自定义色值 */
const colorItems: TimelineItemData[] = [
  { color: 'primary', content: 'primary：进行中的步骤，跟随主题主色' },
  { color: 'secondary', content: 'secondary：辅助记录' },
  { color: 'success', content: 'success：已完成' },
  { color: 'info', content: 'info：信息提示' },
  { color: 'warning', content: 'warning：需要关注' },
  { color: 'error', content: 'error：失败或被驳回' },
  { color: 'neutral', content: 'neutral：尚未开始' },
  { color: '#f59e0b', content: '#f59e0b：任意 CSS 色值，走内联样式' },
]

const placements = ['top', 'bottom', 'left', 'right'] as const

/** 横向时间轴：阶段数量少、横向空间充足时使用 */
const stageItems: TimelineItemData[] = [
  { key: 'draft', timestamp: '09-01', content: '起草', color: 'success' },
  { key: 'review', timestamp: '09-05', content: '评审', color: 'success' },
  { key: 'approve', timestamp: '09-12', content: '审批', loading: true },
  { key: 'archive', timestamp: '09-20', content: '归档', color: 'neutral' },
]
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="timelineCode" component-name="RebornTimeline" title="交互演练场"
      description="调节上方参数，实时查看时间线的方向、排序与时间戳落位。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-6">
        <div :class="state.direction === 'horizontal' ? 'w-full' : 'w-full max-w-md'">
          <RebornTimeline :direction="state.direction" :size="state.size" :variant="state.variant" :reverse="state.reverse">
            <RebornTimelineItem
              v-for="(activity, index) in playgroundActivities" :key="activity.timestamp"
              :timestamp="activity.timestamp" :color="state.color" :label-position="state.labelPosition"
              :placement="state.placement" :loading="state.loading && index === playgroundActivities.length - 1"
              :icon="activity.icon"
            >
              {{ activity.content }}
            </RebornTimelineItem>
          </RebornTimeline>
        </div>

        <RebornButton
          size="sm" variant="outlined" :disabled="playgroundActivities.length >= MAX_ACTIVITIES"
          @click="appendActivity"
        >
          <template #leading>
            <Icon name="lucide:plus" />
          </template>
          追加节点
        </RebornButton>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          Props: { direction: '{{ state.direction }}', size: '{{ state.size }}', variant: '{{ state.variant }}', reverse: {{ state.reverse }}, labelPosition: '{{
            state.labelPosition
          }}',
          placement: '{{ state.placement }}', color: '{{ state.color }}', loading: {{ state.loading }} } · 节点数：{{
            playgroundActivities.length }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        在默认插槽里用 <code>v-for</code> 书写 <code>RebornTimelineItem</code>，<code>reverse</code>
        翻转节点顺序。
      </template>
      <DemoBlock layout="stack">
        <RebornCheckbox v-model="reverse" label="倒序排列" />
        <RebornTimeline class="mt-2" :reverse="reverse">
          <RebornTimelineItem v-for="activity in activities" :key="activity.timestamp" :timestamp="activity.timestamp">
            {{ activity.content }}
          </RebornTimelineItem>
        </RebornTimeline>
      </DemoBlock>
      <DemoNote tone="dimmed" class="font-mono text-xs">reverse: {{ reverse }}</DemoNote>
    </DemoSection>

    <DemoSection title="数据驱动">
      <template #description>
        传入 <code>items</code> 后由组件渲染节点，适合节点来自接口数据的场景；<code>content</code> 默认作为文本渲染，确需 HTML 时显式设置
        <code>dangerouslyUseHTMLString: true</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornTimeline :items="releaseItems" />
      </DemoBlock>
      <DemoNote tone="dimmed">
        content 走文本插值，内容里的 HTML 标签按原文显示、不会生效；dangerouslyUseHTMLString 只把渲染方式切换为 v-html，不做任何清理，开启前须先清理内容。需要强调样式时优先用 #content 插槽。
      </DemoNote>
    </DemoSection>

    <DemoSection title="节点颜色">
      <template #description><code>color</code> 接受 primary / secondary / success / info / warning / error / neutral 七个主题预设，或自定义 CSS 色值。</template>
      <DemoBlock layout="stack">
        <RebornTimeline>
          <RebornTimelineItem v-for="item in colorItems" :key="item.color" :color="item.color">
            {{ item.content }}
          </RebornTimelineItem>
        </RebornTimeline>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="节点尺寸与形态">
      <template #description>
        <code>size</code> 控制 8px、12px、16px 节点，<code>variant</code> 切换实心与空心；单个节点可覆盖父级配置，<code>sm</code> 不显示图标。
      </template>
      <DemoBlock layout="grid" :columns="3">
        <div v-for="size in timelineSizes" :key="size" class="flex flex-col gap-3" :data-timeline-size="size">
          <p class="text-sm text-gray-7">{{ sizeLabels[size] }}</p>
          <RebornTimeline :size="size">
            <RebornTimelineItem>实心节点</RebornTimelineItem>
            <RebornTimelineItem variant="outlined">空心节点</RebornTimelineItem>
            <RebornTimelineItem icon="lucide:check">{{ size === 'sm' ? '小尺寸隐藏图标' : '带图标的实心节点' }}</RebornTimelineItem>
            <RebornTimelineItem variant="outlined" icon="lucide:check">{{ size === 'sm' ? '小尺寸空心节点' : '带图标的空心节点' }}</RebornTimelineItem>
          </RebornTimeline>
        </div>
      </DemoBlock>
      <DemoBlock layout="stack">
        <RebornTimeline size="sm" variant="outlined">
          <RebornTimelineItem>继承父级：8px 空心圆</RebornTimelineItem>
          <RebornTimelineItem size="md" icon="lucide:check">单独覆盖：12px 空心圆，图标 6px</RebornTimelineItem>
          <RebornTimelineItem size="lg" variant="solid" color="success" icon="lucide:check">单独覆盖：16px 实心圆，图标 8px</RebornTimelineItem>
        </RebornTimeline>
      </DemoBlock>
      <DemoNote tone="dimmed">空心圆内孔为外径的一半：4px、6px、8px。节点尺寸不改变正文或节点间距，混合尺寸仍共用同一条轴线。</DemoNote>
    </DemoSection>

    <DemoSection title="自定义图标与加载">
      <template #description>
        设了 <code>icon</code>、<code>loading</code> 或 <code>#icon</code>
        插槽时，图标尺寸随节点取 6px 或 8px，节点外径保持不变；<code>sm</code> 隐藏图标，<code>loading</code> 显示旋转图标。
      </template>
      <DemoBlock layout="stack">
        <RebornTimeline>
          <RebornTimelineItem icon="lucide:git-commit-horizontal" timestamp="2026-09-01 10:20">
            提交代码
          </RebornTimelineItem>
          <RebornTimelineItem color="success" timestamp="2026-09-01 10:32">
            <template #icon="{ class: iconClass }">
              <Icon name="lucide:check" :class="iconClass" />
            </template>
            流水线通过
          </RebornTimelineItem>
          <RebornTimelineItem loading timestamp="2026-09-01 10:35">
            正在部署到预发环境
          </RebornTimelineItem>
        </RebornTimeline>
      </DemoBlock>
      <DemoNote>实心节点的图标为白色，空心节点的图标跟随 color；自定义图标插槽可使用作用域里的 class，继承当前尺寸。</DemoNote>
    </DemoSection>

    <DemoSection title="时间戳位置">
      <template #description><code>placement</code> 为 top / bottom 时时间戳堆叠在内容上下，为 left / right 时放到轴线的对应一侧。</template>
      <DemoBlock layout="grid" :columns="2">
        <div v-for="p in placements" :key="p" class="flex flex-col gap-3">
          <p class="text-dimmed text-xs italic">placement="{{ p }}"</p>
          <RebornTimeline>
            <RebornTimelineItem
              v-for="activity in activities.slice(0, 3)" :key="activity.timestamp"
              :timestamp="activity.timestamp" :placement="p"
            >
              {{ activity.content }}
            </RebornTimelineItem>
          </RebornTimeline>
        </div>
      </DemoBlock>
      <DemoNote>内容在右侧时，placement="left" 把时间戳越过轴线放到左列；placement="right" 与内容同行，保留 12px 间距，整组贴近轴线。</DemoNote>
    </DemoSection>

    <DemoSection title="内容侧">
      <template #description><code>label-position</code> 决定内容位于轴线左侧还是右侧，逐个节点设置即可左右交替。</template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col gap-3">
          <p class="text-dimmed text-xs italic">全部在左侧</p>
          <RebornTimeline>
            <RebornTimelineItem
              v-for="activity in activities" :key="activity.timestamp" :timestamp="activity.timestamp"
              label-position="left"
            >
              {{ activity.content }}
            </RebornTimelineItem>
          </RebornTimeline>
        </div>
        <div class="flex flex-col gap-3">
          <p class="text-dimmed text-xs italic">左右交替，时间戳放到对侧</p>
          <RebornTimeline>
            <RebornTimelineItem
              v-for="(activity, index) in activities" :key="activity.timestamp"
              :timestamp="activity.timestamp" :label-position="index % 2 === 0 ? 'right' : 'left'"
              :placement="index % 2 === 0 ? 'left' : 'right'"
            >
              {{ activity.content }}
            </RebornTimelineItem>
          </RebornTimeline>
        </div>
      </DemoBlock>
      <DemoNote>两侧都有内容时左右列等宽，轴线居中；单侧布局按内容宽度排布，不因内容在左侧而整体靠右。</DemoNote>
    </DemoSection>

    <DemoSection title="横向时间轴">
      <template #description><code>direction="horizontal"</code> 让节点等分一行，适合阶段少、横向空间充足的流程。</template>
      <DemoBlock layout="stack" class="gap-8">
        <!-- DemoBlock 为 items-start，横向时间线需显式 w-full 才能撑满一行 -->
        <RebornTimeline class="w-full" direction="horizontal" :items="stageItems" />
        <RebornTimeline class="w-full" direction="horizontal">
          <RebornTimelineItem
            v-for="item in stageItems" :key="item.key" :timestamp="item.timestamp" :color="item.color"
            :loading="item.loading" placement="top"
          >
            {{ item.content }}
          </RebornTimelineItem>
        </RebornTimeline>
      </DemoBlock>
      <DemoNote>横向时 label-position 不生效；placement="top" 把时间戳放到轴线上方。</DemoNote>
    </DemoSection>

    <DemoSection title="内容与时间戳插槽">
      <template #description><code>#content</code> 与 <code>#timestamp</code> 插槽替换对应区域，用于标题加描述、带图标的时间等结构化内容。</template>
      <DemoBlock layout="stack">
        <RebornTimeline>
          <RebornTimelineItem color="success">
            <template #content>
              <div class="flex flex-col gap-0.5">
                <span class="font-medium">合同审批通过</span>
                <span class="text-sm text-gray-6">法务部 · 审批人 张敏</span>
              </div>
            </template>
            <template #timestamp>
              <span class="inline-flex items-center gap-1">
                <Icon name="lucide:clock" class="size-3" />
                2026-09-05 14:30
              </span>
            </template>
          </RebornTimelineItem>
          <RebornTimelineItem>
            <template #content>
              <div class="flex flex-col gap-0.5">
                <span class="font-medium">等待财务付款</span>
                <span class="text-sm text-gray-6">预计 3 个工作日内完成</span>
              </div>
            </template>
            <template #timestamp>
              <span class="inline-flex items-center gap-1">
                <Icon name="lucide:clock" class="size-3" />
                2026-09-06 09:00
              </span>
            </template>
          </RebornTimelineItem>
        </RebornTimeline>
      </DemoBlock>
      <DemoNote>#content 优先于默认插槽，二者都没有时才回退到 content 属性。</DemoNote>
    </DemoSection>
  </div>
</template>
