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

`v-model` 双向绑定开关值；`activeLabel` / `inactiveLabel` 在轨道两侧显示文案。非受控场景不传 `modelValue`，用 `defaultValue` 设初始值。

```vue
<script setup lang="ts">
import { ref } from "vue";

const on = ref(true);
</script>

<template>
  <RebornSwitch
    v-model="on"
    active-label="开启"
    inactive-label="关闭"
  />
  <RebornSwitch
    v-model="on"
    color="success"
    size="lg"
  />
  <RebornSwitch
    :default-value="true"
    disabled
  />
</template>
```

### 尺寸

三档圆形规格，两端同一几何（Web 为 px，UniApp H5/小程序按相同像素渲染）：

| `size`       | 轨道    | 滑块直径 | 选中位移 |
| ------------ | ------- | -------- | -------- |
| `sm`         | 16 × 28 | 12       | 12       |
| `md`（默认） | 24 × 44 | 20       | 20       |
| `lg`         | 32 × 60 | 28       | 28       |

三档共用同一条几何关系：滑块四周留白固定 2px，选中时滑块右缘贴到轨道右端再回收 2px——位移是「left-full − 自身宽度 − 2px」自动计算的，与轨道宽、滑块直径都无关，因此用 `ui` 自定义宽高时**无需**改写位移，`autoWidth` 自适应宽度下同样成立。

### 形态

`type` 提供三种形态，尺寸档位与选中位移三者通用：

| `type`           | 外观                                             | 典型用途                                         |
| ---------------- | ------------------------------------------------ | ------------------------------------------------ |
| `circle`（默认） | 胶囊轨道 + 圆形滑块                              | 常规设置项                                       |
| `round`          | 轨道与滑块取 4px 小圆角的方形                    | 与方角控件（表格、工具栏）并排时保持形状语言一致 |
| `line`           | 轨道压成滑块直径一半的细线，滑块骑在线上居中滑动 | 低视觉权重场景，如卡片角落的次要开关             |

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

### 点内文本

`inlinePrompt` 为 `true` 时，`activeLabel` / `inactiveLabel` 不再渲染在两侧，而是渲染进开关内部：开态文本落在轨道左侧（滑块滑到右侧后空出的区域），关态文本落在右侧，都在各自区域内居中。固定宽度下超出的文本自动省略号截断；设置 `autoWidth` 后轨道按两态文案的较长者撑开（原固定宽降级为最小宽），切换时宽度保持稳定，文本完整显示不省略。两态文案持续挂载，以 200ms 水平滑入、滑出；系统开启减弱动效时立即切换。

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
    active-label="已开启通知"
    inactive-label="已关闭通知"
  />

  <!-- 轨道随文本撑开，完整显示 -->
  <RebornSwitch
    v-model="on"
    inline-prompt
    auto-width
    size="lg"
    active-label="已开启通知"
    inactive-label="已关闭通知"
  />
</template>
```

::warning
`line` 型轨道过细放不下文本，`inlinePrompt` 在该形态下不渲染（自动回落为无文案，两侧文案也不显示）。
::

### 颜色

开启态轨道取语义色，关闭态统一为中性灰；两侧文案在对应状态下同步取语义色高亮。

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

通过 `ui.activeTrack` / `ui.inactiveTrack` 分别设置开、关状态的轨道背景与 ring；`ui.track` 设置两态共用的样式，状态样式最后合并。全部使用 Tailwind 类名，无背景色内联样式覆盖。

```vue
<template>
  <RebornSwitch
    v-model="on"
    :ui="{
      track: 'ring-2',
      activeTrack: 'bg-[#13ce66] ring-[#0f9d4e]',
      inactiveTrack: 'bg-[#ff4949] ring-[#d9363e]',
    }"
  />
</template>
```

### 切换波纹

`wave` 开启后，每次切换成功都会从轨道边缘向外扩散一圈开态色并淡出（0.5s ease-out），给没有文案的开关补一个「这一下点到了」的反馈。波纹色取 `color` 语义色，不跟随 `ui` 的轨道背景覆盖；`round` 形态下波纹跟随轨道取同样的小圆角。

默认关闭，且只是视觉反馈——不参与取值与事件，被 `beforeChange` 拦下的切换不会起波纹（波纹与 `change` 同一时机触发）。

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

  <!-- 波纹色跟随 color 语义色 -->
  <RebornSwitch
    v-model="on"
    wave
    color="secondary"
  />
</template>
```

::tip
波纹是盖在轨道上的一层空节点，用向外扩散的 `box-shadow` 绘制，不占布局也不影响滑块位移；扩散距离 Web 为 8px、UniApp 为 16rpx（同一物理尺寸）。
::

### 自定义开关值

绑定值不是布尔时，用 `activeValue` / `inactiveValue` 指定开与关分别对应的值；开态由 `modelValue === activeValue` **严格相等**判断。

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

### 切换前拦截（beforeChange）

`beforeChange` 在每次切换前调用：返回 `false`，或返回 Promise 且被 reject，都会停止本次切换——不更新绑定值、不触发任何事件；Promise 解析为 `false` 同样停止（`uni.showModal` 这类 API 用 resolve 传达「取消」，不必刻意改写成 reject）。适合删除确认、权限校验这类「先问再切」的场景。

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
    active-label="需确认"
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
    active-label="需确认"
  />
</template>
```

:::

::

### 加载态与滑块插槽

`loading` 为 `true` 时滑块内显示加载图标且开关不可点击（与 `disabled` 相互独立）。滑块内容有两层插槽：`active` / `inactive` 按开关状态二选一渲染（写勾选/叉号这类状态图标最省事）；`thumb`（作用域 `{ checked, loading }`）则完全接管滑块内容，优先级最高，填充后 `active` / `inactive` 与默认加载图标都不再渲染。

```vue
<template>
  <RebornSwitch
    v-model="on"
    loading
    active-label="加载中"
  />

  <!-- 按状态渲染：开态勾、关态叉 -->
  <RebornSwitch v-model="on">
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

  <!-- 完全接管（含 loading 状态的处理责任） -->
  <RebornSwitch v-model="on">
    <template #thumb="{ checked, loading }">
      <Icon
        v-if="loading"
        name="lucide:loader"
        class="size-3.5 animate-spin"
      />
      <Icon
        v-else
        :name="checked ? 'lucide:check' : 'lucide:x'"
        class="size-3.5"
      />
    </template>
  </RebornSwitch>
</template>
```

### 自定义样式

`ui` 对象按键覆写内部节点的原子类。轨道通过宽高类调整，滑块通过 `--re-switch-thumb-size` 同步设置尺寸和滑动端点；左右边界始终预留 2px，按压时只向轨道内部伸展：

```vue
<template>
  <!-- 方形轨道 -->
  <RebornSwitch
    v-model="on"
    :ui="{ track: 'rounded-ui-2xs', thumb: 'rounded-ui-2xs' }"
  />

  <!-- 自定义 XL：36×64 滑块 32，位移自动适配 -->
  <RebornSwitch
    v-model="on"
    :ui="{ track: 'h-9 w-16', thumb: '[--re-switch-thumb-size:32px]' }"
  />
</template>
```

### 与表单组联动

开关处于 `RebornForm` 内时自动继承表单级配置：尺寸按 `Form` 配置回退；`Form` 级 `disabled` 会禁用组内开关；切换时触发表单项的 `change` 校验（UniApp 端在组件内调用，Web 端由表单体系接管）。

## API

### Props

除标注项外两端通用。

| 属性名          | 类型                                                                                   | 默认值      | 描述                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `any`                                                                                  | `-`         | 受控开关值，与 `activeValue` 严格相等时为开态。                                                                                                             |
| `defaultValue`  | `any`                                                                                  | `-`         | 非受控模式下的初始值（缺省取 `inactiveValue`）。                                                                                                            |
| `activeValue`   | `any`                                                                                  | `true`      | 打开状态对应的绑定值，可为字符串/数字等任意值。                                                                                                             |
| `inactiveValue` | `any`                                                                                  | `false`     | 关闭状态对应的绑定值。                                                                                                                                      |
| `activeLabel`   | `string`                                                                               | `-`         | 开启状态一侧显示的文案，字号固定 14px（Web `text-base` / UniApp 28rpx），不随 `size` 变化。                                                                 |
| `inactiveLabel` | `string`                                                                               | `-`         | 关闭状态一侧显示的文案，字号规则同 `activeLabel`。                                                                                                          |
| `disabled`      | `boolean`                                                                              | `false`     | 是否禁用。                                                                                                                                                  |
| `loading`       | `boolean`                                                                              | `false`     | 是否加载中：滑块内显示加载图标且开关不可点击，与 `disabled` 相互独立。                                                                                      |
| `inlinePrompt`  | `boolean`                                                                              | `false`     | 文本显示在开关内：`activeLabel` / `inactiveLabel` 渲染进轨道内部而非两侧，超出固定宽度时省略号截断；`line` 型不生效。                                       |
| `autoWidth`     | `boolean`                                                                              | `false`     | 轨道按两态点内文本的较长者撑开，切换时宽度稳定（原固定宽降级为最小宽）；仅配合 `inlinePrompt` 有意义。                                                      |
| `wave`          | `boolean`                                                                              | `false`     | 切换波纹：每次切换成功后从轨道边缘向外扩散一圈 `color` 语义色并淡出；纯视觉反馈，不影响取值与事件。                                                         |
| `type`          | `"circle" \| "round" \| "line"`                                                        | `"circle"`  | 形态：`circle` 胶囊圆形 / `round` 圆角方形 / `line` 细线轨道 + 悬浮滑块，见「形态」表。                                                                     |
| `size`          | `"sm" \| "md" \| "lg"`                                                                 | `"md"`      | 尺寸，三档规格见「尺寸」表；处于表单组内时被组尺寸覆盖。                                                                                                    |
| `color`         | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 语义色：开启态轨道与联动文案取该色。                                                                                                                        |
| `borderColor`   | `string`                                                                               | `-`         | 仅 UniApp：兼容旧版轨道边框颜色，1px 实线内联样式；双端统一样式建议用 ui 设置 ring。                                                                        |
| `beforeChange`  | `() => boolean \| Promise<boolean>`                                                    | `-`         | 切换前拦截钩子：返回 `false` 或返回 Promise 且被 reject 时停止切换；Promise 解析为 `false` 同样停止（便于 `uni.showModal` 这类以 resolve 传达取消的 API）。 |
| `class`         | `any`                                                                                  | `-`         | 仅 web。追加到根节点的自定义类名。                                                                                                                          |
| `customClass`   | `any`                                                                                  | `-`         | 仅 uniapp。追加到根节点的自定义类名。                                                                                                                       |
| `ui`            | `object`                                                                               | `{}`        | 细粒度样式覆盖对象，详见下表。                                                                                                                              |

### Emits

两端通用。

| 事件名              | 参数           | 描述                                                                                   |
| ------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: any)` | 切换完成后更新绑定值，参数为 `activeValue` 或 `inactiveValue`。                        |
| `change`            | `(value: any)` | 状态切换后触发（`beforeChange` 拦截通过后才会触发），参数与 `update:modelValue` 相同。 |

### Slots

两端通用。

| 插槽名          | 作用域参数             | 描述                                                                                                                |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `activeLabel`   | `-`                    | 自定义开启一侧文案区域，替代 `activeLabel` 属性。                                                                   |
| `inactiveLabel` | `-`                    | 自定义关闭一侧文案区域，替代 `inactiveLabel` 属性。                                                                 |
| `active`        | `{ checked }`          | 滑块内开态内容：仅开态渲染（`loading` 时让位给加载图标，`thumb` 插槽填充时不渲染）。                                |
| `inactive`      | `{ checked }`          | 滑块内关态内容：仅关态渲染，其余规则同 `active`。                                                                   |
| `thumb`         | `{ checked, loading }` | 完全接管滑块内部内容，优先级最高：填充后 `active` / `inactive` 与默认加载图标都不再渲染，`loading` 视觉需自行处理。 |

### Expose

| 名称    | 签名         | 描述                                                                                                  |
| ------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `focus` | `() => void` | Web 端使内部原生 checkbox 获得键盘焦点；UniApp 端仅为根节点添加 `is-focused` 类名（无原生焦点行为）。 |

### 自定义样式（ui）

| 键名             | 说明                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| `wrapper`        | 根容器。                                                                     |
| `input`          | 仅 web。隐藏的原生 checkbox。                                                |
| `track`          | 两态共用的轨道样式，支持背景、ring 宽度与颜色。                              |
| `activeTrack`    | 开启态轨道样式，覆盖通用 track 中的同类样式。                                |
| `inactiveTrack`  | 关闭态轨道样式，覆盖通用 track 中的同类样式。                                |
| `wave`           | 切换波纹层；波纹颜色取 color 语义色。                                        |
| `thumb`          | 滑块圆钮。                                                                   |
| `inlineWrap`     | 仅 web。点内文案的容器（`inlinePrompt` 开启时渲染）；`autoWidth` 下改为不可收缩、按内容定宽。 |
| `inlineActive`   | 点内开态文本（`inlinePrompt` 开启时渲染）。                                  |
| `inlineInactive` | 点内关态文本。                                                               |
| `loading`        | 仅 uniapp。默认加载图标（web 端加载图标是 Icon 组件，用 `thumb` 插槽替换）。 |
| `activeLabel`    | 开启一侧文案。                                                               |
| `inactiveLabel`  | 关闭一侧文案。                                                               |

### CSS 变量

定义文件：`app/components/reborn/ui/reborn-switch/reborn-switch.config.ts`、`packages/uniapp-project/src/components/reborn-switch/reborn-switch.config.ts`。

| 变量                     | 默认值                       | 说明                                                             |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------- |
| `--re-switch-thumb-size` | sm：12px；md：20px；lg：28px | 滑块基础尺寸；通过 `ui.thumb` 覆盖，同时影响滑动端点与按压伸展。 |

## 两端差异对照

| 维度         | Web                                              | UniApp                                                 |
| ------------ | ------------------------------------------------ | ------------------------------------------------------ |
| 自定义类名   | `class`                                          | `customClass`                                          |
| 两态轨道样式 | 按选中状态合并 activeTrack / inactiveTrack       | 同 Web                                                 |
| 兼容边框参数 | 无 borderColor                                   | 保留 borderColor，仅作用于 border，不影响 ui 中的 ring |
| 加载图标     | `lucide:loader-2` Icon 组件                      | CSS 边框旋转动画（`ui.loading` 可覆写）                |
| 键盘焦点     | `focus()` 聚焦原生 input，`focus-visible` 有色环 | `focus()` 仅添加 `is-focused` 类名                     |
| 表单校验触发 | 由表单体系接管                                   | 组件内切换后调用 `validate('change')`                  |
| 波纹重播机制 | 自增 `:key` 重建波纹节点，动画从头触发           | 交替挂两组同构关键帧类（小程序端改 key 不重播动画）    |

## 注意事项

- **开态判断是严格相等**。`modelValue === activeValue` 才算开：绑定值不是布尔时必须同时配置 `activeValue` 与 `inactiveValue`，且类型要一致——`"1"` 与 `1` 不相等，开关会永远显示关闭态。
- **`beforeChange` 未放行时整次切换作废**。返回 `false`、Promise 解析为 `false` 或 reject 都不会更新绑定值、也不触发 `update:modelValue` / `change`，无需业务侧回滚。
- **`loading` 与 `disabled` 相互独立**。任一为 `true` 都阻止点击；`loading` 额外在滑块内渲染加载图标，两者同时为 `true` 时以加载视觉为准。
- **`inlinePrompt` 在 `line` 型下不生效**。细线轨道放不下文本，此时点内文本与两侧文案都不渲染；需要文案请换 `circle` / `round` 形态。
- **滑块插槽有优先级**。`thumb` 完全接管、优先级最高，填充后 `active` / `inactive` 与默认加载图标都不渲染，`loading` 视觉要靠作用域参数自行处理；只想按状态换图标用 `active` / `inactive` 即可。
- **`inlinePrompt` 的文本在固定宽度下会省略**。点内可用空间 = 轨道宽 − 滑块占位 − 边距，长文案被省略号截断是预期行为；需要完整显示开 `autoWidth`（按两态较长文案撑开，切换不改宽），或改用两侧标签。
- **自定义滑块尺寸使用尺寸变量**。通过 `ui.thumb` 设置 `[--re-switch-thumb-size:32px]`，让高度、滑动端点和按压伸展同步计算；不要单独使用 `size-*` / `w-*` 覆盖滑块宽度，否则会破坏左右边界约束。轨道宽高仍通过 `ui.track` 设置。
- **状态轨道样式优先于通用样式**。合并顺序为默认样式 → `ui.track` → 当前状态的 `ui.activeTrack` / `ui.inactiveTrack`，因此只写 `ui.track` 可以统一两态背景，状态键可以分别覆盖背景与 ring；Web 键盘焦点环用 `peer-focus-visible:ring-*` 类单独覆盖，不要为了换颜色移除焦点提示。
- **`focus` 双端语义不同**。web 聚焦内部原生 input（可接键盘操作），uniapp 仅为根节点添加 `is-focused` 类名用于样式联动，没有原生焦点行为。
- **波纹只由用户点击触发**。`wave` 的波纹在切换成功那一刻起播，所以外部改写 `v-model`（接口回填、代码复位）和被 `beforeChange` 拦下的切换都不会起波纹；需要为程序化变更补反馈得另想办法。
- **波纹会画到轨道外面**。它用向外扩散的 `box-shadow` 绘制、不占布局也不影响滑块位移，但祖先节点若设了 `overflow-hidden` 就会把这一圈裁掉；波纹色只认 `color` 语义色，用 `ui.activeTrack` 换掉轨道背景后两者不会自动一致。
