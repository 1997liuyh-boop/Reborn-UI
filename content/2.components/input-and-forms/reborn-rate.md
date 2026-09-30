---
title: Rate 评分
description: 用于星级评分录入与展示的双端组件，支持半星；Web 端另有悬停预览、分段颜色与分段图标。
category: 表单与输入
platform: both
tags: [css, tailwind, rate, rating, star, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornRateDemo.vue" config="RebornRateConfig" componentId="reborn-rate" :componentFiles='["RebornRate.vue", "reborn-rate.config.ts"]' :uniappFiles='["RebornRate.vue", "reborn-rate.config.ts"]'}
::

## 简介

Rate 用一排图标表示分值，可以录入评分，配合 `readonly` 也可以只做展示。Web 与 UniApp 两端同名，模板结构一致：每颗星由「未选中层」和叠在上面的「选中层」组成，半星就是只露出选中层的左半边。

两端的能力不对等。Web 端围绕鼠标设计：默认悬停先预览、点击才提交（`trigger="click"`），也可以悬停即改分（`trigger="hover"`）；另有 `clearable`、`formatText`、按分值切换颜色的 `colors`、按分值切换图标的 `icons`、`voidColor`，以及 `setCurrentValue` / `resetCurrentValue` 两个实例方法。UniApp 端围绕触控设计：点按评分，横向滑动拖动评分，再点当前分值直接清零，并接入 `RebornForm` 的 `size` / `disabled`。

### 何时使用

- 商品、服务、内容的满意度打分，分值是有限的离散档位（默认 5 档，可开半星）。
- 在列表或详情里展示已有评分：`readonly` 保留星形外观，但禁止修改。
- （Web）不同分数段需要不同反馈时，用 `colors` / `icons` / `formatText` 按分值切换颜色、图标或文案。

### 何时不使用

- 分值是连续区间，或精度高于 0.5（如 0 ~ 100 分）—— 改用 `reborn-slider`。
- 只有「喜欢 / 不喜欢」两种状态 —— 改用 `reborn-switch` 或一个图标按钮，一排星会让用户以为有多个档位。
- 需要精确输入具体数字 —— 改用 `reborn-input-number`。

## 用法

### 基础用法

`v-model` 绑定分值，`allow-half` 允许半星，`show-value` 在末尾显示当前分数。`readonly` 只禁止修改，外观不变；`disabled` 在此基础上给根节点加 `opacity-50 pointer-events-none`，用来表示「当前不可评分」。

```vue
<template>
  <RebornRate v-model="score" show-value />
  <RebornRate v-model="half" allow-half show-value />
  <RebornRate :model-value="4" readonly show-value />
  <RebornRate :model-value="2" disabled show-value />
</template>
```

半星由指针落在星形的左半还是右半决定。UniApp 端另外支持拖动：横向滑动超过 12px 进入拖动评分，滑到所有星的左侧即归零；竖向滑动不会改分，页面照常滚动。

### 语义色与尺寸

`color` 只作用于选中图标，默认 `warning`。`size` 有 `sm` / `md` / `lg` 三档，图标为 16 / 20 / 28px，两端都是 `size-4` / `size-5` / `size-7`。分数字号 Web 为 `text-sm` / `text-base` / `text-lg`，UniApp 为 `text-24` / `text-28` / `text-32`。

```vue
<template>
  <RebornRate v-model="score" color="primary" />
  <RebornRate v-model="score" size="lg" show-value />
</template>
```

UniApp 端放在 `RebornForm` 内时，表单的 `size` 与 `disabled` 优先于组件自身的同名属性；Web 端不读取表单上下文。

### 触发方式：click 与 hover

仅 Web。默认 `trigger="click"`：悬停只预览星形，点击才提交。`trigger="hover"` 时指针移到哪颗星就把分数改到哪颗，适合快速连续打分。触控设备没有悬停事件，`hover` 与 `click` 效果相同。

```vue
<template>
  <RebornRate v-model="score" show-value />
  <RebornRate v-model="score" trigger="hover" allow-half show-value />
</template>
```

`hover` 模式下，指针每移到一个新分值都会触发 `update:modelValue` 与 `change`；点击也不再「同值清零」，否则清零后指针稍一移动分数又会被改回来。

### 可清空：clearable

仅 Web。默认情况下，再次点击当前分值没有变化；开启 `clearable` 后，再点同一分值即清零。清零后只要指针停在原处，预览就不会重新亮起；移到别的星或移出组件后才恢复悬停预览，这样清零的结果能立刻看到。

```vue
<template>
  <RebornRate v-model="score" clearable show-value />
</template>
```

UniApp 端没有这个开关：非半星模式下，再点当前分值直接清零。

### 自定义文案：format-text 与 value 插槽

`format-text` 仅 Web 提供。它接收已提交的分值，返回要显示的文字；传入后不需要 `show-value`。不传时，分数区域没有默认文案。内容更复杂时用 `value` 插槽，它会替换默认的文本节点。

```vue
<script setup lang="ts">
const texts = ["很差", "较差", "还行", "推荐", "力荐"];
const formatText = (value: number) => texts[Math.ceil(value) - 1] ?? "未评分";
</script>

<template>
  <RebornRate v-model="score" :format-text="formatText" />
  <RebornRate v-model="score" allow-half>
    <template #value="{ value }">
      <span class="ml-3 text-sm">{{ value }} 分 · {{ formatText(value) }}</span>
    </template>
  </RebornRate>
</template>
```

分数与文案都取已提交的值：悬停预览只改变星形，不改变文字。UniApp 端的 `value` 插槽作用域只有 `value`，没有 `text`。

### 分段颜色：colors 与阈值

仅 Web。`colors` 有两种写法。

- **数组**：按 `low-threshold`（默认 2，含）与 `high-threshold`（默认 4，不含）分成低、中、高三段。
- **对象**：键为分段上界，值为颜色；写成 `{ value, excluded: true }` 表示不含上界本身。

所有点亮的星统一使用当前分值命中的颜色；没有命中任何分段时，回退到 `color`。

```vue
<template>
  <RebornRate v-model="score" :colors="['#E47BF9', '#32EC95', '#1150D0']" show-value />
  <RebornRate
    v-model="score"
    :colors="{ 2: '#99a9bf', 4: { value: '#f7ba2a', excluded: true }, 5: '#ff9900' }"
    allow-half
    show-value
  />
</template>
```

分段颜色以内联 `color` 写在选中层上，因此会盖过 `ui.iconActive` 里的 `text-*` 类。

### 未选中颜色：void-color

仅 Web。`void-color` 给未选中图标指定实色，同时去掉默认的 30% 不透明度；不传时，未选中图标是文字色加 30% 不透明度。它可以和 `colors` 一起用。

```vue
<template>
  <RebornRate v-model="score" void-color="#FF383F" show-value />
</template>
```

### 分段图标：icons

仅 Web。`icons` 的分段规则与 `colors` 相同，值为 `{ type, url }`：`type` 为 `icon` 时，`url` 是 Nuxt Icon 名；为 `image` 时，`url` 是图片地址。没有命中任何分段时，回退到 `active-icon` / `half-icon`。未选中图标始终由 `icon` 决定。

```vue
<script setup lang="ts">
const icons = {
  3: { type: "icon" as const, url: "lucide:frown" },
  6: { type: "icon" as const, url: "lucide:meh", excluded: true },
  8: { type: "image" as const, url: "https://example.com/logo.png" },
};
</script>

<template>
  <RebornRate v-model="score" :icons="icons" :count="10" show-value />
</template>
```

整颗点亮的星会隐藏未选中层（保留占位）。这样形状不同的分段图标叠在默认星形上，也不会露出边角。

### 实例方法：setCurrentValue 与 resetCurrentValue

仅 Web。

- `setCurrentValue` 直接写入分数：按 `count` 夹取，`allowHalf` 时取整到半星，否则取整到整星。它和点击一样触发 `update:modelValue` 与 `change`，且不受 `disabled` / `readonly` 限制。
- `resetCurrentValue` 清除悬停预览，并把内部值同步回 `modelValue`。

```vue
<script setup lang="ts">
const rateRef = ref();
</script>

<template>
  <RebornRate ref="rateRef" :model-value="3" allow-half show-value />
  <button @click="rateRef?.setCurrentValue(4.5)">setCurrentValue(4.5)</button>
  <button @click="rateRef?.resetCurrentValue()">resetCurrentValue()</button>
</template>
```

`resetCurrentValue` 只在非受控写法下有可见效果，即只传 `:model-value`、父级不接收更新：这时内部值会退回传入的值。

### 自定义图标：icon 属性与 icon 插槽

整套替换图标时，直接传 `icon` / `active-icon`。通常两者传同一个名字，只靠颜色区分选中态。两端取值不同：

- Web 端是 Nuxt Icon 名，默认 `carbon:star` / `carbon:star-filled`。
- UniApp 端是图标类名，默认两者都是 `i-lucide-star`。

需要放任意内容时用 `icon` 插槽。它同时用于未选中层与选中层，用作用域里的 `active` 区分两者。

```vue
<template>
  <RebornRate v-model="score" icon="prime:heart-fill" active-icon="prime:heart-fill" color="error" />
  <RebornRate v-model="score">
    <template #icon>
      <Icon name="lucide:flame" class="size-full" />
    </template>
  </RebornRate>
</template>
```

选中色仍由 `color`（或 Web 端的 `colors`）决定，插槽内容继承图标层的文字色。

### 图片图标：icon 插槽与半星裁切

在 `icon` 插槽里放图片时，可以借助 `active` 给未选中的图片加灰度，再叠加组件自带的 30% 不透明度，拉开选中与未选中的对比。Web 端半星用 `clip-path` 只露出选中层的左半边，对图片同样有效。

```vue
<template>
  <RebornRate v-model="score" allow-half show-value>
    <template #icon="{ active }">
      <img src="https://example.com/logo.png" alt="" class="size-full object-contain" :class="{ grayscale: !active }">
    </template>
  </RebornRate>
</template>
```

UniApp 端的半星实现不同：选中层宽度收成一半并隐藏溢出。插槽作用域因此多了一个 `style`，半星时为 `{ width: '200%' }`。把它绑到插槽内容上，内容才能保持整颗宽度、只被裁掉右半边。

### 横版图片：ui 覆盖图标尺寸

图标层默认是正方形（md 档为 20px），横版图片放进去会被压扁。用 `ui` 的 `icon` 与 `iconActive` 按原图比例覆盖尺寸即可；星距与分数间距由 `wrapper` 和 `value` 控制，不受影响。

```vue
<template>
  <RebornRate v-model="score" :ui="{ icon: 'h-5 w-20', iconActive: 'h-5 w-20' }" show-value>
    <template #icon="{ active }">
      <img src="https://example.com/brand.png" alt="" class="size-full object-contain" :class="{ grayscale: !active }">
    </template>
  </RebornRate>
</template>
```

## API

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名          | 类型                                                                                   | 默认值                 | 描述                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `number`                                                                               | `0`                    | 当前评分值，超出 `0 ~ count` 时被夹取。                                                                                                                                                              |
| `count`         | `number`                                                                               | `5`                    | 星星总数，也是最大分值，分数与自定义文案都以它为上限。                                                                                                                                               |
| `allowHalf`     | `boolean`                                                                              | `false`                | 是否允许半星，按指针落在星形左半或右半决定。                                                                                                                                                         |
| `clearable`     | `boolean`                                                                              | `false`                | 再次点击当前分值时是否清零；`trigger="hover"` 时无效。                                                                                                                                               |
| `showValue`     | `boolean`                                                                              | `false`                | 是否显示当前分数（已提交的值，不受悬停预览影响）；传了 `formatText` 时显示其返回值。                                                                                                                 |
| `formatText`    | `(value: number) => string`                                                            | -                      | 分数区域的自定义文案：接收已提交的分值，返回要显示的文字，传入后无需 `showValue`；不传时没有默认文案。内容更复杂时用 `value` 插槽。                                                                  |
| `disabled`      | `boolean`                                                                              | `false`                | 是否禁用：屏蔽交互，并给根节点加 `opacity-50 pointer-events-none`。                                                                                                                                  |
| `readonly`      | `boolean`                                                                              | `false`                | 是否只读：屏蔽交互，外观不变，光标恢复默认。                                                                                                                                                         |
| `trigger`       | `"click" \| "hover"`                                                                   | `"click"`              | 切换分数的触发方式：`click` 悬停只预览、点击才提交；`hover` 悬停即改分（触控设备上等同 `click`）。                                                                                                   |
| `size`          | `"sm" \| "md" \| "lg"`                                                                 | `"md"`                 | 尺寸，图标为 16 / 20 / 28px。                                                                                                                                                                        |
| `color`         | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"warning"`            | 选中图标的语义色；传了 `colors` 且命中分段时，以分段颜色为准。                                                                                                                                       |
| `colors`        | `string[] \| Record<number, string \| { value: string, excluded?: boolean }>`          | -                      | 按分段自定义选中色：数组按 `lowThreshold` / `highThreshold` 分低、中、高三段；对象以键为分段上界（含），`excluded: true` 表示不含上界本身。所有点亮的星统一使用当前分值命中的颜色。                  |
| `lowThreshold`  | `number`                                                                               | `2`                    | 低分界限（含），配合数组形式的 `colors` / `icons` 使用。                                                                                                                                             |
| `highThreshold` | `number`                                                                               | `4`                    | 高分界限（不含），配合数组形式的 `colors` / `icons` 使用。                                                                                                                                           |
| `voidColor`     | `string`                                                                               | -                      | 未选中图标的颜色，同时去掉 30% 不透明度；不传时为文字色加 30% 不透明度。                                                                                                                             |
| `icon`          | `string`                                                                               | `"carbon:star"`        | 未选中图标名（Nuxt Icon）。                                                                                                                                                                          |
| `activeIcon`    | `string`                                                                               | `"carbon:star-filled"` | 选中图标名（Nuxt Icon）；传了 `icons` 且命中分段时，以分段结果为准。                                                                                                                                 |
| `halfIcon`      | `string`                                                                               | -                      | 半星图标名（Nuxt Icon），不传时用 `activeIcon`。                                                                                                                                                     |
| `icons`         | `RateIconSource[] \| Record<number, RateIconSource>`                                   | -                      | 按分段自定义选中图标，分段规则同 `colors`。`RateIconSource` 为 `{ type, url, excluded? }`：`type` 为 `icon` 时 `url` 是 Nuxt Icon 名，为 `image` 时 `url` 是图片地址。                              |
| `ui`            | `Partial<{ wrapper, star, icon, iconActive, value }>`                                  | `{}`                   | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                                                                                                                         |
| `class`         | `any`                                                                                  | -                      | 根节点类名，与 `ui.wrapper` 合并。                                                                                                                                                                   |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名        | 类型                                                                                   | 默认值            | 描述                                                                 |
| ------------- | -------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------- |
| `modelValue`  | `number`                                                                               | `0`               | 当前评分值，超出 `0 ~ count` 时被夹取。                              |
| `count`       | `number`                                                                               | `5`               | 星星总数，也是最大分值。                                             |
| `allowHalf`   | `boolean`                                                                              | `false`           | 是否允许半星，按触点落在星形左半或右半决定。                         |
| `showValue`   | `boolean`                                                                              | `false`           | 是否显示当前分数。                                                   |
| `disabled`    | `boolean`                                                                              | `false`           | 是否禁用；在 `RebornForm` 内时，表单的 `disabled` 优先。             |
| `readonly`    | `boolean`                                                                              | `false`           | 是否只读：屏蔽交互，外观不变。                                       |
| `icon`        | `string`                                                                               | `"i-lucide-star"` | 未选中图标类名。                                                     |
| `activeIcon`  | `string`                                                                               | `"i-lucide-star"` | 选中图标类名。                                                       |
| `halfIcon`    | `string`                                                                               | -                 | 半星图标类名，不传时用 `activeIcon`。                                |
| `size`        | `"sm" \| "md" \| "lg"`                                                                 | `"md"`            | 尺寸，图标为 16 / 20 / 28px；在 `RebornForm` 内时，表单的 `size` 优先。 |
| `color`       | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"warning"`       | 选中图标的语义色。                                                   |
| `ui`          | `Partial<{ wrapper, star, icon, iconActive, value }>`                                  | `{}`              | 细粒度样式覆盖，键位见「自定义样式（ui）」。                         |
| `customClass` | `any`                                                                                  | -                 | 根节点类名，与 `ui.wrapper` 合并。                                   |

:::

::

### Emits

两端通用。两个事件总是同时触发，参数相同，都是新的分值；分值没有变化时都不触发。

| 事件名              | 参数     | 描述                                                                                                         |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `update:modelValue` | `number` | 分值变化时触发，用于 `v-model`。                                                                             |
| `change`            | `number` | 与 `update:modelValue` 同时触发。Web 端 `trigger="hover"` 下，指针每移到新分值都会触发一次，并不代表「确认」。 |

### Slots

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 插槽名  | 作用域              | 描述                                                                                                                                                                  |
| ------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `icon`  | `{ index, active }` | 自定义图标，同时渲染在未选中层（`active: false`）与选中层（`active: true`），`index` 从 1 开始。填充后 `icon` / `activeIcon` / `halfIcon` / `icons` 不再生效。          |
| `value` | `{ value, text }`   | 自定义分数 / 文案区域。`value` 为已提交的分值，`text` 为 `formatText` 的返回值（未传时为空），两者都不受悬停预览影响。填充后 `ui.value` 失效。                          |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 插槽名  | 作用域                      | 描述                                                                                                                                                                    |
| ------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `icon`  | `{ index, active, style? }` | 自定义图标，同时渲染在未选中层与选中层。选中层额外提供 `style`，半星时为 `{ width: '200%' }`，绑到内容上才能保持整颗宽度。填充后 `icon` / `activeIcon` / `halfIcon` 不再生效。 |
| `value` | `{ value }`                 | 自定义分数区域。填充后 `ui.value` 失效。                                                                                                                                |

:::

::

### Exposes

仅 Web 端提供，UniApp 端没有实例方法。

| 名称                | 描述                                                                                                                                                                | 类型                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `setCurrentValue`   | 设置当前分数：按 `count` 夹取，`allowHalf` 时取整到半星，否则取整到整星；和点击一样触发 `update:modelValue` 与 `change`，不受 `disabled` / `readonly` 限制。       | `(value: number) => void` |
| `resetCurrentValue` | 重置当前分数：清除悬停预览，并把内部值同步回 `modelValue`（非受控用法下，可撤销父级没有接收的改动）。                                                               | `() => void`              |

### 自定义样式（ui）

`ui` 按键名覆盖对应节点的类名，与默认类经 `cn` 合并，冲突时 `ui` 胜出。两端键位相同，但默认类名与渲染条件有差异。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名         | 对应节点                                   | 默认关键类名                                                                                     | 失效 / 渲染条件                                                                                                                                                                                                  |
| ------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`    | 根节点，横向排列所有星与分数               | `inline-flex flex-row items-center gap-1`；禁用时加 `opacity-50 pointer-events-none`             | 始终渲染。`class` 先并入、`ui.wrapper` 后并入，冲突时 `ui.wrapper` 胜出。4px 星距来自 `gap-1`。                                                                                                                  |
| `star`       | 单颗星的定位容器，未选中层与选中层都叠在里面 | `relative cursor-pointer transition-all duration-200 ease-out`；只读时为 `cursor-default`        | 始终渲染，共 `count` 个。                                                                                                                                                                                        |
| `icon`       | 未选中图标层                               | `transition-colors duration-200 ease-out dark:text-gray-2`，加尺寸类 `size-4` / `size-5` / `size-7` | 始终渲染；整颗点亮时加 `invisible`（保留占位）。模板另挂固定的 `opacity-30`，不经过 `cn` 合并，只有传 `voidColor` 才会去掉，想在 `ui` 里改透明度需写 `!opacity-*`。填充 `icon` 插槽只替换层内内容，这个键仍然生效。 |
| `iconActive` | 选中图标层，绝对定位盖在未选中层上         | `transition-colors duration-200 ease-out`，加尺寸类与语义色 `text-<color>`                       | 只在该星点亮（含半星）时渲染；半星用 `clip-path` 只露出左半边。命中 `colors` 分段时，颜色写在内联样式上，`ui.iconActive` 里的 `text-*` 会被盖过。                                                                |
| `value`      | 分数 / 自定义文案文本                      | `ml-3 font-medium tabular-nums text-gray-9`，加字号 `text-sm` / `text-base` / `text-lg`          | **仅在 `showValue` 为真或传了 `formatText`，且未填充 `value` 插槽时渲染**。填充插槽会替换掉这个节点，`ui.value` 随之失效。与末颗星的 16px 间距 = `gap-1` + `ml-3`。                                              |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名         | 对应节点                           | 默认关键类名                                                                                                                                  | 失效 / 渲染条件                                                                                                                                  |
| ------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wrapper`    | 根节点，横向排列所有星与分数       | `inline-flex flex-row items-center gap-1`；禁用时加 `opacity-50 pointer-events-none`                                                          | 始终渲染。`customClass` 先并入、`ui.wrapper` 后并入，冲突时 `ui.wrapper` 胜出。                                                                  |
| `star`       | 单颗星的定位容器，承接点按与拖动   | `relative cursor-pointer transition-transform active:scale-90`；只读时为 `cursor-default active:scale-100`                                    | 始终渲染，共 `count` 个。可交互时模板另加 `touch-none overscroll-x-contain`，防止横向拖动带动页面滚动。                                          |
| `icon`       | 未选中图标层                       | `transition-colors duration-150 dark:text-gray-2`，加尺寸类 `size-4` / `size-5` / `size-7`                                                    | 始终渲染，整颗点亮时也不隐藏。模板另挂固定的 `opacity-30`，不经过 `cn` 合并，也没有 `voidColor` 可以去掉，想改透明度需写 `!opacity-*`。          |
| `iconActive` | 选中图标层，绝对定位盖在未选中层上 | `transition-colors duration-150`，加尺寸类与语义色 `text-<color>`                                                                             | 只在该星点亮（含半星）时渲染。半星时模板另加 `w-1/2 overflow-hidden`，在这个键里改宽度会影响半星裁切。                                           |
| `value`      | 分数文本                           | `ml-1 font-medium tabular-nums dark:text-gray-1`，加字号 `text-24` / `text-28` / `text-32`；`allowHalf` 时另加固定宽度 `!w-[30rpx]`（sm）/ `!w-[40rpx]`（md、lg） | **仅在 `showValue` 为真且未填充 `value` 插槽时渲染**。填充插槽会替换掉这个节点，`ui.value` 随之失效。固定宽度带 `!`，在 `ui.value` 里改宽度也要写 `!w-*`。 |

:::

::

```vue
<template>
  <RebornRate
    v-model="score"
    show-value
    :ui="{
      wrapper: 'gap-2',
      star: 'hover:scale-110',
      icon: 'text-gray-3 !opacity-100',
      iconActive: 'text-warning',
      value: 'text-sm text-gray-6',
    }"
  />
</template>
```

## 两端差异对照

| 维度               | Web                                                                                                              | UniApp                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 自定义类名         | `class`                                                                                                          | `customClass`                                                  |
| 交互方式           | 点击提交、悬停预览；`trigger="hover"` 时悬停即改分                                                               | 点按评分；横向滑动超过 12px 进入拖动评分                       |
| 再点当前分值       | 默认不变，开启 `clearable` 才清零                                                                                | 非半星模式直接清零，没有开关                                   |
| 图标取值           | Nuxt Icon 名，默认 `carbon:star` / `carbon:star-filled`                                                          | 图标类名，默认两者都是 `i-lucide-star`                         |
| 半星实现           | 选中层用 `clip-path` 裁出左半，未选中层裁出右半                                                                  | 选中层 `w-1/2 overflow-hidden`，内容宽度 200%                  |
| 仅 Web 的属性      | `clearable` / `formatText` / `trigger` / `colors` / `icons` / `lowThreshold` / `highThreshold` / `voidColor`     | 无                                                             |
| `value` 插槽作用域 | `{ value, text }`                                                                                                | `{ value }`                                                    |
| `icon` 插槽作用域  | `{ index, active }`                                                                                              | `{ index, active, style? }`                                    |
| 实例方法           | `setCurrentValue` / `resetCurrentValue`                                                                          | 无                                                             |
| 表单联动           | 不读取表单上下文                                                                                                 | `RebornForm` 的 `size` / `disabled` 优先于自身属性             |
| 分数文本样式       | `ml-3`，正文色 `text-gray-9`，字号 `text-sm` / `text-base` / `text-lg`                                           | `ml-1`，字号 `text-24` / `text-28` / `text-32`，半星时固定宽度 |
| 过渡与按压反馈     | `transition-all duration-200`，没有按压缩放                                                                      | `duration-150`，按压时 `active:scale-90`                       |

## 注意事项

- **`readonly` 与 `disabled` 都会屏蔽交互，区别在外观**。`readonly` 保持原样，适合展示已有评分；`disabled` 额外把整体降到 50% 不透明度并屏蔽指针事件，表示「当前不可评分」。
- **分数显示的是已提交的值**。Web 端的悬停预览只改变星形的点亮状态、分段颜色和分段图标；`showValue`、`formatText` 与 `value` 插槽都不跟随预览，否则用户还没点击就会看到分数变了。
- **`change` 不是「确认」事件**。它与 `update:modelValue` 同时触发；Web 端 `trigger="hover"` 下，指针每移到一个新分值都会触发。需要「提交后才回调」时，请使用默认的 `click` 触发方式。
- **分段颜色优先于 `ui.iconActive` 的文字色**。`colors` 命中时，颜色写在选中层的内联样式上，类名改不动它；想统一换选中色，请用 `color`，或者不传 `colors`。
- **未选中层的 30% 不透明度是模板里写死的类**。它不经过 `ui` 合并，覆盖时必须写 `!opacity-*`；Web 端传 `voidColor` 会直接去掉这层不透明度。
- **UniApp 端再点当前分值会清零**。非半星模式下没有「保持不变」的选项；半星模式下，触摸按触点落在左半或右半取值；没有触摸事件的点击（如 H5 桌面端鼠标）则在「整星 → 半星 → 0」之间循环。
- **UniApp 端放进 `RebornForm` 后，自身的 `size` / `disabled` 可能不生效**。表单上设置了这两项时，优先使用表单的值；需要单独控制时，不要在表单上统一设置。
