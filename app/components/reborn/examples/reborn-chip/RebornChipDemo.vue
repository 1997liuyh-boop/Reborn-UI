<script setup lang="ts">
import { ref } from "vue";
import RebornChip from "~/components/reborn/ui/reborn-chip/RebornChip.vue";
import { chipColors, chipSizes, chipPositions } from "~/components/reborn/ui/reborn-chip/reborn-chip.config";

/** 演练场状态 */
const state = ref({
  color: "primary",
  size: "md",
  position: "top-right",
  text: "9",
  show: true,
  inset: false,
  standalone: false,
});

/**
 * 角标锚点占位样式：只描边不填充。
 * 角标必须挂在一个宿主元素上才看得出定位效果，这里用虚线框表示"任意宿主"，
 * 既说明了演示语义，又不会在画布上再叠一层背景。
 */
const anchorClass = "border-default rounded-ui-sm border border-dashed";

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础配置",
    children: [
      {
        label: "标签文本",
        key: "text",
        component: "input" as const,
        defaultValue: "9",
      },
      {
        label: "显示状态",
        key: "show",
        component: "checkbox" as const,
        defaultValue: true,
      },
    ],
  },
  {
    title: "样式选项",
    children: [
      {
        label: "颜色主题",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          // Playground 的 select 走 RebornSelect，选项字段是 options（不是 items）
          options: chipColors.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
        },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: chipSizes.map((s) => ({ label: s.toUpperCase(), value: s })),
        },
      },
    ],
  },
  {
    title: "布局位置",
    children: [
      {
        label: "显示位置",
        key: "position",
        component: "select" as const,
        defaultValue: "top-right",
        props: {
          options: chipPositions.map((p) => ({ label: p, value: p })),
        },
      },
      {
        label: "内嵌模式",
        key: "inset",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "独立渲染",
        key: "standalone",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" component-name="RebornChip" title="交互演练场"
      description="调节左侧属性，实时预览角标的颜色、尺寸与吸附位置。">
      <RebornChip v-bind="state">
        <div :class="anchorClass" class="text-dimmed flex size-24 items-center justify-center">
          <Icon name="lucide:bell" class="size-8" />
        </div>
      </RebornChip>
    </Playground>

    <DemoSection title="色彩体系" description="支持全套语义化色彩，覆盖提示、成功、警告、错误等反馈场景。">
      <DemoBlock layout="grid" align="center">
        <div v-for="c in chipColors" :key="c" class="flex flex-col items-center gap-3">
          <RebornChip :color="c" text="8">
            <div :class="anchorClass" class="size-12" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium tracking-wider uppercase">{{ c }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸规格" description="从细微装饰到醒目提示，多级尺寸随心切换。">
      <DemoBlock layout="row" align="end" class="gap-10">
        <div v-for="s in chipSizes" :key="s" class="flex flex-col items-center gap-4">
          <RebornChip :size="s" color="error" text="NEW">
            <div :class="anchorClass" class="text-dimmed flex h-12 w-20 items-center justify-center text-[10px] font-bold uppercase">
              {{ s }}
            </div>
          </RebornChip>
          <span class="text-dimmed text-[10px] font-bold tracking-widest">{{ s.toUpperCase() }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="典型应用" description="结合头像、图标按钮与操作按钮，构成常见的状态提示组合。">
      <DemoBlock layout="row" align="center" class="gap-10">
        <div class="flex flex-col items-center gap-3">
          <!-- 头像在线状态：inset 让角标嵌入圆形边缘内部 -->
          <RebornChip color="success" size="lg" inset position="bottom-right">
            <UAvatar src="https://github.com/benjamincanac.png" size="xl" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">在线状态 · <code>inset</code></span>
        </div>

        <div class="flex flex-col items-center gap-3">
          <!-- 未读小红点：text 传空串即为纯圆点 -->
          <RebornChip color="error" size="sm" text="">
            <RebornButton color="neutral" variant="circle" size="lg">
              <template #leading>
                <Icon name="lucide:mail" class="size-6" />
              </template>
            </RebornButton>
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">未读圆点 · <code>text=""</code></span>
        </div>

        <div class="flex flex-col items-center gap-3">
          <RebornChip color="warning" text="SALE" size="md">
            <RebornButton label="立即解锁" color="neutral" variant="solid" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">按钮促销标</span>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
