---
title: Dropdown 下拉菜单
description: 当页面上的操作命令过多时，用此组件收纳操作元素；点击或移入触点展开菜单，选择后执行相应命令。仅 Web 端。
category: 杂项
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornDropdownDemo.vue" config="RebornDropdownConfig" componentId="reborn-dropdown" :componentFiles='["reborn-dropdown.config.ts", "RebornDropdown.vue", "RebornDoption.vue", "RebornDsubmenu.vue", "RebornDgroup.vue"]'}
::

# API

## Dropdown Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `show-arrow` | `boolean` | `false` | 下拉框箭头是否显示 |
| `disabled` | `boolean` | `false` | 菜单是否禁用 |
| `options` | `DropdownOption[]` | `[]` | 菜单配置项，每项为 `{ label, value, disabled?, icon? }`；与 `content` 插槽二选一，插槽优先 |
| `position` | `'top' \| 'topLeft' \| 'topRight' \| 'bottom' \| 'bottomLeft' \| 'bottomRight' \| 'left' \| 'leftTop' \| 'leftBottom' \| 'right' \| 'rightTop' \| 'rightBottom'` | `'bottom'` | 菜单弹出位置，靠近视口边缘时自动翻转 |
| `trigger` | `'click' \| 'hover' \| 'manual'` | `'click'` | 触发下拉的行为，移动端不支持 hover；`manual` 时组件不绑定任何触发行为，由使用者通过默认插槽下发的 `open` / `close` / `toggle` 或 `v-model:popup-visible` 控制 |
| `popup-offset` | `number` | - | 浮层与触发器的间距（px）；未传时无箭头为 4、带箭头为 8 |
| `hide-on-select` | `boolean` | `true` | 用户选择后是否自动收起菜单 |
| `portal` | `boolean` | `true` | 浮层是否传送到 `body`；关闭后浮层留在触发器内，随父容器一起滚动与裁剪（行内模式仅支持 start 对齐） |
| `auto-adjust-overflow` | `boolean` | `true` | 下拉框是否自动调整位置：`position` 指定的一侧空间不足时翻转到对侧；关闭后严格按 `position` 弹出 |
| `v-model:popup-visible` | `boolean` | `false` | 下拉框显隐（受控） |
| `ui` | `DropdownUI` | - | 按语义化结构覆盖各节点样式，见下方说明 |

## Dropdown Events

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `popup-visible-change` | 下拉框显示状态发生改变时触发 | `(visible: boolean)` |
| `select` | 用户选择时触发 | `(value: string \| number \| Record<string, any>, ev: Event)` |

## Dropdown Slots

| 插槽名 | 说明 | 参数 |
| :--- | :--- | :--- |
| `default` | 触发下拉的元素 | `visible: boolean`、`open()`、`close()`、`toggle()` |
| `content` | 菜单内容，通常放入 `RebornDoption`；提供后 `options` 不再渲染 | - |
| `header` | 页头 | - |
| `footer` | 页脚 | - |

## Dropdown Expose

| 方法名 | 说明 |
| :--- | :--- |
| `open()` | 展开菜单（禁用时无效） |
| `close()` | 收起菜单 |
| `toggle()` | 切换展开 / 收起 |

## Doption Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `value` | `string \| number \| Record<string, any>` | `''` | 选项值，被选中时通过 `select` 事件回传 |
| `disabled` | `boolean` | `false` | 是否禁用 |

## Doption Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 选项文字内容 |
| `icon` | 选项左侧图标 |

## Dsubmenu Props

子菜单入口。它本身就是一个嵌套的 `RebornDropdown`：入口行铺满整行作为触发器，面板默认从右上角弹出；可无限嵌套。

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `title` | `string` | - | 入口行文字（也可用 `title` 插槽） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `trigger` | `'click' \| 'hover'` | `'hover'` | 子菜单的触发方式 |
| `position` | 同 Dropdown 的 `position` | `'rightTop'` | 子菜单弹出位置 |

## Dsubmenu Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 子菜单内容，放入 `RebornDoption` / `RebornDgroup` / 更深一层的 `RebornDsubmenu` |
| `title` | 入口行文字 |
| `icon` | 入口行左侧图标 |

## Dgroup Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `title` | `string` | - | 选项组标题（也可用 `title` 插槽） |

## Dgroup Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 组内选项 |
| `title` | 组标题 |

## 自定义样式（ui）

`ui` 传给 `RebornDropdown`，选项相关的键会自动下发给每个 `RebornDoption`：

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 最外层锚点容器，默认 `inline-flex w-fit`（与触发元素等宽，定位与箭头以它为基准），`class` prop 也并到这里 |
| `trigger` | 触发元素的外框（承载点击 / 悬停），默认 `inline-flex cursor-pointer` |
| `panel` | 浮层内容排版容器，默认 `px-[4px] py-[6px]`；浮层外壳（底色、描边、圆角、阴影）与 Select 同源，由 `RebornSelectTrigger` 给出 |
| `header` | 页头容器，**仅提供 `header` 插槽时渲染** |
| `list` | 选项列表容器，默认 `flex max-h-72 flex-col gap-0.5 overflow-y-auto`；最大高度改这里 |
| `item` | 单个选项，默认行高 36px、hover 浅灰底，禁用态走 `data-[disabled=true]` |
| `itemIcon` | 选项图标容器，**仅提供 `icon` 插槽或 `options[].icon` 时渲染** |
| `itemLabel` | 选项文字节点，默认 `flex-1 truncate` |
| `submenuIcon` | 子菜单入口右侧的展开箭头，默认 `ml-auto size-4 shrink-0 text-gray-5` |
| `group` | 选项组容器，默认 `space-y-[4px]` |
| `groupTitle` | 选项组标题，默认 12px 弱化灰文字 |
| `footer` | 页脚容器，**仅提供 `footer` 插槽时渲染** |

```vue
<template>
  <RebornDropdown
    :options="options"
    :ui="{
      panel: 'rounded-xl shadow-lg',
      item: 'h-10 px-4',
    }"
  >
    <RebornButton label="操作" />
  </RebornDropdown>
</template>
```

## 示例代码

### 基础用法（options 配置）

```vue
<template>
  <RebornDropdown :options="options" @select="handleSelect">
    <RebornButton label="操作" />
  </RebornDropdown>
</template>

<script setup lang="ts">
import type { DropdownOption, DropdownValue } from "~/components/reborn/ui/reborn-dropdown";
import { RebornDropdown } from "~/components/reborn/ui/reborn-dropdown";

const options: DropdownOption[] = [
  { label: "新建", value: "new", icon: "lucide:plus" },
  { label: "编辑", value: "edit" },
  { label: "删除", value: "delete", disabled: true },
];

function handleSelect(value: DropdownValue) {
  console.log("选择了:", value);
}
</script>
```

### 插槽自定义（content / header / footer）

```vue
<template>
  <RebornDropdown position="bottomLeft" show-arrow @select="handleSelect">
    <RebornButton label="账户" />
    <template #header>已登录：reborn@example.com</template>
    <template #content>
      <RebornDoption value="profile">个人资料</RebornDoption>
      <RebornDoption :value="{ action: 'logout' }">
        <template #icon>
          <Icon name="lucide:log-out" class="size-4" />
        </template>
        退出登录
      </RebornDoption>
    </template>
    <template #footer>value 支持字符串、数字或对象</template>
  </RebornDropdown>
</template>
```

### 多级菜单与选项组

```vue
<template>
  <RebornDropdown @select="handleSelect">
    <RebornButton label="多级菜单" />
    <template #content>
      <RebornDgroup title="文件">
        <RebornDoption value="new">新建</RebornDoption>
        <RebornDoption value="open">打开</RebornDoption>
      </RebornDgroup>
      <RebornDgroup title="导出">
        <RebornDsubmenu title="导出为">
          <RebornDoption value="export-pdf">PDF</RebornDoption>
          <RebornDsubmenu title="更多格式">
            <RebornDoption value="export-svg">SVG</RebornDoption>
          </RebornDsubmenu>
        </RebornDsubmenu>
      </RebornDgroup>
    </template>
  </RebornDropdown>
</template>
```

### 带下拉框的按钮（manual 触发 + 插槽下发控制方法）

`trigger="manual"` 时组件不绑定任何触发行为，整组按钮作为触发器占位，只让右侧箭头按钮调用插槽下发的 `toggle`：

```vue
<template>
  <RebornDropdown v-slot="{ toggle, visible }" :options="moreOptions" trigger="manual" position="bottomRight" @select="handleSelect">
    <div class="inline-flex">
      <RebornButton label="发布" class="rounded-r-none!" @click="publish" />
      <RebornButton class="rounded-l-none! border-l border-white/20" @click="toggle">
        <template #trailing>
          <Icon name="lucide:chevron-down" class="size-4 transition-transform" :class="visible && 'rotate-180'" />
        </template>
      </RebornButton>
    </div>
  </RebornDropdown>
</template>
```

### 受控显隐 + hover 触发

```vue
<template>
  <RebornDropdown
    v-model:popup-visible="visible"
    :options="options"
    trigger="hover"
    @popup-visible-change="onVisibleChange"
  >
    <RebornButton label="悬停展开" />
  </RebornDropdown>
</template>
```

## 平台差异与注意事项

- 仅 Web 端提供。浮层基于 `RebornSelectTrigger`（与 Select 共用同一套浮层外壳、定位与外部点击边界）：12 向 `position` 映射为其 `side` / `align`，目标侧空间不足时自动翻转到对侧；`show-arrow` 即其箭头。
- `trigger="hover"` 基于鼠标移入 / 移出实现，移入 100ms 后展开、移出 150ms 后收起以便鼠标移入面板；移动端无悬停，请使用默认的 `click`。
- `RebornDoption` / `RebornDsubmenu` / `RebornDgroup` 通过 `provide/inject` 与 `RebornDropdown` 通信，嵌套层级不受限制；脱离 Dropdown 单独使用时不带样式也不触发事件。
- 子菜单面板同样传送到 `body`，父级会把子级面板视为自身的一部分：悬停子面板不会让父级收起，子面板内的点击不算外部点击，子级选中会逐级冒泡到最外层的 `select` 并整体收起。子面板与父面板外缘之间固定留 4px 间隙。
- 若 UniApp 端后续适配，Props 参数名与 Emit 事件名应保持一致。
