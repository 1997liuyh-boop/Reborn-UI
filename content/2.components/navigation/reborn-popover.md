---
title: Popover 气泡卡片
description: 双端气泡浮层：点击或悬停触发，可配方位、对齐、箭头与遮罩，内容由插槽自由承载。
category: 反馈
platform: both
tags: [popover, floating, overlay, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornPopoverDemo.vue" config="RebornPopoverConfig" componentId="reborn-popover" :componentFiles='["RebornPopover.vue", "reborn-popover.config.ts"]' :uniappFiles='["RebornPopover.vue", "reborn-popover.config.ts"]'}
::

## 简介

Popover 是锚定在触发元素上的小型气泡浮层，Web 与 UniApp 两端同名，但 API 并不完全一致（见「两端差异对照」）。默认插槽放触发器，`content` 插槽放气泡内容，气泡里放什么完全由使用方决定。

定位由 `content` 属性对象的三个字段独立组合：`side` 决定主轴方向，`align` 决定交叉轴对齐，`sideOffset` 决定与触发器的间距；`arrow` 只负责是否画箭头，箭头落点再跟随 `align` 变化。

其余 API 按用途分组：触发方式看 `mode`（仅 Web）与 `openDelay` / `closeDelay`；显隐控制看 `v-model:open`、`defaultOpen` 与暴露的 `close()`（UniApp 另有 `open()`）；关闭策略看 `dismissible` 与 `modal`（遮罩仅 Web）。UniApp 端额外提供 `title` + `displayMode="menu"` 的轻量菜单模式。

### 何时使用

- 点击按钮或头像后展示一张补充信息卡片，内容里有按钮、表单等可交互元素：用 `content` 插槽承载。
- 悬停展示说明，且鼠标需要能移进气泡操作：Web 端用 `mode="hover"`，配合 `closeDelay` 防止移动途中关闭。
- 气泡的开关要和外部状态联动，例如操作完成后收起：用 `v-model:open` 或 ref 调用 `close()`。
- 需要打断用户、强调当前气泡：Web 端用 `modal` 铺一层遮罩。
- UniApp 端只要一列简单操作项：用 `displayMode="menu"` 配 `title` 数组，省去自己写列表。

### 何时不使用

- 只显示一行纯文字提示 —— 改用 `reborn-tooltip`（仅 Web），它自带深色面板与多种触发方式。
- 删除等需要二次确认的操作 —— 改用 `reborn-popconfirm`，它内置确认 / 取消按钮。
- 底部或侧边的大面积面板 —— 改用 `reborn-drawer`，气泡不适合承载长内容。

## 用法

### 基础用法

默认插槽放触发器，`content` 插槽放气泡内容。不传任何属性时点击触发、向下弹出、居中对齐，点击外部关闭。气泡本身已带底色、边框、圆角和内边距，插槽里不需要再套一层卡片。

```vue
<template>
  <RebornPopover>
    <RebornButton label="点击打开" />
    <template #content>
      <p class="w-56 text-sm">气泡自带底色、边框与内边距，内容区直接放文字即可。</p>
    </template>
  </RebornPopover>
</template>
```

### 方位、对齐与箭头

`content` 属性是一个对象，三个字段相互独立：

| 字段         | 取值                                     | 默认值                     | 典型用途                                   |
| ------------ | ---------------------------------------- | -------------------------- | ------------------------------------------ |
| `side`       | `'top'` / `'bottom'` / `'left'` / `'right'` | `'bottom'`                 | 触发器靠近视口底部时改 `top`               |
| `align`      | `'start'` / `'center'` / `'end'`         | `'center'`                 | 气泡比触发器宽时，用 `start` 与左边缘对齐 |
| `sideOffset` | `number`（px）                           | Web `8` / UniApp `0`       | 需要给箭头或阴影留出更多间距时加大         |

`arrow` 打开箭头后，Web 端 `start` / `end` 的箭头停在气泡两端内缩 17px 处，只有 `center` 才指向触发器中心；这样箭头不会压到气泡圆角上。

```vue
<template>
  <RebornPopover :content="{ side: 'top', align: 'start', sideOffset: 12 }" arrow>
    <RebornButton label="顶部弹出" />
    <template #content>
      <p class="w-56 text-sm">锚定在按钮上方、起点对齐的气泡内容。</p>
    </template>
  </RebornPopover>
</template>
```

### 悬停触发与显隐延迟

Web 端 `mode="hover"` 改为悬停触发（UniApp 端没有 `mode`，只能点击触发）。`openDelay` 控制悬停多久后打开，用来过滤鼠标路过时的误触发；`closeDelay` 控制移出后多久关闭，默认 120ms，给鼠标从触发器移到气泡上留出时间。hover 模式下组件还会在触发器与气泡之间垫一层透明桥接层，鼠标穿过间隙时不会被判定为移出。

```vue
<template>
  <RebornPopover mode="hover" :open-delay="150" :close-delay="200" arrow>
    <span class="cursor-help underline decoration-dotted">悬停查看说明</span>
    <template #content>
      <p class="w-52 text-sm">悬停 150ms 后打开，移出 200ms 后关闭。</p>
    </template>
  </RebornPopover>
</template>
```

### 受控与手动关闭

`v-model:open` 由外部持有显隐状态；不绑定时组件内部自管理，初始值取 `defaultOpen`。气泡里的操作完成后，可以通过 ref 调用 `close()` 收起（UniApp 端还暴露了 `open()`）。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const show = ref(false);
const popoverRef = ref<{ close: () => void } | null>(null);
</script>

<template>
  <RebornPopover ref="popoverRef" v-model:open="show" :content="{ side: 'top' }">
    <RebornButton :label="show ? '已打开' : '点击打开'" />
    <template #content>
      <RebornButton size="sm" label="完成" @click="popoverRef?.close()" />
    </template>
  </RebornPopover>
</template>
```

### 遮罩与点击外部关闭

`dismissible`（默认 `true`）决定点击触发器与气泡以外的区域时是否关闭；设为 `false` 后只能再次点击触发器或调用 `close()` 关闭。Web 端 `modal` 会在气泡打开时铺一层半透明遮罩，点击遮罩同样受 `dismissible` 控制。

| 组合                          | 点击外部 / 遮罩 | 典型用途                                 |
| ----------------------------- | --------------- | ---------------------------------------- |
| 默认                          | 关闭            | 大多数补充信息浮层                       |
| `modal`                       | 关闭            | 需要把注意力聚焦到气泡上（仅 Web）       |
| `:dismissible="false"`        | 不关闭          | 气泡里有未保存的输入，防止误触丢失       |

```vue
<template>
  <RebornPopover modal>
    <RebornButton label="带遮罩" />
    <template #content>点击遮罩关闭。</template>
  </RebornPopover>
  <RebornPopover :dismissible="false">
    <RebornButton variant="outlined" label="点击外部不关闭" />
    <template #content>再次点击触发器才会关闭。</template>
  </RebornPopover>
</template>
```

### 复合内容：资料卡、调色盘与操作菜单

`content` 插槽里可以放任意组件，例如用户资料卡、颜色选择器、操作列表。插槽内的点击不会触发「点击外部关闭」，所以在气泡里选颜色、点按钮都不会让气泡意外收起；需要选完即关时，自行调用 `close()`。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const colors = ['#6366f1', '#ec4899', '#22c55e', '#06b6d4'];
const selected = ref(colors[0]);
</script>

<template>
  <RebornPopover :content="{ side: 'bottom', sideOffset: 12 }" arrow>
    <RebornButton variant="outlined" :label="selected" />
    <template #content>
      <div class="grid grid-cols-4 gap-2">
        <button v-for="c in colors" :key="c" class="size-8 rounded-sm" :style="{ backgroundColor: c }" @click="selected = c" />
      </div>
    </template>
  </RebornPopover>
</template>
```

### 菜单模式（仅 UniApp）

UniApp 端不传 `content` 插槽时，可以用 `title` + `displayMode` 直接渲染内容：`normal` 模式下 `title` 为字符串，直接显示成一段文字；`menu` 模式下 `title` 为对象数组，每项取 `content`（或 `title`）字段渲染成一行可点击菜单。点击菜单项会先关闭气泡，再触发 `menuclick`。

```vue
<template>
  <RebornPopover
    display-mode="menu"
    :title="[{ content: '编辑' }, { content: '分享' }, { content: '删除' }]"
    @menuclick="({ item, index }) => uni.showToast({ title: item.content, icon: 'none' })"
  >
    <RebornButton size="sm" label="操作菜单" />
  </RebornPopover>
</template>
```

## API

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名        | 类型                                                                                                           | 默认值                                            | 描述                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `mode`        | `'click' \| 'hover'`                                                                                           | `'click'`                                         | 触发方式。                                                                   |
| `content`     | `{ side?: 'top' \| 'bottom' \| 'left' \| 'right'; align?: 'start' \| 'center' \| 'end'; sideOffset?: number }` | `{ side: 'bottom', align: 'center', sideOffset: 8 }` | 弹出方位、交叉轴对齐与间距（px）。                                           |
| `arrow`       | `boolean`                                                                                                      | `false`                                           | 是否显示指向触发器的箭头。                                                   |
| `portal`      | `boolean \| string`                                                                                            | `true`                                            | 是否用 Teleport 挂载到 `body`；传字符串时作为挂载目标选择器。                |
| `dismissible` | `boolean`                                                                                                      | `true`                                            | 点击触发器与气泡以外的区域（含遮罩）时是否关闭。                             |
| `open`        | `boolean`                                                                                                      | -                                                 | 受控显隐，对应 `v-model:open`。                                              |
| `defaultOpen` | `boolean`                                                                                                      | `false`                                           | 非受控模式下的初始显隐。                                                     |
| `modal`       | `boolean`                                                                                                      | `false`                                           | 打开时是否铺半透明遮罩。                                                     |
| `openDelay`   | `number`                                                                                                       | `0`                                               | hover 模式下悬停多久后打开（ms）。                                           |
| `closeDelay`  | `number`                                                                                                       | `120`                                             | hover 模式下移出多久后关闭（ms）。                                           |
| `class`       | `any`                                                                                                          | -                                                 | 追加到根节点（`wrapper`）的类名。                                            |
| `ui`          | `Partial<Record<'wrapper' \| 'trigger' \| 'contentWrapper' \| 'content' \| 'arrow' \| 'bridge' \| 'mask', any>>` | -                                              | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名           | 类型                                                                                                           | 默认值                                | 描述                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| `content`        | `{ side?: 'top' \| 'bottom' \| 'left' \| 'right'; align?: 'start' \| 'center' \| 'end'; sideOffset?: number }` | `{ side: 'bottom', align: 'center', sideOffset: 0 }` | 弹出方位、交叉轴对齐与间距。                                                   |
| `arrow`          | `boolean`                                                                                                      | `true`                                | 是否显示箭头。                                                                         |
| `portal`         | `boolean \| string`                                                                                            | `false`                               | 为与 Web 保持 API 一致而保留，组件内未使用。                                           |
| `dismissible`    | `boolean`                                                                                                      | `true`                                | 打开时是否铺一层透明遮罩，点击外部即关闭。                                             |
| `open`           | `boolean`                                                                                                      | `false`                               | 受控显隐，对应 `v-model:open`。                                                        |
| `defaultOpen`    | `boolean`                                                                                                      | `false`                               | 初始显隐。                                                                             |
| `modal`          | `boolean`                                                                                                      | `false`                               | 为与 Web 保持 API 一致而保留，组件内未使用，不会出现遮罩。                             |
| `openDelay`      | `number`                                                                                                       | `0`                                   | 为与 Web 保持 API 一致而保留，组件内未使用。                                           |
| `closeDelay`     | `number`                                                                                                       | `0`                                   | 为与 Web 保持 API 一致而保留，组件内未使用。                                           |
| `disabled`       | `boolean`                                                                                                      | `false`                               | 禁用后点击触发器不再切换显隐（ref 调用 `open()` 不受影响）。                           |
| `title`          | `string \| Record<string, any>[]`                                                                              | `''`                                  | 未使用 `content` 插槽时的气泡内容：`normal` 模式传字符串，`menu` 模式传对象数组。      |
| `useContentSlot` | `boolean`                                                                                                      | `true`                                | 声明了但实际不生效：组件内部按是否传入 `content` 插槽自动判定。                        |
| `displayMode`    | `'normal' \| 'menu'`                                                                                           | `'normal'`                            | 未使用 `content` 插槽时的展示模式。                                                    |
| `customClass`    | `any`                                                                                                          | `''`                                  | 追加到根节点（`base`）的类名。                                                         |
| `ui`             | `Record<string, any>`                                                                                          | `{}`                                  | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                           |

:::

::

### Emits

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 事件名        | 回调参数           | 描述                                    |
| ------------- | ------------------ | --------------------------------------- |
| `update:open` | `(value: boolean)` | 显隐变化时触发，对应 `v-model:open`。   |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 事件名              | 回调参数                                            | 描述                                          |
| ------------------- | --------------------------------------------------- | --------------------------------------------- |
| `update:open`       | `(value: boolean)`                                  | 显隐变化时触发，对应 `v-model:open`。         |
| `update:modelValue` | `(value: boolean)`                                  | 与 `update:open` 同时触发，对应 `v-model`。   |
| `change`            | `({ show }: { show: boolean })`                     | 显隐状态切换后触发。                          |
| `open`              | -                                                   | 气泡打开后触发。                              |
| `close`             | -                                                   | 气泡关闭后触发。                              |
| `menuclick`         | `({ item, index }: { item: Record<string, any>; index: number })` | `menu` 模式下点击菜单项时触发，触发前气泡已关闭。 |

:::

::

### Slots

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 插槽名    | 作用域参数          | 描述                                     |
| --------- | ------------------- | ---------------------------------------- |
| `default` | `{ open: boolean }` | 触发器；`open` 为当前显隐状态。          |
| `content` | -                   | 气泡内容。                               |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 插槽名    | 作用域参数 | 描述                                                   |
| --------- | ---------- | ------------------------------------------------------ |
| `default` | -          | 触发器。                                               |
| `content` | -          | 气泡内容；传入后 `title` / `displayMode` 不再渲染。    |

:::

::

### Expose

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 方法名  | 签名         | 描述          |
| ------- | ------------ | ------------- |
| `close` | `() => void` | 关闭气泡。    |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 方法名  | 签名         | 描述                                   |
| ------- | ------------ | -------------------------------------- |
| `open`  | `() => void` | 打开气泡（不检查 `disabled`）。        |
| `close` | `() => void` | 关闭气泡。                             |

:::

::

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，与默认类通过 tailwind-merge 合并。两端内部结构差异较大，键位互不通用：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名             | 说明                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`        | 最外层包裹节点，默认 `relative inline-block`，`class` prop 也并到这里；整体在行内流中的占位、外边距改这里。                             |
| `trigger`        | 触发器包裹层，默认 `inline-flex max-w-full`，包住 `default` 插槽，点击与悬停事件绑定在它身上。                                         |
| `contentWrapper` | 气泡定位层（Teleport 之后的过渡容器），默认 `fixed top-0 left-0 z-[9999]`，坐标由定位计算写入内联样式；层级改这里。                     |
| `content`        | 气泡主体，默认 `relative bg-gray-1 border border-gray-1 shadow-xl rounded-lg p-[12px]`，另按 `side` 追加 `origin-*` 作为缩放原点；底色、圆角、内边距、阴影改这里。 |
| `arrow`          | 箭头，默认 `absolute w-3 h-3 border border-gray-1 bg-gray-1`。**仅 `arrow` 为真时渲染**；改底色要与 `content` 一起改，否则箭头与面板颜色不一致。 |
| `bridge`         | 触发器与气泡之间的透明桥接层，默认 `absolute inset-0 z-[-1]`。**仅 `mode="hover"` 时渲染**，一般不需要覆盖。                           |
| `mask`           | 遮罩层，默认 `fixed inset-0 bg-black/30 z-[9998]`。**仅 `modal` 为真且气泡打开时渲染**；遮罩深浅改这里。                                |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名        | 说明                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`      | 最外层 `<view>`，默认 `relative inline-block`，`customClass` 也并到这里。                                                                                      |
| `target`    | 触发器包裹层，默认 `inline-block`，包住 `default` 插槽，点击事件绑定在它身上。                                                                                 |
| `pos`       | 气泡定位层，默认 `absolute box-border min-h-[36px] z-[500] transition-opacity duration-200 rounded-md bg-white`；层级改这里。同时用于离屏测量节点和可见气泡。     |
| `hidden`    | 叠加在离屏测量节点上的类名，默认 `left-[-100vw] invisible`。组件先把一份气泡渲染到屏幕外量尺寸再定位，一般不需要覆盖。                                          |
| `container` | 气泡外层容器，默认 `relative text-sm leading-normal shadow-[0_2px_15px_0_rgba(0,0,0,0.1)]`；阴影与基准字号改这里。                                            |
| `inner`     | 普通模式的文字节点，默认 `relative whitespace-nowrap p-3 rounded-md bg-white dark:bg-gray-8`。**仅 `displayMode="normal"` 且未传 `content` 插槽时渲染**。      |
| `arrow`     | 箭头，默认 `absolute w-[9px] h-[9px] bg-white dark:bg-zinc-800 pointer-events-none`，方向偏移由内部 `arrowSide` 变体追加。**仅 `arrow` 为真时渲染**。          |
| `closeIcon` | 关闭图标，默认 `absolute text-[12px] right-[-8px] top-[-10px] scale-50 p-2.5`。当前模板没有渲染关闭图标，传入不会生效。                                        |
| `menu`      | 菜单模式的列表容器，默认 `inline-block px-3 whitespace-nowrap relative rounded-md bg-white dark:bg-zinc-800 z-[500]`。**仅 `displayMode="menu"` 且未传 `content` 插槽时渲染**。 |
| `menuInner` | 菜单模式的每一项，默认 `relative py-3 flex items-center border-t border-solid border-gray-200 dark:border-gray-700 first:border-0`；行高、分割线改这里。          |

:::

::

```vue
<template>
  <RebornPopover
    arrow
    :ui="{
      content: 'bg-gray-10 text-gray-1 border-gray-10 p-2',
      arrow: 'bg-gray-10 border-gray-10',
    }"
  >
    <RebornButton label="深色气泡" />
    <template #content>提示内容</template>
  </RebornPopover>
</template>
```

## 两端差异对照

| 维度             | Web                                                         | UniApp                                                        |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| 触发方式         | `mode` 支持 `click` / `hover`                               | 无 `mode`，只能点击触发                                       |
| 显隐延迟         | `openDelay` / `closeDelay` 在 hover 模式生效                | 仅保留属性，不生效                                            |
| 遮罩             | `modal` 渲染半透明遮罩                                      | 仅保留属性，不渲染                                            |
| 点击外部关闭     | 监听 document `mousedown` 判断                              | `dismissible` 为真时铺一层透明全屏遮罩拦截点击                |
| 挂载位置         | 默认 Teleport 到 `body`                                     | 渲染在原位置，`portal` 不生效                                 |
| `arrow` 默认值   | `false`                                                     | `true`                                                        |
| `sideOffset` 默认 | `8`                                                        | `0`                                                           |
| 多实例           | 各自独立                                                    | 自动互斥：打开一个会关闭其他实例                              |
| 内置内容         | 只有 `content` 插槽                                         | `title` + `displayMode`（`normal` / `menu`）                  |
| 禁用             | 无 `disabled`                                               | `disabled`                                                    |
| 事件             | `update:open`                                               | 另有 `update:modelValue` / `change` / `open` / `close` / `menuclick` |
| Expose           | `close`                                                     | `open` / `close`                                              |
| 默认插槽作用域   | `{ open }`                                                  | 无                                                            |
| 自定义类名       | `class`                                                     | `customClass`                                                 |
| 过渡动画         | `zoom-in`，进场 200ms / 离场 150ms                          | `fade`，200ms                                                 |
| `ui` 键位        | 7 个：`wrapper` / `trigger` / `contentWrapper` / `content` / `arrow` / `bridge` / `mask` | 10 个：`base` / `target` / `pos` / `hidden` / `container` / `inner` / `arrow` / `closeIcon` / `menu` / `menuInner` |

## 注意事项

- **Web 端定位与 `reborn-tooltip`、`reborn-popconfirm` 共用同一套实现。** 主轴放不下时翻到对侧（对侧同样放不下则保持原方向），交叉轴挪回视口内；窗口缩放、滚动或气泡尺寸变化时会重新定位，所以气泡内容动态变高也不会错位。
- **Web 端默认 Teleport 到 `body`。** 气泡不受父容器 `overflow: hidden` 裁剪；但如果把 `portal` 设为 `false`，气泡会渲染在原位置，父级带 `transform` 时 fixed 定位会以该父级为参照而错位。
- **hover 模式的关闭靠 `closeDelay` 和桥接层共同兜底。** 把 `closeDelay` 调成 `0` 后，鼠标只要在触发器与气泡之间的缝隙外稍有偏离就会立刻关闭。
- **UniApp 端多个 Popover 自动互斥。** 打开一个会关闭其他已打开的实例，不需要自己维护「当前打开的是哪个」。
- **UniApp 端 `modal`、`portal`、`openDelay`、`closeDelay` 只是为了与 Web 保持 API 一致而保留，传了也没有效果。** 跨端代码里可以照写，但不要依赖它们在小程序里的表现。
- **UniApp 端 `useContentSlot` 设了不生效。** 组件内部用同名计算属性按是否传入 `content` 插槽判定，外部传值会被覆盖；想走 `title` 渲染就不要传 `content` 插槽。
- **UniApp 端 `title` 的类型必须与 `displayMode` 匹配。** `menu` 模式传对象数组（每项含 `content` 或 `title` 字段），`normal` 模式传字符串；不匹配时控制台报错，菜单也不会渲染。
