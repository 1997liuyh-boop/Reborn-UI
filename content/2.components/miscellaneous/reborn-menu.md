---
title: 菜单
description: 用于站点侧边或顶部导航的菜单组件，支持垂直/水平模式、折叠与多级子菜单。
category: 导航
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornMenuDemo.vue" config="RebornMenuConfig" componentId="reborn-menu" :componentFiles='["reborn-menu.config.ts", "RebornMenu.vue", "RebornMenuItem.vue", "RebornMenuItemGroup.vue", "RebornSubMenu.vue"]'}
::

# API

## Menu Props

| 属性名               | 类型                         | 默认值       | 说明                                                                             |
| :------------------- | :--------------------------- | :----------- | :------------------------------------------------------------------------------- |
| `mode`               | `'horizontal' \| 'vertical'` | `'vertical'` | 菜单展示模式                                                                     |
| `collapse`           | `boolean`                    | `false`      | 是否折叠菜单，仅在 `mode="vertical"` 时生效                                      |
| `active`             | `string[]`                   | `[]`         | 当前激活路径。建议使用 `v-model:active` 进行双向绑定，父级节点会根据路径同步高亮 |
| `defaultOpeneds`     | `string[]`                   | `[]`         | 默认展开的子菜单 `index` 数组                                                    |
| `uniqueOpened`       | `boolean`                    | `false`      | 是否只保持一个子菜单展开                                                         |
| `menuTrigger`        | `'hover' \| 'click'`         | `'hover'`    | 子菜单的触发方式                                                                 |
| `router`             | `boolean`                    | `false`      | 是否启用 `vue-router` 模式。启用后点击菜单项会使用 `index` 作为 `path` 进行跳转  |
| `collapseTransition` | `boolean`                    | `true`       | 是否启用折叠动画                                                                 |
| `backgroundColor`    | `string`                     | `'#ffffff'`  | 菜单背景色                                                                       |
| `textColor`          | `string`                     | `'#303133'`  | 普通菜单项文字颜色                                                               |
| `activeTextColor`    | `string`                     | `'#409eff'`  | 激活菜单项文字颜色                                                               |

> `router` 为 `true` 时，请将 `RebornMenuItem` 的 `index` 设置为真实路由路径，例如 `/dashboard`。首次加载高亮项请通过 `v-model:active` 传入路径数组，例如 `['/dashboard']`。

## Menu Events

| 事件名          | 说明                   | 回调参数                                       |
| :-------------- | :--------------------- | :--------------------------------------------- |
| `update:active` | 当前激活路径变化时触发 | `(indexPath: string[]) => void`                |
| `select`        | 菜单项被激活时触发     | `(index: string, indexPath: string[]) => void` |
| `open`          | 子菜单展开时触发       | `(index: string, indexPath: string[]) => void` |
| `close`         | 子菜单收起时触发       | `(index: string, indexPath: string[]) => void` |

## Menu Methods

| 方法名         | 说明                           | 类型                            |
| :------------- | :----------------------------- | :------------------------------ |
| `open`         | 打开指定子菜单                 | `(index: string) => void`       |
| `close`        | 关闭指定子菜单                 | `(index: string) => void`       |
| `updateActive` | 通过路径数组手动更新当前激活项 | `(indexPath: string[]) => void` |

## Menu Slots

| 插槽名    | 说明     |
| :-------- | :------- |
| `default` | 菜单内容 |

## SubMenu Props

| 属性名         | 类型      | 默认值  | 说明         |
| :------------- | :-------- | :------ | :----------- |
| `index`        | `string`  | -       | 唯一标识     |
| `disabled`     | `boolean` | `false` | 是否禁用     |
| `popperOffset` | `number`  | `6`     | 弹出层偏移量 |

## SubMenu Slots

| 插槽名    | 说明       |
| :-------- | :--------- |
| `default` | 子菜单内容 |
| `title`   | 子菜单标题 |
| `icon`    | 子菜单图标 |

## MenuItem Props

| 属性名     | 类型               | 默认值  | 说明                                           |
| :--------- | :----------------- | :------ | :--------------------------------------------- |
| `index`    | `string`           | -       | 唯一标识。启用 `router` 模式时同时作为跳转路径 |
| `route`    | `string \| object` | -       | 预留路由参数                                   |
| `disabled` | `boolean`          | `false` | 是否禁用                                       |

## MenuItem Events

| 事件名  | 说明             | 回调参数                  |
| :------ | :--------------- | :------------------------ |
| `click` | 点击菜单项时触发 | `(index: string) => void` |

## MenuItem Slots

| 插槽名    | 说明       |
| :-------- | :--------- |
| `default` | 菜单项内容 |
| `icon`    | 菜单项图标 |

## MenuItemGroup Props

| 属性名  | 类型     | 默认值 | 说明     |
| :------ | :------- | :----- | :------- |
| `title` | `string` | -      | 分组标题 |

## MenuItemGroup Slots

| 插槽名    | 说明           |
| :-------- | :------------- |
| `default` | 分组内的菜单项 |
| `title`   | 自定义标题内容 |

## 示例代码

### 基础垂直菜单

```vue
<template>
  <RebornMenu
    v-model:active="activePath"
    mode="vertical"
  >
    <RebornMenuItem index="1">
      <template #icon>
        <Icon
          name="material-symbols:home"
          class="size-5"
        />
      </template>
      首页
    </RebornMenuItem>

    <RebornSubMenu index="2">
      <template #icon>
        <Icon
          name="material-symbols:settings"
          class="size-5"
        />
      </template>
      <template #title>系统管理</template>

      <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
      <RebornMenuItem index="2-2">角色管理</RebornMenuItem>
      <RebornMenuItem index="2-3">权限管理</RebornMenuItem>
    </RebornSubMenu>
  </RebornMenu>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RebornMenu, RebornSubMenu, RebornMenuItem } from "~/components/reborn/ui/reborn-menu";

const activePath = ref(["1"]);
</script>
```

### 水平菜单

```vue
<template>
  <RebornMenu
    v-model:active="activePath"
    mode="horizontal"
  >
    <RebornMenuItem index="1">首页</RebornMenuItem>
    <RebornSubMenu index="2">
      <template #title>系统管理</template>
      <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
      <RebornMenuItem index="2-2">角色管理</RebornMenuItem>
    </RebornSubMenu>
  </RebornMenu>
</template>
```

### Router 模式

```vue
<template>
  <RebornMenu
    v-model:active="activePath"
    router
  >
    <RebornMenuItem index="/dashboard">仪表盘</RebornMenuItem>
    <RebornMenuItem index="/users">用户管理</RebornMenuItem>
    <RebornMenuItem index="/settings">系统设置</RebornMenuItem>
  </RebornMenu>
</template>
```

### 折叠菜单

```vue
<template>
  <div>
    <button @click="isCollapse = !isCollapse">
      {{ isCollapse ? "展开" : "折叠" }}
    </button>

    <RebornMenu
      v-model:active="activePath"
      mode="vertical"
      :collapse="isCollapse"
    >
      <RebornMenuItem index="1">
        <template #icon>
          <Icon
            name="material-symbols:home"
            class="size-5"
          />
        </template>
        首页
      </RebornMenuItem>

      <RebornSubMenu index="2">
        <template #icon>
          <Icon
            name="material-symbols:settings"
            class="size-5"
          />
        </template>
        <template #title>系统管理</template>
        <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
      </RebornSubMenu>
    </RebornMenu>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const isCollapse = ref(false);
</script>
```

### 菜单项分组

```vue
<template>
  <RebornMenu
    v-model:active="activePath"
    mode="vertical"
  >
    <RebornSubMenu index="1">
      <template #title>数据分析</template>

      <RebornMenuItemGroup title="报表">
        <RebornMenuItem index="1-1">日报表</RebornMenuItem>
        <RebornMenuItem index="1-2">周报表</RebornMenuItem>
      </RebornMenuItemGroup>

      <RebornMenuItemGroup title="图表">
        <RebornMenuItem index="1-3">柱状图</RebornMenuItem>
        <RebornMenuItem index="1-4">折线图</RebornMenuItem>
      </RebornMenuItemGroup>
    </RebornSubMenu>
  </RebornMenu>
</template>
```
