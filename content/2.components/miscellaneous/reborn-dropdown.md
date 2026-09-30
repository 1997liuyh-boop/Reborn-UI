---
title: Dropdown 下拉菜单
description: 当页面上的操作命令过多时，用此组件收纳操作元素；点击或移入触点展开菜单，选择后执行相应命令。仅 Web 端。
category: 导航
platform: web
---

::ComponentViewer{demoFile="RebornDropdownDemo.vue" config="RebornDropdownConfig" componentId="reborn-dropdown" :componentFiles='["reborn-dropdown.config.ts", "RebornDropdown.vue", "RebornDoption.vue", "RebornDsubmenu.vue", "RebornDgroup.vue"]'}
::

## 简介

Dropdown 把一组操作命令收进一个触发器后面：平时只占一个按钮或一段文字的位置，点击或悬停后展开菜单，选中某一项即通过 `select` 事件把该项的 `value` 交给业务代码执行。它由四个组件配合使用：

- `RebornDropdown`：容器，负责触发、定位、显隐与 `select` 事件。
- `RebornDoption`：单个选项。
- `RebornDgroup`：带标题的选项组。
- `RebornDsubmenu`：子菜单入口，本身是一个嵌套的 `RebornDropdown`，可无限嵌套。

选项既可以用 `options` 数组数据驱动，也可以在 `content` 插槽里手写上面三个子组件；两者二选一，插槽优先。

### 何时使用

- 同一对象上的操作较多，平铺成按钮会挤占版面，例如表格行的「更多」操作、页头的账户菜单。
- 主操作之外还有几个次要变体，需要做成「主按钮 + 右侧箭头」的组合按钮，例如「发布 / 保存草稿 / 定时发布」。
- 操作本身有层级，需要分组或多级展开，例如「导出为 → PDF / PNG / 更多格式」。

### 何时不使用

- 需要在表单里选一个值并回显在触发器上：用 `reborn-select`。Dropdown 只派发 `select` 事件，不保存选中状态，也不改变触发器的显示内容。
- 选项只有一两个：直接平铺按钮，省掉一次展开操作。
- 站点级的页面导航：用 `reborn-menu`，它有选中态、折叠与路由模式。
- 浮层里放的是表单、说明文字等非命令内容：用 `reborn-popover`。

## 用法

### 基础用法

任意元素都能放进默认插槽作为触发器，`options` 数组描述菜单项，每项为 `{ label, value, disabled?, icon? }`。默认 `trigger="click"`，点击触发器切换展开；改为 `trigger="hover"` 后移入 100ms 展开、移出 150ms 收起，收起留出的延迟让鼠标有时间从触发器移进面板。

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

触发器获得焦点时，按 `Enter` 或空格切换展开，按 `Esc` 收起。

### 弹出位置与箭头

`placement` 支持 12 个方向，取值与 `reborn-tooltip` 的 `placement` 一致：`top` / `top-start` / `top-end`、`bottom` / `bottom-start` / `bottom-end`、`left` / `left-start` / `left-end`、`right` / `right-start` / `right-end`。前半段是弹出的一侧，后半段是浮层与触发器对齐的一端（`start` 为左 / 上端，`end` 为右 / 下端）。`show-arrow` 显示指向触发器的小箭头。

```vue
<template>
  <RebornDropdown :options="options" placement="bottom-start" show-arrow>
    <RebornButton label="bottom-start" />
  </RebornDropdown>
</template>
```

- **自动翻转**：默认 `auto-adjust-overflow` 开启，`placement` 指定的一侧空间不足时翻转到对侧；关闭后严格按 `placement` 弹出，适合必须固定方向的场景。
- **间距**：浮层与触发器的间距未传 `popup-offset` 时，无箭头为 4px、带箭头为 8px，多出的 4px 留给箭头本身。
- **箭头落点**：跟随 `placement` 的对齐端，与 Popover / Tooltip 同一口径。`-start` 停在浮层起始端内缩 17px 处，`-end` 停在末端 17px 处，只有 `top` / `bottom` / `left` / `right` 才指向触发器中心。
  - 不让三档都指向触发器中心的原因：浮层最小宽度就是触发器宽度，内容不比触发器宽多少时，左右对齐的箭头会和居中的一样落在正中附近，看不出浮层靠哪边对齐。
  - 17px 是浮层圆角 8px 加半个箭头底边，再小箭头底边会压到圆角弧线上露出缺口。

### 带下拉框的按钮：手动触发

`trigger="manual"` 时组件不绑定任何触发行为，展开只能通过默认插槽下发的 `open` / `close` / `toggle`，或 `v-model:popup-visible` 控制。组合按钮正需要这一点：整组按钮作为触发器占位，决定浮层从整组的哪个角弹出；只有右侧箭头按钮调用 `toggle`，主按钮点击执行默认操作而不展开菜单。插槽同时下发 `visible`，可用来旋转箭头图标。

```vue
<template>
  <RebornDropdown v-slot="{ toggle, visible }" :options="moreOptions" trigger="manual" placement="bottom-end" @select="handleSelect">
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

`manual` 模式下外部点击仍会收起菜单，只是展开需要使用者自己触发。

### 多级菜单与选项组

在 `content` 插槽里组合子组件：`RebornDgroup` 用标题把选项分组；`RebornDsubmenu` 作为入口展开下一级菜单，默认悬停触发、从右上角（`right-start`）弹出，可无限嵌套。

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

子菜单面板同样传送到 `body`，父级会把子级面板视为自身的一部分：

- 鼠标从父面板移进子面板时，父级不会因「移出」而收起。
- 子面板内的点击不算父级的外部点击。
- 任一层选中都会逐级冒泡到最外层的 `select`，并按各层的 `hide-on-select` 整条链路一起收起。

子面板与父面板外缘之间固定留 4px 间隙：子菜单的间距取 9px，即 4px 可见间隙加父面板 4px 水平内边距与 1px 描边。

### 页头页脚、禁用与选择后保持展开

- `header` / `footer` 插槽在选项列表上下各加一个带分隔线的区域，适合放登录账户、提示文字；不提供插槽时对应节点不渲染。
- `disabled` 禁用整个菜单：`open()` 失效，展开中的菜单会立即收起。它不会改变触发元素的外观，触发器若是按钮，需要自己同时给按钮加 `disabled`。
- `hide-on-select` 默认开启，选中后自动收起；关闭后可连续选择多项，适合「切换多个开关」一类的操作。
- 选项的 `value` 支持字符串、数字或对象，`select` 原样回传。

```vue
<template>
  <RebornDropdown @select="handleSelect">
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

  <RebornDropdown :options="options" disabled>
    <RebornButton label="已禁用" disabled />
  </RebornDropdown>

  <RebornDropdown :options="options" :hide-on-select="false">
    <RebornButton label="选择后不收起" />
  </RebornDropdown>
</template>
```

### 受控显隐：v-model:popup-visible

`v-model:popup-visible` 把显隐交给外部状态，菜单自身的点击、外部点击收起与业务代码改的是同一个值，便于在新手引导、快捷键等场景里由代码打开菜单。

```vue
<template>
  <RebornDropdown
    v-model:popup-visible="visible"
    :options="options"
    @popup-visible-change="onVisibleChange"
  >
    <RebornButton label="受控菜单" />
  </RebornDropdown>
  <RebornButton label="外部展开" @click.stop="visible = true" />
</template>

<script setup lang="ts">
const visible = ref(false);

function onVisibleChange(v: boolean) {
  console.log(v ? "展开" : "收起");
}
</script>
```

`popup-visible-change` 只在组件内部改变显隐时触发，包括触发器点击、悬停、键盘、外部点击、选中后收起，以及调用 `open` / `close` / `toggle`。外部直接给绑定值赋值不会触发它，需要感知时请 `watch` 绑定值。外部按钮要加 `.stop`：外部点击判定监听的是 `document` 的 `click`，不阻止冒泡的话，这次点击会被当作外部点击，把刚打开的菜单立刻收起。

## API

### Dropdown Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `options` | `DropdownOption[]` | `[]` | 菜单配置项，每项为 `{ label, value, disabled?, icon? }`；与 `content` 插槽二选一，插槽优先 |
| `trigger` | `'click' \| 'hover' \| 'manual'` | `'click'` | 触发下拉的行为，移动端不支持 hover；`manual` 时组件不绑定任何触发行为，由默认插槽下发的 `open` / `close` / `toggle` 或 `v-model:popup-visible` 控制 |
| `placement` | `'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | `'bottom'` | 菜单弹出位置，取值与 `reborn-tooltip` 的 `placement` 一致 |
| `show-arrow` | `boolean` | `false` | 是否显示指向触发器的小箭头，落点见「弹出位置与箭头」 |
| `popup-offset` | `number` | - | 浮层与触发器的间距（px）；未传时无箭头为 4、带箭头为 8 |
| `auto-adjust-overflow` | `boolean` | `true` | `placement` 指定的一侧空间不足时是否翻转到对侧；关闭后严格按 `placement` 弹出 |
| `portal` | `boolean` | `true` | 浮层是否传送到 `body`；关闭后浮层留在触发器内，随父容器一起滚动与裁剪，且只支持 start 对齐 |
| `disabled` | `boolean` | `false` | 菜单是否禁用；不改变触发元素外观 |
| `hide-on-select` | `boolean` | `true` | 用户选择后是否自动收起菜单 |
| `v-model:popup-visible` | `boolean` | `false` | 下拉框显隐（受控） |
| `class` | `any` | - | 并入最外层 `wrapper` 节点 |
| `ui` | `DropdownUI` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

### Dropdown Emits

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `popup-visible-change` | 组件内部改变显隐时触发；外部直接改 `popup-visible` 绑定值不触发 | `(visible: boolean)` |
| `select` | 用户选择时触发；子菜单里的选中也会冒泡到这里 | `(value: string \| number \| Record<string, any>, ev: Event)` |

### Dropdown Slots

| 插槽名 | 说明 | 参数 |
| :--- | :--- | :--- |
| `default` | 触发下拉的元素 | `{ visible: boolean, open: () => void, close: () => void, toggle: () => void }` |
| `content` | 菜单内容，放入 `RebornDoption` / `RebornDgroup` / `RebornDsubmenu`；提供后 `options` 不再渲染 | - |
| `header` | 页头，提供时才渲染页头容器 | - |
| `footer` | 页脚，提供时才渲染页脚容器 | - |

### Dropdown Expose

| 方法名 | 说明 | 签名 |
| :--- | :--- | :--- |
| `open` | 展开菜单，禁用时无效 | `() => void` |
| `close` | 收起菜单 | `() => void` |
| `toggle` | 切换展开 / 收起 | `() => void` |
| `contains` | 节点是否位于本菜单（触发器 + 面板）或任一子级菜单面板内，可用于自定义外部点击判定 | `(node: Node) => boolean` |

### Doption Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `value` | `string \| number \| Record<string, any>` | `''` | 选项值，被选中时通过 Dropdown 的 `select` 事件回传 |
| `disabled` | `boolean` | `false` | 是否禁用；禁用后不响应点击，并以 `data-disabled="true"` 标记 |
| `class` | `any` | - | 并入该选项的 `item` 节点 |

### Doption Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 选项文字内容 |
| `icon` | 选项左侧图标，提供时才渲染图标容器 |

### Dsubmenu Props

子菜单入口。它本身就是一个嵌套的 `RebornDropdown`：入口行铺满整行作为触发器，右侧自带展开箭头。

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `title` | `string` | - | 入口行文字（也可用 `title` 插槽） |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `trigger` | `'click' \| 'hover' \| 'manual'` | `'hover'` | 子菜单的触发方式；入口行不下发 `toggle`，`manual` 下子菜单无法展开，实际只用 `click` / `hover` |
| `placement` | 同 Dropdown 的 `placement` | `'right-start'` | 子菜单弹出位置 |
| `class` | `any` | - | 并入入口行的 `item` 节点 |

### Dsubmenu Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 子菜单内容，放入 `RebornDoption` / `RebornDgroup` / 更深一层的 `RebornDsubmenu` |
| `title` | 入口行文字 |
| `icon` | 入口行左侧图标 |

### Dgroup Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `title` | `string` | - | 选项组标题（也可用 `title` 插槽）；两者都没有时不渲染标题行 |
| `class` | `any` | - | 并入该组的 `group` 节点 |

### Dgroup Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 组内选项 |
| `title` | 组标题 |

### 自定义样式（ui）

`ui` 只传给 `RebornDropdown`。其中 `item` / `itemIcon` / `itemLabel` / `submenuIcon` / `group` / `groupTitle` 六个键通过上下文下发给面板里的每个 `RebornDoption`、`RebornDsubmenu` 入口行与 `RebornDgroup`，一处设置即作用于整个菜单。例外是子菜单：`RebornDsubmenu` 的入口行取所在菜单的配置，但它展开的面板是另一个 Dropdown 实例，会重新下发自己的默认样式，所以最外层 `ui` 的任何键都作用不到子菜单面板里的选项、组与容器，子菜单面板目前没有样式覆盖入口。浮层外壳（底色、描边、圆角、阴影）与 Select 同源，由 `RebornSelectTrigger` 给出，不在下表之列。

| 键名 | 对应节点 | 默认关键类名 | 渲染条件 |
| --- | --- | --- | --- |
| `wrapper` | 最外层锚点容器，定位与箭头以它为基准；`class` prop 也并到这里 | `inline-flex w-fit`（覆盖 SelectTrigger 锚点的 `w-full`，保证与触发元素等宽） | 始终渲染 |
| `trigger` | 包裹默认插槽的触发外框，承载点击与悬停监听 | `inline-flex cursor-pointer` | 始终渲染；需要触发器撑满父容器时加 `w-full` |
| `panel` | 浮层内的内容排版容器，同时承载面板的悬停监听 | `px-[4px] py-[6px]` | 展开时渲染 |
| `header` | 页头容器 | `border-b border-gray-3 px-[10px] py-[6px] text-sm text-gray-6` | 仅提供 `header` 插槽时渲染 |
| `list` | 选项列表容器（`role="menu"`），`options` 或 `content` 插槽的内容放在这里 | `max-h-60 overflow-y-auto scrollbar-hide space-y-[4px]` | 展开时渲染；最大高度与行距改这里 |
| `item` | 单个选项，以及子菜单的入口行 | `rounded-sm px-[6px] py-[4px] text-base text-gray-6 hover:bg-gray-2`，禁用态 `data-[disabled=true]:opacity-50 pointer-events-none` | 每个 `RebornDoption` / `RebornDsubmenu` 渲染一个 |
| `itemIcon` | 选项左侧图标容器 | `flex size-4 shrink-0 items-center justify-center` | 仅提供 `icon` 插槽或 `options[].icon` 时渲染 |
| `itemLabel` | 选项文字节点 | `flex-1 truncate` | 始终随选项渲染 |
| `submenuIcon` | 子菜单入口行右侧的展开箭头 | `ml-auto size-4 shrink-0 text-gray-5` | 仅 `RebornDsubmenu` 入口行渲染 |
| `group` | 选项组容器（`role="group"`） | `space-y-[4px]` | 每个 `RebornDgroup` 渲染一个 |
| `groupTitle` | 选项组标题 | `px-[6px] py-[4px] text-sm text-gray-5` | 仅传 `title` 或提供 `title` 插槽时渲染 |
| `footer` | 页脚容器 | `border-t border-gray-3 px-[10px] py-[6px] text-sm text-gray-6` | 仅提供 `footer` 插槽时渲染 |

```vue
<template>
  <RebornDropdown
    :options="options"
    :ui="{
      panel: 'px-2 py-2',
      list: 'max-h-80',
      item: 'py-2 hover:bg-primary-1 hover:text-primary-6',
      itemIcon: 'text-gray-5',
      groupTitle: 'uppercase tracking-wide',
    }"
  >
    <RebornButton label="操作" />
  </RebornDropdown>
</template>
```

## 注意事项

- 仅 Web 端提供，UniApp 端暂无对应组件。若后续适配，Props 参数名与 Emit 事件名应保持一致。
- 浮层基于 `RebornSelectTrigger`，与 Select 共用同一套浮层外壳、定位与外部点击边界。12 向 `placement` 映射为它的 `side` / `align`，`show-arrow` 即它的箭头。浮层宽度由菜单内容撑开，不跟随触发器。
- `trigger="hover"` 基于鼠标移入 / 移出实现，移动端没有悬停，请使用默认的 `click`。
- `RebornDoption` / `RebornDsubmenu` / `RebornDgroup` 通过 `provide/inject` 与 `RebornDropdown` 通信，嵌套层级不受限制；脱离 Dropdown 单独使用时不带样式，点击也不会派发任何事件。
- Dropdown 不记录选中项，也不给选项加选中态。需要「当前选中哪一项」的高亮，请在 `content` 插槽里自行给对应 `RebornDoption` 传 `class`，或改用 `reborn-select`。
