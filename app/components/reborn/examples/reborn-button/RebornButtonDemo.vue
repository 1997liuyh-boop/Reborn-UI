<script setup lang="ts">
import { buttonBorderStyles, buttonColors, buttonSizes, buttonVariants } from "~/components/reborn/ui/reborn-button/reborn-button.config"
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue"

const colorOptions = buttonColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }));
const variantOptions = buttonVariants.map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));
const sizeOptions = buttonSizes.map(s => ({ label: s.toUpperCase(), value: s as typeof buttonSizes[number] }));
const borderStyleOptions = buttonBorderStyles.map(b => ({
  label: b === 'solid' ? '实线 Solid' : '虚线 Dashed',
  value: b as typeof buttonBorderStyles[number],
}));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  borderStyle: 'solid',
  disabled: false,
  loading: false,
}

const state = ref<Record<string, any>>({ ...defaultState })

/** 点击计数，让预览区的交互「有回应」 */
const clickCount = ref(0)
function onClick() {
  clickCount.value++
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState }
  clickCount.value = 0
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: '基础属性',
    children: [
      { label: '配色方案', key: 'color', component: 'select' as const, defaultValue: 'primary', props: { options: colorOptions } },
      { label: '风格变体', key: 'variant', component: 'select' as const, defaultValue: 'solid', props: { options: variantOptions } },
      { label: '尺寸规格', key: 'size', component: 'select' as const, defaultValue: 'md', props: { options: sizeOptions } },
      {
        label: '边框线型（对 outline / subtle 生效）',
        key: 'borderStyle',
        component: 'select' as const,
        defaultValue: 'solid',
        props: { options: borderStyleOptions },
      },
    ],
  },
  {
    title: '状态',
    children: [
      { label: '禁用状态', key: 'disabled', component: 'checkbox' as const, defaultValue: false },
      { label: '加载状态', key: 'loading', component: 'checkbox' as const, defaultValue: false },
    ],
  },
]

/** 演练场右上角展示的传参明细（按钮无 v-model，需手动拼接）：完整列出当前所有参数（含默认值） */
const buttonCode = computed(() => {
  const s = state.value
  const props: string[] = [
    `color="${s.color}"`,
    `variant="${s.variant}"`,
    `size="${s.size}"`,
    `border-style="${s.borderStyle}"`,
    `:disabled="${s.disabled}"`,
    `:loading="${s.loading}"`,
  ]
  return `<RebornButton\n  ${props.join('\n  ')}\n>\n  按钮\n</RebornButton>`
})

// ─── 场景演示状态 ───────────────────────────────────────────────

const gap = ref(true)
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="buttonCode" component-name="RebornButton"
      title="交互演练场" description="调节左侧参数，实时查看按钮表现。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-8">
        <div class="flex flex-wrap items-center justify-center gap-6">
          <RebornButton
            :color="state.color" :variant="state.variant" :size="state.size" :disabled="state.disabled"
            :loading="state.loading" :border-style="state.borderStyle" @click="onClick"
          >
            点我交互 ({{ clickCount }})
          </RebornButton>

          <RebornButton
            :color="state.color" variant="circle" :size="state.size" :disabled="state.disabled"
            :loading="state.loading"
          >
            <Icon name="lucide:sparkles" />
          </RebornButton>

          <RebornButton
            :color="state.color" variant="outline" :size="state.size" :border-style="state.borderStyle"
            :disabled="state.disabled" :loading="state.loading"
          >
            <template #leading>
              <Icon name="lucide:shopping-cart" />
            </template>
            带图标
          </RebornButton>
        </div>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          Props: { color: '{{ state.color }}', variant: '{{ state.variant }}', size: '{{ state.size }}', borderStyle:
          '{{ state.borderStyle }}' }
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="所有变体展示">
      <DemoBlock layout="stack" class="gap-4">
        <div v-for="v in buttonVariants" :key="v" class="flex flex-wrap items-center gap-3">
          <p class="text-dimmed w-16 text-xs italic">{{ v }}</p>
          <!-- circle 为纯图标按钮：展示时只放图标，不放文字 -->
          <template v-if="v === 'circle'">
            <RebornButton v-for="c in buttonColors" :key="c" variant="circle" :color="c" size="sm">
              <Icon name="lucide:star" />
            </RebornButton>
          </template>
          <RebornButton v-for="c in buttonColors" v-else :key="c" :variant="v" :color="c" size="sm">
            {{ c }}
          </RebornButton>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="文字按钮 (text)">
      <template #description>
        <code>variant="text"</code>：无背景 / 边框，高度与水平内边距跟随文字，适合行内操作入口。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex flex-wrap items-center gap-4">
          <RebornButton v-for="c in buttonColors" :key="c" variant="text" :color="c">
            {{ c }}
          </RebornButton>
        </div>
        <div class="text-default flex flex-wrap items-baseline gap-3 text-sm">
          <span>行内混排示例：</span>
          <RebornButton variant="text" color="primary">查看详情</RebornButton>
          <span>/</span>
          <RebornButton variant="text" color="error">删除</RebornButton>
          <span>/</span>
          <RebornButton variant="text" color="neutral">取消</RebornButton>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸与图标" description="三档：高度 24 / 32 / 40px，水平内边距统一 12px。">
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex flex-wrap items-end gap-3">
          <RebornButton v-for="s in sizeOptions" :key="s.value" :size="s.value" color="primary">
            {{ s.label }}
          </RebornButton>
        </div>
        <div>
          <RebornButton v-for="s in sizeOptions" :key="s.value" :size="s.value" variant="circle" color="secondary" gap>
            <Icon name="lucide:star" />
          </RebornButton>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="边框线型 (Border Style)">
      <template #description>
        <code>borderStyle</code> 取 <code>solid</code> / <code>dashed</code>，边框宽度固定 1px；
        对有边框的 <code>outline</code> / <code>subtle</code> 变体生效。
      </template>
      <DemoBlock layout="stack" class="gap-5">
        <div v-for="v in (['outline', 'subtle'] as const)" :key="v" class="flex flex-col gap-3">
          <p class="text-muted text-xs font-medium">{{ v }}</p>
          <div v-for="bs in borderStyleOptions" :key="bs.value" class="flex flex-wrap items-center gap-3">
            <p class="text-dimmed w-20 text-xs italic">{{ bs.value }}</p>
            <RebornButton v-for="c in buttonColors" :key="c" :variant="v" :color="c" :border-style="bs.value" size="sm">
              {{ c }}
            </RebornButton>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="间隔功能 (Gap Handle)" description="自动为同级按钮添加左边距，方便快速布局。">
      <DemoBlock layout="stack" class="gap-4">
        <RebornCheckbox v-model="gap" label="开启间隔" />
        <div class="flex flex-wrap items-center">
          <RebornButton color="primary" :gap="gap">确认提交</RebornButton>
          <RebornButton color="neutral" variant="outline" :gap="gap">取消</RebornButton>
          <RebornButton color="error" variant="soft" :gap="gap">删除</RebornButton>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="组合与编排">
      <DemoBlock layout="grid" class="sm:grid-cols-2 lg:grid-cols-2">
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="text-xs">胶囊组</DemoNote>
          <div class="flex items-center">
            <RebornButton color="warning" class="w-[110px] rounded-l-full px-6">加入购物车</RebornButton>
            <RebornButton color="error" class="w-[110px] rounded-r-full px-6">立即购买</RebornButton>
          </div>
        </div>
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="text-xs">垂直功能</DemoNote>
          <div class="flex">
            <RebornButton color="warning" variant="solid" class="h-auto w-16 flex-col gap-1 rounded-r-none py-3">
              <Icon name="lucide:share-2" size="18" />
              <span class="text-[10px]">分享</span>
            </RebornButton>
            <RebornButton color="secondary" variant="solid" class="h-auto w-16 flex-col gap-1 rounded-none! py-3">
              <Icon name="lucide:message-square" size="18" />
              <span class="text-[10px]">咨询</span>
            </RebornButton>
            <RebornButton color="error" variant="solid" class="h-auto w-16 flex-col gap-1 rounded-l-none py-3">
              <Icon name="lucide:heart" size="18" />
              <span class="text-[10px]">点赞</span>
            </RebornButton>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
