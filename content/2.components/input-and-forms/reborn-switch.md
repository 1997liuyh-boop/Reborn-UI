---
title: 开关
description: 用于在两种状态间切换的开关组件，支持自定义开关值、加载态与切换前拦截。
category: 表单与输入
tags: [css, tailwind, switch, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSwitchDemo.vue" config="RebornSwitchConfig" componentId="reborn-switch" :componentFiles='["RebornSwitch.vue", "reborn-switch.config.ts"]' :uniappFiles='["RebornSwitch.vue", "reborn-switch.config.ts"]'}
::

## 简介

Switch 是双端可用的开关组件，用于设置项的启用/停用等两种状态的即时切换。绑定值不限于布尔：通过 `activeValue` / `inactiveValue` 可映射任意值；`beforeChange` 支持在切换前做同步或异步拦截（二次确认、接口校验）；`loading` 展示加载态；轨道两侧文案可用 `activeLabel` / `inactiveLabel` 属性或同名插槽定制。

适用场景：

- 设置项的启用/停用切换，操作后立即生效。
- 绑定值为字符串/数字（如 `"yes"` / `"no"`）的开关字段。
- 切换前需二次确认或异步校验的敏感操作。

不适用场景：

- 一组互斥选项中选一个，改用 `reborn-radio`。
- 多项勾选组合或需要提交才生效的确认项，改用 `reborn-checkbox`。

## 用法

### 基础用法

`v-model` 双向绑定开关值；`activeLabel` / `inactiveLabel` 在轨道两侧显示文案。非受控场景不传 `modelValue`，用 `defaultValue` 设初始值。

```vue
<script setup lang="ts">
import { ref } from "vue";

const on = ref(true);
</script>

<template>
  <RebornSwitch v-model="on" active-label="开启" inactive-label="关闭" />
  <RebornSwitch v-model="on" color="success" size="lg" />
  <RebornSwitch :default-value="true" disabled />
</template>
```

### 自定义开关值

绑定值不是布尔时，用 `activeValue` / `inactiveValue` 指定开与关分别对应的值；开态由 `modelValue === activeValue` 严格相等判断。

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

### 切换前拦截（beforeChange）

`beforeChange` 在每次切换前调用：返回 `false`、Promise 解析为 `false` 或 Promise reject 都会取消本次切换（不更新绑定值、不触发事件）。

```vue
<script setup lang="ts">
const value = ref(false);

function beforeChange() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "提示",
      content: "确认切换状态吗？",
      success: res => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });
}
</script>

<template>
  <RebornSwitch v-model="value" :before-change="beforeChange" active-label="需确认" />
</template>
```

### 加载态与滑块插槽

`loading` 为 `true` 时轨道内显示加载图标且开关不可点击；`thumb` 插槽（作用域 `{ checked, loading }`）可自定义滑块内容。

```vue
<template>
  <RebornSwitch v-model="on" loading active-label="加载中" />

  <RebornSwitch v-model="on" :ui="{ track: 'rounded-md', thumb: 'rounded-sm' }">
    <template #thumb="{ checked }">
      <view class="size-4" :class="checked ? 'i-lucide-check' : 'i-lucide-x'" />
    </template>
  </RebornSwitch>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `any` | `false` | 受控开关值，与 `activeValue` 严格相等时为开态。 |
| `defaultValue` | `any` | `false` | 非受控模式下的初始值。 |
| `activeValue` | `any` | `true` | 打开状态对应的绑定值，可为字符串/数字等任意值。 |
| `inactiveValue` | `any` | `false` | 关闭状态对应的绑定值。 |
| `activeLabel` | `string` | `undefined` | 开启状态一侧显示的文案。 |
| `inactiveLabel` | `string` | `undefined` | 关闭状态一侧显示的文案。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `loading` | `boolean` | `false` | 是否加载中：显示加载图标且开关不可点击，与 `disabled` 相互独立。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 启用色值。 |
| `beforeChange` | `() => boolean \| Promise<boolean>` | - | 切换前拦截钩子：返回 `false`、Promise 解析为 `false` 或 reject 时取消本次切换。 |
| `class` | `string` | `""` | **仅 Web**。追加到根节点的自定义类名。 |
| `customClass` | `string` | - | **仅 UniApp**。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | 覆盖内部各区域样式类，见下方「自定义样式（ui）」。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: any)` | 切换完成后更新绑定值，参数为 `activeValue` 或 `inactiveValue`。 |
| `change` | `(value: any)` | 状态切换后触发（`beforeChange` 拦截通过后才会触发），参数与 `update:modelValue` 相同。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `activeLabel` | - | 自定义开启一侧文案区域，替代 `activeLabel` 属性。 |
| `inactiveLabel` | - | 自定义关闭一侧文案区域，替代 `inactiveLabel` 属性。 |
| `thumb` | `{ checked, loading }` | 自定义滑块内部内容（如图标、加载动画）。 |

### Expose

| 名称 | 签名 | 描述 |
| --- | --- | --- |
| `focus` | `() => void` | Web 端使内部原生 checkbox 获得键盘焦点；UniApp 端仅为根节点添加 `is-focused` 类名（无原生焦点行为）。 |

## 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的样式类：

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `input` | **仅 Web**。隐藏的原生 checkbox。 |
| `track` | 开关轨道。 |
| `thumb` | 滑块圆钮。 |
| `loading` | **仅 UniApp**。默认加载图标。 |
| `activeLabel` | 开启一侧文案。 |
| `inactiveLabel` | 关闭一侧文案。 |

```vue
<!-- 自定义尺寸（uniapp 用 rpx 同理：h-[64rpx] w-[112rpx]） -->
<RebornSwitch
  v-model="on"
  :ui="{ track: 'h-8 w-14', thumb: 'size-7 group-[.is-checked]:translate-x-6' }"
/>
```

## 注意事项

- web 与 uniapp 双端可用；额外类名 web 端用 `class`，uniapp 端用 `customClass`。
- 开态由 `modelValue === activeValue` 严格相等判断：绑定值不是布尔时必须同时配置 `activeValue` 与 `inactiveValue`，且注意类型一致（`"1"` 与 `1` 不相等）。
- `beforeChange` 拦截未通过时不会更新绑定值、也不触发 `update:modelValue` / `change`。
- `loading` 与 `disabled` 是两个独立属性，任一为 `true` 都会阻止点击。
- `focus` 双端语义不同：web 聚焦原生 input（可接键盘操作），uniapp 仅添加 `is-focused` 类名用于样式联动。
- 在 `RebornForm` 中使用时，切换会自动触发表单项的 `change` 校验。
