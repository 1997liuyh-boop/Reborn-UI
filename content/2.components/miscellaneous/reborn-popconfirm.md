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

Popconfirm 是锚定在触发元素上的小型确认气泡：点击触发器弹出，点确认或取消按钮触发对应事件并关闭，点击气泡外部同样关闭。它把「确认一下」这一步留在操作原位，用户不必把视线移到屏幕中央。

组件由 `reborn-popover`（`mode="click"`）负责定位与显隐，按钮复用 `reborn-button` 的 sm 档，本身只负责气泡里的文字区与按钮区。因此定位口径、翻转规则与 `reborn-tooltip` 一致，`ui.popover` 可以直接透传到底层气泡。

本组件**仅 Web 端提供**，UniApp 端没有对应实现（`packages/uniapp-project` 下无 `reborn-popconfirm` 目录），下方 API 无需区分平台。

### 何时使用

- 删除单条数据、移除成员、退出编辑等可撤销或影响范围小的操作：确认就在按钮旁边，打断感比弹窗低。
- 需要一句提醒加一次点击的场景：标题加描述两行文字就能讲清楚后果。

### 何时不使用

- 高风险、不可逆或需要展示较多上下文的确认：改用 `reborn-dialog`，模态遮罩能挡住其他操作，也放得下更多说明。
- 气泡里只展示内容、不需要确认：改用 `reborn-popover`；纯文字提示改用 `reborn-tooltip`。

## 用法

### 基础用法

默认插槽放触发器，气泡默认在触发器上方居中弹出并带箭头。省略 `description` 时只显示标题；`title` 与 `description` 都不传时文字区整块不渲染，不会留下空隙。

```vue
<template>
  <RebornPopconfirm
    title="确定删除这条数据吗？"
    description="删除后不可恢复，关联的引用也会一并失效。"
    @confirm="remove"
    @cancel="onCancel"
  >
    <RebornButton size="sm" variant="outlined" color="error">删除</RebornButton>
  </RebornPopconfirm>

  <RebornPopconfirm title="确认提交本次修改？" @confirm="submit">
    <RebornButton size="sm">仅标题</RebornButton>
  </RebornPopconfirm>
</template>
```

`title` 为 14px 标题色（gray-10）、字重 500，`description` 为 14px 辅助色（gray-8），两者间隔 8px；按钮区与文字区间隔 16px，按钮彼此间隔 8px、右对齐。气泡内边距 12px，宽度随内容伸缩，限制在 244px 到 280px 之间。

### 弹出方位：placement 十二向

`placement` 取值与 `reborn-tooltip` 完全一致，默认 `'top'`：四个方向各带 `-start` / `-end` 对齐，共 12 种。`sideOffset` 控制气泡与触发器的间距（默认 8px），`arrow` 控制是否显示箭头（默认显示）。

```vue
<template>
  <RebornPopconfirm title="确定执行该操作吗？" placement="bottom-start" :side-offset="12" :arrow="false">
    <RebornButton size="sm">底部弹出</RebornButton>
  </RebornPopconfirm>
</template>
```

定位口径与 `reborn-tooltip` 共用同一套实现：主轴放不下时翻到对侧，对侧同样放不下就保持原方向，因为翻过去只会换个方向继续溢出；交叉轴则把气泡挪回视口内，但始终与触发器保持至少 12px 交叠，触发器滚出视口时气泡跟着一起走，不会被钉在屏幕边缘。箭头落点按 `placement` 的对齐档位固定：`-start` / `-end` 停在气泡两端 17px 处，只有居中档才指向触发器中心。

::tip
旧的 `content` 对象写法（`{ side, align, sideOffset }`）仍然可用，等价于 `placement` + `sideOffset`。传了 `placement` 时方向与对齐以 `placement` 为准；但未传 `sideOffset` 时仍会读取 `content.sideOffset`。新代码请使用 `placement` / `sideOffset`。
::

### 按钮定制：文案、语义色与隐藏取消

确认按钮为 `filled` 变体，`confirmColor` 默认 `primary`；取消按钮为 `outlined` 变体，`cancelColor` 默认 `neutral`。`confirmText` / `cancelText` 替换文案，`hideCancel` 只留确认按钮，适合「知道了」这类单向告知。

```vue
<template>
  <RebornPopconfirm
    title="确定移除该成员吗？"
    description="移除后对方将立即失去项目访问权限。"
    confirm-color="error"
    confirm-text="移除"
    cancel-text="再想想"
  >
    <RebornButton size="sm" variant="outlined" color="error">危险操作</RebornButton>
  </RebornPopconfirm>

  <RebornPopconfirm title="已阅读并知晓以上提醒？" hide-cancel confirm-text="知道了">
    <RebornButton size="sm" variant="outlined" color="neutral">仅确认</RebornButton>
  </RebornPopconfirm>
</template>
```

### 异步确认：loading 与 v-model:open

`loading` 为 `true` 时确认按钮进入加载态（同时禁用，不能重复点击），点击确认也不再自动关闭气泡；配合 `v-model:open` 在异步完成后手动收起。

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
    title="确定删除所选的 3 项吗？"
    description="删除请求完成前请勿关闭页面。"
    :loading="loading"
    confirm-color="error"
    confirm-text="删除"
    @confirm="onConfirm"
  >
    <RebornButton size="sm" variant="outlined" color="error">异步删除</RebornButton>
  </RebornPopconfirm>
</template>
```

组件在触发 `confirm` 后等待一个 tick 再读取 `loading`，所以 `loading.value = true` 必须在 `confirm` 回调里同步设置，不能放到 `await` 之后，否则气泡会先关闭。取消按钮与点击外部不受 `loading` 影响，加载中也能关闭气泡。

### 自定义内容：标题与按钮区插槽

`title` / `description` 插槽优先于同名属性；`footer` 插槽整体接管按钮区，作用域参数提供 `confirm` / `cancel` 回调，调用后同样会触发对应事件，并按 `loading` 规则关闭气泡。

```vue
<template>
  <RebornPopconfirm description="发布后将对全部用户可见，可随时在后台下线。">
    <template #title>
      <span class="inline-flex items-center gap-[4px]">
        <span class="icon-[lucide--rocket] size-[14px] text-primary" />
        确认发布新版本？
      </span>
    </template>
    <RebornButton size="sm">自定义标题</RebornButton>
  </RebornPopconfirm>

  <RebornPopconfirm title="对本次改动满意吗？">
    <template #footer="{ confirm, cancel }">
      <RebornButton size="sm" variant="text" color="neutral" @click="cancel">不满意</RebornButton>
      <RebornButton size="sm" variant="soft" color="success" @click="confirm">满意</RebornButton>
    </template>
    <RebornButton size="sm" variant="outlined" color="neutral">自定义按钮区</RebornButton>
  </RebornPopconfirm>
</template>
```

使用 `footer` 插槽后，`confirmText` / `cancelText` / `confirmColor` / `cancelColor` / `hideCancel` / `loading` 的按钮渲染都不再生效，按钮样式与加载态需要在插槽里自行处理；`loading` 仍然决定调用 `confirm()` 后是否自动关闭。

## API

### Props

| 属性名         | 类型                                                  | 默认值      | 描述                                                                                                          |
| :------------- | :---------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------ |
| `title`        | `string`                                              | -           | 标题文字，14px 标题色（gray-10）                                                                              |
| `description`  | `string`                                              | -           | 描述文字，14px 辅助色（gray-8），与标题间隔 8px                                                               |
| `confirmText`  | `string`                                              | `'确定'`    | 确认按钮文字                                                                                                  |
| `cancelText`   | `string`                                              | `'取消'`    | 取消按钮文字                                                                                                  |
| `confirmColor` | `ButtonProps['color']`                                | `'primary'` | 确认按钮语义色，取值同按钮组件                                                                                |
| `cancelColor`  | `ButtonProps['color']`                                | `'neutral'` | 取消按钮语义色，取值同按钮组件                                                                                |
| `hideCancel`   | `boolean`                                             | `false`     | 隐藏取消按钮，仅保留确认                                                                                      |
| `loading`      | `boolean`                                             | `false`     | 确认按钮加载中；加载时点击确认不会自动关闭气泡，配合 `v-model:open` 做异步确认                               |
| `placement`    | `PopconfirmPlacement`                                 | `'top'`     | 出现方向与对齐方式，取值与 `reborn-tooltip` 一致                                                              |
| `sideOffset`   | `number`                                              | `8`         | 气泡与触发器的间距（px）；未传时依次回落到 `content.sideOffset`、8                                           |
| `content`      | `PopoverContentProps`                                 | -           | 已废弃：旧的定位对象写法（`side` / `align` / `sideOffset`），等价于 `placement` + `sideOffset`，仅为兼容保留 |
| `arrow`        | `boolean`                                             | `true`      | 是否显示指向触发器的箭头                                                                                      |
| `portal`       | `boolean \| string`                                   | `true`      | 传送目标，`true` 传送到 body，字符串为目标选择器，`false` 表示原地渲染                                       |
| `dismissible`  | `boolean`                                             | `true`      | 点击气泡外部是否关闭                                                                                          |
| `open`         | `boolean`                                             | -           | 受控显隐，对应 `v-model:open`；不传时由组件内部维护                                                           |
| `defaultOpen`  | `boolean`                                             | `false`     | 非受控模式的初始显隐                                                                                          |
| `class`        | `ClassValue`                                          | -           | 追加到触发器外层容器（底层 Popover 的 `wrapper` 节点）的类名                                                 |
| `ui`           | `PopconfirmUi & { popover?: PopoverProps['ui'] }`     | -           | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                                  |

### Emits

| 事件名        | 回调参数          | 描述                                                              |
| :------------ | :---------------- | :---------------------------------------------------------------- |
| `confirm`     | -                 | 点击确认按钮（或调用 `footer` 插槽的 `confirm`）时触发            |
| `cancel`      | -                 | 点击取消按钮（或调用 `footer` 插槽的 `cancel`）时触发；点击外部关闭不触发 |
| `update:open` | `(open: boolean)` | 显隐变化时触发，对应 `v-model:open`                               |

### Slots

| 插槽名        | 作用域参数                                    | 描述                                                  |
| :------------ | :-------------------------------------------- | :---------------------------------------------------- |
| `default`     | `{ open: boolean }`                           | 触发元素，`open` 为当前气泡是否展开                   |
| `title`       | -                                             | 自定义标题内容，优先于 `title` 属性                   |
| `description` | -                                             | 自定义描述内容，优先于 `description` 属性             |
| `footer`      | `{ confirm: () => void; cancel: () => void }` | 自定义按钮区，整体替换默认的取消 / 确认按钮           |

### Expose

| 方法名  | 签名         | 描述                                               |
| :------ | :----------- | :------------------------------------------------- |
| `close` | `() => void` | 手动关闭气泡，受控与非受控模式都生效；只触发 `update:open`，不触发 `confirm` / `cancel`   |

### 自定义样式（ui）

`ui` 按结构键把类名合并到对应节点（经 `tv` 合并，冲突的 Tailwind 类以传入值为准）。前五个键与 `reborn-popconfirm.config.ts` 的 slots 一一对应；`popover` 是额外的透传键，整体交给底层 `reborn-popover` 的 `ui`。

| 键名          | 对应节点                                           | 默认 class                                                                                                                                                               | 渲染条件                                                    |
| :------------ | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| `body`        | 气泡内容根节点（`data-popconfirm`）                | `flex w-max min-w-[244px] max-w-[280px] flex-col gap-[16px]`                                                                                                            | 随气泡内容渲染                                              |
| `header`      | 文字区，包裹标题与描述                             | `flex flex-col gap-[8px]`                                                                                                                                                | `title` / `description` 属性或同名插槽至少有一个            |
| `title`       | 标题（`data-popconfirm-title`）                    | `text-base font-medium text-gray-10`                                                                                                                                     | 传了 `title` 属性或 `title` 插槽                            |
| `description` | 描述（`data-popconfirm-description`）              | `text-base text-gray-8`                                                                                                                                                  | 传了 `description` 属性或 `description` 插槽                |
| `footer`      | 按钮区（`data-popconfirm-footer`）                 | `flex items-center justify-end gap-[8px]`                                                                                                                                | 始终渲染；有 `footer` 插槽时内容由插槽接管                  |
| `popover`     | 底层气泡的 ui 对象（`wrapper` / `trigger` / `contentWrapper` / `content` / `arrow` / `bridge` / `mask`） | 由 `reborn-popover` 定义；组件额外给 `content` 写入 `p-[12px]` 与四周柔光阴影 `shadow-[0_0_8px_rgb(0_0_0/0.12),0_8px_24px_rgb(0_0_0/0.12)]` | 各子键按底层 Popover 的规则渲染；`popover.content` 排在组件默认值之后合并 |

```vue
<template>
  <RebornPopconfirm
    title="确认操作？"
    :ui="{
      title: 'font-semibold',
      footer: 'justify-start',
      popover: { content: 'rounded-xl', trigger: 'w-full' },
    }"
  >
    <RebornButton size="sm">确认操作</RebornButton>
  </RebornPopconfirm>
</template>
```

## 注意事项

- 触发方式固定为点击，不支持悬停触发；再次点击触发器会收起气泡。点击气泡内部不会关闭，只有按钮、点击外部（`dismissible` 为 `true` 时）、`v-model:open` 或 `close()` 能关闭。
- 点击外部关闭只会更新 `open`，不会触发 `cancel`；需要区分「主动取消」与「点外面收起」时，只在 `cancel` 里处理取消逻辑。
- `loading` 只拦截确认按钮的自动关闭：加载中点击取消或点击外部仍会关闭气泡，异步请求需要自行处理中途关闭的情况，必要时把 `dismissible` 设为 `false`。
- 组件在 `confirm` 事件后等待一个 tick 再读取 `loading`，因此 `loading` 必须在 `confirm` 回调里同步置为 `true`；放到 `await` 之后读到的仍是旧值，气泡会先关闭。
- `open` 的默认值是 `undefined` 而非 `false`：未绑定 `v-model:open` 时由底层气泡自行维护显隐，`defaultOpen` 才会生效；绑定后以外部值为准。
- 用 `footer` 插槽接管按钮区后，内置的按钮文案、配色、`hideCancel` 与加载态都不再渲染，需要在插槽里自己实现。
- `class` 挂在触发器外层的 `wrapper` 节点（默认 `relative inline-block`）上，不作用于气泡；调整气泡样式请用 `ui.popover.content`，调整触发区宽度（例如让按钮占满栅格）请同时给 `class` 与 `ui.popover.trigger` 传 `w-full`。
- 气泡默认传送到 `body`，处于滚动容器或 `overflow: hidden` 的祖先中时也不会被裁切；`portal` 设为 `false` 原地渲染时则受祖先裁切影响。
