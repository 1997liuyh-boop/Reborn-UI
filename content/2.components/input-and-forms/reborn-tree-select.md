---
title: Tree Select 树选择器
description: Web 层级选值：沿用 select 的三档尺寸与四种形态，下拉复用 tree，支持单选、独立多选和清空。
category: 输入与表单
tags: [tree-select, tree, select, form, web]
badge: New
navigation:
  badges:
    - label: Web
      color: primary
  chip:
    label: NEW
    color: primary
---

::warning
仅 Web 端组件。UniApp 层级选值请使用 `reborn-cascader`。
::

::ComponentViewer{demoFile="RebornTreeSelectDemo.vue" config="RebornTreeSelectConfig" componentId="reborn-tree-select" :componentFiles='["RebornTreeSelect.vue", "reborn-tree-select.config.ts"]' :uniappFiles='[]'}
::

## 简介

TreeSelect 把层级节点选择收进表单输入框，仅支持 Web，UniApp 暂无同名同构组件。

`color` 决定选择框与树的语义色，`variant` 决定描边、填充、无边框或下划线形态，`size` 决定选择框尺寸；三者直接复用 `reborn-select` 的主题。下拉内容由 `reborn-tree` 渲染，不另写一套树节点。

`multiple` 控制单选或独立复选，`clearable` 提供清空，`collapseTags` / `collapseTagsTooltip` / `maxCollapseTags` 控制标签折叠，`allowSearch` 按标题搜索；`closeOn` 与 `portal` 控制浮层行为；`fieldNames` 适配数据字段，`loadData` 支持异步补充子节点，`height` 与 `virtual` 控制树滚动区，`title` / `empty` 插槽定制内容。

### 何时使用

- 表单选择团队、目录或分类节点——用 `treeData` 保留父子结构。
- 多个层级节点需要分别选取——用 `multiple` 开启独立复选。
- 与普通下拉框并排展示——用一致的 `size`、`color`、`variant` 对齐外观。
- 子级数据按需获取——用 `loadData` 更新原始 `treeData`。

### 何时不使用

- 选项没有层级关系——改用 `reborn-select`。
- 需要逐级选完整路径——改用 `reborn-cascader`。
- 常驻展示目录、拖拽或父子联动勾选——改用 `reborn-tree`。

## 用法

### 基础用法

`treeData` 默认读取 `key`、`title`、`children`；单选回写节点 key，选中后自动收起。

```vue
<script setup lang="ts">
const value = ref<string | number | null>(null);
const treeData = [{ key: "team", title: "研发团队", children: [{ key: "web", title: "前端" }] }];
</script>
<template>
  <RebornTreeSelect
    v-model="value"
    :tree-data="treeData"
    default-expand-all
  />
</template>
```

### 颜色与变体

`variant` 与 `color` 和普通选择器共享配置，展开描边与树内选中色保持一致。

| 变体         | 外观       | 典型用途   |
| ------------ | ---------- | ---------- |
| `outlined`   | 背景与描边 | 常规表单   |
| `filled`     | 灰色填充   | 区分输入区 |
| `borderless` | 无边框     | 内联筛选   |
| `underlined` | 底部边框   | 紧凑编辑   |

| 语义色                  | 外观          | 典型用途       |
| ----------------------- | ------------- | -------------- |
| `primary` / `secondary` | 主色 / 辅色   | 常规与次级选值 |
| `success` / `info`      | 成功 / 信息色 | 状态分类       |
| `warning` / `error`     | 警告 / 错误色 | 需要注意的选值 |
| `neutral`               | 中性色        | 弱化视觉强调   |

```vue
<template>
  <div class="grid gap-3">
    <RebornTreeSelect
      :tree-data="treeData"
      color="primary"
      variant="outlined"
    />
    <RebornTreeSelect
      :tree-data="treeData"
      color="success"
      variant="filled"
    />
  </div>
</template>
```

### 尺寸

`size` 控制选择框高度与标签尺寸；表单项、表单容器的尺寸配置优先于组件自身。

| 尺寸 | 外观 | 典型用途 |
| ---- | ---- | -------- |
| `sm` | 紧凑 | 表格筛选 |
| `md` | 默认 | 常规表单 |
| `lg` | 宽松 | 重点输入 |

```vue
<template>
  <div class="grid gap-3">
    <RebornTreeSelect
      :tree-data="treeData"
      size="sm"
    />
    <RebornTreeSelect
      :tree-data="treeData"
      size="lg"
    />
  </div>
</template>
```

### 多选与清空

`multiple` 使用树的严格勾选模式，父子节点独立选取；`clearable` 清空时单选回写 `null`，多选回写 `[]`。

```vue
<script setup lang="ts">
const values = ref<(string | number)[]>(["web"]);
</script>
<template>
  <RebornTreeSelect
    v-model="values"
    :tree-data="treeData"
    multiple
    clearable
    default-expand-all
  />
</template>
```

### 标签折叠

多选时用 `collapseTags` 压缩标签，并通过 `collapseTagsTooltip` 查看隐藏项。

| 参数                  | 默认值  | 典型用途                            |
| --------------------- | ------- | ----------------------------------- |
| `collapseTags`        | `false` | 将超出数量的标签合并为 +N           |
| `collapseTagsTooltip` | `false` | 悬浮 +N 查看被折叠的标题            |
| `maxCollapseTags`     | `1`     | 调整折叠前保留数量，0 表示只显示 +N |

```vue
<template>
  <RebornTreeSelect
    v-model="values"
    :tree-data="treeData"
    multiple
    collapse-tags
    collapse-tags-tooltip
    :max-collapse-tags="1"
  />
</template>
```

### 搜索节点

`allowSearch` 在展开后将选择框切换为搜索输入框，按标题进行忽略大小写的包含匹配，保留命中节点和祖先并展开路径。

```vue
<template>
  <RebornTreeSelect
    v-model="values"
    :tree-data="treeData"
    multiple
    allow-search
    collapse-tags
    placeholder="输入团队名称"
  />
</template>
```

### 浮层行为

`closeOn` 与 `portal` 和 select 保持一致，用于适配滚动容器与外部交互。

| 参数 / 取值           | 行为                                     | 典型用途               |
| --------------------- | ---------------------------------------- | ---------------------- |
| `closeOn="click"`     | 外部完成点击后收起，默认                 | 常规表单               |
| `closeOn="mousedown"` | 外部按下或页面滚动时收起，内部滚动不关闭 | 需要即时收起的筛选     |
| `portal=true`         | 传送到 body，默认                        | 避免祖先 overflow 裁剪 |
| `portal=false`        | 留在触发器容器内                         | 跟随局部容器滚动       |

```vue
<template>
  <RebornTreeSelect
    v-model="value"
    :tree-data="treeData"
    close-on="mousedown"
    :portal="false"
  />
</template>
```

### 节点与空态插槽

`title` 插槽只修改下拉树的节点标题，选择框仍按数据中的标题字段回显；`empty` 覆盖空数据提示。

```vue
<template>
  <RebornTreeSelect :tree-data="treeData">
    <template #title="{ node }"
      ><strong>{{ node.title }}</strong></template
    >
    <template #empty>暂无可选团队</template>
  </RebornTreeSelect>
</template>
```

## API

### Props

| 属性                  | 类型                                                                                   | 默认值     | 描述                                                         |
| --------------------- | -------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `modelValue`          | `string \| number \| (string \| number)[] \| null`                                     | `null`     | 单选 key 或多选 key 数组，支持 `v-model`                     |
| `expandedKeys`        | `TreeKey[]`                                                                            | -          | 受控展开节点，支持 `v-model:expanded-keys`；不传时树内部维护 |
| `treeData`            | `TreeDataNode[]`                                                                       | `[]`       | 节点数据，与 tree 的数据格式一致                             |
| `fieldNames`          | `TreeFieldNames`                                                                       | -          | 映射 `title`、`key`、`children` 字段                         |
| `multiple`            | `boolean`                                                                              | `false`    | 独立复选，选后不收起                                         |
| `collapseTags`        | `boolean`                                                                              | `false`    | 多选标签超出数量时合并为 +N                                  |
| `collapseTagsTooltip` | `boolean`                                                                              | `false`    | 悬浮显示隐藏标签，需开启 collapseTags                        |
| `maxCollapseTags`     | `number`                                                                               | `1`        | 折叠前保留数量，负数按 0 处理                                |
| `allowSearch`         | `boolean`                                                                              | `false`    | 在选择框内搜索节点标题，保留祖先路径                         |
| `placeholder`         | `string`                                                                               | `请选择`   | 空值提示与默认无障碍名称                                     |
| `disabled`            | `boolean`                                                                              | `false`    | 禁用操作，继承表单禁用状态                                   |
| `clearable`           | `boolean`                                                                              | `false`    | 悬停显示清空按钮                                             |
| `size`                | `'sm' \| 'md' \| 'lg'`                                                                 | `md`       | 选择框尺寸；表单组尺寸优先                                   |
| `color`               | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `primary`  | 选择框与树共用语义色                                         |
| `variant`             | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'`                               | `outlined` | 选择框形态                                                   |
| `defaultExpandAll`    | `boolean`                                                                              | `false`    | 默认展开全部节点                                             |
| `defaultExpandedKeys` | `TreeKey[]`                                                                            | `[]`       | 默认展开节点；受控展开优先                                   |
| `showLine`            | `boolean \| TreeShowLineConfig`                                                        | `false`    | 展示树连接线                                                 |
| `showIcon`            | `boolean`                                                                              | `false`    | 显示节点图标                                                 |
| `loadData`            | `(node: TreeDataNode) => Promise<unknown>`                                             | -          | 异步加载，调用方写回 treeData                                |
| `height`              | `number`                                                                               | `240`      | 树滚动区高度，单位 px                                        |
| `virtual`             | `boolean`                                                                              | `true`     | 树的定高虚拟滚动                                             |
| `emptyText`           | `string`                                                                               | `暂无数据` | 无数据文案                                                   |
| `portal`              | `boolean`                                                                              | `true`     | 将浮层传送到 body，避免祖先裁剪                              |
| `closeOn`             | `'click' \| 'mousedown'`                                                               | `click`    | 外部关闭时机                                                 |
| `autoAdjustOverflow`  | `boolean`                                                                              | `true`     | 下方空间不足时向上展开                                       |
| `class`               | `ClassValue`                                                                           | -          | 根容器类名                                                   |
| `triggerUi`           | `SelectTriggerUI & SelectFieldUI`                                                      | -          | 选择框与浮层的 Tailwind 覆盖                                 |
| `ui`                  | `TreeSelectUI`                                                                         | -          | 下拉内容、空态和标签覆盖                                     |
| `treeUi`              | `TreeUI`                                                                               | -          | 透传树内部的 Tailwind 覆盖                                   |

### Emits

| 事件名                | 参数                     | 描述                           |
| --------------------- | ------------------------ | ------------------------------ |
| `update:modelValue`   | `value: TreeSelectValue` | 回写选中值                     |
| `update:expandedKeys` | `keys: TreeKey[]`        | 回写展开节点                   |
| `change`              | `value: TreeSelectValue` | 用户选取、移除标签或清空时触发 |
| `search`              | `value: string`          | 用户输入搜索关键词时触发       |
| `clear`               | -                        | 点击清空按钮时触发             |
| `visibleChange`       | `open: boolean`          | 浮层开关变化                   |

### Slots

| 插槽名  | 参数                                                           | 描述                                            |
| ------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `title` | `{ node: TreeDataNode, selected: boolean, expanded: boolean }` | 自定义树标题；多选走勾选态，selected 不代表勾选 |
| `empty` | -                                                              | 自定义空数据文案                                |

### Expose

无公开实例方法。

### 自定义样式（ui）

`ui` 以 Tailwind 类覆盖内容区；`triggerUi` 沿用 select 的同名入口，`treeUi` 沿用 tree 的键位。

| 键名          | 说明                                             |
| ------------- | ------------------------------------------------ |
| `dropdown`    | 下拉内边距；默认取消外层限高和滚动，仅树自身滚动 |
| `empty`       | 默认居中、灰色提示；有树数据时不渲染             |
| `tagList`     | 多选标签容器；单选或无值时不渲染                 |
| `collapseTag` | +N 标签样式；仅多选折叠产生隐藏项时渲染          |
| `tag`         | 标签底色、边框、圆角；单选或无值时不渲染         |

```vue
<RebornTreeSelect
  :tree-data="treeData"
  :trigger-ui="{ trigger: 'rounded-xl' }"
  :ui="{ empty: 'text-gray-6' }"
/>
```

### CSS 变量

复用选择器与树的语义 token，不增加私有 CSS 变量。灰阶与主题色定义在 `app/assets/theme/base.css`；尺寸变量定义在 `app/assets/theme/typography.css`。

| 变量                | 默认值 | 用途           |
| ------------------- | ------ | -------------- |
| `--height-input-sm` | `24px` | 小号选择框高度 |
| `--height-input-md` | `32px` | 中号选择框高度 |
| `--height-input-lg` | `40px` | 大号选择框高度 |

## 注意事项

- **搜索不修改原始数据或清除隐藏的已选值**。匹配使用 `fieldNames.title` 映射后的标题；无匹配显示空态。多选勾选后清空关键词便于连续搜索，关闭时也会清理关键词并恢复原展开状态。
- **折叠提示依赖折叠开关**。`collapseTagsTooltip` 仅在多选、开启 `collapseTags` 且确有隐藏标签时生效。

- **多选不做父子联动**。内部树固定 `checkStrictly`，选择父节点不会选中子节点，移除标签也只影响自身。
- **节点 key 必须全树唯一且类型稳定**。数字 `0` 与字符串 `'0'` 是不同值；异步数据尚未到达时暂用 key 回显，数据更新后自动显示标题。
- **禁用节点不能通过标签单独移除**。节点 `disabled` 或 `disableCheckbox` 会关闭标签删除；组件未禁用时，清空按钮仍可重置整个字段。
- **虚拟滚动依赖树的固定行高**。标题插槽避免多行内容，否则滚动切片会错位；需要可变高度时关闭 `virtual` 并谨慎覆盖 `treeUi`。
- **异步加载不代改数据**。`loadData` 中需由调用方把子节点写入响应式 `treeData`，叶子节点标记 `isLeaf`。
- **选择框样式直接复用 select**。标签、描边与浮层跟随公共主题；仅修改树内容样式时使用 `treeUi`，不要覆盖触发器。
