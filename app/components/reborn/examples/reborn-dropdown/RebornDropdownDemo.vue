<script setup lang="ts">
import type { DropdownOption, DropdownPosition, DropdownValue } from "~/components/reborn/ui/reborn-dropdown/reborn-dropdown.config";
import { dropdownPositions, dropdownTriggers } from "~/components/reborn/ui/reborn-dropdown/reborn-dropdown.config";
import RebornDgroup from "~/components/reborn/ui/reborn-dropdown/RebornDgroup.vue";
import RebornDoption from "~/components/reborn/ui/reborn-dropdown/RebornDoption.vue";
import RebornDropdown from "~/components/reborn/ui/reborn-dropdown/RebornDropdown.vue";
import RebornDsubmenu from "~/components/reborn/ui/reborn-dropdown/RebornDsubmenu.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  trigger: "click",
  position: "bottom",
  showArrow: false,
  disabled: false,
  hideOnSelect: true,
});

/** 最近一次选择的值与显隐状态，用于回显事件 */
const lastSelected = ref<DropdownValue | null>(null);
const visibleLog = ref("");

function handleSelect(value: DropdownValue) {
  lastSelected.value = value;
}

function handleVisibleChange(visible: boolean) {
  visibleLog.value = visible ? "展开" : "收起";
}

/** 菜单配置项（options 数据驱动） */
const options: DropdownOption[] = [
  { label: "新建文件", value: "new", icon: "lucide:plus" },
  { label: "编辑内容", value: "edit", icon: "lucide:pencil" },
  { label: "分享链接", value: "share", icon: "lucide:share-2" },
  { label: "删除（禁用）", value: "delete", icon: "lucide:trash-2", disabled: true },
];

/** 带下拉框的按钮：右侧箭头收纳的次要操作 */
const submitOptions: DropdownOption[] = [
  { label: "保存草稿", value: "draft" },
  { label: "定时发布", value: "schedule" },
  { label: "发布并通知", value: "notify" },
];

/**
 * 弹出位置演示的占位网格：按钮落在与其弹出方向对应的格子上，
 * 上排三个向上弹、左列三个向左弹，以此类推；null 为空白占位。
 */
const placementGrid: (DropdownPosition | null)[] = [
  null, "topLeft", "top", "topRight", null,
  "leftTop", null, null, null, "rightTop",
  "left", null, null, null, "right",
  "leftBottom", null, null, null, "rightBottom",
  null, "bottomLeft", "bottom", "bottomRight", null,
];

const triggerLabels: Record<string, string> = { click: "Click 点击", hover: "Hover 悬停", manual: "Manual 手动控制" };
const triggerOptions = dropdownTriggers.map((t) => ({ label: triggerLabels[t], value: t }));

const positionOptions = dropdownPositions.map((p) => ({ label: p, value: p }));

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "触发方式",
        key: "trigger",
        component: "select" as const,
        defaultValue: "click",
        props: { options: triggerOptions },
      },
      {
        label: "弹出位置",
        key: "position",
        component: "select" as const,
        defaultValue: "bottom",
        props: { options: positionOptions },
      },
    ],
  },
  {
    title: "行为控制",
    children: [
      { label: "显示箭头", key: "showArrow", component: "checkbox" as const, defaultValue: false },
      { label: "选择后收起", key: "hideOnSelect", component: "checkbox" as const, defaultValue: true },
      { label: "禁用菜单", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const dropdownCode = computed(() => {
  const s = state.value;
  const attrs: string[] = [":options=\"options\""];
  if (s.trigger !== "click") attrs.push(`trigger="${s.trigger}"`);
  if (s.position !== "bottom") attrs.push(`position="${s.position}"`);
  if (s.showArrow) attrs.push("show-arrow");
  if (!s.hideOnSelect) attrs.push(":hide-on-select=\"false\"");
  if (s.disabled) attrs.push("disabled");
  return `<RebornDropdown\n  ${attrs.join("\n  ")}\n  @select="handleSelect"\n>\n  <RebornButton label="下拉菜单" />\n</RebornDropdown>`;
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" :code="dropdownCode" component-name="RebornDropdown" title="交互演练场"
      description="调节触发方式、弹出位置与箭头，实时预览下拉菜单的展开表现。">
      <div class="flex flex-col items-center gap-4 py-16">
        <RebornDropdown v-slot="{ toggle }" :options="options" :trigger="state.trigger" :position="state.position"
          :show-arrow="state.showArrow" :hide-on-select="state.hideOnSelect" :disabled="state.disabled"
          @select="handleSelect" @popup-visible-change="handleVisibleChange">
          <!-- manual 触发方式下组件不响应点击，由插槽下发的 toggle 控制 -->
          <RebornButton :disabled="state.disabled" label="下拉菜单" @click="state.trigger === 'manual' && toggle()">
            <template #trailing>
              <Icon name="lucide:chevron-down" class="size-4" />
            </template>
          </RebornButton>
        </RebornDropdown>
        <DemoNote v-if="lastSelected !== null || visibleLog" tone="dimmed">
          <span v-if="visibleLog">popup-visible-change：{{ visibleLog }}</span>
          <span v-if="lastSelected !== null" class="ml-3">select：<code>{{ lastSelected }}</code></span>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法" description="最简单的下拉菜单：任意元素都能作为触发器，这里用一段文字加下拉图标；默认点击触发，也可改为悬停。">
      <DemoBlock layout="row" align="center" class="gap-10">
        <RebornDropdown :options="options" @select="handleSelect">
          <span class="inline-flex cursor-pointer items-center gap-1 text-sm text-gray-7 select-none">
            Click Me
            <Icon name="lucide:chevron-down" class="size-4 text-gray-5" />
          </span>
        </RebornDropdown>
        <RebornDropdown :options="options" trigger="hover" @select="handleSelect">
          <span class="inline-flex cursor-pointer items-center gap-1 text-sm text-gray-7 select-none">
            Hover Me
            <Icon name="lucide:chevron-down" class="size-4 text-gray-5" />
          </span>
        </RebornDropdown>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="弹出位置" description="position 支持 12 个方向；按钮落在与其弹出方向对应的位置上，靠近视口边缘时会自动翻转到对侧。">
      <DemoBlock layout="row" align="center">
        <div class="grid w-fit grid-cols-5 gap-2">
          <template v-for="(p, i) in placementGrid" :key="i">
            <RebornDropdown v-if="p" :options="options" :position="p" show-arrow class="w-full"
              :ui="{ trigger: 'w-full' }" @select="handleSelect">
              <RebornButton :label="p" size="sm" variant="outlined" color="neutral" class="w-full" />
            </RebornDropdown>
            <div v-else />
          </template>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="带下拉框的按钮"
      description="trigger=manual 时组件不绑定触发行为，默认插槽下发 open / close / toggle 与 visible：整组按钮作为触发器占位，只让右侧箭头按钮调用 toggle 展开，主按钮执行默认操作；下拉从整组的右下角弹出。">
      <DemoBlock layout="row" align="center">
        <RebornDropdown v-slot="{ toggle, visible }" :options="submitOptions" trigger="manual" position="bottomRight"
          @select="handleSelect">
          <div class="inline-flex">
            <RebornButton label="发布" class="rounded-r-none!" @click="handleSelect('publish')" />
            <RebornButton class="rounded-l-none! border-l border-white/20" aria-label="更多发布方式" @click="toggle">
              <template #trailing>
                <Icon name="lucide:chevron-down" class="size-4 transition-transform" :class="visible && 'rotate-180'" />
              </template>
            </RebornButton>
          </div>
        </RebornDropdown>
        <RebornDropdown v-slot="{ toggle, visible }" :options="submitOptions" trigger="manual" position="bottomRight"
          @select="handleSelect">
          <div class="inline-flex">
            <RebornButton label="导出" variant="outlined" class="rounded-r-none!" @click="handleSelect('export')" />
            <RebornButton variant="outlined" class="-ml-px rounded-l-none!" aria-label="更多导出方式" @click="toggle">
              <template #trailing>
                <Icon name="lucide:chevron-down" class="size-4 transition-transform" :class="visible && 'rotate-180'" />
              </template>
            </RebornButton>
          </div>
        </RebornDropdown>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多级菜单与选项组"
      description="RebornDgroup 用标题把选项分组；RebornDsubmenu 作为入口展开下一级菜单（默认悬停、从右上角弹出），可无限嵌套，任一层选中都会冒泡到最外层的 select 并整体收起。">
      <DemoBlock layout="row" align="center">
        <RebornDropdown @select="handleSelect">
          <RebornButton label="多级菜单" variant="outlined">
            <template #trailing>
              <Icon name="lucide:chevron-down" class="size-4" />
            </template>
          </RebornButton>
          <template #content>
            <RebornDgroup title="文件">
              <RebornDoption value="new">
                <template #icon>
                  <Icon name="lucide:file-plus" class="size-4" />
                </template>
                新建
              </RebornDoption>
              <RebornDoption value="open">
                <template #icon>
                  <Icon name="lucide:folder-open" class="size-4" />
                </template>
                打开
              </RebornDoption>
            </RebornDgroup>
            <RebornDgroup title="导出">
              <RebornDsubmenu title="导出为">
                <template #icon>
                  <Icon name="lucide:file-output" class="size-4" />
                </template>
                <RebornDoption value="export-pdf">PDF</RebornDoption>
                <RebornDoption value="export-png">PNG</RebornDoption>
                <RebornDsubmenu title="更多格式">
                  <RebornDoption value="export-svg">SVG</RebornDoption>
                  <RebornDoption value="export-webp">WebP</RebornDoption>
                </RebornDsubmenu>
              </RebornDsubmenu>
              <RebornDoption value="print">打印</RebornDoption>
            </RebornDgroup>
          </template>
        </RebornDropdown>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="页头、页脚与禁用" description="header / footer 插槽提供页头与页脚；disabled 禁用整个菜单；hide-on-select 关闭后选择不再自动收起。">
      <DemoBlock layout="row" align="center">
        <RebornDropdown @select="handleSelect">
          <RebornButton label="账户" variant="soft" />
          <template #header>
            <span>已登录：reborn@example.com</span>
          </template>
          <template #content>
            <RebornDoption value="profile">个人资料</RebornDoption>
            <RebornDoption value="billing">账单管理</RebornDoption>
            <RebornDoption :value="{ action: 'logout' }">退出登录</RebornDoption>
          </template>
          <template #footer>
            <span>value 支持字符串、数字或对象</span>
          </template>
        </RebornDropdown>
        <RebornDropdown :options="options" disabled>
          <RebornButton label="已禁用" disabled />
        </RebornDropdown>
        <RebornDropdown :options="options" :hide-on-select="false" @select="handleSelect">
          <RebornButton label="选择后不收起" color="warning" variant="soft" />
        </RebornDropdown>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
