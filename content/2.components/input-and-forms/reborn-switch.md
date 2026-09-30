---
title: Switch 开关
description: 双端开关：三种形态 × 任意值双态映射，支持点内文本、切换前拦截、加载态与滑块状态插槽。
category: 表单与输入
platform: both
tags: [css, tailwind, switch, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornSwitchDemo.vue" config="RebornSwitchConfig" componentId="reborn-switch" :componentFiles='["RebornSwitch.vue", "reborn-switch.config.ts"]' :uniappFiles='["RebornSwitch.vue", "reborn-switch.config.ts"]'}
::

## 简介

Switch 用于两种状态的即时切换，Web 与 UniApp 两端同名同构。

它的核心是一层**双态映射**：开态由 `modelValue === activeValue` 严格相等判断，配合 `inactiveValue` 可以把开关直接绑到 `"yes"/"no"`、`1/0` 这类业务字段上，而不必先转成布尔。在切换链路上还有两道闸门：`beforeChange` 在状态改变前做同步/异步拦截（二次确认、接口校验，未通过则整次切换作废）；`loading` / `disabled` 则直接锁定交互。

视觉上由 `type` 决定形态：`circle` 胶囊圆形（默认）、`round` 圆角方形、`line` 细线轨道 + 悬浮滑块；开启态轨道取 `color` 语义色、关闭态为中性灰。三档尺寸两端共用同一套几何——滑块四周留白固定 2px，选中位移 = 轨道宽 − 滑块直径 − 4px。文案（`activeLabel` / `inactiveLabel`）默认在轨道两侧并跟随状态与语义色联动高亮，`inlinePrompt` 可把它们收进开关内部。

### 何时使用

- 设置项的启用/停用切换，操作后立即生效。
- 绑定值为字符串/数字（如 `"yes"` / `"no"`）的开关字段。
- 切换前需二次确认或异步校验的敏感操作（`beforeChange`）。
- 切换后要等接口返回的场景，用 `loading` 锁定期间的重复点击。

### 何时不使用

- 一组互斥选项中选一个 —— 改用 `reborn-radio`。
- 多项勾选组合或需要提交才生效的确认项 —— 改用 `reborn-checkbox`。

## 用法

### 基础用法

`v-model` 双向绑定开关值；`activeLabel` / `inactiveLabel` 在轨道两侧显示文案，当前状态一侧的文案加粗并取语义色，另一侧转为弱化灰。非受控场景不传 `modelValue`，用 `defaultValue` 设初始值（缺省取 `inactiveValue`）。

```vue
<script setup lang="ts">
import { ref } from "vue";

const on = ref(true);
</script>

<template>
  <RebornSwitch v-model="on" />
  <RebornSwitch
    v-model="on"
    active-label="开启"
    inactive-label="关闭"
  />
  <RebornSwitch
    v-model="on"
    disabled
    active-label="禁用"
  />
</template>
```

::note
禁用的视觉两端不同：Web 端禁用（含 `loading`）时两态轨道都换成 `bg-gray-2`；UniApp 端 config 没有禁用变体，禁用后外观不变，只是不再响应点击。
::

### 语义色：color

开启态轨道取 `color` 语义色，关闭态统一为中性灰（Web `bg-gray-5`、UniApp `bg-gray-3`）；两侧文案在对应状态下同步取语义色高亮。

```vue
<template>
  <RebornSwitch
    v-model="on"
    color="primary"
  />
  <RebornSwitch
    v-model="on"
    color="success"
  />
  <RebornSwitch
    v-model="on"
    color="error"
  />
</template>
```

### 尺寸：size

三档圆形规格，两端同一几何（两端都按 px 书写）：

| `size`       | 轨道    | 滑块直径 | 选中位移 |
| ------------ | ------- | -------- | -------- |
| `sm`         | 16 × 28 | 12       | 12       |
| `md`（默认） | 24 × 44 | 20       | 20       |
| `lg`         | 32 × 60 | 28       | 28       |

三档共用同一条几何关系：滑块四周留白固定 2px，选中时滑块右缘贴到轨道右端再回收 2px。位移由 `left` / `right` 两个端点按 `--re-switch-thumb-size` 计算，不写死像素，因此用 `ui` 改轨道宽度时不必改位移，`autoWidth` 撑宽后同样成立。处于 `RebornForm` 内时，表单下发的尺寸优先于组件自身的 `size`。

```vue
<template>
  <RebornSwitch
    v-model="on"
    size="sm"
  />
  <RebornSwitch
    v-model="on"
    size="md"
  />
  <RebornSwitch
    v-model="on"
    size="lg"
  />
</template>
```

### 形态：type

`type` 提供三种形态，尺寸档位与选中位移三者通用：

| `type`           | 外观                                             | 典型用途                                         |
| ---------------- | ------------------------------------------------ | ------------------------------------------------ |
| `circle`（默认） | 胶囊轨道 + 圆形滑块                              | 常规设置项                                       |
| `round`          | 轨道、滑块与波纹换成小圆角方形                   | 与方角控件（表格、工具栏）并排时保持形状语言一致 |
| `line`           | 轨道压成滑块直径一半的细线，滑块骑在线上居中滑动 | 低视觉权重场景，如卡片角落的次要开关             |

`round` 的圆角 Web 端为 `rounded-sm`，UniApp 端为 `rounded-ui-2xs`。

```vue
<template>
  <RebornSwitch
    v-model="on"
    type="circle"
  />
  <RebornSwitch
    v-model="on"
    type="round"
  />
  <RebornSwitch
    v-model="on"
    type="line"
  />
</template>
```

### 点内文本：inline-prompt 与 auto-width

`inlinePrompt` 为 `true` 时，`activeLabel` / `inactiveLabel` 不再渲染在两侧，而是渲染进轨道内部：开态文本落在滑块滑走后空出的左侧，关态文本落在右侧，两态文案持续挂载，以 200ms 水平滑入、滑出；系统开启减弱动效时立即切换。点内文字字号随尺寸收缩（sm 8px / md 10px；lg 档 Web 为 `text-sm`、UniApp 为 12px）。

固定宽度下超出的文本以省略号截断。设置 `autoWidth` 后轨道的固定宽降级为最小宽、随文本撑开；两端撑开的彻底程度不同，见下方提示。

```vue
<template>
  <RebornSwitch
    v-model="on"
    inline-prompt
    active-label="开"
    inactive-label="关"
  />

  <!-- 固定宽度：长文本省略 -->
  <RebornSwitch
    v-model="on"
    inline-prompt
    size="lg"
    active-label="超出省略"
    inactive-label="超出省略"
  />

  <!-- 轨道随文本撑开 -->
  <RebornSwitch
    v-model="on"
    inline-prompt
    auto-width
    size="lg"
    active-label="完整展示多个内容"
    inactive-label="多个内容"
  />
</template>
```

::warning
- `line` 型轨道过细放不下文本，`inlinePrompt` 在该形态下不生效，此时点内与两侧文案都不渲染。
- **UniApp 端点内文本只读 `activeLabel` / `inactiveLabel` 属性**，`#activeLabel` / `#inactiveLabel` 插槽在点内模式下不会渲染；Web 端点内模式同样渲染这两个插槽，可做图文混排（demo 第三行）。
- **UniApp 端 `autoWidth` 只把轨道改成 `w-auto` + 最小宽**，点内文本仍保留 `truncate` / `max-w-full`；Web 端额外把文案容器改为按内容定宽、文案 `min-w-max`，在被挤压的 flex 行里也不会被压回省略。
::

### 切换波纹：wave

`wave` 开启后，每次切换成功都会从轨道边缘向外扩散一圈开态色并淡出（0.5s ease-out），给没有文案的开关补一个「这一下点到了」的反馈。波纹色取 `color` 语义色，不跟随 `ui` 的轨道背景覆盖；`round` 形态下波纹跟随轨道取同样的小圆角。

默认关闭，且只是视觉反馈，不参与取值与事件；波纹与 `change` 同一时机触发，被 `beforeChange` 拦下的切换不会起波纹。

```vue
<template>
  <RebornSwitch
    v-model="on"
    wave
  />
  <RebornSwitch
    v-model="on"
    wave
    color="success"
  />
  <RebornSwitch
    v-model="on"
    wave
    type="round"
    color="secondary"
  />
</template>
```

::tip
波纹是盖在轨道上的一层空节点，用向外扩散的 `box-shadow` 绘制，不占布局也不影响滑块位移；扩散距离 Web 为 8px、UniApp 为 16rpx（同一物理尺寸）。
::

### 自定义取值：active-value 与 inactive-value

绑定值不是布尔时，用 `activeValue` / `inactiveValue` 指定开与关分别对应的值；开态由 `modelValue === activeValue` **严格相等**判断，`update:modelValue` 与 `change` 的载荷也是这两个值之一。

```vue
<script setup lang="ts">
const status = ref("yes");
</script>

<template>
  <RebornSwitch
    v-model="status"
    active-value="yes"
    inactive-value="no"
    active-label="Yes"
    inactive-label="No"
  />
</template>
```

::warning
严格相等意味着类型必须一致：绑定值是数字 `1` 而 `activeValue` 传了字符串 `"1"` 时开关永远显示关闭态。
::

### 切换前拦截：before-change

`beforeChange` 在每次点击后、改值前调用：返回 `false`、Promise 解析为 `false` 或被 reject，都会停止本次切换，不更新绑定值、不触发任何事件。`uni.showModal` 这类 API 用 resolve 传达「取消」，直接 `resolve(res.confirm)` 即可，不必改写成 reject。等待 Promise 期间开关保持原状态，不会先翻转再回滚。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

```vue
<script setup lang="ts">
const value = ref(false);

function beforeChange() {
  return new Promise<boolean>((resolve) => {
    resolve(window.confirm("确认切换状态吗？"));
  });
}
</script>

<template>
  <RebornSwitch
    v-model="value"
    :before-change="beforeChange"
    active-label="需要确认"
  />
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

```vue
<script setup lang="ts">
const value = ref(false);

function beforeChange() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "提示",
      content: "确认切换状态吗？",
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });
}
</script>

<template>
  <RebornSwitch
    v-model="value"
    :before-change="beforeChange"
    active-label="需要确认"
  />
</template>
```

:::

::

### 加载与滑块插槽：loading、thumb 与 active / inactive

`loading` 为 `true` 时滑块内显示加载图标且开关不可点击（与 `disabled` 相互独立）。默认加载图标两端实现不同：Web 端是 `lucide:loader-2` 图标，轨道同时降到 `opacity-80` 并换成等待光标；UniApp 端是一个用边框画出的旋转圆环（可用 `ui.loading` 改写），轨道外观不变。

滑块内容有两层插槽：`active` / `inactive` 按开关状态二选一渲染，适合放勾选、叉号这类状态图标；`thumb`（作用域 `{ checked, loading }`）完全接管滑块内容，优先级最高，填充后 `active` / `inactive` 与默认加载图标都不再渲染。

```vue
<template>
  <RebornSwitch
    v-model="on"
    loading
    active-label="加载中"
  />

  <!-- 完全接管：loading 视觉需自行处理 -->
  <RebornSwitch
    v-model="on"
    loading
  >
    <template #thumb="{ loading }">
      <Icon
        v-if="loading"
        name="lucide:loader"
        class="text-primary size-full animate-spin p-0.5"
      />
    </template>
  </RebornSwitch>

  <!-- 按状态渲染：开态勾、关态叉 -->
  <RebornSwitch
    v-model="on"
    color="success"
  >
    <template #active>
      <Icon
        name="lucide:check"
        class="text-success size-3.5"
      />
    </template>
    <template #inactive>
      <Icon
        name="lucide:x"
        class="size-3.5"
      />
    </template>
  </RebornSwitch>
</template>
```

### 轨道配色：ui.activeTrack 与 ui.inactiveTrack

语义色不够用时，`ui.activeTrack` / `ui.inactiveTrack` 分别设置开、关状态的轨道背景与 ring；`ui.track` 写两态共用的样式。合并顺序是「默认样式 → `ui.track` → 当前状态的 `ui.activeTrack` / `ui.inactiveTrack`」，所以同类原子类以状态样式为准。

```vue
<template>
  <RebornSwitch
    v-model="on"
    :ui="{
      activeTrack: 'bg-[#13ce66] ring-[#0f9d4e]',
      inactiveTrack: 'bg-[#ff4949] ring-[#d9363e]',
    }"
  />
  <RebornSwitch
    v-model="on"
    :ui="{
      track: 'ring-2',
      activeTrack: 'bg-primary ring-primary/40',
      inactiveTrack: 'bg-[#f5f7fa] ring-[#dcdfe6]',
    }"
  />
</template>
```

### 样式定制：ui.track 与滑块尺寸变量

`ui` 对象按键覆写内部节点的原子类。轨道通过 `ui.track` 的宽高类调整；滑块通过 `ui.thumb` 设置 `--re-switch-thumb-size`，高度、滑动端点与按压伸展会一起按新尺寸计算，左右边界始终预留 2px。

```vue
<template>
  <!-- 方形轨道 -->
  <RebornSwitch
    v-model="on"
    :ui="{ track: 'rounded-sm', thumb: 'rounded-sm' }"
  />

  <!-- 自定义 XL：轨道 36×64、滑块 32，位移自动适配 -->
  <RebornSwitch
    v-model="on"
    :ui="{ track: 'h-9 w-16', thumb: '[--re-switch-thumb-size:32px]' }"
  />
</template>
```

## API

### Props

两端 Props 不同：Web 端有 `class`；UniApp 端有 `borderColor` 与 `customClass`，没有 `class`。其余属性同名同义。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
#### Web 端全部属性

| 属性名          | 类型                                                                                   | 默认值      | 描述                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `any`                                                                                  | `-`         | 受控开关值，与 `activeValue` 严格相等时为开态。                                                                                   |
| `defaultValue`  | `any`                                                                                  | `-`         | 非受控模式下的初始值（缺省取 `inactiveValue`）。                                                                                  |
| `activeValue`   | `any`                                                                                  | `true`      | 打开状态对应的绑定值，可为字符串/数字等任意值。                                                                                   |
| `inactiveValue` | `any`                                                                                  | `false`     | 关闭状态对应的绑定值。                                                                                                            |
| `activeLabel`   | `string`                                                                               | `-`         | 开启状态一侧显示的文案，字号固定 14px（`text-base`），不随 `size` 变化。                                                          |
| `inactiveLabel` | `string`                                                                               | `-`         | 关闭状态一侧显示的文案，字号规则同 `activeLabel`。                                                                                |
| `disabled`      | `boolean`                                                                              | `false`     | 是否禁用：不响应点击，两态轨道置为 `bg-gray-2`；`RebornForm` 级 `disabled` 同样生效。                                             |
| `loading`       | `boolean`                                                                              | `false`     | 是否加载中：滑块内显示加载图标、开关不可点击，与 `disabled` 相互独立。                                                            |
| `inlinePrompt`  | `boolean`                                                                              | `false`     | 文本显示在开关内：`activeLabel` / `inactiveLabel` 渲染进轨道内部而非两侧，超出固定宽度时省略号截断；`line` 型不生效。             |
| `autoWidth`     | `boolean`                                                                              | `false`     | 轨道按两态点内文本的较长者撑开，切换时宽度稳定（原固定宽降级为最小宽），文本完整显示；仅配合 `inlinePrompt` 有意义。              |
| `wave`          | `boolean`                                                                              | `false`     | 切换波纹：每次切换成功后从轨道边缘向外扩散一圈 `color` 语义色并淡出；纯视觉反馈，不影响取值与事件。                               |
| `type`          | `"circle" \| "round" \| "line"`                                                        | `"circle"`  | 形态：`circle` 胶囊圆形 / `round` 圆角方形 / `line` 细线轨道 + 悬浮滑块，见「形态：type」。                                       |
| `size`          | `"sm" \| "md" \| "lg"`                                                                 | `"md"`      | 尺寸，三档规格见「尺寸：size」；处于表单内时被表单尺寸覆盖。                                                                      |
| `color`         | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 语义色：开启态轨道与联动文案取该色。                                                                                              |
| `beforeChange`  | `() => boolean \| Promise<boolean>`                                                    | `-`         | 切换前拦截钩子：返回 `false`、Promise 解析为 `false` 或被 reject 时停止切换。                                                     |
| `class`         | `any`                                                                                  | `-`         | 追加到根节点的自定义类名；其余未声明的 attrs 透传到内部隐藏的原生 checkbox。                                                      |
| `ui`            | `object`                                                                               | `-`         | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                                                      |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
#### UniApp 端全部属性

| 属性名          | 类型                                                                                   | 默认值      | 描述                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `any`                                                                                  | `-`         | 受控开关值，与 `activeValue` 严格相等时为开态。                                                                                   |
| `defaultValue`  | `any`                                                                                  | `-`         | 非受控模式下的初始值（缺省取 `inactiveValue`）。                                                                                  |
| `activeValue`   | `any`                                                                                  | `true`      | 打开状态对应的绑定值，可为字符串/数字等任意值。                                                                                   |
| `inactiveValue` | `any`                                                                                  | `false`     | 关闭状态对应的绑定值。                                                                                                            |
| `activeLabel`   | `string`                                                                               | `-`         | 开启状态一侧显示的文案，字号固定 28rpx，不随 `size` 变化。                                                                        |
| `inactiveLabel` | `string`                                                                               | `-`         | 关闭状态一侧显示的文案，字号规则同 `activeLabel`。                                                                                |
| `disabled`      | `boolean`                                                                              | `false`     | 是否禁用：不响应点击，外观无变化。`RebornForm` 级禁用只取消按压反馈，**不会阻止切换**，需要时请同时传本属性。                     |
| `loading`       | `boolean`                                                                              | `false`     | 是否加载中：滑块内显示旋转圆环、开关不可点击，与 `disabled` 相互独立。                                                            |
| `inlinePrompt`  | `boolean`                                                                              | `false`     | 文本显示在开关内：只渲染 `activeLabel` / `inactiveLabel` 属性文本（不读同名插槽），超出固定宽度时省略号截断；`line` 型不生效。    |
| `autoWidth`     | `boolean`                                                                              | `false`     | 轨道改为 `w-auto` 并以原固定宽为最小宽；点内文本仍带截断，仅配合 `inlinePrompt` 有意义。                                          |
| `wave`          | `boolean`                                                                              | `false`     | 切换波纹：每次切换成功后从轨道边缘向外扩散一圈 `color` 语义色并淡出；纯视觉反馈，不影响取值与事件。                               |
| `type`          | `"circle" \| "round" \| "line"`                                                        | `"circle"`  | 形态：`circle` 胶囊圆形 / `round` 圆角方形 / `line` 细线轨道 + 悬浮滑块，见「形态：type」。                                       |
| `borderColor`   | `string`                                                                               | `-`         | 兼容旧版的轨道边框颜色，以 1px 实线内联样式写入；只作用于 border，不影响 `ui` 里的 ring。                                         |
| `size`          | `"sm" \| "md" \| "lg"`                                                                 | `"md"`      | 尺寸，三档规格见「尺寸：size」；处于表单内时被表单尺寸覆盖。                                                                      |
| `color`         | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 语义色：开启态轨道与联动文案取该色。                                                                                              |
| `beforeChange`  | `() => boolean \| Promise<boolean>`                                                    | `-`         | 切换前拦截钩子：返回 `false`、Promise 解析为 `false` 或被 reject 时停止切换。                                                     |
| `customClass`   | `any`                                                                                  | `-`         | 追加到根节点（wrapper）的自定义类名。                                                                                             |
| `ui`            | `object`                                                                               | `-`         | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                                                      |
:::

::

### Emits

两端通用。

| 事件名              | 参数           | 描述                                                                                   |
| ------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: any)` | 切换完成后更新绑定值，参数为 `activeValue` 或 `inactiveValue`。                        |
| `change`            | `(value: any)` | 状态切换后触发（`beforeChange` 拦截通过后才会触发），参数与 `update:modelValue` 相同。 |

### Slots

两端插槽同名，但 `activeLabel` / `inactiveLabel` 在点内模式下的行为不同，因此分端列出。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 插槽名          | 作用域参数             | 描述                                                                                                                |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `activeLabel`   | `-`                    | 开启态文案：默认渲染在轨道右侧；`inlinePrompt` 生效时渲染在轨道内，替代 `activeLabel` 属性。                        |
| `inactiveLabel` | `-`                    | 关闭态文案：默认渲染在轨道左侧；`inlinePrompt` 生效时渲染在轨道内，替代 `inactiveLabel` 属性。                      |
| `active`        | `{ checked }`          | 滑块内开态内容：仅开态渲染（`loading` 时让位给加载图标，`thumb` 插槽填充时不渲染）。                                |
| `inactive`      | `{ checked }`          | 滑块内关态内容：仅关态渲染，其余规则同 `active`。                                                                   |
| `thumb`         | `{ checked, loading }` | 完全接管滑块内部内容，优先级最高：填充后 `active` / `inactive` 与默认加载图标都不再渲染，`loading` 视觉需自行处理。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 插槽名          | 作用域参数             | 描述                                                                                                                |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `activeLabel`   | `-`                    | 轨道右侧的开启态文案，替代 `activeLabel` 属性；`inlinePrompt` 生效时不渲染（点内只显示属性文本）。                  |
| `inactiveLabel` | `-`                    | 轨道左侧的关闭态文案，替代 `inactiveLabel` 属性；`inlinePrompt` 生效时不渲染。                                      |
| `active`        | `{ checked }`          | 滑块内开态内容：仅开态渲染（`loading` 时让位给加载圆环，`thumb` 插槽填充时不渲染）。                                |
| `inactive`      | `{ checked }`          | 滑块内关态内容：仅关态渲染，其余规则同 `active`。                                                                   |
| `thumb`         | `{ checked, loading }` | 完全接管滑块内部内容，优先级最高：填充后 `active` / `inactive` 与默认加载圆环都不再渲染，`loading` 视觉需自行处理。 |
:::

::

### Expose

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 名称    | 签名         | 描述                                                                    |
| ------- | ------------ | ----------------------------------------------------------------------- |
| `focus` | `() => void` | 使内部隐藏的原生 checkbox 获得键盘焦点，轨道随之显示 `focus-visible` 色环。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 名称    | 签名         | 描述                                                                |
| ------- | ------------ | ------------------------------------------------------------------- |
| `focus` | `() => void` | 仅为根节点追加 `is-focused` 类名供样式联动，没有原生焦点行为。 |
:::

::

### 自定义样式（ui）

`ui` 的类名与默认类合并（冲突时 `ui` 优先）。两端各 12 个键，但 Web 有 `inlineWrap`、UniApp 有 `loading`，默认类名也有差异，因此分端列出。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 键名 | 对应节点 | 默认关键类名 | 失效 / 渲染条件 |
| --- | --- | --- | --- |
| `wrapper` | 根节点 `<label>` | `group/switch relative inline-flex items-center gap-3 cursor-pointer select-none` | 始终渲染；`class` 属性与它合并；`relative` 是 sr-only 隐藏 input 的包含块，覆盖时请保留，否则内滚动布局下 input 会锚到 `<html>` 把整页撑高 |
| `input` | 隐藏的原生 checkbox | `peer sr-only` | 始终渲染；轨道的焦点环、禁用光标依赖 `peer`，覆盖时勿去掉 |
| `track` | 轨道（两态共用） | `relative inline-flex items-center rounded-full transition-colors ring-1 ring-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 …` | 始终渲染；加载时 `cursor-wait opacity-80`，表单校验失败时 `ring-red-5`，`line` 型改为 `h-[8/12/16px] overflow-visible` |
| `activeTrack` | 开态轨道背景 | `bg-<color>` | 仅开态合并进轨道；禁用或加载时为 `bg-gray-2` |
| `inactiveTrack` | 关态轨道背景 | `bg-gray-5` | 仅关态合并进轨道；禁用或加载时为 `bg-gray-2` |
| `thumb` | 滑块 | `absolute left-[2px] top-[2px] flex items-center justify-center rounded-full bg-white shadow transition-[left,right] duration-200` | 始终渲染；尺寸由 `[--re-switch-thumb-size:*]` 决定，`line` 型改为垂直居中并加 `ring-1 ring-black/10` |
| `inlineWrap` | 点内文案网格容器 | `grid min-w-0 flex-1 grid-cols-1 self-stretch overflow-hidden rounded-[inherit]` | 仅 `inlinePrompt` 生效（非 `line`）时渲染；`autoWidth` 下追加 `min-w-max flex-none grid-cols-[auto]` |
| `inlineActive` | 点内开态文本 | `col-start-1 row-start-1 self-center truncate text-center text-white leading-none` | 同 `inlineWrap`，且有 `activeLabel` 属性或插槽；`autoWidth` 下改为 `min-w-max max-w-none whitespace-nowrap` |
| `inlineInactive` | 点内关态文本 | `col-start-1 row-start-1 self-center truncate text-center text-gray-1 leading-none` | 同 `inlineWrap`，且有 `inactiveLabel` 属性或插槽；`autoWidth` 规则同上 |
| `wave` | 切换波纹层 | `absolute inset-0 rounded-full pointer-events-none` | 仅 `wave` 开启且至少成功切换过一次时渲染；颜色取 `color` 语义色，不读 `ui` |
| `activeLabel` | 右侧开态文案 | `text-base text-gray-8` | 仅 `inlinePrompt` 未生效且有 `activeLabel` 属性或插槽时渲染；开态加粗取语义色，关态 `text-gray-5` |
| `inactiveLabel` | 左侧关态文案 | `text-base text-gray-8` | 仅 `inlinePrompt` 未生效且有 `inactiveLabel` 属性或插槽时渲染；关态加粗取语义色，开态 `text-gray-5` |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 键名 | 对应节点 | 默认关键类名 | 失效 / 渲染条件 |
| --- | --- | --- | --- |
| `wrapper` | 根 `view` | `group/switch inline-flex items-center gap-3 cursor-pointer select-none` | 始终渲染；`customClass` 与它合并 |
| `input` | 无对应节点 | `sr-only` | **不生效**：config 声明了该键，但模板没有渲染原生 input |
| `track` | 轨道（两态共用） | `relative inline-flex items-center rounded-full transition-colors ring-1 ring-transparent` | 始终渲染；无焦点环、加载与校验失败样式，`line` 型改为 `h-[8/12/16px] overflow-visible`；`borderColor` 以内联样式叠加边框 |
| `activeTrack` | 开态轨道背景 | `bg-<color>` | 仅开态合并进轨道；禁用、加载时不变 |
| `inactiveTrack` | 关态轨道背景 | `bg-gray-3` | 仅关态合并进轨道；禁用、加载时不变 |
| `thumb` | 滑块 | `absolute left-[2px] top-[2px] flex items-center justify-center rounded-full bg-white shadow transition-[left,right] duration-200` | 始终渲染；尺寸由 `[--re-switch-thumb-size:*]` 决定，`line` 型改为垂直居中并加 `ring-1 ring-black/10` |
| `loading` | 默认加载圆环 | `size-full p-0.5 animate-spin text-gray-400 border-2 border-current border-t-transparent rounded-full` | 仅 `loading` 为 `true` 且未使用 `#thumb` 插槽时渲染 |
| `inlineActive` | 点内开态文本 | `col-start-1 row-start-1 self-center truncate text-center text-white leading-none` | 仅 `inlinePrompt` 生效（非 `line`）且有 `activeLabel` 属性时渲染；`autoWidth` 下仍保留截断 |
| `inlineInactive` | 点内关态文本 | `col-start-1 row-start-1 self-center truncate text-center text-gray-7 leading-none` | 仅 `inlinePrompt` 生效且有 `inactiveLabel` 属性时渲染 |
| `wave` | 切换波纹层 | `absolute inset-0 rounded-full pointer-events-none` | 仅 `wave` 开启且至少成功切换过一次时渲染；颜色取 `color` 语义色，不读 `ui` |
| `activeLabel` | 右侧开态文案 | `text-28 text-gray-8 dark:text-gray-1` | 仅 `inlinePrompt` 未生效且有 `activeLabel` 属性或插槽时渲染；开态加粗取语义色，关态 `text-gray-4` |
| `inactiveLabel` | 左侧关态文案 | `text-28 text-gray-8 dark:text-gray-1` | 仅 `inlinePrompt` 未生效且有 `inactiveLabel` 属性或插槽时渲染；关态加粗取语义色，开态 `text-gray-4` |
:::

::

```vue
<template>
  <RebornSwitch
    v-model="on"
    active-label="开启"
    :ui="{
      track: 'ring-2',
      activeTrack: 'bg-[#13ce66] ring-[#0f9d4e]',
      thumb: 'rounded-sm',
      activeLabel: 'text-sm',
    }"
  />
</template>
```

### CSS 变量

定义文件：`app/components/reborn/ui/reborn-switch/reborn-switch.config.ts`、`packages/uniapp-project/src/components/reborn-switch/reborn-switch.config.ts`。

| 变量                     | 默认值                       | 说明                                                             |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------- |
| `--re-switch-thumb-size` | sm：12px；md：20px；lg：28px | 滑块基础尺寸；通过 `ui.thumb` 覆盖，同时影响滑动端点与按压伸展。 |

## 两端差异对照

| 维度             | Web                                                                 | UniApp                                                            |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 自定义类名       | `class`                                                             | `customClass`                                                     |
| 兼容边框参数     | 无 `borderColor`                                                    | 保留 `borderColor`，仅作用于 border，不影响 `ui` 中的 ring        |
| 表单级禁用       | 阻止点击，轨道置灰                                                  | 只取消按压反馈，点击仍会切换                                      |
| 禁用视觉         | 两态轨道 `bg-gray-2`                                                | 无变化                                                            |
| 校验失败视觉     | 轨道 `ring-red-5`                                                   | 无                                                                |
| 关态配色         | 轨道 `bg-gray-5`，点内关态文字 `text-gray-1`                        | 轨道 `bg-gray-3`，点内关态文字 `text-gray-7`                      |
| 加载图标         | `lucide:loader-2` 图标，轨道 `opacity-80` + 等待光标                | 边框旋转圆环（`ui.loading` 可覆写），轨道外观不变                 |
| 点内文本插槽     | 点内模式渲染 `#activeLabel` / `#inactiveLabel`                      | 点内模式只显示属性文本                                            |
| `autoWidth`      | 容器与文案按内容定宽，文本不截断                                    | 只放宽轨道，文本仍带截断                                          |
| `ui` 键          | 有 `inlineWrap`，`input` 对应隐藏 checkbox                          | 有 `loading`，`input` 无对应节点                                  |
| 键盘焦点         | `focus()` 聚焦原生 input，`focus-visible` 有色环                    | `focus()` 仅添加 `is-focused` 类名                                |
| 波纹重播机制     | 自增 `:key` 重建波纹节点，扩散 8px                                  | 交替挂两组同构关键帧类（小程序端改 key 不重播），扩散 16rpx       |

## 注意事项

- **开态判断是严格相等**。`modelValue === activeValue` 才算开：绑定值不是布尔时必须同时配置 `activeValue` 与 `inactiveValue`，且类型要一致，`"1"` 与 `1` 不相等，开关会永远显示关闭态。
- **`beforeChange` 未放行时整次切换作废**。返回 `false`、Promise 解析为 `false` 或 reject 都不会更新绑定值，也不触发 `update:modelValue` / `change`，无需业务侧回滚。
- **`loading` 与 `disabled` 相互独立**。任一为 `true` 都阻止点击；`loading` 额外在滑块内渲染加载图标，两者同时为 `true` 时以加载视觉为准。
- **表单联动两端不完全一致**。两端都在切换成功后调用表单项的 `validate('change')`，尺寸都按表单配置回退；但 `RebornForm` 级 `disabled` 只有 Web 端会阻止切换，UniApp 端点击仍会改值，需要禁用时请在开关上显式传 `disabled`。
- **`inlinePrompt` 在 `line` 型下不生效**。细线轨道放不下文本，此时点内文本与两侧文案都不渲染；需要文案请换 `circle` / `round` 形态。
- **滑块插槽有优先级**。`thumb` 完全接管、优先级最高，填充后 `active` / `inactive` 与默认加载图标都不渲染，`loading` 视觉要靠作用域参数自行处理；只想按状态换图标用 `active` / `inactive` 即可。
- **`inlinePrompt` 的文本在固定宽度下会省略**。点内可用空间 = 轨道宽 − 滑块占位 − 边距，长文案被省略号截断是预期行为；Web 端开 `autoWidth` 可完整显示，UniApp 端 `autoWidth` 只放宽轨道、文本仍可能截断，长文案建议改用两侧标签。
- **自定义滑块尺寸使用尺寸变量**。通过 `ui.thumb` 设置 `[--re-switch-thumb-size:32px]`，让高度、滑动端点和按压伸展同步计算；不要单独用 `size-*` / `w-*` 覆盖滑块宽度，否则会破坏左右边界约束。轨道宽高仍通过 `ui.track` 设置。
- **Web 端焦点环写在 `track` 上**。默认的 `peer-focus-visible:ring-*` 在 `ui.track` 里单独覆盖即可，不要为了换颜色移除焦点提示；它依赖 `ui.input` 里的 `peer`，覆盖 `input` 时要保留。
- **波纹只由用户点击触发**。波纹在切换成功那一刻起播，所以外部改写 `v-model`（接口回填、代码复位）和被 `beforeChange` 拦下的切换都不会起波纹。
- **波纹会画到轨道外面**。它用向外扩散的 `box-shadow` 绘制、不占布局也不影响滑块位移，但祖先节点若设了 `overflow-hidden` 就会把这一圈裁掉；波纹色只认 `color` 语义色，用 `ui.activeTrack` 换掉轨道背景后两者不会自动一致。
