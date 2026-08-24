---
title: 按钮
description: 双端基础按钮：7 种语义色 × 5 种变体，支持尺寸、形状、加载与禁用状态。
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

Button 是 Reborn UI 中最基础的操作触发组件，Web 与 UniApp 两端同名同构。

它的样式体系由两个正交维度构成：`color` 决定**语义**（这个操作是主要的、危险的还是中性的），`variant` 决定**视觉强度**（这个操作在当前界面里有多突出）。7 种语义色 × 5 种变体覆盖了从主行动按钮到轻量文字链接的完整强度梯度，无需为每种场景单独定制样式。

在此之上，`size` / `round` / `circle` 控制形态，`loading` / `disabled` 控制状态，`leading` / `trailing` 插槽承载图标。UniApp 端额外完整代理了小程序原生 `button` 的开放能力（获取手机号、客服会话、打开授权设置等），因此同一套 API 可以同时服务 H5 与各端小程序。

### 何时使用

- 表单提交、确认 / 取消、保存等常规操作触发。
- 需要按强度分层的按钮体系：主操作用 `solid`，次操作用 `outline`，弱操作用 `text`。
- 需要语义色表达操作后果，例如删除用 `error`、完成用 `success`。
- 需要图文按钮，通过 `leading` / `trailing` 插槽放置图标。
- 小程序开放能力场景，通过 `openType` 触发原生能力。

### 何时不使用

- 页面固定位置的悬浮操作入口 —— 改用 `reborn-fab`。
- 仅 Web 的营销风格按钮特效 —— 改用 `gradient-button`、`ripple-button` 或 `shimmer-button`。
- 纯跳转、无副作用的导航链接 —— 优先使用链接语义元素，而非按钮。

## 用法

### 基础用法

文本可以通过 `label` prop 传入，也可以用默认插槽。两者同时存在时**默认插槽优先**，`label` 被忽略。

```vue
<template>
  <!-- 两种写法等价 -->
  <RebornButton label="确认提交" />
  <RebornButton>确认提交</RebornButton>
</template>
```

### 颜色与变体

`color` 控制语义色，`variant` 控制视觉强度，两者自由组合：

| 变体 | 外观 | 典型用途 |
| --- | --- | --- |
| `solid` | 实心填充，白色文字 | 页面主行动（每屏建议只有一个） |
| `outline` | 透明底 + 1px 描边 | 次级操作，如「取消」 |
| `soft` | 10% 透明度浅色底，无边框 | 并列的多个同级操作 |
| `subtle` | 浅色底 + 同色描边 | 需要比 `soft` 更明确边界的场景 |
| `text` | 无背景无边框，高度与内边距归零 | 表格行内操作、辅助链接 |

```vue
<template>
  <RebornButton color="primary">确认提交</RebornButton>
  <RebornButton color="neutral" variant="outline">取消</RebornButton>
  <RebornButton color="error" variant="soft">删除</RebornButton>
  <RebornButton color="success" variant="subtle">已完成</RebornButton>
  <RebornButton color="primary" variant="text">查看详情</RebornButton>
</template>
```

::tip
`text` 变体通过 `!h-auto !px-0` 覆盖了 `size` 的固定高度与水平内边距，所以它的占位完全由文字撑开，可以安全地嵌在文本流或表格单元格里。
::

Web 端可用 `borderStyle="dashed"` 把边框改为虚线，仅对渲染了边框的 `outline` / `subtle` 生效（边框宽度固定 1px）。

```vue
<template>
  <RebornButton variant="outline" border-style="dashed">添加字段</RebornButton>
</template>
```

### 尺寸

两端的尺寸档位不同，这是为适配各自的输入精度与屏幕密度而有意分化的。

**Web 端**三档，高度固定 px，水平内边距统一 12px：

| `size` | 高度 | 字号 |
| --- | --- | --- |
| `sm` | 24px | `text-sm`（12px） |
| `md`（默认） | 32px | `text-base`（14px） |
| `lg` | 40px | `text-lg`（16px） |

**UniApp 端**七档，高度用 `rpx` 随屏宽缩放，水平内边距与圆角同步递进：

| `size` | 高度 | 水平内边距 | 字号 | 直角圆角 |
| --- | --- | --- | --- | --- |
| `xs` | 48rpx | 12rpx | 22rpx | 6px |
| `sm` | 56rpx | 12rpx | 24rpx | 6px |
| `default` | 64rpx | 16rpx | 26rpx | 8px |
| `md`（默认） | 64rpx | 16rpx | 26rpx | 8px |
| `lg` | 76rpx | 24rpx | 28rpx | 10px |
| `xl` | 86rpx | 24rpx | 30rpx | 12px |
| `2xl` | 96rpx | 24rpx | 32rpx | 14px |

`default` 与 `md` 完全等价，前者保留用于对齐旧代码。

```vue
<template>
  <RebornButton size="sm">小按钮</RebornButton>
  <RebornButton size="md">中按钮</RebornButton>
  <RebornButton size="lg">大按钮</RebornButton>
</template>
```

### 形状

`round` 默认为 `true`，按钮呈胶囊形（`rounded-full`）。需要直角或自定义圆角时**必须显式传 `:round="false"`**，否则圆角类会被 `rounded-full` 覆盖。

`circle` 渲染正方形纯图标按钮：Web 端通过 `!aspect-square !w-auto !p-0` 实现，UniApp 端按 `size` 匹配等宽令牌。

```vue
<template>
  <!-- 默认胶囊 -->
  <RebornButton>胶囊按钮</RebornButton>

  <!-- 关掉胶囊才能自定义圆角 -->
  <RebornButton :round="false" class="rounded-md">直角按钮</RebornButton>

  <!-- 圆形图标按钮 -->
  <RebornButton circle>
    <Icon name="lucide:plus" />
  </RebornButton>
</template>
```

### 加载与禁用

`loading` 为 `true` 时按钮**同时被禁用**，`click` / `tap` 不再触发。加载动画的颜色随变体走：`solid` 下为白色，其余变体跟随 `color`。

- Web 端动画尺寸为 `1.25em`，跟随当前字号自动缩放。
- UniApp 端动画尺寸按 `size` 取固定值（22 / 24 / 26 / 26 / 28 / 30 / 32）。
- 非 `circle` 时动画出现在前置位置并顶掉 `leading` 插槽；`circle` 时动画替换按钮主体内容。
- 两种状态下 `trailing` 插槽都不渲染。

```vue
<script setup lang="ts">
const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    await save()
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <RebornButton :loading="submitting" @click="onSubmit">
    {{ submitting ? '保存中' : '保存' }}
  </RebornButton>
  <RebornButton disabled>不可用</RebornButton>
</template>
```

### 图标插槽

`leading` / `trailing` 分别渲染在主体内容前后。

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

Web 端未显式设置尺寸的 `svg` 会被自动约束为 `size-4`（16px），因此多数图标库可以直接放入而无需额外调尺寸。

### 布局：块级与间隔

`gap` 为 `true` 时，紧邻在另一个 `.reborn-button` 之后的按钮会自动获得 8px 左边距，适合按钮组不想手写 `space-x` 的场景。

UniApp 端额外提供 `block`：为 `true` 时按钮占满整行（`flex w-full`），为 `false` 时为 `inline-flex`。

```vue
<template>
  <!-- 自动间隔 -->
  <RebornButton gap>上一步</RebornButton>
  <RebornButton gap>下一步</RebornButton>

  <!-- UniApp：整行按钮 -->
  <RebornButton block size="lg">立即支付</RebornButton>
</template>
```

### 与表单组联动

按钮处于 `RebornForm` 内时会自动继承表单级配置：

- **尺寸**：Web 为 `FormItem` > `Form` > 自身 `size` 三级回退；UniApp 为 `Form` > 自身 `size`。
- **禁用**：UniApp 端 `Form` 的 `disabled` 会强制禁用组内按钮；Web 端按钮的禁用态只由自身 `disabled` / `loading` 决定。

```vue
<template>
  <RebornForm size="lg" :disabled="readonly">
    <!-- 自动变为 lg 尺寸 -->
    <RebornButton form-type="submit">提交</RebornButton>
  </RebornForm>
</template>
```

### 小程序开放能力（UniApp）

UniApp 端在容器内叠了一个透明的原生 `button` 作为点击层，因此可以在保留自定义样式的同时完整代理小程序开放能力。传入 `openType` 后，回调经同名事件抛出。

```vue
<script setup lang="ts">
function onGetPhone(e: any) {
  // e.detail.code 交由服务端换取真实手机号
  console.log(e.detail.code)
}

function onError(e: any) {
  console.warn('开放能力调用失败', e.detail)
}
</script>

<template>
  <RebornButton
    open-type="getPhoneNumber"
    @getphonenumber="onGetPhone"
    @error="onError"
  >
    手机号快捷登录
  </RebornButton>
</template>
```

::warning
各开放能力对具体小程序平台（微信 / QQ / 支付宝等）的支持范围、以及是否需要资质与用户授权，均以对应平台官方文档为准。组件只负责透传，不做能力降级。
::

## API

### Props

#### 通用（Web / UniApp 一致）

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | - | 按钮文本；提供默认插槽时被插槽内容覆盖。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 语义色。 |
| `variant` | `'solid' \| 'outline' \| 'soft' \| 'subtle' \| 'text'` | `'solid'` | 视觉变体，含义见「颜色与变体」。 |
| `size` | Web：`'sm' \| 'md' \| 'lg'`<br>UniApp：`'xs' \| 'sm' \| 'default' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | 尺寸；处于表单组内时被组尺寸覆盖。 |
| `loading` | `boolean` | `false` | 是否加载中；显示加载动画并同时禁用点击。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `round` | `boolean` | `true` | 是否为胶囊形状；自定义圆角时须显式传 `false`。 |
| `circle` | `boolean` | `false` | 是否为正方形纯图标按钮（内边距归零）。 |
| `gap` | `boolean` | `false` | 紧邻上一个按钮时自动添加 8px 左边距。 |
| `ui` | `object` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

#### Web 专属

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `class` | `any` | - | 追加到根元素的自定义类名。 |
| `borderStyle` | `'solid' \| 'dashed'` | `'solid'` | 边框线型；宽度固定 1px，仅对 `outline` / `subtle` 生效。 |

#### UniApp 专属

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `customClass` | `any` | - | 追加到根节点的自定义类名（对应 Web 端 `class`）。 |
| `block` | `boolean` | `false` | 是否占满整行（`flex w-full`），否则为 `inline-flex`。 |
| `fluid` | `boolean` | `false` | 预留的 flex-1 布局开关，当前版本尚未接入样式，暂无视觉效果。 |
| `hoverClass` | `string` | - | 按钮点击态样式类。 |
| `hoverStopPropagation` | `boolean` | - | 是否阻止点击态冒泡。 |
| `hoverStartTime` | `number` | `20` | 按住后出现点击态的延迟，单位毫秒。 |
| `hoverStayTime` | `number` | `70` | 松手后点击态保留时长，单位毫秒。 |
| `formType` | `'submit' \| 'reset'` | - | 表单提交类型，配合 form 组件使用。 |
| `openType` | `string` | - | 小程序开放能力类型（`contact` / `getPhoneNumber` / `openSetting` / `launchApp` / `chooseAvatar` 等），回调见 Emits。 |
| `lang` | `string` | - | 返回用户信息的语言。 |
| `sessionFrom` | `string` | - | `openType="contact"` 时的会话来源。 |
| `sendMessageTitle` | `string` | - | `openType="contact"` 时的会话内消息卡片标题。 |
| `sendMessagePath` | `string` | - | `openType="contact"` 时的会话内消息卡片路径。 |
| `sendMessageImg` | `string` | - | `openType="contact"` 时的会话内消息卡片图片。 |
| `showMessageCard` | `boolean` | - | `openType="contact"` 时是否显示会话内消息卡片。 |
| `appParameter` | `string` | - | `openType="launchApp"` 时向 APP 传递的参数。 |
| `groupId` | `string` | - | 群 ID（QQ 开放能力）。 |
| `guildId` | `string` | - | 频道 / 公会 ID（QQ 开放能力）。 |
| `publicId` | `string` | - | 公众号 ID（QQ 开放能力）。 |
| `phoneNumberNoQuotaToast` | `boolean` | - | 获取手机号因额度不足失败时，是否弹出错误提示。 |
| `createliveactivity` | `boolean` | - | 是否创建直播活动。 |

### Emits

| 事件名 | 回调参数 | 平台 | 描述 |
| --- | --- | --- | --- |
| `click` | `(e: Event)` | 通用 | 点击时触发；`disabled` 或 `loading` 时不触发。Web 端为原生 click 透传。 |
| `tap` | `(e: UniEvent)` | UniApp | 与 `click` 同时派发，便于沿用 `@tap` 写法。 |
| `getphonenumber` | `(e: UniEvent)` | UniApp | `openType="getPhoneNumber"`，`e.detail.code` 用于服务端换取手机号。 |
| `getrealtimephonenumber` | `(e: UniEvent)` | UniApp | `openType="getRealtimePhoneNumber"`（微信）实时手机号验证回调。 |
| `getuserinfo` | `(e: UniEvent)` | UniApp | `openType="getUserInfo"`，`e.detail` 含 `userInfo` 等。 |
| `contact` | `(e: UniEvent)` | UniApp | `openType="contact"` 客服会话回调，`e.detail.path` / `query` 为消息参数。 |
| `opensetting` | `(e: UniEvent)` | UniApp | `openType="openSetting"` 打开授权设置页后回调，`e.detail.authSetting` 为授权结果。 |
| `launchapp` | `(e: UniEvent)` | UniApp | `openType="launchApp"` 打开 APP 成功时触发。 |
| `chooseavatar` | `(e: UniEvent)` | UniApp | `openType="chooseAvatar"`（微信），`e.detail.avatarUrl` 为所选头像临时路径。 |
| `chooseaddress` | `(e: UniEvent)` | UniApp | `openType="chooseAddress"`（QQ）选择收货地址后回调。 |
| `chooseinvoicetitle` | `(e: UniEvent)` | UniApp | `openType="chooseInvoiceTitle"`（QQ）选择发票抬头后回调。 |
| `addgroupapp` | `(e: UniEvent)` | UniApp | `openType="addGroupApp"`（QQ）添加群应用后回调。 |
| `subscribe` | `(e: UniEvent)` | UniApp | `openType="subscribe"`（QQ）订阅号订阅结果回调。 |
| `login` | `(e: UniEvent)` | UniApp | `openType="login"`（QQ）登录回调，`e.detail` 含登录 code。 |
| `agreeprivacyauthorization` | `(e: UniEvent)` | UniApp | `openType="agreePrivacyAuthorization"`（微信）用户同意隐私协议后回调。 |
| `error` | `(e: UniEvent)` | UniApp | 开放能力调用出错时触发，`e.detail` 含错误信息。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `{ ui }` | 按钮主体内容，优先于 `label` prop 渲染。 |
| `leading` | Web：`{ ui }`<br>UniApp：`{ ui, loading }` | 前置内容，常放图标；`loading` 时被加载动画替代。 |
| `trailing` | Web：`{ ui }`（当前实现下 `ui` 为 `trailingIcon` 类名字符串）<br>UniApp：`{ ui }` | 后置内容，常放图标；`loading` 时不渲染。 |

作用域里的 `ui` 是样式函数集合，可用于让插槽内容复用按钮的内部类名，例如 `:class="ui.label()"`。

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端 DOM 结构不同，可用键位也不同：

| 键名 | 平台 | 说明 |
| --- | --- | --- |
| `base` | 通用 | 根元素。 |
| `label` | 通用 | 文本节点。 |
| `leadingIcon` | Web | 前置图标区域，同时是加载动画的容器。 |
| `leadingAvatar` | Web | 前置头像区域。 |
| `leadingAvatarSize` | Web | 前置头像尺寸。 |
| `trailingIcon` | Web | 后置图标区域。 |
| `inner` | UniApp | 覆盖在根节点上的透明原生 `button` 点击层。 |
| `loading` | UniApp | 加载动画容器。 |

```vue
<template>
  <RebornButton
    :ui="{ base: 'shadow-lg', label: 'tracking-wide' }"
  >
    自定义样式
  </RebornButton>
</template>
```

### CSS 变量

两端各自维护一套独立的高度令牌，互不影响。

**Web 端**（`app/assets/theme/typography.css`，固定 px）：

| 变量名 | 对应 `size` | 值 |
| --- | --- | --- |
| `--height-button-sm` | `sm` | `24px` |
| `--height-button-md` | `md` | `32px` |
| `--height-button-lg` | `lg` | `40px` |

**UniApp 端**（`packages/uniapp-project/src/styles/theme.css`，`rpx` 随屏宽缩放）：

| 变量名 | 对应 `size` | 值 |
| --- | --- | --- |
| `--button-xs-height` | `xs` | `48rpx` |
| `--button-sm-height` | `sm` | `56rpx` |
| `--button-md-height` | `md` / `default` | `64rpx` |
| `--button-lg-height` | `lg` | `76rpx` |
| `--button-xl-height` | `xl` | `86rpx` |
| `--button-2xl-height` | `2xl` | `96rpx` |

`default` 档位不单独设变量，直接复用 `--button-md-height`。UniApp 主题变量挂载在 `:root, body, page` 上（避免 `:root` 在微信小程序下报错），覆盖时请对齐同一选择器。

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 自定义类名 | `class` | `customClass` |
| 尺寸档位 | `sm` / `md` / `lg`（3 档，px） | `xs` ~ `2xl`（7 档，rpx） |
| 水平内边距 | 统一 12px | 随 `size` 递进 12 / 16 / 24rpx |
| 边框线型 | 支持 `borderStyle` | 不支持，固定实线 |
| 块级布局 | 用 `class` 自行控制 | `block` prop |
| `ui` 键位 | `base` / `label` / `leadingIcon` / `leadingAvatar` / `leadingAvatarSize` / `trailingIcon` | `base` / `inner` / `label` / `loading` |
| 加载动画尺寸 | `1.25em`，跟随字号 | 按 `size` 取固定值 |
| 表单组禁用 | 仅自身 `disabled` / `loading` 生效 | `Form` 级 `disabled` 会强制禁用 |
| 点击态 | 由变体的 hover 样式内置 | `hoverClass` / `hoverStartTime` / `hoverStayTime` |
| 开放能力 | 不支持 | 完整代理 `openType` 及全部回调 |

## 注意事项

- **`round` 是默认开启的**。需要直角、或按钮组拼接时的单侧圆角，必须显式传 `:round="false"`，否则自定义圆角类会被 `rounded-full` 覆盖。
- **`loading` 隐含禁用**。加载中按钮不会派发 `click` / `tap`，无需再额外绑 `disabled`。
- **`text` 变体不占固定高度**。它用 `!h-auto !px-0` 覆盖了 `size` 的高度与水平内边距，与其他变体并排时基线不齐是预期行为；需要对齐请把它放进同一个 flex 容器并用 `items-center`。
- **`borderStyle` 只影响有边框的变体**。`solid` / `soft` / `text` 本身不渲染边框，传 `dashed` 不会有视觉变化。
- **开放能力仅小程序生效**。`openType` 系列 props 与 `getphonenumber`、`contact` 等事件在 H5 / APP 端无效，具体能力的平台支持范围以对应小程序平台文档为准。
- **UniApp 的点击层是独立元素**。原生 `button` 以透明层叠在根节点上（`ui.inner`），如果自定义样式改动了根节点的层叠上下文或 `overflow`，可能影响点击命中，请一并检查。
- **`fluid` 当前是预留 prop**。UniApp 端已声明但尚未接入样式，需要等宽填充请改用 `block` 或外层 flex 布局。
