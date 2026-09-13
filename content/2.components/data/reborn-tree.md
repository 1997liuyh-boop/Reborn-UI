---
title: Tree 树形控件
description: 层级数据展示：展开/点选/勾选三组受控 keys，支持父子联动、异步加载、拖拽与虚拟滚动。
category: 数据展示
platform: web
tags: [css, tailwind, tree, data]
badge: New
---

::warning
仅 Web 端组件。UniApp 端暂无对应实现，移动端的层级选择场景可改用 `reborn-cascader`。
::

::ComponentViewer{demoFile="RebornTreeDemo.vue" config="RebornTreeConfig" componentId="reborn-tree" :componentFiles='["RebornTree.vue", "reborn-tree.config.ts", "useTree.ts"]'}
::

## 简介

Tree 用于展示文件目录、组织架构、权限点这类具有父子层级的数据，API 对齐 Ant Design 的 Tree（React 专属参数做了 Vue 化改造：`icon` / `switcherIcon` / `titleRender` 改由插槽承担）。

它的状态体系由三组正交的 keys 构成：`expandedKeys` 决定**哪些父节点摊开**，`selectedKeys` 决定**哪些标题被点亮**（单选或 `multiple` 多选），`checkedKeys` 决定**哪些复选框被勾上**（默认父子联动，`checkStrictly` 切断联动）。三组各自都有受控（`v-model:xxx-keys`）与非受控（`defaultXxx`）两条通路，互不干扰——一棵树可以同时受控勾选、非受控展开。

在此之上，剩余 API 按职责分组：**数据**由 `treeData` + `fieldNames` 驱动；**外观**有 `color` 主题色（7 种语义色统一着色）、`showLine` 连接线、`showIcon` 节点图标、`blockNode` 整行占位与 `ui` 细粒度覆盖，标题 / 附加内容 / 图标 / 复选框 / 拖拽手柄等视觉单元全部开放插槽替换；**行为**有 `loadData` 异步加载、`draggable` / `allowDrop` 拖拽、`filterTreeNode` 筛选高亮；**性能**上设置 `height` 即启用虚拟滚动，配套 `scrollTo` 实例方法与 `useTree` 数据工具。

### 何时使用

- 文件目录、组织架构等天然层级数据的浏览与定位——`treeData` 一次传入，`defaultExpandedKeys` 控制初始视野。
- 权限点、分类勾选等需要「选父即选子」语义的批量选择——用 `checkable`，父子联动自动补全。
- 层级很深、子级需要按需请求的场景——用 `loadData` 异步加载，`isLeaf` 终止加载链。
- 需要用户手动调整层级结构（移动、归档、排序）——用 `draggable` + `drop` 回调落库。
- 上千节点的大数据树——设置 `height` 启用虚拟滚动，只渲染视口内的行。

### 何时不使用

- 表单里选一个层级路径（省市区、分类）—— 改用 `reborn-cascader`，它自带触发器与浮层。
- 平铺的可折叠内容区块（FAQ、设置分组）—— 改用 `reborn-collapse`，它是内容容器而非数据结构。
- 页面级导航目录 —— 改用 `reborn-menu`，它带路由联动与浮层子菜单。

## 用法

### 基础用法

`treeData` 一次性传入整棵树，节点的 `key` 在**整树范围内**必须唯一（展开、选中、勾选三组集合都以它为索引）；`defaultExpandedKeys` 指定初始展开的节点，`defaultExpandAll` 则直接摊开全部。字段名不叫 `title` / `key` / `children` 时用 `fieldNames` 重新映射。

```vue
<script setup lang="ts">
const treeData = [
  {
    key: "engineering",
    title: "工程效能",
    children: [
      { key: "frontend", title: "前端平台" },
      { key: "backend", title: "服务端" },
    ],
  },
];
</script>

<template>
  <RebornTree :tree-data="treeData" :default-expanded-keys="['engineering']" />
</template>
```

### 主题色

`color` 统一控制树上所有强调色的落点：选中背景/文字、`filterTreeNode` 高亮、复选框（透传给内部的 `RebornCheckbox`）与拖拽指示（线与内部描边）。配方：选中填充取色阶 1 档、文字与描边取 6 档；拖拽内部放置的填充取 2 档，比选中重一档以示区分。

| `color` | 选中填充 / 文字 | 典型用途 |
| --- | --- | --- |
| `primary`（默认） | `brand-1` / `brand-6` | 常规业务树 |
| `secondary` | `secondary-1` / `secondary-6` | 与主色并列的次级视图 |
| `success` | `green-1` / `green-6` | 审核通过、健康状态类结构 |
| `info` | `blue-1` / `blue-6` | 信息展示类结构 |
| `warning` | `orange-1` / `orange-6` | 需要留意的风险结构 |
| `error` | `red-1` / `red-6` | 删除确认、异常定位场景 |
| `neutral` | `gray-2` / `gray-9` | 低饱和界面；填充例外取 2 档（gray-1 是页面底色，选中会隐形），文字取 9 档正文色 |

```vue
<template>
  <RebornTree :tree-data="treeData" color="success" checkable />
</template>
```

### 受控展开

`v-model:expanded-keys` 让展开集合由外部持有；`autoExpandParent` 为 `true` 时，外部写入的 keys 会自动补全父链（否则深层 key 因父级收起而不可见）。`useTree` 的 `getPath(key)` 返回根到目标的节点路径，适合「定位到某个深层节点」时一次性算出要并入的父链。

```vue
<script setup lang="ts">
import { useTree } from "~/components/reborn/ui/reborn-tree/useTree";

const expandedKeys = ref<(string | number)[]>([]);
const { getPath } = useTree(() => treeData, {});

function locate(key: string) {
  expandedKeys.value = [...new Set([...expandedKeys.value, ...getPath(key).map((n) => n.key)])];
}
</script>

<template>
  <RebornTree v-model:expanded-keys="expandedKeys" :tree-data="treeData" />
</template>
```

::tip
`getPath` 的函数引用保持稳定、调用时才读取最新 `treeData`。若对它的派生结果做 `computed` 缓存，请把 `treeData` 与查询 key 一并列入依赖——依赖追踪感知不到 `getPath` 内部惰性读取的数据。
::

### 点选与多选

点击标题切换选中，再次点击已选节点取消选中。`multiple` 让点选累加为多选；`blockNode` 把点击区拉满整行，选中背景随之铺满，适合行级操作的树。节点级 `selectable: false` 或 `disabled: true` 都会让该节点不可点选，组件级 `selectable={false}` 关闭整树点选。

注意：点选（`selectedKeys` 高亮）只存在于**非 checkable** 树。树开启 `checkable` 后，点击标题切换的是复选框勾选，`multiple` / `selectable` 不再起作用——复选树的多选天生由复选框承担。

```vue
<template>
  <RebornTree
    v-model:selected-keys="selectedKeys"
    :tree-data="treeData"
    multiple
    block-node
  />
</template>
```

### 复选与父子联动

`checkable` 在节点前渲染复选框，**点击标题等同于点击复选框**（不再产生点选高亮——复选树的选中语义由复选框承担，叠一层 selected 背景会出现两套「选中」）。默认父子联动：勾选父节点自动勾满子级、子级全选则父级全选、部分选中则父级半选；传入 `checkedKeys` 时同样先做联动归一（传父节点 key 即视为整枝勾选）。`checkStrictly` 切断联动、逐节点独立勾选，此时 `checkedKeys` 用 `{ checked, halfChecked }` 对象形态。

```vue
<script setup lang="ts">
// 联动模式：数组形态，传 "frontend" 会自动补全它的全部子级
const checkedKeys = ref<(string | number)[]>(["frontend"]);
</script>

<template>
  <RebornTree
    v-model:checked-keys="checkedKeys"
    :tree-data="treeData"
    checkable
    default-expand-all
  />
</template>
```

::tip
节点上的 `disabled` 与 `disableCheckbox` 都会让该节点**阻断联动传导**：勾选父级时它保持原状，父级也不会因为它未勾选而卡在半选。而 `checkable: false` 只隐藏复选框，节点仍参与联动计算。
::

### 连接线与图标

`showLine` 在缩进列画竖向连接线（祖先已是同级末位的层自动截断），展开图标换成加减号且不再旋转；对象写法 `{ showLeafIcon }` 传字符串替换叶子图标、传 `false` 关闭。`showIcon` 渲染节点数据里的 `icon` 字段；没有图标且无 `icon` 插槽的节点不保留图标占位，条件插槽内容为空时也会收起，`switcherIcon` prop 或同名插槽替换展开/折叠图标。

```vue
<template>
  <!-- 连接线 + 自定义叶子图标 -->
  <RebornTree :tree-data="treeData" :show-line="{ showLeafIcon: 'lucide:file-text' }" />

  <!-- 节点图标 + 自定义展开图标 -->
  <RebornTree :tree-data="treeData" show-icon switcher-icon="lucide:circle-chevron-right" />
</template>
```

### 自定义节点内容与筛选

节点行的每个视觉单元都开放了同名插槽：`title` 整体接管标题（等价于 antd 的 `titleRender`）、`icon` 节点图标、`switcherIcon` 展开/折叠图标（作用域含 `leaf`，showLine 的叶子图标也归它）、`checkbox` 复选框（作用域给出 `toggle` 回调，自定义控件点击时调用即接入父子联动）、`dragHandle` 拖拽手柄。`extra` 在标题后渲染附加内容——徽标、行内操作按钮等，容器自带 `@click.stop`（行内按钮不会误触点选/勾选），`blockNode` 下被推到行尾。

`filterTreeNode` 对每个节点求值，返回 `true` 的节点标题高亮（品牌色加粗），常配合搜索框做「筛选定位」——它只负责高亮，不会隐藏未命中的节点。

```vue
<template>
  <RebornTree :tree-data="treeData" block-node :filter-tree-node="(node) => node.title?.includes(keyword)">
    <template #title="{ node, selected }">
      <span :class="{ 'font-semibold': selected }">{{ node.title }}</span>
    </template>
    <template #extra="{ node, leaf }">
      <span v-if="!leaf">{{ node.children?.length }}</span>
      <button @click="openMenu(node)">…</button>
    </template>
    <template #checkbox="{ checked, halfChecked, toggle }">
      <MyCheck :checked="checked" :half="halfChecked" @click="toggle" />
    </template>
  </RebornTree>
</template>
```

### 异步加载

`loadData` 在展开「无子级且未加载过」的父节点时被调用，加载期间展开图标替换为旋转的加载图标（可用 `switcherLoadingIcon` 换）。Promise 内由使用方把子级写回 `treeData`；同一节点只请求一次，由 `loadedKeys` 记账（可 `v-model:loaded-keys` 受控）。子节点声明 `isLeaf: true` 即按叶子渲染、终止加载链；反之 `isLeaf: false` 可把暂无子级的节点强制按父节点渲染。

```vue
<script setup lang="ts">
const treeData = ref([{ key: "region-east", title: "华东节点" }]);

async function loadChildren(node: any) {
  const children = await fetchChildren(node.key);
  // 由使用方写回 treeData，组件不代管子级数据
  node.children = children.map((c) => ({ ...c, isLeaf: true }));
}
</script>

<template>
  <RebornTree :tree-data="treeData" :load-data="loadChildren" />
</template>
```

### 拖拽调整结构

`draggable` 开启拖拽（布尔整树开关 / 函数按节点判定 / 对象写法 `{ nodeDraggable, icon }`，`icon: false` 隐藏拖拽手柄）。悬停位置按行高三分：前 1/4 落在目标**之前**、后 1/4 落在**之后**、中间落入目标**内部**；`allowDrop` 返回 `false` 的位置不亮起指示且拒绝放置。悬停在收起的父节点上约 700ms 自动展开。

`drop` 事件**不代改数据**：回调载荷给出 `dragNode`、`node`（目标）、`dropPosition`（-1 前 / 0 内 / 1 后）与 `dropToGap`，需自行调整 `treeData`——不落库的话拖完会弹回原状。

```vue
<script setup lang="ts">
// 落库三步：摘除拖拽源 → 定位目标 → 按 dropPosition 插回
// （removeNode / locateNode 是常规的树遍历辅助函数，完整实现见本页示例源码）
function handleDrop({ node, dragNode, dropPosition }) {
  const dragged = removeNode(treeData.value, dragNode.key);
  if (!dragged) return;
  const target = locateNode(treeData.value, node.key);
  if (!target) return;
  if (dropPosition === 0) (target.node.children ??= []).push(dragged);
  else target.siblings.splice(target.index + (dropPosition === 1 ? 1 : 0), 0, dragged);
}
</script>

<template>
  <RebornTree
    :tree-data="treeData"
    draggable
    :allow-drop="({ dropNode, dropPosition }) => dropPosition !== 0 || !!dropNode.children?.length"
    @drop="handleDrop"
  />
</template>
```

### 虚拟滚动

设置 `height`（像素）后根节点成为定高滚动容器（横向滚动按规格关闭），并默认启用虚拟滚动：只渲染视口内外各 5 行，千级节点不掉帧。滚动位置按 `itemHeight`（默认 28px）定高换算；`virtual={false}` 关闭虚拟化后退化为普通滚动容器。实例方法 `scrollTo({ key, align, offset, autoExpand, behavior })` 按 key 定位，`autoExpand` 在非受控展开下先自动展开目标的父链，`behavior: "smooth"` 启用平滑滚动动画。

```vue
<script setup lang="ts">
const treeRef = ref();

function locate() {
  treeRef.value?.scrollTo({ key: "group-25", align: "top", autoExpand: true, behavior: "smooth" });
}
</script>

<template>
  <RebornTree ref="treeRef" :tree-data="bigTreeData" :height="280" />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `treeData` | `TreeDataNode[]` | `[]` | 整棵树的数据，节点 `key` 在整树范围内必须唯一；节点字段见下方 TreeDataNode 表。 |
| `fieldNames` | `{ title?: string; key?: string; children?: string }` | `{ title: 'title', key: 'key', children: 'children' }` | 自定义节点的标题 / 唯一标识 / 子级字段名。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 主题色：统一控制选中背景/文字、筛选高亮、复选框与拖拽指示的用色，取值见「主题色」。 |
| `expandedKeys` | `(string \| number)[]` | - | （受控）展开的节点，用 `v-model:expanded-keys` 绑定；不绑定时由内部状态承担，初值来自 `defaultExpandedKeys` / `defaultExpandAll`。 |
| `selectedKeys` | `(string \| number)[]` | - | （受控）点选的节点，用 `v-model:selected-keys` 绑定；多选需配合 `multiple`。 |
| `checkedKeys` | `(string \| number)[] \| { checked: (string \| number)[]; halfChecked: (string \| number)[] }` | - | （受控）勾选的节点，用 `v-model:checked-keys` 绑定。非 `checkStrictly` 下传数组即可，父子自动联动补全；`checkStrictly` 下用对象形态，父子不再关联。 |
| `loadedKeys` | `(string \| number)[]` | - | （受控）已异步加载完成的节点，需配合 `loadData` 使用，用 `v-model:loaded-keys` 绑定。 |
| `defaultExpandedKeys` | `(string \| number)[]` | `[]` | 非受控模式的初始展开集合。 |
| `defaultExpandAll` | `boolean` | `false` | 非受控模式下初始展开全部父节点，优先级高于 `defaultExpandedKeys`。 |
| `defaultExpandParent` | `boolean` | `true` | 初始化时自动展开「初始展开集合」各 key 的父链，保证它们可见。 |
| `defaultSelectedKeys` | `(string \| number)[]` | `[]` | 非受控模式的初始选中集合。 |
| `defaultCheckedKeys` | `(string \| number)[]` | `[]` | 非受控模式的初始勾选集合，非 `checkStrictly` 下同样经过联动归一。 |
| `autoExpandParent` | `boolean` | `false` | 外部改写 `expandedKeys` 时自动补全父链；组件内部的展开/收起操作不受影响（否则收起父级会被立刻撑回）。 |
| `selectable` | `boolean` | `true` | 整树是否可点选；节点级 `selectable: false` 可单独关闭某节点。`checkable` 树没有点选，本项不再起作用。 |
| `multiple` | `boolean` | `false` | 点选是否累加为多选；单选模式下点新节点会替换旧选中。只作用于 `selectedKeys`——复选框勾选天生多选，与它无关。 |
| `checkable` | `boolean` | `false` | 节点前是否渲染复选框；开启后点击标题等同于点击复选框，点选高亮随之停用。 |
| `checkStrictly` | `boolean` | `false` | 勾选完全受控：父子勾选状态不再关联，`checkedKeys` 改用 `{ checked, halfChecked }` 对象形态。 |
| `disabled` | `boolean` | `false` | 禁用整树：点选、勾选、展开、拖拽全部失效，文字降为 `text-gray-5`。 |
| `blockNode` | `boolean` | `false` | 标题点击区拉满整行，悬浮 / 选中背景随之铺满。 |
| `showLine` | `boolean \| { showLeafIcon?: boolean \| string }` | `false` | 缩进列画竖向连接线，展开图标换成加减号；`showLeafIcon` 传字符串替换叶子图标、传 `false` 关闭（缺省用 `lucide:file`）。 |
| `showIcon` | `boolean` | `false` | 渲染节点数据的 `icon` 字段（或 `icon` 插槽），无默认样式。 |
| `switcherIcon` | `string` | - | 展开/折叠图标名称（如 `lucide:circle-chevron-right`）；`showLine` 下不会自动旋转。复杂内容改用同名插槽。 |
| `switcherLoadingIcon` | `string` | - | 异步加载中的图标名称，缺省为 `lucide:loader-circle` 并附加旋转动画。 |
| `filterTreeNode` | `(node: TreeDataNode) => boolean` | - | 按需筛选：返回 `true` 的节点标题高亮（品牌色加粗），不隐藏未命中节点。 |
| `loadData` | `(node: TreeDataNode) => Promise<unknown>` | - | 异步加载：展开无子级且未加载过的节点时调用，Promise 内由使用方把子级写回 `treeData`。 |
| `draggable` | `boolean \| ((node: TreeDataNode) => boolean) \| { icon?: boolean; nodeDraggable?: (node: TreeDataNode) => boolean }` | `false` | 节点可拖拽：布尔整树开关 / 函数按节点判定 / 对象写法，`icon: false` 隐藏拖拽手柄图标。 |
| `allowDrop` | `({ dropNode, dropPosition }) => boolean` | - | 拖拽悬停时判定该位置是否可放置，返回 `false` 则指示不亮起且拒绝 drop。`dropPosition`：-1 前 / 0 内 / 1 后。 |
| `height` | `number` | - | 滚动容器高度（px）。设置后根节点定高滚动、关闭横向滚动，并默认启用虚拟滚动。 |
| `itemHeight` | `number` | `28` | 虚拟滚动的行高（px），滚动位置与 `scrollTo` 都按它定高换算。Vue 适配新增，antd 无此项。 |
| `virtual` | `boolean` | `true` | 设为 `false` 关闭虚拟滚动；`height` 仍生效，退化为普通滚动容器。 |
| `animated` | `boolean` | `true` | 展开/收起的行级过渡动画（antd `motion` 参数的 Vue 化替代）：新行淡入下滑、下方行 FLIP 位移让位。虚拟滚动生效时强制关闭；`prefers-reduced-motion` 下自动归零。 |
| `class` | `any` | - | 追加到根元素的自定义类名。 |
| `ui` | `TreeUI` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

#### TreeDataNode 节点字段

| 字段名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `key` | `string \| number` | - | 节点唯一标识，被三组 keys 集合引用，整树内不可重复。 |
| `title` | `string` | - | 标题文案；复杂内容用 `title` 插槽。 |
| `children` | `TreeDataNode[]` | - | 子节点数据。 |
| `disabled` | `boolean` | `false` | 禁用整个节点：点选、勾选、拖拽失效，且阻断勾选联动传导。 |
| `disableCheckbox` | `boolean` | `false` | 仅禁用复选框（标题仍可点选），同样阻断联动传导。 |
| `selectable` | `boolean` | `true` | 该节点是否可被点选。 |
| `checkable` | `boolean` | - | 树为 `checkable` 时单独隐藏该节点的复选框（设为 `false`），不影响联动计算。 |
| `isLeaf` | `boolean` | - | 强制叶子（`true`）或强制父节点（`false`）；配合 `loadData` 用于终止/触发加载链。 |
| `icon` | `string` | - | 节点图标名称（如 `lucide:folder`），需 `showIcon` 开启才渲染。 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `expand` | `(expandedKeys, { expanded, node })` | 展开/收起节点时触发。 |
| `select` | `(selectedKeys, { selected, selectedNodes, node, event })` | 点选节点时触发。 |
| `check` | `(checkedKeys, { checked, checkedNodes, node, event, halfCheckedKeys })` | 勾选复选框时触发；`checkStrictly` 下第一个参数是 `{ checked, halfChecked }` 对象。 |
| `load` | `(loadedKeys, { node })` | 节点异步加载完毕时触发。 |
| `dblclick` | `(event, node)` | 双击节点标题时触发。 |
| `rightClick` | `({ event, node })` | 右键点击节点标题时触发；组件不屏蔽系统菜单，需要自定义菜单请在回调里 `event.preventDefault()`。 |
| `dragstart` | `({ event, node })` | 开始拖拽节点时触发；拖拽源若处于展开态会先自动收起。 |
| `dragenter` | `({ event, node, expandedKeys })` | 拖拽进入某节点时触发。 |
| `dragover` | `({ event, node })` | 拖拽经过某节点时触发。 |
| `dragleave` | `({ event, node })` | 拖拽离开某节点时触发。 |
| `dragend` | `({ event, node })` | 拖拽结束（无论是否放置成功）时触发。 |
| `drop` | `({ event, node, dragNode, dragNodesKeys, dropPosition, dropToGap })` | 放置节点时触发；组件不代改 `treeData`，按 `dropPosition`（-1 前 / 0 内 / 1 后）自行落库。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `title` | `{ node, selected, expanded }` | 整体接管标题渲染（等价于 antd 的 `titleRender`），缺省渲染 `title` 字段文本。 |
| `extra` | `{ node, selected, expanded, leaf }` | 标题后的附加内容（徽标、行内操作按钮等）；容器自带 `@click.stop`，`blockNode` 下由 `ml-auto` 推到行尾。 |
| `icon` | `{ node, expanded, selected, leaf }` | 节点图标内容，需 `showIcon` 开启；缺省渲染节点 `icon` 字段指向的图标。 |
| `switcherIcon` | `{ node, expanded, loading, leaf }` | 整体替换展开/折叠图标；叶子（含 `showLine` 的 leaf 图标）与加载态由作用域的 `leaf` / `loading` 区分。 |
| `checkbox` | `{ node, checked, halfChecked, disabled, toggle }` | 整体替换复选框；自定义控件在点击时调用 `toggle(event)` 即接入父子联动与事件派发。 |
| `dragHandle` | `{ node, disabled }` | 替换拖拽手柄图标，仅 `draggable` 且节点可拖拽时渲染。 |

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| `scrollTo` | `({ key, align?, offset?, autoExpand?, behavior? }) => Promise<void>` | 滚动到指定 key 的节点。`align`：`top` / `bottom` / `auto`（仅视口外才滚动）；`offset` 为对齐后的额外偏移（px）；`autoExpand` 仅非受控展开下先自动展开目标父链；`behavior: 'smooth'` 启用平滑动画（rAF 驱动、时长随距离取 150~400ms，缺省即时跳转）。无 `height` 时退化为 `scrollIntoView`。 |

::tip
平滑动画由 rAF 自行驱动而非原生 `behavior: 'smooth'`——部分环境会把原生 smooth 静默丢弃成不滚动；rAF 逐帧写 `scrollTop` 还能让虚拟滚动的切片随动画逐帧更新，不会露白。系统开启「减少动态效果」（`prefers-reduced-motion`）时自动退回即时跳转；动画途中用户滚轮/触摸介入会立即中止动画，交还控制权。
::

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名：

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器；设置 `height` 后同时是滚动容器。 |
| `list` | 节点列表（`ul`）；虚拟滚动的位移变换落在它身上。 |
| `node` | 单个节点行（`li`），放置指示线以它为定位基准。 |
| `indentUnit` | 单层缩进列，固定 24px 宽；`showLine` 的竖线画在这里。 |
| `switcher` | 展开/折叠开关容器，叶子节点也保留占位以维持对齐。 |
| `switcherIcon` | 展开/折叠图标本体，非 `showLine` 下展开态旋转 90°。 |
| `dragHandle` | 拖拽手柄图标容器，仅 `draggable` 且节点可拖拽时渲染；排在 switcher 占位列之后、紧贴内容区。 |
| `checkbox` | 复选框容器，仅 `checkable` 时渲染。 |
| `iconEle` | 节点图标容器，仅 `showIcon` 开启且有图标或 `icon` 插槽时渲染；空插槽内容不占位。 |
| `content` | 标题点击区（含图标与文本），选中背景与悬浮反馈落在这里；`blockNode` 时拉满整行。 |
| `title` | 标题文本，默认 `truncate`；`filterTreeNode` 命中的高亮也作用在它上面。 |
| `extra` | 标题后的附加内容容器（extra 插槽），`ml-auto` 在 `blockNode` 下把它推到行尾。 |
| `dropIndicator` | 拖拽放置指示线（仅前/后两个间隙位置渲染，放入内部走 `content` 的描边高亮）。 |

```vue
<template>
  <RebornTree
    :tree-data="treeData"
    :ui="{ content: 'gap-2', title: 'text-sm' }"
  />
</template>
```

## 注意事项

- **展开动画是行级过渡，不是容器高度过渡**。内部按「拍平可见节点」的单列表渲染（这是虚拟滚动的前提），节点没有独立的收合容器，因此动画由 `TransitionGroup` 承担：新行淡入下滑、下方行 FLIP 位移让位（`animated` 控制，默认开启）。虚拟滚动生效时强制关闭——滚动过程中切片不断增删行，过渡会退化成滚动闪烁。antd 的 `motion` 参数由布尔 `animated` 替代。
- **`drop` 不代改数据**。组件只负责拖拽交互与位置判定，放置后 `treeData` 原样不动；不在回调里落库的话界面会「弹回」原状，这是预期行为而非 bug。
- **`checkable` 树的标题点击切换的是勾选，不是点选**。这是对 antd 的有意偏离：antd 里点标题走 `selectedKeys`、点复选框走 `checkedKeys` 两套并存，实际使用中点了节点复选框却不勾选是高频困惑；本组件在 `checkable` 下把标题点击并入勾选，`selectable` / `multiple` 随之停用，也不再渲染点选高亮背景。
- **`multiple` 只作用于点选**。它控制的是 `selectedKeys`（标题高亮）能否累加；复选框勾选（`checkedKeys`）天生就是多选，不受 `multiple` 影响——两组状态相互独立。
- **非 `checkStrictly` 下 `checkedKeys` 会被联动归一**。传入父节点 key 等于整枝勾选，取消一个子级会同时摘掉父链再重算——受控方拿到的回写值是归一后的完整集合，不是原样透传。
- **禁用节点阻断勾选联动**。`disabled` / `disableCheckbox` 的节点不参与父子传导；而节点级 `checkable: false` 只隐藏复选框、仍参与联动计算，两者语义不同。
- **虚拟滚动依赖定高行**。滚动位置按 `itemHeight`（默认 28px）换算，用 `ui` 改了行高（如加大 `content` 内边距）时必须同步调整 `itemHeight`，否则切片与 `scrollTo` 的落点都会漂移。
- **`scrollTo` 的 `autoExpand` 只在非受控展开下生效**。受控（`v-model:expanded-keys`）时展开集合归外部所有、组件不越权改写，需要先用 `useTree` 的 `getPath` 自行把父链并入展开集合。
- **`autoExpandParent` 只响应外部写入**。组件内部的展开/收起不触发父链补全，否则用户刚收起的父级会被子级 key 立刻撑回，无法收起。
- **`itemHeight` 是 Vue 适配新增 prop**。antd 的行高是内部常量，这里因拍平定高渲染需要显式换算而暴露出来；不用虚拟滚动时无需关心。
