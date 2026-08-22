---
title: 按钮
description: 用于触发操作的双端按钮组件，提供颜色、变体、尺寸、加载与禁用状态。
category: 按钮
tags: [css, tailwind, button, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornButtonDemo.vue" config="RebornButtonConfig" componentId="reborn-button" :componentFiles='["RebornButton.vue", "reborn-button.config.ts"]'  :uniappFiles='["RebornButton.vue", "reborn-button.config.ts"]'}
::

## 简介

Button 是 Web 与 UniApp 双端通用的基础按钮，通过 `color`（7 种语义色）与 `variant`（`solid` / `outline` / `soft` / `subtle` 4 种变体）组合出完整的按钮体系，配合 `size`、`round` / `circle` 形状与 `loading` / `disabled` 状态覆盖常规操作场景。文本可用 `label` prop 或默认插槽传入，`leading` / `trailing` 插槽用于放置图标；UniApp 端还完整代理了小程序 `open-type` 开放能力（获取手机号、客服会话、打开授权设置等）。

适用场景：

- 表单提交、确认/取消等常规操作触发。
- 需要语义色 × 变体组合的按钮体系（如 `error` + `soft` 的删除按钮）。
- 小程序开放能力场景（`open-type` 获取手机号、客服会话等）。
- 需要 `leading` / `trailing` 插槽放置图标的图文按钮。

不适用场景：

- 页面固定位置的悬浮操作入口，改用 `reborn-fab`。
- 仅 Web 的营销风格按钮特效，改用 `gradient-button`、`ripple-button` 或 `shimmer-button`。

## 用法

### 颜色与变体

`color` 控制语义色（`primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`），`variant` 控制视觉强度：`solid` 实心、`outline` 描边、`soft` 浅色底、`subtle` 浅色底加描边。两者正交组合。

```vue
<template>
  <RebornButton color="primary">确认提交</RebornButton>
  <RebornButton color="neutral" variant="outline">取消</RebornButton>
  <RebornButton color="error" variant="soft">删除</RebornButton>
  <RebornButton color="success" variant="subtle">已完成</RebornButton>
</template>
```

### 尺寸与形状

Web 端 `size` 提供 `sm` / `md` / `lg` 三档，高度依次 **24 / 32 / 40px**，水平内边距统一 **12px**，字号依次 `text-sm` (12px) / `text-base` (14px) / `text-lg` (16px)，默认 `md`。UniApp 端仍为 `xs` ~ `2xl` 七档。

`round` 默认 `true` 呈胶囊形，传 `:round="false"` 恢复直角以便自定义圆角；`circle` 渲染圆形纯图标按钮。

```vue
<template>
  <RebornButton size="sm">小按钮</RebornButton>
  <RebornButton size="lg">大按钮</RebornButton>
  <RebornButton :round="false" class="rounded-l-full">左半胶囊</RebornButton>
  <RebornButton circle>
    <Icon name="lucide:plus" />
  </RebornButton>
</template>
```

### 加载与禁用

`loading` 为 `true` 时在前置位置显示加载动画并禁用点击（`solid` 变体下加载动画为白色，其余变体跟随 `color`）；`disabled` 直接禁用按钮。两种状态下 `click` 均不触发。

```vue
<script setup lang="ts">
const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  await save()
  submitting.value = false
}
</script>

<template>
  <RebornButton :loading="submitting" @click="onSubmit">保存</RebornButton>
  <RebornButton disabled>不可用</RebornButton>
</template>
```

### 图标插槽

`leading` / `trailing` 插槽分别渲染在文本前后，常用于放置图标；默认插槽优先于 `label` prop 渲染。`loading` 时 `leading` 被加载动画替代、`trailing` 不渲染。

```vue
<template>
  <RebornButton>
    <template #leading>
      <Icon name="lucide:mail" />
    </template>
    邮箱登录
  </RebornButton>

  <RebornButton variant="outline">
    下一步
    <template #trailing>
      <Icon name="lucide:arrow-right" />
    </template>
  </RebornButton>
</template>
```

### 小程序开放能力（UniApp）

UniApp 端通过 `openType` 及配套 props 代理原生 button 的开放能力，回调经同名事件抛出。例如获取手机号：

```vue
<template>
  <RebornButton
    open-type="getPhoneNumber"
    @getphonenumber="onGetPhone"
  >
    手机号快捷登录
  </RebornButton>
</template>

<script setup lang="ts">
function onGetPhone(e: any) {
  // e.detail.code 交由服务端换取手机号
  console.log(e.detail.code)
}
</script>
```

## API

### Props

| 属性名                    | 类型      | 默认值      | 平台   | 描述                                                                                                     |
| ------------------------- | --------- | ----------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `label`                   | `string`  | -           | 通用   | 按钮文本内容；提供默认插槽时被插槽内容覆盖。                                                             |
| `color`                   | `string`  | `'primary'` | 通用   | 语义色。可选值：`primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`。               |
| `variant`                 | `string`  | `'solid'`   | 通用   | 视觉变体。可选值：`solid`（实心）, `outline`（描边）, `soft`（浅底）, `subtle`（浅底加描边）。           |
| `size`                    | `string`  | `'md'`      | 通用   | 尺寸。Web：`sm`(24px) / `md`(32px) / `lg`(40px)，水平内边距统一 12px；UniApp：`xs`~`2xl` 七档。          |
| `borderStyle`             | `string`  | `'solid'`   | Web    | 边框线型。可选值：`solid`（实线）/ `dashed`（虚线）；宽度固定 1px，对有边框的 `outline` / `subtle` 变体生效。 |
| `loading`                 | `boolean` | `false`     | 通用   | 是否加载中；显示加载动画并禁用点击。                                                                     |
| `disabled`                | `boolean` | `false`     | 通用   | 是否禁用按钮。                                                                                           |
| `round`                   | `boolean` | `true`      | 通用   | 是否为胶囊形状（rounded-full）；自定义圆角时须显式传 `false`。                                           |
| `circle`                  | `boolean` | `false`     | 通用   | 是否为圆形纯图标按钮（宽高相等、内边距归零）。                                                           |
| `gap`                     | `boolean` | `false`     | 通用   | 是否间隔按钮：为相邻的同级按钮自动添加左边距。                                                           |
| `ui`                      | `object`  | -           | 通用   | 细粒度样式覆盖对象，键位见下方「自定义样式（ui）」。                                                     |
| `class`                   | `any`     | -           | Web    | 追加到根元素的自定义类名。                                                                               |
| `customClass`             | `any`     | -           | UniApp | 追加到根节点的自定义类名（对应 Web 端 `class`）。                                                        |
| `fluid`                   | `boolean` | `false`     | UniApp | 是否为 flex-1 布局。                                                                                     |
| `block`                   | `boolean` | `false`     | UniApp | 是否块级元素。                                                                                           |
| `hoverClass`              | `string`  | -           | UniApp | 按钮点击态样式类。                                                                                       |
| `hoverStopPropagation`    | `boolean` | -           | UniApp | 是否阻止点击态冒泡。                                                                                     |
| `hoverStartTime`          | `number`  | `20`        | UniApp | 按住后出现点击态的延迟时间，单位毫秒。                                                                   |
| `hoverStayTime`           | `number`  | `70`        | UniApp | 手指松开后点击态保留时间，单位毫秒。                                                                     |
| `formType`                | `string`  | -           | UniApp | 表单提交类型（`submit` / `reset`），配合 form 组件使用。                                                 |
| `openType`                | `string`  | -           | UniApp | 小程序开放能力类型（`contact` / `getPhoneNumber` / `openSetting` / `launchApp` 等），回调见 Emits。      |
| `lang`                    | `string`  | -           | UniApp | 返回用户信息的语言。                                                                                     |
| `sessionFrom`             | `string`  | -           | UniApp | `open-type="contact"` 时的会话来源。                                                                     |
| `sendMessageTitle`        | `string`  | -           | UniApp | `open-type="contact"` 时的会话内消息卡片标题。                                                           |
| `sendMessagePath`         | `string`  | -           | UniApp | `open-type="contact"` 时的会话内消息卡片路径。                                                           |
| `sendMessageImg`          | `string`  | -           | UniApp | `open-type="contact"` 时的会话内消息卡片图片。                                                           |
| `showMessageCard`         | `boolean` | -           | UniApp | `open-type="contact"` 时是否显示会话内消息卡片。                                                         |
| `appParameter`            | `string`  | -           | UniApp | `open-type="launchApp"` 打开 APP 时向 APP 传递的参数。                                                   |
| `groupId`                 | `string`  | -           | UniApp | 群 ID（QQ 开放能力）。                                                                                   |
| `guildId`                 | `string`  | -           | UniApp | 频道/公会 ID（QQ 开放能力）。                                                                            |
| `publicId`                | `string`  | -           | UniApp | 公众号 ID（QQ 开放能力）。                                                                               |
| `phoneNumberNoQuotaToast` | `boolean` | -           | UniApp | 获取手机号失败（额度不足）时是否弹出错误提示。                                                           |
| `createliveactivity`      | `boolean` | -           | UniApp | 是否创建直播活动。                                                                                       |

### Emits

| 事件名                      | 回调参数         | 平台   | 描述                                                                                            |
| --------------------------- | ---------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `click`                     | `(e: Event)`     | 通用   | 点击按钮时触发；`disabled` 或 `loading` 时不触发（Web 端为原生 click 透传）。                   |
| `tap`                       | `(e: Event)`     | UniApp | 与 `click` 同时派发，便于沿用 uniapp `@tap` 写法。                                              |
| `getuserinfo`               | `(e: UniEvent)`  | UniApp | `open-type="getUserInfo"` 时触发，`e.detail` 含 `userInfo` 等用户信息。                         |
| `contact`                   | `(e: UniEvent)`  | UniApp | `open-type="contact"` 客服会话回调，`e.detail.path` / `query` 为小程序消息参数。                |
| `getphonenumber`            | `(e: UniEvent)`  | UniApp | `open-type="getPhoneNumber"` 时触发，`e.detail.code` 用于服务端换取手机号。                     |
| `error`                     | `(e: UniEvent)`  | UniApp | 使用开放能力发生错误时触发，`e.detail` 含错误信息。                                             |
| `opensetting`               | `(e: UniEvent)`  | UniApp | `open-type="openSetting"` 打开授权设置页后回调，`e.detail.authSetting` 为授权结果。             |
| `launchapp`                 | `(e: UniEvent)`  | UniApp | `open-type="launchApp"` 打开 APP 成功时触发，参数经 `appParameter` 传给 APP。                   |
| `chooseavatar`              | `(e: UniEvent)`  | UniApp | `open-type="chooseAvatar"`（微信）时触发，`e.detail.avatarUrl` 为所选头像临时路径。             |
| `chooseaddress`             | `(e: UniEvent)`  | UniApp | `open-type="chooseAddress"`（QQ）用户选择收货地址后回调，`e.detail` 含地址信息。                |
| `chooseinvoicetitle`        | `(e: UniEvent)`  | UniApp | `open-type="chooseInvoiceTitle"`（QQ）用户选择发票抬头后回调。                                  |
| `addgroupapp`               | `(e: UniEvent)`  | UniApp | `open-type="addGroupApp"`（QQ）添加群应用后回调。                                               |
| `subscribe`                 | `(e: UniEvent)`  | UniApp | `open-type="subscribe"`（QQ）订阅号订阅结果回调。                                               |
| `login`                     | `(e: UniEvent)`  | UniApp | `open-type="login"`（QQ）登录回调，`e.detail` 含登录 code。                                     |
| `getrealtimephonenumber`    | `(e: UniEvent)`  | UniApp | `open-type="getRealtimePhoneNumber"`（微信）实时手机号验证回调，`e.detail.code` 换取手机号。    |
| `agreeprivacyauthorization` | `(e: UniEvent)`  | UniApp | `open-type="agreePrivacyAuthorization"`（微信）用户同意隐私协议后回调。                         |

### Slots

| 插槽名     | 作用域参数                                     | 描述                                                          |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------- |
| `leading`  | `{ ui }`（UniApp 额外含 `loading: boolean`）   | 前置内容（常放图标）；`loading` 时被加载动画替代。            |
| `default`  | `{ ui }`                                       | 按钮主体内容，优先于 `label` prop 渲染。                      |
| `trailing` | `{ ui }`                                       | 后置内容（常放图标）；`loading` 时不渲染。                    |

### 自定义样式（ui）

`ui` 属性按内部结构键覆盖对应节点的类名，两端键位不同：

| 键名                | 平台   | 说明                             |
| ------------------- | ------ | -------------------------------- |
| `base`              | 通用   | 根元素。                         |
| `label`             | 通用   | 文本节点。                       |
| `leadingIcon`       | Web    | 前置图标区域（含加载动画容器）。 |
| `leadingAvatar`     | Web    | 前置头像区域。                   |
| `leadingAvatarSize` | Web    | 前置头像尺寸。                   |
| `trailingIcon`      | Web    | 后置图标区域。                   |
| `inner`             | UniApp | 内层原生 button 元素。           |
| `loading`           | UniApp | 加载动画容器。                   |

### CSS 变量

两端各有独立的高度令牌，互不影响。

**Web 端**（`app/assets/theme/typography.css`，固定 px）：

| 变量名                | 对应 size | 值      |
| :-------------------- | :-------- | :------ |
| `--height-button-sm`  | `sm`      | `24px`  |
| `--height-button-md`  | `md`      | `32px`  |
| `--height-button-lg`  | `lg`      | `40px`  |

**UniApp 端**（`packages/uniapp-project/src/styles/theme.css`，rpx，随屏宽响应式）：

| 变量名                 | 对应 size | 移动端值 (默认) | 桌面端值 (min-width: 768rpx) |
| :--------------------- | :-------- | :-------------- | :--------------------------- |
| `--button-2xl-height`  | `2xl`     | `96rpx`         | `48rpx`                      |
| `--button-xl-height`   | `xl`      | `86rpx`         | `43rpx`                      |
| `--button-lg-height`   | `lg`      | `76rpx`         | `38rpx`                      |
| `--button-md-height`   | `md`      | `64rpx`         | `32rpx`                      |
| `--button-sm-height`   | `sm`      | `56rpx`         | `28rpx`                      |
| `--button-xs-height`   | `xs`      | `48rpx`         | `24rpx`                      |

## 注意事项

- Web 与 UniApp 双端可用；`openType` 系列 props（`sessionFrom` / `appParameter` 等）与 `getphonenumber`、`contact` 等事件仅在小程序开放能力场景生效，各能力对小程序平台的支持范围以对应平台文档为准。
- `round` 默认 `true`（胶囊形状），需要直角或自定义圆角（如按钮组拼接）时须显式传 `:round="false"`。
- `loading` 为 `true` 时按钮同时被禁用，`click` / `tap` 不会触发；`solid` 变体下加载动画为白色，其余变体跟随 `color`。
- UniApp 端点击态由 `hoverClass` / `hoverStartTime` / `hoverStayTime` 控制；Web 端悬停态由变体样式内置。
- 自定义类名两端命名不同：Web 用 `class`，UniApp 用 `customClass`；`ui` 覆盖键位也不同（见上表）。
- 处于表单组（FieldGroup）内时，按钮尺寸会被组尺寸覆盖，UniApp 端禁用状态也随组联动。
