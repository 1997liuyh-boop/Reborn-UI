<script setup lang="ts">
import type { TreeSelectValue } from "~/components/reborn/ui/reborn-tree-select/reborn-tree-select.config";
import type { TreeSelectProps } from "~/components/reborn/ui/reborn-tree-select/RebornTreeSelect.vue";
import { computed, ref } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import { treeSelectColors, treeSelectSizes, treeSelectVariants } from "~/components/reborn/ui/reborn-tree-select/reborn-tree-select.config";
import RebornTreeSelect from "~/components/reborn/ui/reborn-tree-select/RebornTreeSelect.vue";

/** 各示例共用只读树数据，包含可选父级与禁用节点。 */
const treeData = [
  {
    key: "product", title: "产品研发", icon: "lucide:folder", children: [
      { key: "design", title: "设计系统", icon: "lucide:palette" },
      { key: "web", title: "前端开发", icon: "lucide:code" },
      { key: "legacy", title: "历史项目（禁用）", disabled: true },
    ]
  },
  {
    key: "operation", title: "业务运营", icon: "lucide:folder", children: [
      { key: "content", title: "内容运营", icon: "lucide:zodiac-taurus" }, { key: "support", title: "客户支持", icon: "lucide:users-round" },
    ]
  },
];

// ─── 交互演练场 ───
/** 演练场默认参数。 */
const defaultState = {
  color: "primary", variant: "outlined", size: "md", multiple: false,
  clearable: true, disabled: false, collapseTags: false, collapseTagsTooltip: false, maxCollapseTags: 1,
  closeOn: "click", portal: true, allowSearch: false, showLine: false, showIcon: false, defaultExpandAll: true
} satisfies TreeSelectProps;
const state = ref<Pick<TreeSelectProps, keyof typeof defaultState>>({ ...defaultState });
const value = ref<TreeSelectValue>(null);
/** 控制面板覆盖形态、尺寸与常用行为。 */
const controls = [
  {
    title: "基础属性", children: [
      { label: "语义色", key: "color", component: "select" as const, props: { options: treeSelectColors.map(value => ({ label: value, value })) } },
      { label: "形态", key: "variant", component: "select" as const, props: { options: treeSelectVariants.map(value => ({ label: value, value })) } },
      { label: "尺寸", key: "size", component: "select" as const, props: { options: treeSelectSizes.map(value => ({ label: value, value })) } },
    ]
  },
  {
    title: "状态与行为", children: [
      { label: "多选", key: "multiple", component: "checkbox" as const },
      { label: "折叠标签", key: "collapseTags", component: "checkbox" as const, defaultValue: false },
      { label: "折叠标签悬浮提示", key: "collapseTagsTooltip", component: "checkbox" as const, defaultValue: false },
      { label: "折叠前保留数量", key: "maxCollapseTags", component: "input-number" as const, defaultValue: 1, props: { min: 0, step: 1 } },
      { label: "关闭时机", key: "closeOn", component: "select" as const, defaultValue: "click", props: { options: [{ label: "外部点击后", value: "click" }, { label: "外部按下时", value: "mousedown" }] } },
      { label: "浮层传送到 body", key: "portal", component: "checkbox" as const, defaultValue: true },
      { label: "允许搜索", key: "allowSearch", component: "checkbox" as const, defaultValue: false },
      { label: "可清空", key: "clearable", component: "checkbox" as const },
      { label: "禁用", key: "disabled", component: "checkbox" as const },
      { label: "连接线", key: "showLine", component: "checkbox" as const },
      { label: "节点图标", key: "showIcon", component: "checkbox" as const },
    ]
  },
];
/** 代码包含演示数据，可直接复制。 */
const code = computed(() => `<script setup>\nimport { ref } from 'vue'\nconst value = ref(${JSON.stringify(value.value)})\nconst treeData = ${JSON.stringify(treeData, null, 2)}\n<\/script>\n<template>\n  <RebornTreeSelect v-model="value" :tree-data="treeData"\n    color="${state.value.color}" variant="${state.value.variant}" size="${state.value.size}"\n    :multiple="${state.value.multiple}" :clearable="${state.value.clearable}" :disabled="${state.value.disabled}"\n    :collapse-tags="${state.value.collapseTags}" :collapse-tags-tooltip="${state.value.collapseTagsTooltip}" :max-collapse-tags="${state.value.maxCollapseTags}"\n    close-on="${state.value.closeOn}" :portal="${state.value.portal}" :allow-search="${state.value.allowSearch}"\n    :show-line="${state.value.showLine}" :show-icon="${state.value.showIcon}" default-expand-all />\n</template>`);
/** 同时重置演练参数与选中值。 */
function resetState() { state.value = { ...defaultState }; value.value = null; }

// ─── 场景演示状态 ───
/** 单选与多选分开维护，方便比较返回值。 */
const single = ref<TreeSelectValue>("web");
const multiple = ref<TreeSelectValue>(["design", "content"]);
const selectValue = ref("web");
const variants = { outlined: "描边", filled: "填充", borderless: "无边框", underlined: "下划线" };
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="code" component-name="RebornTreeSelect" title="交互演练场"
      description="调节选择框形态、单多选与树节点显示方式，查看选择结果。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">重置配置</RebornButton>
      </template>
      <div class="flex w-full max-w-md flex-col gap-4 pb-40">
        <RebornTreeSelect v-model="value" v-bind="state" :tree-data="treeData" placeholder="请选择所属团队" />
        <DemoNote tone="dimmed">当前值：{{ JSON.stringify(value) }}</DemoNote>
      </div>
    </Playground>
    <DemoSection title="基础用法" class="relative z-30">
      <template #description>使用 <code>treeData</code> 传入层级数据，单选节点后自动收起。</template>
      <DemoBlock layout="stack">
        <RebornTreeSelect v-model="single" :tree-data="treeData" default-expand-all clearable class="w-full max-w-sm" />
        <DemoNote tone="dimmed">当前值：{{ JSON.stringify(single) }}</DemoNote>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="颜色与变体" class="relative z-20">
      <template #description><code>color</code> 与 <code>variant</code> 复用选择器主题；每组左侧为普通选择器，右侧为树选择器。</template>
      <DemoBlock layout="stack">
        <div
          v-for="variant in treeSelectVariants" :key="variant"
          class="grid w-full gap-3 sm:grid-cols-[5rem_1fr_1fr] sm:items-center"
        >
          <span class="text-sm text-gray-6">{{ variants[variant] }}</span>
          <RebornSelect v-model="selectValue" :variant="variant" :options="[{ label: '前端开发', value: 'web' }]" />
          <RebornTreeSelect model-value="web" :variant="variant" :tree-data="treeData" default-expand-all />
        </div>
        <div class="grid w-full gap-3 sm:grid-cols-2">
          <RebornTreeSelect
            v-for="color in treeSelectColors" :key="color" :color="color" :placeholder="color"
            :tree-data="treeData"
          />
        </div>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="尺寸" class="relative z-10">
      <template #description><code>size</code> 调整选择框高度与标签尺寸，树节点维持统一行高。</template>
      <DemoBlock layout="stack">
        <RebornTreeSelect
          v-for="size in treeSelectSizes" :key="size" :size="size" :placeholder="size"
          :tree-data="treeData" class="w-full max-w-sm"
        />
      </DemoBlock>
    </DemoSection>
    <DemoSection title="多选与清空" class="relative z-1">
      <template #description><code>multiple</code> 启用独立复选，<code>clearable</code> 允许一次清空所有选中项。</template>
      <DemoBlock layout="stack">
        <RebornTreeSelect
          v-model="multiple" :tree-data="treeData" multiple clearable default-expand-all
          class="w-full max-w-md"
        />
        <RebornTreeSelect :model-value="['design']" :tree-data="treeData" multiple disabled class="w-full max-w-md" />
        <DemoNote tone="dimmed">当前值：{{ JSON.stringify(multiple) }}；父子节点不会自动联动。</DemoNote>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="标签折叠">
      <template #description><code>collapseTags</code> 将超出 <code>maxCollapseTags</code> 的标签合并为数量，<code>collapseTagsTooltip</code> 悬浮展示隐藏项。</template>
      <DemoBlock layout="stack">
        <RebornTreeSelect
          :model-value="['design', 'web', 'content']" :tree-data="treeData" multiple collapse-tags
          collapse-tags-tooltip :max-collapse-tags="1" default-expand-all class="w-full max-w-md"
        />
      </DemoBlock>
    </DemoSection>
    <DemoSection title="搜索节点">
      <template #description><code>allowSearch</code> 在选择框内输入关键词，保留匹配节点及祖先路径；不会清除其他已选节点。</template>
      <DemoBlock layout="stack">
        <RebornTreeSelect :tree-data="treeData" allow-search placeholder="输入“设计”搜索团队" class="w-full max-w-md" />
        <RebornTreeSelect
          :tree-data="treeData" multiple allow-search collapse-tags collapse-tags-tooltip clearable
          placeholder="搜索并选择多个团队" class="w-full max-w-md"
        />
      </DemoBlock>
    </DemoSection>
    <DemoSection title="浮层行为">
      <template #description><code>closeOn</code> 决定外部点击或按下时关闭，<code>portal</code> 决定浮层是否传送到 body。</template>
      <DemoBlock layout="stack">
        <RebornTreeSelect :tree-data="treeData" close-on="mousedown" :portal="false" default-expand-all class="w-full max-w-md" />
        <DemoNote tone="dimmed">此例关闭传送，浮层留在容器内；祖先设置 overflow 时会被裁剪。</DemoNote>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="节点与空态插槽">
      <template #description><code>title</code> 插槽自定义树标题，<code>empty</code> 插槽替换空数据提示。</template>
      <DemoBlock layout="stack">
        <RebornTreeSelect :tree-data="treeData" show-line show-icon default-expand-all class="w-full max-w-sm">
          <template #title="{ node }">
            <span class="flex items-center gap-2">{{ node.title }}<span
              v-if="node.children"
              class="text-xs text-gray-5"
            >团队</span></span>
          </template>
        </RebornTreeSelect>
        <RebornTreeSelect class="w-full max-w-sm"><template #empty>暂无可选团队，请先创建团队</template></RebornTreeSelect>
      </DemoBlock>
    </DemoSection>
  </div>
</template>