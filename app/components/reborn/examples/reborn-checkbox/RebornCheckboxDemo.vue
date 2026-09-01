<script setup lang="ts">
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornCheckboxGroup from "~/components/reborn/ui/reborn-checkbox/RebornCheckboxGroup.vue";
import {
  checkboxColors,
  checkboxSizes,
  checkboxVariants,
} from "~/components/reborn/ui/reborn-checkbox/reborn-checkbox.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  checked: true,
  size: "md",
  color: "primary",
  variant: "filled",
  label: "同意用户协议",
  indeterminate: false,
  disabled: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础属性",
    children: [
      {
        label: "标签文本",
        key: "label",
        component: "input" as const,
        defaultValue: "同意用户协议",
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: checkboxSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: checkboxColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "样式变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "filled",
        props: { options: checkboxVariants.map((v) => ({ label: v, value: v })) },
      },
      {
        label: "半选状态",
        key: "indeterminate",
        component: "checkbox" as const,
        defaultValue: false,
      },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const checkboxCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="checked"', `label="${s.label}"`];

  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.variant !== "filled") props.push(`variant="${s.variant}"`);
  if (s.indeterminate) props.push("indeterminate");
  if (s.disabled) props.push("disabled");

  return `<RebornCheckbox\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 三种基础状态 */
const uncheckedValue = ref(false);
const checkedValue = ref(true);
const disabledValue = ref(true);

/** 自定义真假值：未选中时也会写入具体文案 */
const noticeValue = ref("系统更新");

/** 复选框组的选中集合 */
const brands = ref<string[]>(["Apple"]);
const brandOptions = ["Apple", "Huawei", "Xiaomi"];

/** 卡片式多选 */
const selectedPlans = ref<string[]>(["标准版"]);
const plans = [
  { value: "基础版", title: "基础版", description: "适合快速接入的轻量配置。" },
  { value: "标准版", title: "标准版", description: "涵盖常用场景的均衡方案。" },
  { value: "旗舰版", title: "旗舰版", description: "完整能力组合，满足复杂业务。" },
];

/** 半选与全选：父级勾选框的状态由子项选中数量推导 */
const fruitOptions = ["苹果", "香蕉", "橙子"];
const fruits = ref<string[]>(["苹果"]);
const isAllFruitChecked = computed(() => fruits.value.length === fruitOptions.length);
const isPartFruitChecked = computed(() => fruits.value.length > 0 && !isAllFruitChecked.value);

/** 点击父级勾选框：全选或全不选 */
function toggleAllFruits() {
  fruits.value = isAllFruitChecked.value ? [] : [...fruitOptions];
}

/** 数据驱动的复选框组：options 支持对象写法，可逐项禁用 */
const roleOptions = [
  { label: "管理员", value: "admin" },
  { label: "开发", value: "dev" },
  { label: "测试", value: "qa" },
  { label: "运维", value: "ops", disabled: true },
];
const roles = ref<string[]>(["dev"]);
const roleDirection = ref<"horizontal" | "vertical">("horizontal");

/** max 限制：选满两项后未选中的选项自动禁用 */
const limitedRoles = ref<string[]>([]);

/** 自定义勾选框：checkbox 插槽整体替换方块 */
const tagOptions = ["Vue", "React", "Svelte"];
const tags = ref<string[]>(["Vue"]);

/** 高级定制演示用的独立状态 */
const roundedValue = ref(true);
const iconValue = ref(true);

/** 样式变体矩阵：两种变体各演示未选、选中、半选三态 */
const variantMatrix = [
  { variant: "filled" as const, note: "默认值。选中与半选都填充配色，图标为白色。" },
  {
    variant: "outlined" as const,
    note: "选中不填充背景，只把边框与图标染成配色；半选时边框保持灰色，中间是同色实心小方块。",
  },
];
const variantUnchecked = ref(false);
const variantChecked = ref(true);

/** outlined 变体的配色对照 */
const variantColors = ["primary", "success", "warning", "error"] as const;
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="checkboxCode"
      component-name="RebornCheckbox"
      title="交互演练场"
      description="调节尺寸与配色，实时预览勾选框的选中动画与禁用表现。"
    >
      <RebornCheckbox
        v-model="state.checked"
        :size="state.size"
        :color="state.color"
        :variant="state.variant"
        :label="state.label"
        :indeterminate="state.indeterminate"
        :disabled="state.disabled"
      />
    </Playground>

    <DemoSection
      title="基础状态"
      description="未选中、已选中与禁用三种状态；禁用后仍会保留当前勾选结果。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-10"
      >
        <RebornCheckbox
          v-model="uncheckedValue"
          label="未选中"
        />
        <RebornCheckbox
          v-model="checkedValue"
          label="已选中"
        />
        <RebornCheckbox
          v-model="disabledValue"
          label="禁用"
          disabled
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="样式变体"
      description="variant 控制选中态的表现形式：filled 填充配色，outlined 只染边框与图标。半选样式跟随变体，无需额外配置。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div
          v-for="item in variantMatrix"
          :key="item.variant"
          class="flex flex-col gap-3"
        >
          <span class="text-dimmed text-xs font-medium">
            <code>variant="{{ item.variant }}"</code>
          </span>
          <div class="flex flex-wrap items-center gap-8">
            <RebornCheckbox
              v-model="variantUnchecked"
              :variant="item.variant"
              label="未选"
            />
            <RebornCheckbox
              v-model="variantChecked"
              :variant="item.variant"
              label="选中"
            />
            <RebornCheckbox
              :model-value="false"
              :variant="item.variant"
              indeterminate
              label="半选"
            />
          </div>
          <p class="text-muted text-xs">{{ item.note }}</p>
        </div>
      </DemoBlock>

      <DemoBlock
        layout="row"
        align="center"
        class="gap-8"
      >
        <RebornCheckbox
          v-for="color in variantColors"
          :key="color"
          :model-value="true"
          variant="outlined"
          :color="color"
          :label="color"
        />
      </DemoBlock>

      <DemoNote tone="dimmed">
        outlined 的半选态刻意不改边框颜色，只在方块中央渲染一个宽高为勾选框一半的同色实心小方块；此时
        <code>ui.icon</code> 不生效，需要覆盖样式请改用 <code>ui.dot</code>。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义真假值"
      description="true-value 与 false-value 让单个勾选框直接绑定业务文案，而不局限于布尔值。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-10"
      >
        <RebornCheckbox
          v-model="noticeValue"
          true-value="系统更新"
          false-value="系统不更新"
          label="系统更新"
        />
        <RebornCheckbox
          v-model="noticeValue"
          true-value="产品迭代"
          false-value="产品不迭代"
          label="产品迭代"
          color="info"
        />
        <RebornCheckbox
          v-model="noticeValue"
          true-value="活动通知"
          false-value="活动不通知"
          label="活动通知"
          color="success"
        />
      </DemoBlock>

      <DemoNote tone="dimmed">
        当前值：<code>{{ noticeValue }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="复选框组"
      description="RebornCheckboxGroup 统一托管数组值，并向下派发 size 与 color。"
    >
      <DemoBlock layout="stack">
        <RebornCheckboxGroup
          v-model="brands"
          color="secondary"
          class="flex flex-wrap items-center gap-8"
        >
          <RebornCheckbox
            v-for="option in brandOptions"
            :key="option"
            :value="option"
            :label="option"
          />
        </RebornCheckboxGroup>
      </DemoBlock>

      <DemoNote tone="dimmed">
        已选：<code>{{ brands.length ? brands.join("、") : "空" }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="半选与全选"
      description="indeterminate 是纯受控属性，父级勾选框的半选态需由子项选中数量推导。"
    >
      <DemoBlock layout="stack">
        <RebornCheckbox
          :model-value="isAllFruitChecked"
          :indeterminate="isPartFruitChecked"
          label="全选"
          @change="toggleAllFruits"
        />

        <RebornCheckboxGroup
          v-model="fruits"
          class="pl-7"
        >
          <RebornCheckbox
            v-for="fruit in fruitOptions"
            :key="fruit"
            :value="fruit"
            :label="fruit"
          />
        </RebornCheckboxGroup>
      </DemoBlock>

      <DemoNote tone="dimmed">
        已选 <code>{{ fruits.length }}</code> / {{ fruitOptions.length }} 项，父级当前为
        <code>{{ isAllFruitChecked ? "全选" : isPartFruitChecked ? "半选" : "未选" }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="数据驱动的复选框组"
      description="options 传入数据后由组自行渲染子项，此时默认插槽不再生效；direction 控制排列方向，max 限制最多选中数量。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>options</code> ·
            <code>direction</code>
          </span>
          <RebornCheckboxGroup
            v-model="roles"
            :options="roleOptions"
            :direction="roleDirection"
          />
          <button
            type="button"
            class="border-default rounded-ui-md hover:border-inverted text-muted w-fit cursor-pointer border px-3 py-1 text-xs transition-colors"
            @click="roleDirection = roleDirection === 'horizontal' ? 'vertical' : 'horizontal'"
          >
            切换为 {{ roleDirection === "horizontal" ? "vertical" : "horizontal" }}
          </button>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>max="2"</code> ·
            <code>#label</code>
          </span>
          <RebornCheckboxGroup
            v-model="limitedRoles"
            :options="roleOptions"
            :max="2"
            color="success"
            direction="vertical"
          >
            <template #label="{ data }">
              <span class="flex items-center gap-2">
                {{ data.label }}
                <code class="text-dimmed text-[10px]">{{ data.value }}</code>
              </span>
            </template>
          </RebornCheckboxGroup>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        角色：<code>{{ roles.length ? roles.join("、") : "空" }}</code>；限额组已选
        <code>{{ limitedRoles.length }}</code> / 2 项，选满后未选中项自动禁用。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="卡片式多选"
      description="value 与数组型 v-model 配合，可把勾选框嵌入到整块可点击的描边卡片中。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <label
          v-for="plan in plans"
          :key="plan.value"
          class="border-default rounded-ui-md hover:border-inverted flex cursor-pointer items-start gap-4 border p-4 transition-colors"
        >
          <RebornCheckbox
            v-model="selectedPlans"
            :value="plan.value"
          />
          <div class="flex flex-col gap-1">
            <p class="text-highlighted text-sm font-semibold">{{ plan.title }}</p>
            <p class="text-muted text-xs">{{ plan.description }}</p>
          </div>
        </label>
      </DemoBlock>

      <DemoNote tone="dimmed">
        已选套餐：<code>{{ selectedPlans.length ? selectedPlans.join("、") : "空" }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义勾选框"
      description="checkbox 插槽整体替换勾选方块，作用域提供 checked / disabled / indeterminate；填充后 ui 的 control 与 icon 两个键会失效。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-4"
      >
        <RebornCheckbox
          v-for="tag in tagOptions"
          :key="tag"
          v-model="tags"
          :value="tag"
        >
          <template #checkbox="{ checked }">
            <span
              class="rounded-ui-md border px-3 py-1 text-xs font-medium transition-colors"
              :class="checked ? 'border-primary bg-primary text-inverted' : 'border-default text-muted'"
            >
              {{ tag }}
            </span>
          </template>
        </RebornCheckbox>
      </DemoBlock>

      <DemoNote tone="dimmed">
        已选技术栈：<code>{{ tags.length ? tags.join("、") : "空" }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="进阶自定义"
      description="ui 可逐槽覆盖 control / icon / label 的样式，icon 插槽还能整体替换勾选标记。"
    >
      <DemoBlock
        layout="grid"
        align="center"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">全圆角 · <code>ui</code> 覆盖</span>
          <RebornCheckbox
            v-model="roundedValue"
            label="渐变文字标签"
            :ui="{
              control: 'rounded-full',
              label: 'font-bold bg-linear-to-r from-primary to-info bg-clip-text text-transparent',
            }"
          />
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">自定义图标 · <code>#icon</code></span>
          <RebornCheckbox
            v-model="iconValue"
            label="收藏这个组件"
            color="error"
            :ui="{ control: 'size-8' }"
          >
            <template #icon="{ checked }">
              <Icon
                :name="checked ? 'lucide:heart' : 'lucide:heart-crack'"
                class="size-5 transition-all duration-300"
                :class="checked ? 'fill-current' : 'text-dimmed'"
              />
            </template>
          </RebornCheckbox>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
