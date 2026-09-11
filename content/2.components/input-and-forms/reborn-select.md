---
title: Select 下拉选择
description: 用于从选项列表中单选或多选的双端下拉选择组件，uniapp 端为弹层滚动选择。
category: 表单与输入
tags: [css, tailwind, select, dropdown, uniapp]
badge: Update
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: UPDATE
    color: warning
---

::ComponentViewer{demoFile="RebornSelectDemo.vue" config="RebornSelectConfig" componentId="reborn-select" :componentFiles='["RebornSelect.vue", "reborn-select.config.ts"]' :uniappFiles='["RebornSelect.vue", "reborn-select.config.ts", "index.ts"]'}
::

> 源码面板只列 select 自身目录下的文件。触发器 `RebornSelectTrigger`（含 `reborn-select-trigger.config.ts`）与展开动画 `RebornTransition` 是独立组件，源码分别见 `reborn-select-trigger`、`reborn-transition` 组件页。

## 简介

从选项列表中选值的表单控件，两端都支持 `v-model` 双向绑定、清空、禁用，并接入 `reborn-form` 的校验链路。

::warning
**本组件两端未对齐，交互范式与 API 差异极大，必须分端查看。** 最关键的三点：Web 端是**下拉浮层**（支持多选标签、关键词搜索、虚拟滚动、键盘导航），UniApp 端是**底部弹层 + 滚轮选择器**（带确认 / 取消按钮）；「多值」在两端是**不同概念**——Web 靠 `multiple` 选出一组值，UniApp 靠 `columnCount` 组成多列联动的一条路径；`change` 事件的签名不同（UniApp 是双参数）。
::

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}
触发器点击后在其下方展开浮层列表，选项即点即选。四种形态变体（`outlined` / `filled` / `borderless` / `underlined`）与 `RebornInput`、`RebornInputNumber` 共用同一套形态语言。浮层默认传送到 `body`，下方空间不足时自动向上展开。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
触发器点击后从屏幕底部升起 `RebornPopup`，内部是 `RebornPickerView` 滚轮选择器。滚动过程中值不落定，**必须点「确定」才写回 `v-model`**，点「取消」或滑动关闭则丢弃本次滚动。触发器可以整块隐藏（`show-trigger="false"`），改由外部调用暴露的 `open()` 方法唤起。
:::
::

**适用场景**：从一组有限、可枚举的候选值中取值；候选项较多、不适合平铺为 `RebornRadio` 或 `RebornCheckbox` 时。

**不适用场景**：候选项在 3 个以内（用 `RebornRadio` 更直观）；需要用户自由输入非枚举值（用 `RebornInput`）；需要多级下钻的树形数据（Web 端用 `RebornCascader`）。

## 用法

### 基础用法

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}

```vue
<script setup lang="ts">
const value = ref(null);
const options = [
  { label: "北京", value: "beijing" },
  { label: "上海", value: "shanghai" },
  { label: "广州", value: "guangzhou", disabled: true },
];
</script>

<template>
  <RebornSelect
    v-model="value"
    :options="options"
    placeholder="请选择城市"
    class="w-60"
  />
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

```vue
<script setup lang="ts">
const value = ref(null);
const options = [
  { label: "北京", value: "beijing" },
  { label: "上海", value: "shanghai" },
  { label: "广州", value: "guangzhou" },
];
</script>

<template>
  <RebornSelect
    v-model="value"
    title="请选择城市"
    placeholder="请选择城市"
    :options="options"
  />
</template>
```

::warning
本端选项类型来自 `RebornPickerView`，**不支持 `disabled` 字段**——滚轮里无法「跳过」某一项，需要禁用某个候选值时请在数据源里直接剔除。
::
:::
::

### 多选与标签折叠（仅 Web）

开启 `multiple` 后 `v-model` 的值变为数组，触发器内渲染 `RebornBadge` 标签。标签默认单行铺开、超出换行；开启 `collapse-tags` 则收敛为一行加一段 `+N`，再配 `collapse-tags-tooltip` 可悬停查看被折叠的具体选项。

```vue
<script setup lang="ts">
const value = ref(["beijing", "shanghai", "guangzhou"]);
</script>

<template>
  <RebornSelect
    v-model="value"
    multiple
    collapse-tags
    collapse-tags-tooltip
    :max-collapse-tags="1"
    :multiple-limit="5"
    :options="options"
    class="w-60"
  />
</template>
```

::tip
`multiple-limit` 为 `0` 时不限制个数。达到上限后未选中的选项不会自动置灰，超限的点击会被直接忽略。
::

### 搜索过滤（仅 Web）

`allow-search` 会在触发器内嵌一个输入框，展开时可直接键入关键词。`filter-option` 控制过滤策略：`true` 按 `label` 做不区分大小写的包含匹配，`false` 关闭本地过滤（配合 `search` 事件做远程搜索），也可传函数自定义。

```vue
<template>
  <!-- 本地过滤 -->
  <RebornSelect
    v-model="value"
    allow-search
    :options="options"
    class="w-60"
  />

  <!-- 远程搜索：关掉本地过滤，列表完全由外部 options 决定 -->
  <RebornSelect
    v-model="value"
    allow-search
    :filter-option="false"
    :loading="loading"
    :options="remoteOptions"
    class="w-60"
    @search="fetchRemote"
  />

  <!-- 自定义匹配规则：同时匹配 label 与拼音字段 -->
  <RebornSelect
    v-model="value"
    allow-search
    :filter-option="(kw, opt) => opt.label.includes(kw) || opt.pinyin?.includes(kw)"
    :options="options"
    class="w-60"
  />
</template>
```

### 虚拟滚动（仅 Web）

数据量上千时开启 `virtual`，只渲染可视区域内的选项，DOM 数量与数据量解耦。代价是**每一项高度必须恒定**，由 `virtual-item-height` 给出（默认 `33`，即 md 尺寸下选项的实测步长，含 4px 行距）。

```vue
<template>
  <RebornSelect
    v-model="value"
    virtual
    :virtual-item-height="33"
    :virtual-buffer="4"
    :options="bigOptions"
    class="w-60"
  />
</template>
```

::warning
若通过 `ui.option` 改了选项的字号或内边距，必须同步改 `virtual-item-height`，否则滚动条长度与内容会错位。
::

### 多列与级联（仅 UniApp）

`column-count` 大于 1 时渲染多列滚轮，此时 `v-model` 是各列 `value` 组成的数组，触发器展示文本用 `splitor` 拼接。级联数据靠**选项的 `children` 字段**逐层下钻：第一列取 `options`，第二列取第一列选中项的 `children`，以此类推。

```vue
<script setup lang="ts">
// 多列联动：省 → 市
const value = ref(["zhejiang", "hangzhou"]);
const options = [
  {
    label: "浙江",
    value: "zhejiang",
    children: [
      { label: "杭州", value: "hangzhou" },
      { label: "宁波", value: "ningbo" },
    ],
  },
  {
    label: "江苏",
    value: "jiangsu",
    children: [
      { label: "南京", value: "nanjing" },
      { label: "苏州", value: "suzhou" },
    ],
  },
];
</script>

<template>
  <RebornSelect
    v-model="value"
    :options="options"
    :column-count="2"
    splitor=" / "
    title="请选择地区"
  />
</template>
```

::tip
不带 `children` 的平铺数据配 `column-count="2"` 时，两列会渲染同一份候选项、彼此独立不联动——适合「小时 / 分钟」这类同源多列场景。
::

### 命令式打开（仅 UniApp）

组件通过 `defineExpose` 暴露了 `open` / `close`。把 `show-trigger` 关掉即可完全自定义触发入口；`open()` 还能接收一个回调，在用户点「确定」时拿到本次选中值。

```vue
<script setup lang="ts">
const selectRef = ref();
const value = ref(null);

function pick() {
  // 回调在点击「确定」后触发，参数为确认后的值
  selectRef.value?.open((val: any) => {
    console.log("已确认", val);
  });
}
</script>

<template>
  <RebornButton @tap="pick"> 自定义入口 </RebornButton>
  <RebornSelect
    ref="selectRef"
    v-model="value"
    :options="options"
    :show-trigger="false"
    title="请选择"
  />
</template>
```

::warning
`open()` 每次调用都会强制重挂 `RebornPickerView`（内部 `renderKey` 自增），把滚轮位置重置到当前 `v-model` 对应的档位。因此弹层关闭后再打开，滚轮不会停在上次滑动到的临时位置。
::

### 自定义选项渲染

两端都提供 `option` 插槽，但作用域参数与平台限制不同。

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}

```vue
<template>
  <RebornSelect
    v-model="value"
    :options="options"
    class="w-60"
  >
    <template #option="{ option, active }">
      <div class="flex w-full items-center justify-between">
        <span>{{ option.label }}</span>
        <span class="text-gray-5 text-[12px]">{{ option.desc }}</span>
      </div>
    </template>

    <template #header> 共 {{ options.length }} 项 </template>
    <template #footer>
      <span class="cursor-pointer">+ 新建选项</span>
    </template>
  </RebornSelect>
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

```vue
<template>
  <RebornSelect
    v-model="value"
    :options="options"
    title="请选择"
  >
    <template #option="{ item, index }">
      <text>{{ index + 1 }}. {{ item.label }}</text>
    </template>
  </RebornSelect>
</template>
```

::warning
**`option` 插槽在微信小程序上不可用。** 组件内部对该插槽的转发包在 `#ifndef MP-WEIXIN` 条件编译里，小程序端会回落为 `RebornPickerView` 的默认文本渲染。`tag` 插槽同理做了分端处理：非小程序端无条件渲染插槽内容，小程序端改为 `v-if="$slots.tag"` 判断并回落到内置的文本 / 占位符。
::
:::
::

### 表单校验（通用）

两端都通过 `useFormInject` 接入 `reborn-form`：外层 `RebornForm` 的 `disabled` 会向下透传，选值变动后自动触发 `change` 时机的校验。

```vue
<template>
  <RebornForm
    :model="form"
    :rules="rules"
  >
    <RebornFormItem
      label="城市"
      prop="city"
    >
      <RebornSelect
        v-model="form.city"
        :options="options"
      />
    </RebornFormItem>
  </RebornForm>
</template>
```

::tip
Web 端额外接收表单上下文的 `size` 与 `isError`：尺寸会被表单统一档位覆盖，校验失败时触发器自动切到红色描边（`borderless` 形态会补一圈边框，`underlined` 只标红底边）。UniApp 端只消费 `disabled` 与校验触发，不接管尺寸与错误态描边。
::

## API

::warning
两端 API 不通用，请按平台查看。
::

### Props

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}
| 属性名 | 类型 | 默认值 | 描述 |
| ---------------------- | ----------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `modelValue` / v-model | `any` | `null` | 绑定值。单选为选项的 `value`，`multiple` 开启后为 `value` 数组 |
| `options` | `SelectOption[]` | `[]` | 数据源选项 |
| `placeholder` | `string` | `"请选择"` | 占位符文本 |
| `multiple` | `boolean` | `false` | 多选模式，开启后触发器内渲染标签、绑定值变为数组 |
| `collapseTags` | `boolean` | `false` | 多选时把超出的标签合并为一段 `+N` |
| `collapseTagsTooltip` | `boolean` | `false` | 悬停 `+N` 时以气泡展示被折叠的选项，需先开启 `collapseTags` |
| `maxCollapseTags` | `number` | `1` | 折叠前最多展示的标签个数，仅在 `collapseTags` 开启时生效 |
| `multipleLimit` | `number` | `0` | 多选时最多可选个数，`0` 为不限制 |
| `disabled` | `boolean` | `false` | 是否禁用，可被外层 `RebornForm` 覆盖 |
| `clearable` | `boolean` | `true` | 是否显示清空按钮。悬停触发器时箭头淡出、清空按钮盖上来，不产生宽度跳动 |
| `loading` | `boolean` | `false` | 加载中：触发器箭头替换为转圈图标，下拉面板改为加载中占位 |
| `allowSearch` | `boolean` | `false` | 是否允许在触发器内输入关键词搜索选项 |
| `filterOption` | `boolean \| ((inputValue: string, option: SelectOption) => boolean)` | `true` | 过滤规则，需配合 `allowSearch`。`true` 按 `label` 包含匹配、`false` 关闭本地过滤 |
| `virtual` | `boolean` | `false` | 开启虚拟滚动，仅渲染可视区域内的选项 |
| `virtualItemHeight` | `number` | `33` | 虚拟列表单项占位高度（px，含 4px 行距），改了选项排版必须同步改这里 |
| `virtualBuffer` | `number` | `4` | 虚拟列表上下各多渲染几项，用于抵消快速滚动时的白屏 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸档位，可被外层 `RebornForm` 覆盖 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 配色。同时决定聚焦 / 展开态的描边色与选项选中态的底色文字色 |
| `variant` | `"outlined" \| "filled" \| "borderless" \| "underlined"` | `"outlined"` | 形态变体，与 `RebornInput`、`RebornInputNumber` 同一套形态语言 |
| `showArrow` | `boolean` | `true` | 是否显示下拉箭头 |
| `arrowAnimation` | `boolean` | `true` | 展开时箭头是否旋转 180° |
| `icon` | `string` | `"lucide:chevron-down"` | 箭头图标名 |
| `closeOn` | `"click" \| "mousedown"` | `"click"` | 收起时机。`click` 为触发器外完成一次点击后收起，`mousedown` 为外部按下即收（滚动亦收） |
| `portal` | `boolean` | `true` | 浮层是否传送到 `body`。关掉后浮层留在触发器内，会随父容器滚动并被 `overflow` 裁剪 |
| `autoAdjustOverflow` | `boolean` | `true` | 下方空间不足且上方更宽裕时向上展开；关闭后固定向下 |
| `class` | `any` | `-` | 追加到触发器外层容器的类名 |
| `ui` | `Record<string, ClassValue>` | `-` | 下拉列表与标签区的样式覆盖，见「自定义样式」 |
| `triggerUi` | `Record<string, ClassValue>` | `-` | 触发器盒子与浮层的样式覆盖（两部分键混写，组件内部自动拆分） |

> UniApp 端独有的 `title`、`showTrigger`、`columnCount`、`splitor`、`confirmText`、`showConfirm`、`cancelText`、`showCancel`、`popupUi`、`pickerUi` 在 Web 端**不存在**。
> :::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 属性名 | 类型 | 默认值 | 描述 |
| ---------------------- | ----------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `modelValue` / v-model | `SelectValue` | `null` | 绑定值。单列为选项的 `value`，多列为各列 `value` 组成的数组 |
| `options` | `SelectOption[]` | `[]` | 选项数据。多列级联时靠选项的 `children` 字段逐层下钻 |
| `title` | `string` | `"请选择"` | 底部弹层的标题 |
| `placeholder` | `string` | `"请选择"` | 触发器的占位符 |
| `showTrigger` | `boolean` | `true` | 是否渲染内置触发器。关掉后需外部调用 `open()` 唤起弹层 |
| `disabled` | `boolean` | `false` | 是否禁用，可被外层 `RebornForm` 覆盖 |
| `columnCount` | `number` | `1` | 滚轮列数。大于 1 时绑定值变为数组，级联数据取自选项的 `children` |
| `splitor` | `string` | `" - "` | 多列时触发器展示文本的拼接分隔符 |
| `clearable` | `boolean` | `true` | 是否在触发器上显示清空按钮 |
| `confirmText` | `string` | `"确定"` | 确认按钮文案 |
| `showConfirm` | `boolean` | `true` | 是否显示确认按钮。无选项数据时该按钮强制隐藏 |
| `cancelText` | `string` | `"取消"` | 取消按钮文案 |
| `showCancel` | `boolean` | `true` | 是否显示取消按钮。与 `showConfirm` 同时为 `false` 时整个按钮区隐藏 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 配色，同时下发给触发器、滚轮选择器与底部按钮 |
| `size` | `"sm" \| "md" \| "lg"` | `"lg"` | 尺寸档位，透传给触发器与底部按钮 |
| `ui` | `Record<string, ClassValue>` | `-` | 空态与按钮区的样式覆盖，见「自定义样式」 |
| `triggerUi` | `Record<string, ClassValue>` | `-` | 触发器 `RebornSelectTrigger` 的样式覆盖 |
| `popupUi` | `Record<string, ClassValue>` | `-` | 底部弹层 `RebornPopup` 的样式覆盖 |
| `pickerUi` | `Record<string, ClassValue>` | `-` | 滚轮选择器 `RebornPickerView` 的样式覆盖 |

> Web 端独有的 `multiple`、`collapseTags`、`collapseTagsTooltip`、`maxCollapseTags`、`multipleLimit`、`loading`、`allowSearch`、`filterOption`、`virtual`、`virtualItemHeight`、`virtualBuffer`、`variant`、`showArrow`、`arrowAnimation`、`icon`、`closeOn`、`portal`、`autoAdjustOverflow`、`class` 在 UniApp 端**不存在**。
>
> 本端 `size` 不参与组件自身的样式变体（config 里只有 `hideButtons` 一个变体），仅作为透传参数影响触发器高度与按钮尺寸。
> ::

### SelectOption

两端同名但**不是同一个类型**：Web 版定义在 `RebornSelect.vue` 内，UniApp 版复用 `RebornPickerView` 的定义。

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}
| 字段 | 类型 | 描述 |
| --------------- | --------- | ---------------------------------------- |
| `label` | `string` | 选项展示文本，也是本地搜索的匹配字段 |
| `value` | `any` | 选项实际值 |
| `disabled` | `boolean` | 是否禁用该选项 |
| `[key: string]` | `any` | 其他自定义属性，可在 `option` 插槽中取用 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 字段 | 类型 | 描述 |
| --------------- | ---------------- | ---------------------------------------- |
| `label` | `string` | 选项展示文本 |
| `value` | `any` | 选项实际值 |
| `children` | `SelectOption[]` | 下一列的候选项，多列级联时使用 |
| `[key: string]` | `any` | 其他自定义属性，可在 `option` 插槽中取用 |

::warning
本端**没有 `disabled` 字段**——滚轮无法跳过单项。需要禁用某个候选值请直接从数据源剔除。
::
:::
::

### SelectValue（仅 UniApp）

```ts
type SelectValue = string | number | (string | number)[] | null;
```

单列为 `string | number`，多列为数组；未传入或清空后为 `null`（多列清空后为 `[]`）。

### Emits

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}
| 事件名 | 参数 | 描述 |
| ------------------- | ------------------- | ------------------------------------------------------ |
| `update:modelValue` | `(value: any)` | 绑定值变化（由 `defineModel` 生成） |
| `change` | `(value: any)` | 选中值变化。多选时参数为完整的值数组 |
| `remove-tag` | `(value: any)` | 多选时点击标签上的关闭按钮移除某一项，参数为被移除的值 |
| `clear` | `-` | 点击清空按钮 |
| `visible-change` | `(visible: boolean)` | 下拉面板展开 / 收起 |
| `dropdown-scroll` | `(event: Event)` | 下拉列表滚动，可用于触底加载 |
| `search` | `(value: string)` | 搜索关键词变化，需先开启 `allowSearch` |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 事件名 | 参数 | 描述 |
| ------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `update:modelValue` | `(value: SelectValue)` | 绑定值变化（由 `defineModel` 生成） |
| `change` | `(value: SelectValue, select: any)` | **双参数**。第二个参数是选中的选项对象，多列时为选项对象数组 |
| `changing` | `(value: SelectValue)` | 滚轮滚动过程中的实时值变化，此时尚未写回 `v-model` |

::warning
`change` 只在**点击「确定」或点击「清空」**后触发，滚动过程本身不触发。清空时也走这条事件：单列发出 `change(null, null)`，多列发出 `change([], [])`。

本端**没有** `remove-tag`、`clear`、`visible-change`、`dropdown-scroll`、`search` 事件。
::
:::
::

### Slots

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}
| 插槽名 | 作用域参数 | 描述 |
| --------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| `default` | `{ displayText, placeholder, isOpen, ui }` | 自定义触发器内容，内置的标签区、搜索框、占位符仍由组件负责 |
| `cover` | `-` | 完全接管触发器，内置结构全部不渲染 |
| `option` | `{ option: SelectOption, active: boolean }` | 自定义单个选项的渲染 |
| `header` | `-` | 下拉面板页头，位于滚动容器之外，列表滚动时固定不动 |
| `footer` | `-` | 下拉面板页脚，位于滚动容器之外，列表滚动时固定不动 |

> Web 端**没有** `tag`、`prepend`、`append`、`empty` 插槽。空态文案由 `ui.empty` 控制样式，文案本身不可插槽化。
> :::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 插槽名 | 作用域参数 | 描述 |
| --------- | --------------------------------------- | --------------------------------------------------------------- |
| `tag` | `{ selectItem: any[] }` | 自定义触发器内的选中内容展示 |
| `prepend` | `-` | 滚轮选择器上方的附加内容 |
| `append` | `-` | 滚轮选择器下方、按钮区上方的附加内容 |
| `option` | `{ item: SelectOption, index: number }` | 自定义滚轮单项渲染 |
| `empty` | `-` | 无选项数据时的空态内容，默认文案「暂无数据」 |

::warning
**条件编译限制**：`option` 插槽的转发包在 `#ifndef MP-WEIXIN` 里，微信小程序端不生效，会回落为默认文本渲染。`tag` 插槽在非小程序端无条件渲染，小程序端改为 `v-if="$slots.tag"` 判断并回落到内置文本 / 占位符。

本端**没有** `default`（默认插槽）与 `cover`、`header`、`footer` 插槽。
::
:::
::

### 暴露方法（仅 UniApp）

| 方法名  | 签名                           | 描述                                                     |
| ------- | ------------------------------ | -------------------------------------------------------- |
| `open`  | `(callback?: (value) => void)` | 打开底部弹层。可传回调，在用户点「确定」时接收确认后的值 |
| `close` | `()`                           | 关闭底部弹层，不写回值                                   |

> Web 端**不暴露**任何实例方法，展开 / 收起完全由内部状态与 `visible-change` 事件对外反映。

### 自定义样式（ui）

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}
`ui` 管下拉列表内部与多选标签。触发器盒子与浮层外壳属于 `RebornSelectTrigger`，走 `triggerUi` 下发，键位见下一节「子组件样式入口」。

**`ui`（21 个键）**

| 键名               | 描述                                                       |
| ------------------ | ---------------------------------------------------------- |
| `dropdown`         | 下拉内容区（最大高度 240px、内边距、滚动）                 |
| `dropdownHeader`   | 页头，带底部分隔线                                         |
| `dropdownFooter`   | 页脚，带顶部分隔线                                         |
| `optionList`       | 选项行容器，行间距 4px 在此给出                            |
| `option`           | 单个选项（圆角 4px、内边距 6/4、禁用态半透明）             |
| `optionContent`    | 选项内部的横向布局容器                                     |
| `optionLabel`      | 选项文本（默认单行裁剪）                                   |
| `optionActive`     | 选中态选项（底色取色阶第 2 阶、文字取第 6 阶）             |
| `optionActiveIcon` | 选中态勾选图标                                             |
| `optionHighlight`  | 键盘导航高亮的选项                                         |
| `empty`            | 无匹配选项时的空态占位                                     |
| `loading`          | 加载中占位                                                 |
| `loadingIcon`      | 加载中占位里的转圈图标                                     |
| `virtualPhantom`   | 虚拟列表占位层，高度由 JS 按「总条数 × 步长」写成行内样式  |
| `virtualWindow`    | 虚拟列表窗口层，靠行内 `translateY` 滑到当前区间           |
| `tagList`          | 多选标签区（默认单行裁剪，未开 `collapseTags` 时逐行铺开） |
| `tag`              | 单个标签盒子，作为 `RebornBadge` 的 `base` 覆盖下发        |
| `tagLabel`         | 标签文本                                                   |
| `tagClose`         | 标签关闭按钮                                               |
| `tagCloseIcon`     | 标签关闭图标                                               |
| `collapseTag`      | 折叠后的 `+N` 标签                                         |

::tip
覆盖 `tag` 的圆角或高度时必须带 `!` 提权。`tailwind-merge` 不认识自定义的 `rounded-ui-*` / `h-badge-*` 属于同一冲突组，不提权会与 `RebornBadge` 自带的档位值同时留在类名里，最终由 CSS 顺序决定胜负。
::
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
`ui` 只管组件自身的空态与底部按钮区。触发器、弹层、滚轮分别是三个独立子组件，走 `triggerUi` / `popupUi` / `pickerUi` 下发，键位见下一节「子组件样式入口」。

**`ui`（7 个键，组件自身）**

| 键名            | 描述                              |
| --------------- | --------------------------------- |
| `empty`         | 空态容器                          |
| `emptyText`     | 空态文字                          |
| `buttons`       | 底部按钮区容器                    |
| `cancel`        | 取消按钮外层容器                  |
| `cancelButton`  | 取消按钮本体（下发给按钮 `base`） |
| `confirm`       | 确认按钮外层容器                  |
| `confirmButton` | 确认按钮本体（下发给按钮 `base`） |

::tip
`showCancel` 与 `showConfirm` 同时为 `false` 时，组件自身的 `hideButtons` 变体会把整个按钮区设为 `hidden`，此时通过 `ui.buttons` 追加的类名不会让它重新显示。
::
:::
::

### 子组件样式入口

下面这些键**不属于 `reborn-select` 自身**——它们改的是内部子组件的样式，通过 `triggerUi` / `popupUi` / `pickerUi` 透传下去，键位与默认值以对应子组件页为准。

#### `triggerUi`（Web，11 个键，`RebornSelectTrigger`）

| 名称                 | 归属     | 描述                                           |
| -------------------- | -------- | ---------------------------------------------- |
| `wrapper`            | 浮层外壳 | 浮层锚点容器，提供定位参照与聚焦分组           |
| `dropdown`           | 浮层外壳 | 浮层盒子（圆角 8px、描边、阴影、滚动）         |
| `dropdownInner`      | 浮层外壳 | 浮层内层容器                                   |
| `arrow`              | 浮层外壳 | 指向触发器的 12px 小箭头                       |
| `trigger`            | 触发器   | 触发器盒子（高度、内边距、圆角、字号、描边）   |
| `triggerText`        | 触发器   | 已选中的文本                                   |
| `triggerIconWrapper` | 触发器   | 尾部图标格子，为清空按钮的绝对覆盖提供定位参照 |
| `placeholder`        | 触发器   | 占位文本                                       |
| `clearBtn`           | 触发器   | 清空按钮（绝对定位盖在箭头之上，悬停时显示）   |
| `searchInput`        | 触发器   | 触发器内的搜索输入框                           |
| `triggerLoadingIcon` | 触发器   | 加载中指示器，占满尾部格子替代箭头             |

::warning
`arrow` 这个键被归到**浮层外壳**一侧：组件内部用 `splitTriggerUi` 拆分 `triggerUi`，而 `arrow` 在浮层键白名单里，因此 `triggerUi.arrow` 改的是浮层的 12px 小箭头，**改不到触发器上的下拉箭头图标**。要调整下拉箭头请用 `icon` 换图标、`show-arrow` / `arrow-animation` 控制显示与旋转。
::

#### `triggerUi`（UniApp，7 个键，`RebornSelectTrigger`）

| 名称          | 描述             |
| ------------- | ---------------- |
| `wrapper`     | 触发器最外层容器 |
| `content`     | 触发器内容区     |
| `text`        | 已选中的文本     |
| `placeholder` | 占位文本         |
| `iconWrapper` | 尾部图标区容器   |
| `clearIcon`   | 清空图标         |
| `arrowIcon`   | 右侧箭头图标     |

#### `popupUi`（仅 UniApp，8 个键，`RebornPopup`）

| 名称        | 描述           |
| ----------- | -------------- |
| `wrapper`   | 弹层最外层容器 |
| `mask`      | 遮罩层         |
| `popup`     | 弹层面板       |
| `inner`     | 面板内层容器   |
| `draw`      | 顶部拖拽条     |
| `header`    | 弹层头部       |
| `title`     | 弹层标题       |
| `container` | 内容容器       |

#### `pickerUi`（仅 UniApp，7 个键，`RebornPickerView`）

| 名称              | 描述           |
| ----------------- | -------------- |
| `wrapper`         | 滚轮最外层容器 |
| `header`          | 滚轮表头       |
| `headerText`      | 表头文字       |
| `pickerContainer` | 滚轮容器       |
| `item`            | 单个选项       |
| `itemText`        | 选项文字       |
| `indicator`       | 中间选中指示器 |

### 设计令牌

::tabs{sync="platform"}
:::tabs-item{label="Web" icon="tabler:world"}
| 项目 | sm | md | lg |
| ---------------- | ------------- | ------------- | ------------- |
| 触发器高度 | 24px | 32px | 40px |
| 触发器水平内边距 | 10px | 12px | 16px |
| 触发器字号 | 12px | 14px | 16px |
| 尾部图标格 | 12px | 16px | 16px |
| 标签高度 | 16px | 20px | 24px |
| 标签字号 | 10px | 12px | 14px |
| 标签关闭图标 | 10px | 12px | 14px |
| 标签换行态纵向内边距 | 3px | 5px | 7px |

- 触发器圆角固定 `rounded-ui-xs`（6px），**不随尺寸变化**，与 `RebornInput` 的 md 档位保持同一视觉语言；`underlined` 形态强制压平为直角。
- 行高统一 150%（不用 `text-sm` / `text-base` / `text-lg`，那三个 token 自带 20/22/24px 的固定行高会覆盖 150%）。
- 多选形态下触发器水平内边距收敛为 4px（标签自带描边与内边距，沿用档位值留白会明显偏大）。
- 选项：圆角 `rounded-ui-2xs`（4px）、内边距 6/4、行距 4px；下拉内容区内边距 4/6、最大高度 240px。
- 浮层外壳圆角 `rounded-ui-sm`（8px），描边 `gray-3`；页头页脚字号 13px，空态与加载态字号 14px、纵向内边距 24px。
- 虚拟列表默认步长 33px，即 md 档位选项的实测高度加 4px 行距。
- 标签换行态的纵向内边距按 `(档位高度 - 标签高度) / 2 - 1px 描边` 反推，因此只有一行标签时与固定高度档位严格等高，不产生 1px 抖动。
  :::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 项目 | 值 |
| ---------------- | --------------------------- |
| 空态纵向内边距 | `py-3`（12px） |
| 空态字号 / 颜色 | `text-sm` / `gray-400` |
| 按钮区内边距 | `p-3`（12px） |
| 按钮间距 | `gap-2`（8px） |
| 按钮宽度 | 两枚按钮等分（`flex-1`） |
| 无选项时滑动关闭阈值 | `90` |

- 本端 config 只有 `hideButtons` 一个变体，**没有 `size` / `color` 变体**：尺寸与配色全部透传给 `RebornSelectTrigger`、`RebornPickerView`、`RebornButton` 三个子组件，令牌见各自组件页。
- 取消按钮为 `variant="outlined"`、确认按钮为 `variant="filled"`，两者均带 `block`。
- 弹层与滚轮的圆角、高度、指示器等令牌归属 `RebornPopup` 与 `RebornPickerView`，本组件不覆盖。
  :::
  ::

## 两端差异对照

| 维度            | Web                                                  | UniApp                                            |
| --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| 交互范式        | 触发器下方展开下拉浮层，即点即选                     | 底部升起弹层 + 滚轮选择器，需点「确定」确认       |
| 值落定时机      | 点击选项立即写回                                     | 只有点「确定」才写回，滚动过程仅发 `changing`     |
| 绑定值类型      | `any`（多选为数组）                                  | `SelectValue`（多列为数组）                       |
| 「多值」语义    | `multiple`：从同一列表选出多个值                     | `columnCount`：多列联动组成一条路径               |
| 级联数据        | 不支持（用 `RebornCascader`）                        | 选项的 `children` 字段逐层下钻                    |
| 选项禁用        | 支持 `option.disabled`                               | **不支持**，需从数据源剔除                        |
| `change` 签名   | `(value)` 单参数                                     | `(value, select)` **双参数**，第二个为选项对象    |
| 清空行为        | 发出独立的 `clear` 事件                              | 无 `clear` 事件，走 `change(null, null)`          |
| 展开 / 收起通知 | `visible-change` 事件                                | 无对应事件                                        |
| 命令式控制      | 不暴露实例方法                                       | `defineExpose({ open, close })`，`open` 可带回调  |
| 触发器可隐藏    | 不可（可用 `cover` 插槽完全接管）                    | `show-trigger="false"`                            |
| 搜索过滤        | `allow-search` + `filterOption`                      | 不支持                                            |
| 虚拟滚动        | `virtual` + `virtualItemHeight` + `virtualBuffer`    | 不支持（滚轮天然只渲染可视档位）                  |
| 加载态          | `loading`：箭头转圈 + 面板加载占位                   | 不支持                                            |
| 形态变体        | `outlined` / `filled` / `borderless` / `underlined`  | 无 `variant`                                      |
| 错误态描边      | 消费表单 `isError`，自动切红边                       | 不接管，仅触发校验                                |
| 表单注入        | `disabled` / `size` / `isError` / `validate`         | 仅 `disabled` / `validate`                        |
| 可用插槽        | `default` / `cover` / `option` / `header` / `footer` | `tag` / `prepend` / `append` / `option` / `empty` |
| 小程序限制      | 无                                                   | `option` 插槽在 MP-WEIXIN 下不生效                |
| 样式覆盖入口    | `ui` + `triggerUi`（21 + 11 键）                     | `ui` + `triggerUi` + `popupUi` + `pickerUi`       |
| 尺寸默认值      | `md`                                                 | `lg`                                              |
| 尺寸单位        | px（Tailwind v4 令牌）                               | rpx（子组件内部）                                 |

## 注意事项

- **`change` 的签名两端不同**：Web 是 `(value)`，UniApp 是 `(value, select)`。写跨端逻辑时不要假设参数个数一致。
- UniApp 端滚动滚轮**不会**改变 `v-model`，只发 `changing`。需要跟随滚动实时联动的场景请监听 `changing`。
- UniApp 端 `open()` 会强制重挂滚轮，把位置重置到当前绑定值对应的档位；上一次未确认的临时滚动位置不会保留。
- UniApp 端无选项数据时确认按钮强制隐藏，同时弹层的滑动关闭阈值放宽到 `90`，方便用户直接滑走。
- Web 端 `triggerUi.arrow` 改的是浮层小箭头，**不是**触发器上的下拉箭头图标。
- Web 端 `loading` 与 `clearable` 共用尾部同一块空间：加载中时清空按钮不渲染。
- Web 端开启 `virtual` 后每项高度必须恒定，改了 `ui.option` 的排版必须同步改 `virtual-item-height`。
- Web 端 `portal` 关掉后浮层留在触发器内，会随父容器滚动并被 `overflow: hidden` 裁剪，仅在浮层需要跟随内部滚动容器时才关。
- Web 端覆盖 `ui.tag` 的圆角 / 高度必须带 `!` 提权，否则会被 `RebornBadge` 自带档位值压过。
- 两端配色 token 自身已随主题切换，**不要再写 `dark:` 前缀**，否则深色模式下会二次翻转。
- UniApp 端 `showCancel` 与 `showConfirm` 同时为 `false` 时按钮区被整块 `hidden`，用 `ui.buttons` 追加类名无法让它恢复显示。
