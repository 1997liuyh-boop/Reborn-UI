---
title: Popconfirm 气泡确认框
description: 点击触发的轻量确认气泡，标题、描述加确认取消按钮，适合低风险操作的二次确认。
category: 反馈
platform: web
tags: [popconfirm, confirm, feedback, popover]
---

::ComponentViewer{demoFile="RebornPopconfirmDemo.vue" config="RebornPopconfirmConfig" componentId="reborn-popconfirm" :componentFiles='["RebornPopconfirm.vue", "reborn-popconfirm.config.ts"]'}
::

## 简介

仅支持 **Web**。Popconfirm 是锚定在触发元素上的小型确认气泡，基于 `reborn-popover` 定位、按钮复用 `reborn-button`（sm 档）。点击触发器弹出，点击确认 / 取消按钮触发对应事件并关闭，点击外部同样关闭。适合删除单条数据、退出编辑等打断感要求低的二次确认。

不适用场景：

- 高风险、不可逆或需要展示较多上下文的确认，改用 `reborn-dialog`。
- 纯展示性的气泡内容改用 `reborn-popover`，纯文字提示改用 `reborn-tooltip`。

## 基础用法

```vue
<template>
  <RebornPopconfirm
    title="确定删除这条数据吗？"
    description="删除后不可恢复，关联的引用也会一并失效。"
    @confirm="remove"
    @cancel="onCancel"
  >
    <RebornButton
      size="sm"
      variant="outlined"
      color="error"
      >删除</RebornButton
    >
  </RebornPopconfirm>
</template>
```

默认插槽放触发器，气泡默认在触发器上方居中弹出并带箭头。`title` 为 14px 标题色（gray-10），`description` 为 14px 辅助色（gray-8），两者间隔 8px；按钮区与文字区间隔 16px，按钮为 sm 档、彼此间隔 8px、右对齐。气泡内边距 12px。省略 `description` 时只显示标题。

## 定位

```vue
<template>
  <RebornPopconfirm
    title="确定执行该操作吗？"
    placement="bottom-start"
    :side-offset="12"
    :arrow="false"
  >
    <RebornButton size="sm">底部弹出</RebornButton>
  </RebornPopconfirm>
</template>
```

`placement` 取值与 `reborn-tooltip` 完全一致（同一套 `PopconfirmPlacement` 定义），默认 `'top'`；同样接受 `topLeft` / `rightBottom` 这类驼峰别名。`sideOffset` 控制气泡与触发器的间距（默认 8px）。`arrow` 默认显示。

定位口径与 `reborn-tooltip` 共用同一套实现：主轴放不下时翻到对侧，对侧同样放不下就保持原方向（翻过去只会换个方向继续溢出）；交叉轴则把气泡挪回视口内，但始终与触发器保持至少 12px 交叠，触发器滚出视口时气泡跟着一起走，不会被钉在屏幕边缘。箭头落点也按 `placement` 的对齐档位固定：`-start` / `-end` 停在气泡两端 17px 处，只有居中档才指向触发器中心。

### PopconfirmPlacement

- `top` / `top-start` / `top-end`
- `bottom` / `bottom-start` / `bottom-end`
- `left` / `left-start` / `left-end`
- `right` / `right-start` / `right-end`
- 驼峰等价别名：`topLeft` / `topRight` / `bottomLeft` / `bottomRight` / `leftTop` / `leftBottom` / `rightTop` / `rightBottom`

::tip
旧的 `content` 对象写法（`{ side, align, sideOffset }`）仍然可用，等价于 `placement` + `sideOffset`；同时传入时以 `placement` 为准。新代码请使用 `placement`。
::

## 按钮定制

```vue
<template>
  <RebornPopconfirm
    title="确定移除该成员吗？"
    confirm-color="error"
    confirm-text="移除"
    cancel-text="再想想"
  >
    <RebornButton
      size="sm"
      color="error"
      >移除成员</RebornButton
    >
  </RebornPopconfirm>
  <RebornPopconfirm
    title="已阅读并知晓以上提醒？"
    hide-cancel
    confirm-text="知道了"
  >
    <RebornButton size="sm">仅确认</RebornButton>
  </RebornPopconfirm>
</template>
```

确认按钮为 `filled` 变体，`confirmColor` 默认 `primary`；取消按钮为 `outlined` 变体，`cancelColor` 默认 `neutral`。`hideCancel` 隐藏取消按钮。

## 异步确认

```vue
<script setup lang="ts">
const open = ref(false);
const loading = ref(false);

async function onConfirm() {
  loading.value = true;
  await removeItems();
  loading.value = false;
  open.value = false;
}
</script>

<template>
  <RebornPopconfirm
    v-model:open="open"
    title="确定删除所选项吗？"
    :loading="loading"
    confirm-color="error"
    @confirm="onConfirm"
  >
    <RebornButton
      size="sm"
      color="error"
      >删除</RebornButton
    >
  </RebornPopconfirm>
</template>
```

`loading` 使确认按钮进入加载态，且点击确认不再自动关闭气泡；配合 `v-model:open` 在异步完成后手动收起。取消按钮与点击外部不受 `loading` 影响。

## 自定义内容

```vue
<template>
  <RebornPopconfirm description="发布后将对全部用户可见。">
    <template #title>
      <span class="inline-flex items-center gap-[4px]">
        <span class="icon-[lucide--rocket] text-primary size-[14px]" />
        确认发布新版本？
      </span>
    </template>
    <template #footer="{ confirm, cancel }">
      <RebornButton
        size="sm"
        variant="text"
        color="neutral"
        @click="cancel"
        >再想想</RebornButton
      >
      <RebornButton
        size="sm"
        variant="soft"
        color="success"
        @click="confirm"
        >发布</RebornButton
      >
    </template>
    <RebornButton size="sm">发布</RebornButton>
  </RebornPopconfirm>
</template>
```

`title` / `description` 插槽优先于同名属性；`footer` 插槽整体接管按钮区，作用域参数提供 `confirm` / `cancel` 回调（内部会触发事件并按 `loading` 规则关闭）。也可通过 ref 调用暴露的 `close()` 手动关闭。

## API

### Props

| 属性名         | 类型                          | 默认值      | 描述                                                                                             |
| -------------- | ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `title`        | `string`                      | `—`         | 标题文字，14px 标题色。                                                                          |
| `description`  | `string`                      | `—`         | 描述文字，14px 辅助色，与标题间隔 8px。                                                          |
| `confirmText`  | `string`                      | `'确定'`    | 确认按钮文字。                                                                                   |
| `cancelText`   | `string`                      | `'取消'`    | 取消按钮文字。                                                                                   |
| `confirmColor` | `ButtonProps['color']`        | `'primary'` | 确认按钮语义色。                                                                                 |
| `cancelColor`  | `ButtonProps['color']`        | `'neutral'` | 取消按钮语义色。                                                                                 |
| `hideCancel`   | `boolean`                     | `false`     | 隐藏取消按钮。                                                                                   |
| `loading`      | `boolean`                     | `false`     | 确认按钮加载中，点击确认不自动关闭。                                                             |
| `placement`    | `PopconfirmPlacement`         | `'top'`     | 出现方向与对齐方式，同时接受驼峰命名别名（`topLeft` 等），取值与 `reborn-tooltip` 一致。         |
| `sideOffset`   | `number`                      | `8`         | 气泡与触发器的间距（px）。                                                                       |
| `content`      | `PopoverContentProps`         | `—`         | 已废弃：旧的定位对象写法（`side` / `align` / `sideOffset`），等价于 `placement` + `sideOffset`。 |
| `arrow`        | `boolean`                     | `true`      | 是否显示指向触发器的箭头。                                                                       |
| `portal`       | `boolean \| string`           | `true`      | 传送目标，false 表示原地渲染。                                                                   |
| `dismissible`  | `boolean`                     | `true`      | 点击外部是否关闭。                                                                               |
| `open`         | `boolean`                     | `—`         | 受控显隐，对应 `v-model:open`。                                                                  |
| `defaultOpen`  | `boolean`                     | `false`     | 非受控模式的初始显隐。                                                                           |
| `class`        | `ClassValue`                  | `—`         | 触发器外层容器类名。                                                                             |
| `ui`           | `PopconfirmUi & { popover? }` | `—`         | 样式覆盖：body/header/title/description/footer，popover 键透传底层气泡。                         |

### Events

| 事件名        | 参数              | 描述                                  |
| ------------- | ----------------- | ------------------------------------- |
| `confirm`     | `—`               | 点击确认按钮时触发。                  |
| `cancel`      | `—`               | 点击取消按钮时触发。                  |
| `update:open` | `(open: boolean)` | 显隐变化时触发，对应 `v-model:open`。 |

### Slots

| 插槽名        | 参数                                          | 描述                                        |
| ------------- | --------------------------------------------- | ------------------------------------------- |
| `default`     | `{ open: boolean }`                           | 触发元素。                                  |
| `title`       | `—`                                           | 自定义标题内容，优先于 `title` 属性。       |
| `description` | `—`                                           | 自定义描述内容，优先于 `description` 属性。 |
| `footer`      | `{ confirm: () => void, cancel: () => void }` | 自定义按钮区。                              |

### Expose

| 方法      | 描述           |
| --------- | -------------- |
| `close()` | 手动关闭气泡。 |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的 Tailwind 类名：

| 键名          | 说明                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `body`        | 气泡内容列布局容器（文字区与按钮区间隔 16px）。                      |
| `header`      | 标题与描述的文字区（内部间隔 8px）。                                 |
| `title`       | 标题。                                                               |
| `description` | 描述。                                                               |
| `footer`      | 按钮区（右对齐、间隔 8px）。                                         |
| `popover`     | 透传给底层 `reborn-popover` 的 ui 对象（wrapper/content/arrow 等）。 |

```vue
<RebornPopconfirm
  title="确认操作？"
  :ui="{ title: 'font-semibold', footer: 'justify-start', popover: { content: 'rounded-lg' } }"
/>
```
