---
title: Tree Select 树选择器
description: Web 层级选值：沿用 select 的三档尺寸与四种形态，下拉复用 tree，支持单选、父子联动或独立勾选的多选，以及清空。
category: 表单与输入
platform: web
tags: [tree-select, tree, select, form, web]
badge: New
---

::warning
仅 Web 端组件。UniApp 层级选值请使用 `reborn-cascader`。
::

::ComponentViewer{demoFile="RebornTreeSelectDemo.vue" config="RebornTreeSelectConfig" componentId="reborn-tree-select" :componentFiles='["RebornTreeSelect.vue", "reborn-tree-select.config.ts"]' :uniappFiles='[]'}
::

## 简介

TreeSelect 把层级节点选择收进表单输入框，仅支持 Web，UniApp 暂无同名同构组件。

`color` 决定选择框与树的语义色，`variant` 决定描边、填充、无边框或下划线形态，`size` 决定选择框尺寸；三者直接复用 `reborn-select` 的主题。下拉内容由 `reborn-tree` 渲染，不另写一套树节点。

`multiple` 开启复选并默认父子联动，`checkStrictly` 改为逐节点独立勾选，`clearable` 提供清空，`collapseTags` / `collapseTagsTooltip` / `maxCollapseTags` 控制标签折叠，`allowSearch` 默认关闭，开启后按 key 与标题搜索，`searchData` 提供异步搜索；`closeOn` 与 `portal` 控制浮层行为；`fieldNames` 适配标题、唯一标识与子节点字段（绑定值按 `fieldNames.key` 识别节点），`loadData` 支持异步补充子节点并由 `loadedKeys` 记录已加载节点，`height` 与 `virtual` 控制树滚动区，`item` / `empty` 插槽定制内容。

### 何时使用

- 表单选择团队、目录或分类节点——用 `treeData` 保留父子结构。
- 选中父级即代表选中整组子级——用 `multiple` 开启联动复选。
- 父子节点含义各自独立、需要分别选取——在 `multiple` 之外再开 `checkStrictly`。
- 与普通下拉框并排展示——用一致的 `size`、`color`、`variant` 对齐外观。
- 子级数据按需获取——用 `loadData` 更新原始 `treeData`。

### 何时不使用

- 选项没有层级关系——改用 `reborn-select`。
- 需要逐级选完整路径——改用 `reborn-cascader`。
- 常驻展示目录或拖拽调整层级——改用 `reborn-tree`。

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

### 多选与父子联动

`multiple` 开启复选，默认父子联动：可勾选的子级全部选中时父级随之选中，部分选中时父级显示半选；勾选父级会带上全部可勾选后代，取消子级会连带取消祖先。节点 `disabled` 或 `disableCheckbox` 不参与联动，父级是否全选只看其余子级。`checkStrictly` 切断联动，各节点独立勾选，移除标签也只影响自身。`clearable` 清空时单选回写 `null`，多选回写 `[]`。

| 模式            | 勾选父级           | 绑定值                     | 典型用途                         |
| --------------- | ------------------ | -------------------------- | -------------------------------- |
| 联动（默认）    | 带上全部可勾选后代 | 全部勾选节点，含父级与子级 | 按部门批量选人                   |
| `checkStrictly` | 只勾选自身         | 仅用户勾选的节点           | 父子含义独立，如分类与子分类分授 |

```vue
<script setup lang="ts">
const values = ref<(string | number)[]>(["web"]);
const strictValues = ref<(string | number)[]>(["team"]);
</script>
<template>
  <div class="grid gap-3">
    <RebornTreeSelect
      v-model="values"
      :tree-data="treeData"
      multiple
      clearable
      default-expand-all
    />
    <RebornTreeSelect
      v-model="strictValues"
      :tree-data="treeData"
      multiple
      check-strictly
      clearable
      default-expand-all
    />
  </div>
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

`allowSearch` 默认 `false`，开启后在展开时将选择框切换为搜索输入框，同时对 key 和显示标题进行忽略大小写的包含匹配，保留命中节点和祖先并展开路径。`fieldNames.key` 映射标识字段，`fieldNames.title` 映射显示标题（例如后端的 `label` 字段）；数值 key 也支持搜索。

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

### 异步搜索

`allowSearch` 配合 `searchData` 使用。与 `loadData` 一样，回调返回 Promise，并由调用方更新响应式 `treeData`；组件管理加载和失败提示，直接展示服务端结果，不再本地筛选。两者可同时配置：搜索替换结果集，展开节点时由 `loadData` 补充子级。

```vue
<script setup lang="ts">
import type { TreeSelectSearchContext } from '~/components/reborn/ui/reborn-tree-select';

const treeData = ref([]);
async function searchData(keyword: string, { signal }: TreeSelectSearchContext) {
  const response = await fetch(`/api/teams?keyword=${encodeURIComponent(keyword)}`, { signal });
  if (!response.ok) throw new Error('搜索失败');
  const nodes = await response.json();
  if (!signal.aborted) treeData.value = nodes;
}
</script>
<template>
  <RebornTreeSelect :tree-data="treeData" allow-search :search-data="searchData" />
</template>
```

用户输入时才调用回调，传入去除首尾空白但保留大小写的关键词；手动清空时也会传入空字符串，接口可据此恢复根节点。仅配置 `searchData` 不会开启搜索。关键词变化、关闭面板、禁用搜索或卸载时会取消旧 `signal`；回调需把它传给请求，并在写回数据前检查 `signal.aborted`。关闭时清理输入，不额外请求或还原调用方的数据。

### 浮层行为

`closeOn` 与 `portal` 和 select 保持一致，用于适配滚动容器与外部交互。`closeOn` 默认 `mousedown`，面板内部的树滚动不算外部，不会收起。

| 参数 / 取值           | 行为                                     | 典型用途               |
| --------------------- | ---------------------------------------- | ---------------------- |
| `closeOn="mousedown"` | 外部按下或页面滚动时收起，默认           | 多数表单与筛选         |
| `closeOn="click"`     | 外部完成点击后收起，页面滚动时跟随       | 边滚动边对照再选       |
| `portal=true`         | 传送到 body，默认                        | 避免祖先 overflow 裁剪 |
| `portal=false`        | 留在触发器容器内                         | 跟随局部容器滚动       |

```vue
<template>
  <RebornTreeSelect
    v-model="value"
    :tree-data="treeData"
    close-on="click"
    :portal="false"
  />
</template>
```

### 节点与空态插槽

`item` 插槽自定义下拉树的节点内容，接收原始 `node`、选中态 `selected` 与展开态 `expanded`，可组合图标、标题及附加说明；它只替换节点标题区，展开箭头、勾选框与点击选中仍由树处理。选择框仍按数据中的标题字段回显。`empty` 覆盖空数据提示。

```vue
<template>
  <RebornTreeSelect :tree-data="treeData">
    <template #item="{ node, selected, expanded }">
      <span class="flex items-center gap-2">
        <Icon :name="expanded ? 'lucide:folder-open' : 'lucide:folder'" />
        <span>{{ node.title }}</span>
        <Icon v-if="selected" name="lucide:check" />
      </span>
    </template>
    <template #empty>暂无可选团队</template>
  </RebornTreeSelect>
</template>
```

### 绑定值字段

`v-model` 默认读取节点的 `key` 字段。后端数据用别的字段作唯一标识时（如行政区划的 `code`），用 `fieldNames.key` 指定，绑定值、标签回显、搜索与父子联动都改按该字段识别节点。`fieldNames` 里没给出的 `title` / `children` 仍读默认字段名，只改唯一标识时传 `{ key: 'code' }` 即可。

```vue
<script setup lang="ts">
const regions = [{ code: '330000', label: '浙江省', children: [{ code: '330100', label: '杭州市' }] }];
const region = ref('330100');
</script>

<template>
  <RebornTreeSelect v-model="region" :tree-data="regions" :field-names="{ key: 'code', title: 'label' }" allow-search />
</template>
```

### 异步加载

`loadData` 在展开未加载的节点时调用，返回 Promise；组件不改数据，需在函数里把子节点写入响应式 `treeData`，叶子节点标记 `isLeaf: true` 不再显示展开箭头。已加载的节点 key 由选择器记录，收起下拉后再展开不会重复请求，子级为空的节点也会按叶子显示；需要持久化或手动重置时用 `v-model:loaded-keys` 接管。

```vue
<script setup lang="ts">
const treeData = ref([{ key: 'root', title: '总部' }]);
const loadedKeys = ref<string[]>([]);

async function loadData(node: TreeDataNode) {
  const children = await fetchDepartments(node.key);
  node.children = children.map(item => ({ ...item, isLeaf: !item.hasChildren }));
}
</script>

<template>
  <RebornTreeSelect v-model="value" v-model:loaded-keys="loadedKeys" :tree-data="treeData" :load-data="loadData" />
</template>
```

## API

### Props

`RebornTreeSelect` 由选择框（`RebornSelectTrigger` 及其下拉浮层）和浮层内的 `RebornTree` 组合而成，描述列开头的标注说明参数作用于哪一部分：〔选择框〕只影响触发器与浮层，〔树〕作用于内部的 `RebornTree`，〔共用〕同时作用于两者。交互演练的控制面板按同一口径分组。

| 属性名                | 类型                                                                                   | 默认值     | 描述                                                                             |
| --------------------- | -------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelValue`          | `string \| number \| (string \| number)[] \| null`                                     | `null`     | 〔共用〕单选 key 或多选 key 数组，支持 `v-model`                                 |
| `expandedKeys`        | `TreeKey[]`                                                                            | -          | 〔树〕受控展开节点，支持 `v-model:expanded-keys`；不传时树内部维护               |
| `treeData`            | `TreeDataNode[]`                                                                       | `[]`       | 〔树〕节点数据，与 tree 的数据格式一致                                           |
| `fieldNames`          | `TreeFieldNames`                                                                       | -          | 〔共用〕映射 `title`、`key`、`children` 字段；绑定值按映射后的 `key` 识别节点    |
| `multiple`            | `boolean`                                                                              | `false`    | 〔共用〕开启复选，选后不收起；选择框改为标签回显，树切换为勾选模式，默认父子联动 |
| `checkStrictly`       | `boolean`                                                                              | `false`    | 〔树〕多选时父子勾选互不关联，各节点独立勾选                                     |
| `collapseTags`        | `boolean`                                                                              | `false`    | 〔选择框〕多选标签超出数量时合并为 +N                                            |
| `collapseTagsTooltip` | `boolean`                                                                              | `false`    | 〔选择框〕悬浮显示隐藏标签，需开启 collapseTags                                  |
| `maxCollapseTags`     | `number`                                                                               | `1`        | 〔选择框〕折叠前保留数量，负数按 0 处理                                          |
| `allowSearch`         | `boolean`                                                                              | `false`    | 〔选择框〕搜索 key 与显示标题，按 fieldNames 映射字段，保留祖先路径              |
| `searchData`          | `(value: string, context: TreeSelectSearchContext) => Promise<unknown>`                  | -          | 〔选择框〕异步搜索，需开启 allowSearch；调用方写回 treeData，context.signal 用于取消旧请求 |
| `placeholder`         | `string`                                                                               | `请选择`   | 〔选择框〕空值提示与默认无障碍名称                                               |
| `disabled`            | `boolean`                                                                              | `false`    | 〔共用〕禁用选择框与树的全部操作，继承表单禁用状态                               |
| `clearable`           | `boolean`                                                                              | `false`    | 〔选择框〕悬停显示清空按钮                                                       |
| `size`                | `'sm' \| 'md' \| 'lg'`                                                                 | `md`       | 〔选择框〕尺寸档位；显式设置时优先于所在表单的 `size`，未设置时跟随表单                                   |
| `color`               | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `primary`  | 〔共用〕语义色，同时决定选择框描边与树的选中色                                   |
| `variant`             | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'`                               | `outlined` | 〔选择框〕形态变体                                                               |
| `defaultExpandAll`    | `boolean`                                                                              | `false`    | 〔树〕默认展开全部节点                                                           |
| `defaultExpandedKeys` | `TreeKey[]`                                                                            | `[]`       | 〔树〕默认展开节点；受控展开优先                                                 |
| `showLine`            | `boolean \| TreeShowLineConfig`                                                        | `false`    | 〔树〕展示连接线                                                                 |
| `showIcon`            | `boolean`                                                                              | `false`    | 〔树〕显示节点图标                                                               |
| `loadData`            | `(node: TreeDataNode) => Promise<unknown>`                                             | -          | 〔树〕异步加载，调用方写回 treeData                                              |
| `loadedKeys`          | `TreeKey[]`                                                                            | -          | 〔树〕已完成异步加载的节点，支持 `v-model:loaded-keys`；不传时选择器内部记录     |
| `height`              | `number`                                                                               | `240`      | 〔树〕滚动区最大高度，单位 px；节点少时面板按内容撑开                            |
| `virtual`             | `boolean`                                                                              | `true`     | 〔树〕定高虚拟滚动                                                               |
| `emptyText`           | `string`                                                                               | `暂无数据` | 〔选择框〕浮层内无数据时的文案；搜索无结果时固定显示「无匹配结果」               |
| `portal`              | `boolean`                                                                              | `true`     | 〔选择框〕将浮层传送到 body，避免祖先裁剪                                        |
| `closeOn`             | `'click' \| 'mousedown'`                                                               | `mousedown` | 〔选择框〕外部关闭时机，`mousedown` 外部按下、滚轮或页面滚动即收，`click` 外部完成点击后收                                                        |
| `autoAdjustOverflow`  | `boolean`                                                                              | `true`     | 〔选择框〕下方空间不足时向上展开                                                 |
| `class`               | `ClassValue`                                                                           | -          | 〔选择框〕根容器类名                                                             |
| `triggerUi`           | `SelectTriggerUI & SelectFieldUI`                                                      | -          | 〔选择框〕触发器与浮层外壳的 Tailwind 覆盖                                       |
| `ui`                  | `TreeSelectUI`                                                                         | -          | 〔选择框〕下拉内容、空态和标签覆盖                                               |
| `treeUi`              | `TreeUI`                                                                               | -          | 〔树〕原样透传给 `RebornTree` 的 `ui`                                            |

### Emits

标注口径同 Props：〔共用〕事件在树上点选与选择框内移除标签、清空时都会触发。

| 事件名                | 回调参数                 | 描述                                   |
| --------------------- | ------------------------ | -------------------------------------- |
| `update:modelValue`   | `value: TreeSelectValue` | 〔共用〕回写选中值                     |
| `update:expandedKeys` | `keys: TreeKey[]`        | 〔树〕回写展开节点                     |
| `update:loadedKeys`   | `keys: TreeKey[]`        | 〔树〕节点异步加载完成后回写           |
| `change`              | `value: TreeSelectValue` | 〔共用〕用户选取、移除标签或清空时触发 |
| `search`              | `value: string`          | 〔选择框〕用户输入搜索关键词时触发     |
| `clear`               | -                        | 〔选择框〕点击清空按钮时触发           |
| `visibleChange`       | `open: boolean`          | 〔选择框〕浮层开关变化                 |

### Slots

| 插槽名  | 作用域参数                                                     | 描述                                                    |
| ------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| `item` | `{ node: TreeDataNode, selected: boolean, expanded: boolean }` | 〔树〕自定义节点内容，替换树的节点标题区；多选的 selected 不代表勾选 |
| `empty` | -                                                              | 〔选择框〕自定义空数据文案                              |

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

复用选择器与树的语义 token，不增加私有 CSS 变量。灰阶与主题色定义在 `app/assets/theme/base.css`，字号定义在 `app/assets/theme/typography.css`；选择框高度使用 `app/assets/css/reborn-ui.css` 引入的 Tailwind 原生尺寸刻度，随 `--spacing`（默认 `0.25rem`）缩放。

| `size` | 高度类名 | 默认根字号 16px 时 |
| --- | --- | --- |
| `sm` | `h-6` | `24px` |
| `md` | `h-8` | `32px` |
| `lg` | `h-10` | `40px` |

## 注意事项

- **本地搜索不修改原始数据或清除隐藏的已选值**。匹配使用 `fieldNames.key` 与 `fieldNames.title` 映射后的字段；无匹配显示空态。多选勾选后清空关键词便于连续搜索，关闭时也会清理关键词并恢复原展开状态。
- **异步搜索与节点加载都由调用方管理数据**。`searchData` 与 `loadData` 均等待 Promise，由回调写回 `treeData`；搜索结果不再本地过滤。`searchData` 的第二个参数包含取消信号 `signal`，旧请求完成前需检查取消状态，防止覆盖新结果。替换结果集时需自行保留已选节点数据，否则标签按未知 key 回显；同时使用懒加载并需要重载同一 key 时清空 `loadedKeys`。回调拒绝时显示失败提示，再次输入可重试。
- **折叠提示依赖折叠开关**。`collapseTagsTooltip` 仅在多选、开启 `collapseTags` 且确有隐藏标签时生效。
- **联动模式的绑定值包含全部勾选节点**。父级全选时父级 key 与各子级 key 同时回写；搜索时勾选父级，被搜索隐藏的后代也会一并勾选。程序赋值只按联动规则归一显示（补齐后代、推导半选），不会回写 `v-model`，用户下一次勾选或移除标签时才写回归一后的完整集合。需要原样取值时开启 `checkStrictly`。
- **节点 key 必须全树唯一且类型稳定**。数字 `0` 与字符串 `'0'` 是不同值；异步数据尚未到达时暂用 key 回显，数据更新后自动显示标题。
- **禁用节点不能通过标签单独移除**。节点 `disabled` 或 `disableCheckbox` 会关闭标签删除；组件未禁用时，清空按钮仍可重置整个字段。
- **`title` 插槽已移除，改用 `item`**。两者作用域参数相同（`node` / `selected` / `expanded`），旧写法把 `#title` 改成 `#item` 即可；继续写 `#title` 不会报错，但内容不再渲染，节点会回落为数据里的默认标题。
- **虚拟滚动依赖树的固定行高**。`item` 插槽避免多行内容，否则滚动切片会错位；需要可变高度时关闭 `virtual` 并谨慎覆盖 `treeUi`。
- **异步加载不代改数据**。`loadData` 中需由调用方把子节点写入响应式 `treeData`，叶子节点标记 `isLeaf`。下拉收起时内部树会卸载，已加载记录因此保存在选择器上；替换整棵 `treeData` 重新拉取时，要同时清空 `v-model:loaded-keys`，否则旧记录会让节点按已加载处理、不再请求。
- **唯一标识字段需要显式指定**。`v-model` 默认按 `key` 查找节点，数据以 `code`、`id` 等字段作唯一标识时必须传 `fieldNames.key`，否则绑定值匹配不到节点，只能按原值回显。
- **选择框样式直接复用 select**。标签、描边与浮层跟随公共主题；仅修改树内容样式时使用 `treeUi`，不要覆盖触发器。
