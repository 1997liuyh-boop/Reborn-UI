---
title: 标签页 Tabs
description: 用于在多个内容区之间切换的标签页组件，web 端为组合式子组件、uniapp 端为数据驱动单组件。
category: 导航
tags: [css, tailwind, tabs]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
---

::ComponentViewer{demoFile="RebornTabsDemo.vue" config="RebornTabsConfig" componentId="reborn-tabs" :componentFiles='["TabsRoot.vue", "TabsList.vue", "TabsTrigger.vue", "TabsContent.vue", "reborn-tabs.config.ts"]'}
::

## 简介

Tabs 用于页面内多个内容区之间的平级切换，双端实现形态不同：**Web 端**是组合式子组件——`TabsRoot` 提供上下文，内部自由组织 `TabsList` / `TabsTrigger` / `TabsContent`，以 `v-model:active`（索引）驱动，支持 `line` / `card` 两种样式、横竖布局、吸顶、滚动导航与滑动手势切换；**UniApp 端**是单组件 `RebornTabs`，由 `list` 数组数据驱动渲染标签项，以 `v-model`（选中项的 `value`）驱动，内置横向滚动居中与下划线/滑块动画。

适用场景：

- 页面内分区切换内容（`line` / `card` 样式，横向或纵向布局）。
- Web 端需要自由组织标签与内容结构，或需要吸顶（`sticky`）/ 滚动导航（`scrollspy`）。
- UniApp 端用数据数组快速渲染一行可滚动标签。

不适用场景：

- 页面底部全局导航，改用 `reborn-tabbar`（仅 uniapp）。
- 内容折叠展开，改用 `reborn-collapse`。

## 用法

### Web 端基础用法（组合式）

`TabsRoot` 上用 `v-model:active` 绑定激活索引（非受控时用 `defaultActive` 设初值），`type` 切换 `line` / `card` 样式，`variant` / `size` / `orientation` 控制配色、尺寸与横竖布局。`TabsTrigger` 与 `TabsContent` 通过 `index` 一一对应。

```vue
<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "~/components/reborn/ui/reborn-tabs";

const active = ref(0);
</script>

<template>
  <TabsRoot v-model:active="active" type="line" variant="primary" size="md">
    <TabsList>
      <TabsTrigger :index="0">账户</TabsTrigger>
      <TabsTrigger :index="1">密码</TabsTrigger>
      <TabsTrigger :index="2" disabled>账单</TabsTrigger>
    </TabsList>
    <TabsContent :index="0">账户信息</TabsContent>
    <TabsContent :index="1">修改密码</TabsContent>
    <TabsContent :index="2">账单详情</TabsContent>
  </TabsRoot>
</template>
```

### Web 端滑动切换与滚动导航

`swipeable` 开启后在内容区滑动超过 50px 即切换上/下一个标签；`sticky` 让标签列表在页面滚动时吸顶；`scrollspy` 开启滚动导航模式——所有内容平铺展示，点击标签平滑滚动到对应区块，滚动时经 IntersectionObserver 反向高亮当前标签。

```vue
<template>
  <TabsRoot v-model:active="active" sticky scrollspy swipeable @click-tab="(i, e) => console.log(i)">
    <TabsList>
      <TabsTrigger v-for="(t, i) in tabs" :key="t" :index="i">{{ t }}</TabsTrigger>
    </TabsList>
    <TabsContent v-for="(t, i) in tabs" :key="t" :index="i">
      <div class="min-h-[400px]">{{ t }} 的内容</div>
    </TabsContent>
  </TabsRoot>
</template>
```

### Web 端插槽定制

`TabsTrigger` 提供 `leading-icon` / `leading-avatar`（文本前图标、头像区）、`label`（文本区）、`trailing-badge`（文本后徽标区）四个具名插槽；`TabsList` 的 `indicator` 插槽可替换激活指示器，作用域提供含 `--radix-tabs-indicator-width` / `--radix-tabs-indicator-position` 定位变量的 `style`。

```vue
<template>
  <TabsRoot v-model:active="active" type="line">
    <TabsList>
      <TabsTrigger :index="0">
        <template #leading-icon><span class="i-lucide-inbox" /></template>
        消息
        <template #trailing-badge>99+</template>
      </TabsTrigger>
      <TabsTrigger :index="1">设置</TabsTrigger>
      <template #indicator="{ style }">
        <span :style="style" class="absolute bottom-0 h-1 rounded-full bg-pink-500 transition-all" />
      </template>
    </TabsList>
    <TabsContent :index="0">收件箱</TabsContent>
    <TabsContent :index="1">偏好设置</TabsContent>
  </TabsRoot>
</template>
```

### UniApp 端数据驱动用法

单组件 `RebornTabs` 由 `list` 数组（每项 `{ label, value, disabled? }`）驱动，`v-model` 绑定选中项的 `value`；`variant` 支持 `line`（渐变下划线）与 `card`（滑块卡片），`fill` 使标签等宽填满，`justify` 控制未填满时的对齐；`item` 插槽（作用域 `{ item, active }`）可自定义单个标签内容。

```vue
<script setup lang="ts">
import RebornTabs from "@/components/reborn-tabs/RebornTabs.vue";

const active = ref("1");
const tabs = [
  { label: "推荐", value: "1" },
  { label: "关注", value: "2" },
  { label: "热榜", value: "3", disabled: true },
];
</script>

<template>
  <RebornTabs
    v-model="active"
    :list="tabs"
    variant="card"
    size="md"
    fill
    :ui="{ item: 'h-[72rpx]' }"
    @change="(value, item, index) => console.log(value)"
  />
</template>
```

## API

双端 API 形态不同：标准表格中标注了各成员的生效端；Web 端各子组件的 Props 见后续小节。

### Props

以下为 **UniApp 端**单组件 `RebornTabs` 的属性：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | - | 当前选中标签的 `value`，支持 `v-model`。 |
| `list` | `TabsItem[]` | `[]` | 标签项数据数组，每项 `{ label, value, disabled? }`。 |
| `variant` | `"line" \| "card"` | `"line"` | 标签样式：`line` 渐变下划线；`card` 滑块卡片。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 主题色（下划线渐变 / 卡片滑块背景）。 |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"xs"` | 标签尺寸。 |
| `fill` | `boolean` | `false` | 标签等宽填满容器宽度。 |
| `justify` | `"start" \| "center" \| "end"` | `"start"` | 标签未填满容器时的整体对齐方式。 |
| `disabled` | `boolean` | `false` | 禁用整个标签组（单项禁用用 `list` 项的 `disabled`）。 |
| `customClass` | `string` | - | 追加到根节点的自定义类名。 |
| `ui` | `object` | - | 覆盖内部节点类名，见下方「自定义样式（ui）」。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value, item, index)` | **仅 UniApp**。选中值变化时触发（`v-model` 同步）。 |
| `change` | `(value, item, index)` | **仅 UniApp**。切换标签后触发，`item` 为选中项数据、`index` 为其索引。 |
| `update:active` | `(value: number)` | **仅 Web**（TabsRoot）。激活索引变化时触发（`v-model:active` 同步）。 |
| `click-tab` | `(value: number, event: MouseEvent)` | **仅 Web**（TabsRoot）。点击某个标签时触发，参数为该标签索引与原生鼠标事件。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `item` | `{ item, active }` | **仅 UniApp**。自定义单个标签内容，`item` 含 `label` / `value` / `disabled` / `isActive`。 |
| `default` | TabsRoot 上为 `{ ui, uiOverrides }` | **仅 Web**。各子组件的内容插槽：`TabsRoot` 放置 List 与 Content，`TabsList` 放置 Trigger，`TabsTrigger` 为标签文本兜底，`TabsContent` 为面板内容。 |
| `indicator` | `{ style, class }` | **仅 Web**（TabsList）。自定义激活指示器，`style` 携带 `--radix-tabs-indicator-*` 定位变量。 |
| `leading-icon` | - | **仅 Web**（TabsTrigger）。标签文本前的图标区。 |
| `leading-avatar` | - | **仅 Web**（TabsTrigger）。标签文本前的头像区（圆形裁剪容器）。 |
| `label` | - | **仅 Web**（TabsTrigger）。标签文本区，优先于默认插槽渲染。 |
| `trailing-badge` | - | **仅 Web**（TabsTrigger）。标签文本后的徽标区。 |

### Expose

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `activeIndex` | `Ref<number>` | **仅 Web**（TabsRoot）。当前激活的标签索引，可读可写，写入即切换标签。 |

### TabsRoot Props

Web 端根组件 `TabsRoot` 的属性：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `active` | `number` | `0` | 当前激活的 Tab 索引（`v-model:active`）。 |
| `defaultActive` | `number` | `0` | 非受控模式下默认激活的 Tab 索引。 |
| `type` | `"line" \| "card"` | `"line"` | Tabs 样式类型：`line` 下划线；`card` 圆角卡片。 |
| `variant` | `"primary" \| "info" \| "success" \| "warning" \| "neutral"` | `"primary"` | 颜色变体。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸。 |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | 布局方向。 |
| `sticky` | `boolean` | `false` | 是否开启吸顶布局（标签列表随页面滚动吸附在顶部）。 |
| `swipeable` | `boolean` | `false` | 是否开启滑动手势切换：在内容区滑动超过 50px 时切换上/下一个标签。 |
| `shrink` | `boolean` | `false` | 是否开启收缩布局（标签向左侧收缩对齐，不再平分宽度）。 |
| `scrollspy` | `boolean` | `false` | 是否开启滚动导航模式（内容平铺展示，滚动反向高亮标签）。 |
| `activationMode` | `"automatic" \| "manual"` | `"automatic"` | 激活模式：`automatic` 点击即激活；`manual` 预留给键盘导航手动确认场景。 |
| `class` | `ClassValue` | - | 追加到根元素的自定义类名。 |
| `ui` | `object` | - | 覆盖内部节点类名，见下方「自定义样式（ui）」。 |

### TabsList Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `class` | `any` | - | 追加到标签列表容器的自定义类名。 |

### TabsTrigger Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `index` | `number` | 按注册顺序分配 | 该触发器对应的索引，须与目标 `TabsContent` 的 `index` 一致。 |
| `disabled` | `boolean` | `false` | 是否禁用该标签。 |
| `class` | `any` | - | 追加到触发器按钮的自定义类名。 |

### TabsContent Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `index` | `number` | 按注册顺序分配 | 该内容面板对应的索引。 |
| `class` | `any` | - | 追加到内容面板的自定义类名。 |

### 自定义样式（ui）

Web 端 `TabsRoot` 的 `ui` 按以下键覆盖对应节点类名：`root`、`list`、`indicator`、`trigger`、`leadingIcon`、`leadingAvatar`、`leadingAvatarSize`、`label`、`trailingBadge`、`trailingBadgeSize`、`content`。

UniApp 端 `RebornTabs` 的 `ui` 键为：

| 键名 | 说明 |
| --- | --- |
| `tabs` | 根容器。 |
| `scrollbar` | 横向滚动容器。 |
| `inner` | 标签行内层容器。 |
| `item` | 单个标签项。 |
| `text` | 未选中标签文本。 |
| `active` | 选中标签文本。 |
| `line` | `line` 样式的渐变下划线。 |
| `slider` | `card` 样式的滑块背景。 |

## 注意事项

- 双端 API 形态不同：Web 端由 `TabsRoot` / `TabsList` / `TabsTrigger` / `TabsContent` 组合，子组件必须放在 Root 内（依赖注入 context）；UniApp 端为单组件 `RebornTabs`。合并展示的属性只在各自端生效（如 `list` / `fill` 仅 uniapp，`active` / `type` / `scrollspy` 仅 web），以对应端源码为准。
- 激活绑定两套写法：Web 端 `v-model:active` 绑定**索引**（number，初值可用 `defaultActive`）；UniApp 端 `v-model` 绑定选中项的 **value**（string | number）。
- `variant` 双端语义不同：Web 端是颜色变体（样式类型用 `type`）；UniApp 端是样式类型（`line` / `card`，颜色用 `color`）。
- Web 端 `TabsTrigger` / `TabsContent` 建议显式传 `index` 并一一对应；缺省时按挂载顺序自动分配，条件渲染下顺序可能与预期不符。
- `scrollspy` 开启后所有内容平铺展示（不再单面板切换），内容区块的吸顶偏移由 `content` 节点的 `scroll-mt` 类控制。
- UniApp 端通过 `uni.createSelectorQuery` 测量下划线/滑块位置，`list` 或 `size` 等属性变化后约 50ms 延迟刷新；选中值与 `value` 用宽松相等（`==`）比较，`"1"` 与 `1` 视为相同。
- UniApp 端 `disabled`（整组）与 `list` 项的 `disabled`（单项）任一生效时点击均无效；默认的置灰样式只作用于内置文本，使用自定义 `item` 插槽时禁用态样式需自行渲染。
