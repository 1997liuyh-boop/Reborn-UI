---
title: Menu 菜单
description: 用于站点侧边或顶部导航的菜单组件，支持垂直/水平模式、折叠、多级子菜单与配置式数据驱动。
category: 导航
platform: web
badge: New
---

::ComponentViewer{demoFile="RebornMenuDemo.vue" config="RebornMenuConfig" componentId="reborn-menu" :componentFiles='["reborn-menu.config.ts", "RebornMenu.vue", "RebornMenuItem.vue", "RebornMenuItemGroup.vue", "RebornMenuItems.vue", "RebornMenuDivider.vue", "RebornSubMenu.vue"]'}
::

# 两种写法

菜单支持**插槽式**与**配置式**两种写法，二选一，不要混用：

- **插槽式** —— 手写 `RebornMenuItem` / `RebornSubMenu` / `RebornMenuItemGroup` / `RebornMenuDivider` 嵌套结构，适合结构固定、需要在每个条目上塞自定义内容的场景。
- **配置式** —— 给 `RebornMenu` 传 `items` 数组，由组件递归渲染，适合菜单树来自接口或权限过滤的场景。数据结构与 Ant Design 的 `ItemType` 对齐。

传了 `items` 时默认插槽会被忽略。

# API

## Menu Props

| 属性名                | 类型                                                                              | 默认值                    | 说明                                                                                   |
| :-------------------- | :-------------------------------------------------------------------------------- | :------------------------ | :------------------------------------------------------------------------------------- |
| `mode`                | `'horizontal' \| 'vertical'`                                                       | `'vertical'`              | 菜单展示模式                                                                           |
| `items`               | `ItemType[]`                                                                       | -                         | 配置式菜单数据，传入后由组件递归渲染并忽略默认插槽                                     |
| `selectedKeys`        | `string[]`                                                                         | `[]`                      | 当前选中项的**完整路径**，配合 `v-model:selected-keys` 使用，父级节点按路径包含关系高亮 |
| `openKeys`            | `string[]`                                                                         | `[]`                      | 当前展开的子菜单 `index` 集合，配合 `v-model:open-keys` 使用                            |
| `collapse`            | `boolean`                                                                          | `false`                   | 是否折叠菜单，仅在 `mode="vertical"` 时生效                                            |
| `defaultOpeneds`      | `string[]`                                                                         | `[]`                      | 默认展开的子菜单 `index` 数组，仅在 `openKeys` 为空时作为初值生效                       |
| `uniqueOpened`        | `boolean`                                                                          | `false`                   | 是否只保持一个子菜单展开（手风琴模式）                                                 |
| `expandMutex`         | `boolean`                                                                          | `false`                   | 同级子菜单是否互斥展开                                                                 |
| `expandType`          | `'normal' \| 'popup'`                                                              | `'popup'`                 | 二级菜单展开方式：平铺展开 / 浮层展开。折叠态与水平模式下强制为 `popup`                |
| `menuTrigger`         | `'hover' \| 'click'`                                                               | `'hover'`                 | 子菜单的触发方式                                                                       |
| `closeOnClickOutside` | `boolean`                                                                          | `true`                    | 点击菜单外部时是否关闭已展开的子菜单                                                   |
| `showTimeout`         | `number`                                                                           | `300`                     | 浮层子菜单的展开延时（毫秒）                                                           |
| `hideTimeout`         | `number`                                                                           | `300`                     | 浮层子菜单的关闭延时（毫秒）                                                           |
| `popperOffset`        | `number`                                                                           | `8`                       | 浮层子菜单相对触发元素的偏移量（像素）                                                 |
| `persistent`          | `boolean`                                                                          | `true`                    | 浮层关闭后是否保留其 DOM，为 `false` 时关闭即销毁                                      |
| `ellipsis`            | `boolean`                                                                          | `false`                   | 水平模式下宽度不足时，是否把溢出条目折叠进末尾的「更多」子菜单                         |
| `ellipsisIcon`        | `string`                                                                           | `'lucide:more-horizontal'` | 溢出折叠触发器的图标名称                                                               |
| `router`              | `boolean`                                                                          | `false`                   | 是否启用 `vue-router` 模式。启用后点击菜单项会使用 `index` 作为 `path` 进行跳转         |
| `collapseTransition`  | `boolean`                                                                          | `true`                    | 是否启用折叠/展开过渡动画，为 `false` 时移除相关 `transition`                          |
| `color`               | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'`               | 选中态与展开态的主题色：选中项文字取该色阶第 6 档，背景块取第 2 档                     |
| `showActiveBackground` | `boolean`                                                                          | `true`                    | 选中项是否展示背景块，关闭后仅保留文字高亮（投影一并移除）                             |
| `backgroundColor`     | `string`                                                                           | `''`                      | 菜单背景色，留空则使用主题默认底色                                                     |
| `textColor`           | `string`                                                                           | `''`                      | 普通菜单项文字颜色，留空则使用 `level` 规范灰阶                                        |
| `activeTextColor`     | `string`                                                                           | `''`                      | 选中菜单项文字颜色，留空则使用 `color` 主题色                                          |
| `class`               | `any`                                                                              | -                         | 最外层容器的自定义类名                                                                 |
| `ui`                  | `MenuUI`                                                                           | `{}`                      | 内置 UI 部件的类名覆盖，见「自定义样式（ui）」                                         |

::callout{icon="i-lucide-info" color="info"}
**`selectedKeys` 存的是路径而非单个 key。** 这是与 Element Plus 有意不同的一点：Element Plus 的 `selected-keys` 只放当前选中项的 key，而本组件放的是从一级菜单到选中项的完整 `indexPath`（例如 `['2', '2-1']`），祖先节点的高亮依赖这个语义。只想拿选中项本身时取数组末位即可。
::

::callout{icon="i-lucide-triangle-alert" color="warning"}
**`ellipsis` 默认为 `false`**，与 Element Plus 的默认 `true` 不同。溢出折叠会改变既有水平菜单的渲染结果，因此本组件要求显式传 `ellipsis` 开启，避免升级时产生非预期的视觉变化。
::

> `router` 为 `true` 时，请将 `RebornMenuItem` 的 `index` 设置为真实路由路径，例如 `/dashboard`。首次加载高亮项请通过 `v-model:selected-keys` 传入路径数组，例如 `['/dashboard']`。

## Menu Events

| 事件名                | 说明                   | 回调参数                                       |
| :-------------------- | :--------------------- | :--------------------------------------------- |
| `update:selectedKeys` | 选中路径变化时触发     | `(indexPath: string[]) => void`                |
| `update:openKeys`     | 展开集合变化时触发     | `(openKeys: string[]) => void`                 |
| `select`              | 菜单项被选中时触发     | `(index: string, indexPath: string[]) => void` |
| `open`                | 子菜单展开时触发       | `(index: string, indexPath: string[]) => void` |
| `close`               | 子菜单收起时触发       | `(index: string, indexPath: string[]) => void` |

## Menu Methods

| 方法名              | 说明                                                         | 类型                            |
| :------------------ | :----------------------------------------------------------- | :------------------------------ |
| `open`              | 打开指定子菜单                                               | `(index: string) => void`       |
| `close`             | 关闭指定子菜单                                               | `(index: string) => void`       |
| `updateActiveIndex` | 通过路径数组手动更新当前选中项                               | `(indexPath: string[]) => void` |
| `handleResize`      | 主动触发一次溢出折叠测量，用于容器宽度被 JS 改动而未触发 resize 时 | `() => void`                    |

## Menu Slots

| 插槽名    | 说明                             |
| :-------- | :------------------------------- |
| `default` | 菜单内容，传了 `items` 时不生效 |

## SubMenu Props

| 属性名              | 类型                     | 默认值 | 说明                                                       |
| :------------------ | :----------------------- | :----- | :--------------------------------------------------------- |
| `index`             | `string`                 | -      | 唯一标识，必填                                             |
| `items`             | `ItemType[]`             | -      | 配置式子菜单数据，传入后由组件递归渲染并忽略默认插槽       |
| `disabled`          | `boolean`                | `false` | 是否禁用                                                   |
| `popperClass`       | `ClassValue`             | -      | 浮层的自定义类名                                           |
| `popperStyle`       | `CSSProperties`          | -      | 浮层的自定义内联样式                                       |
| `popperOffset`      | `number`                 | -      | 浮层偏移量，缺省时继承菜单根节点的 `popperOffset`          |
| `showTimeout`       | `number`                 | -      | 浮层展开延时，缺省时继承菜单根节点的 `showTimeout`         |
| `hideTimeout`       | `number`                 | -      | 浮层关闭延时，缺省时继承菜单根节点的 `hideTimeout`         |
| `teleported`        | `boolean`                | `true` | 浮层是否传送到 `body`，关闭后浮层将跟随父级定位            |
| `expandCloseIcon`   | `string`                 | -      | 平铺（`normal`）态下的收起图标，需与 `expandOpenIcon` 成对提供 |
| `expandOpenIcon`    | `string`                 | -      | 平铺（`normal`）态下的展开图标，需与 `expandCloseIcon` 成对提供 |
| `collapseCloseIcon` | `string`                 | -      | 折叠（`collapse`）态下的收起图标，需与 `collapseOpenIcon` 成对提供 |
| `collapseOpenIcon`  | `string`                 | -      | 折叠（`collapse`）态下的展开图标，需与 `collapseCloseIcon` 成对提供 |
| `class`             | `any`                    | -      | 自定义类名                                                 |
| `ui`                | `MenuUI`                 | `{}`   | 内置 UI 部件的类名覆盖                                     |

> 四个图标属性都不传时保持内置观感（`lucide:chevron-right` 配合旋转动画）。它们需要成对提供，只给其中一个不会生效。

## SubMenu Events

| 事件名       | 说明                 | 回调参数                       |
| :----------- | :------------------- | :----------------------------- |
| `titleClick` | 点击子菜单标题时触发 | `(event: MouseEvent) => void`  |

## SubMenu Slots

| 插槽名    | 说明                                 |
| :-------- | :----------------------------------- |
| `default` | 子菜单内容，传了 `items` 时不生效   |
| `title`   | 子菜单标题                           |
| `icon`    | 子菜单图标                           |

## MenuItem Props

| 属性名     | 类型                | 默认值  | 说明                                                                       |
| :--------- | :------------------ | :------ | :------------------------------------------------------------------------- |
| `index`    | `string`            | -       | 唯一标识，必填。启用 `router` 模式时同时作为跳转路径                       |
| `route`    | `RouteLocationRaw`  | -       | 显式指定跳转目标，支持字符串路径与具名路由对象。**仅在菜单开启 `router` 时生效**，传入后优先于 `index` |
| `disabled` | `boolean`           | `false` | 是否禁用。禁用后文字置灰为 `gray-5` 并保留 `cursor: not-allowed` 光标      |
| `danger`   | `boolean`           | `false` | 是否为危险项，渲染为错误色                                                 |
| `extra`    | `string`            | -       | 右侧附加文本，常用于展示快捷键。也可用 `extra` 插槽自定义                  |
| `title`    | `string`            | -       | 原生 `title` 提示，折叠态下文字被隐藏时尤其有用                            |
| `class`    | `any`               | -       | 自定义类名                                                                 |
| `ui`       | `MenuUI`            | `{}`    | 内置 UI 部件的类名覆盖                                                     |

## MenuItem Events

| 事件名  | 说明             | 回调参数                  |
| :------ | :--------------- | :------------------------ |
| `click` | 点击菜单项时触发 | `(index: string) => void` |

## MenuItem Slots

| 插槽名    | 说明                                   |
| :-------- | :------------------------------------- |
| `default` | 菜单项内容                             |
| `icon`    | 菜单项图标                             |
| `extra`   | 右侧附加内容，缺省时回退到 `extra` 属性 |

## MenuItemGroup Props

| 属性名  | 类型         | 默认值 | 说明                                                 |
| :------ | :----------- | :----- | :--------------------------------------------------- |
| `title` | `string`     | `''`   | 分组标题                                             |
| `items` | `ItemType[]` | -      | 配置式分组数据，传入后由组件递归渲染并忽略默认插槽   |
| `class` | `any`        | -      | 自定义类名                                           |
| `ui`    | `MenuUI`     | `{}`   | 内置 UI 部件的类名覆盖                               |

## MenuItemGroup Slots

| 插槽名    | 说明                               |
| :-------- | :--------------------------------- |
| `default` | 分组内的菜单项，传了 `items` 时不生效 |
| `title`   | 自定义标题内容                     |

## MenuDivider Props

| 属性名   | 类型      | 默认值  | 说明                             |
| :------- | :-------- | :------ | :------------------------------- |
| `dashed` | `boolean` | `false` | 是否为虚线样式                   |
| `class`  | `any`     | -       | 自定义类名                       |
| `ui`     | `MenuUI`  | `{}`    | 内置 UI 部件的类名覆盖           |

## 配置式数据类型

`items` 的元素是四类节点的联合，与 Ant Design 的 `ItemType` 对齐：

```ts
type ItemType = MenuItemType | SubMenuType | MenuItemGroupType | MenuDividerType;

/** 普通菜单项：不带 children、不带 type 判别字段 */
interface MenuItemType {
  key: string;
  label?: string;
  icon?: string;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
  extra?: string;
  route?: RouteLocationRaw;
}

/** 子菜单：靠 children 数组判别 */
interface SubMenuType {
  key: string;
  label?: string;
  icon?: string;
  disabled?: boolean;
  children: ItemType[];
  popupClassName?: ClassValue;
  popupOffset?: [number, number];
  onTitleClick?: (info: { key: string; domEvent: MouseEvent }) => void;
}

/** 分组：靠 type: "group" 判别 */
interface MenuItemGroupType {
  type: "group";
  key?: string;
  label?: string;
  children: ItemType[];
}

/** 分割线：靠 type: "divider" 判别 */
interface MenuDividerType {
  type: "divider";
  key?: string;
  dashed?: boolean;
}
```

> `popupOffset` 沿用 Ant Design 的 `[x, y]` 双轴写法，而浮层只需要单向间距：一级水平菜单的浮层向下弹出取 `y`，其余情况向侧方弹出取 `x`。
>
> 判别函数 `isMenuDivider` / `isMenuGroup` / `isSubMenu` 一并从 `~/components/reborn/ui/reborn-menu` 导出，自行处理菜单树时可直接复用。

# 基础样式规范

一级与次级菜单的字号、字重、灰阶由内部 `level` 变体自动区分，无需手动传类名：

| 层级                              | 字号   | 字重     | 颜色         |
| :-------------------------------- | :----- | :------- | :----------- |
| 一级菜单（`parentIndexPath` 为空） | `14px` | `500`    | `text-gray-10` |
| 次级及以下菜单                    | `14px` | `400`    | `text-gray-9`  |
| 禁用态（任意层级）                | `14px` | 继承     | `text-gray-5` + `cursor: not-allowed` |

`--color-gray-*` 在暗色模式下已在主题层重定义，因此上述灰阶**不需要额外写 `dark:` 变体**，明暗两态自动切换。

选中态（`active`）与展开态（`opened`）的色值由 `color` 属性决定，层叠优先级高于上表的默认灰阶。展开态只做**纯色高亮**——标题不再叠加渐变流光动画，默认 `hover` 触发下鼠标划过不会出现背景跑动。

选中态取**同一色阶的两档**：文字用第 6 档、背景块用第 2 档，与 `RebornBadge` 的 `soft` 变体同一套配方。语义别名没有数字档位（不存在 `bg-primary-2`），因此实际落到各色阶本名：

| `color`     | 背景块           | 文字               |
| :---------- | :--------------- | :----------------- |
| `primary`   | `bg-brand-2`     | `text-brand-6`     |
| `secondary` | `bg-secondary-2` | `text-secondary-6` |
| `success`   | `bg-green-2`     | `text-green-6`     |
| `info`      | `bg-blue-2`      | `text-blue-6`      |
| `warning`   | `bg-orange-2`    | `text-orange-6`    |
| `error`     | `bg-red-2`       | `text-red-6`       |
| `neutral`   | `bg-gray-2`      | `text-gray-9`      |

`neutral` 的文字取 `gray-9`（正文色）而非 `gray-6`——灰阶里第 6 档属于弱化文本，压不住选中态。这些档位在暗色模式下已在主题层整体反转，同样**不需要写 `dark:` 变体**。

不需要色块时传 `:show-active-background="false"`，选中项只保留文字高亮，依附于背景块的投影会一并移除。水平模式的一级条目本就不画背景块（见下一节），该属性对它无影响。

## 水平菜单的交互样式

`mode="horizontal"` 的一级条目走一套独立规则，与垂直菜单不同：

| 场景            | 表现                                                                                       |
| :-------------- | :----------------------------------------------------------------------------------------- |
| 条目间距        | `16px`（`menu` 上的 `gap-x-4`）                                                             |
| `hover`         | **图标与文字一起高亮为 `color` 色值，不出现背景块**。图标由 Iconify 以 `currentColor` 填充，跟随文字自动变色 |
| `active`（选中）| 文字高亮，同样不加背景块                                                                    |
| `active` 且无子菜单 | 额外在底部绘制 `2px` 指示器（`::after`，取 `bg-current` 跟随当前文字色）                 |

带子菜单的一级项选中时**不画底部指示器**——此时的高亮通常来自子项带来的祖先高亮，再加下划线会与浮层的指向产生冲突。

## 折叠动画

`collapse` 切换时，根容器宽度与条目内容同步过渡（`300ms`，`ease-in-out`）。整套动画的目标是**单向收起**——文字只朝图标那一侧退，左内边距与图标列左边缘全程不动，不会出现「两端往中间挤」的观感：

- **宽度**：折叠宽度以内联样式 `width: 4rem` 下发到 `root`，优先级高于任何 `class`。垂直模式下 `root` 展开态为 `w-full`——宽度插值需要两端都是确定值，`auto → 64px` 不会产生动画。
- **文字 / 尾注 / 箭头**：折叠态用 `w-0 + opacity-0 + overflow-hidden` 收起，而**不是** `display: none`（`display` 不可过渡，会让文字瞬间消失、宽度动画看起来像卡帧）。
- **对齐与内边距不参与动画**：折叠态沿用展开态的 `px-4` 与 `items-start` 对齐，**不切 `justify-center`**。`justify-content` 不可过渡，在第 0 帧就会把「图标 + 文字」整组钉到行中线上，之后随容器变窄来回摆动。
- **图标列定宽**：`menuItemIcon` 是一列固定宽度的盒子，展开态 `w-5`（20px）、折叠态 `w-8`（32px = 轨道 `64px` 减去左右各 `16px` 内边距），图形本身（16px 或 20px）由盒子自身的 `justify-center` 居中。折叠完成时图标正好落在轨道正中。这与 Element Plus 给菜单图标定死 24px 列宽是同一套做法；`min-width` 不能替代 `width`——实际宽度取 `max(图形宽, min-width)`，前段纹丝不动、后段才追上，会与同时收缩的间隙错开相位而产生回摆。
- **间隙同步归零**：`menuItemContent` 的 `gap-2`（8px）在折叠态收到 `gap-0`。图标列 `20 → 32px` 与间隙 `8 → 0px` 共用同一条曲线，两者之和 `28 → 32px` 严格单调，动画全程内容既不溢出 64px 轨道也不留空。

传 `:collapse-transition="false"` 会一并移除上述所有 `transition`（含图标列宽度与间隙），切换变为瞬时。

::callout{icon="i-lucide-info" color="info"}
因为折叠宽度走的是内联样式，给 `RebornMenu` 传 `class="w-full max-w-xs"` 之类的宽度类**不会**影响折叠态尺寸，两者可以共存。
::

## 子菜单的展开与收起语义

`expandType` 与 `menuTrigger` 组合出两套手感：

| 组合                                | 展开                     | 收起                                                            |
| :---------------------------------- | :----------------------- | :-------------------------------------------------------------- |
| `expandType="popup"` + `menuTrigger="hover"`  | 悬停 `showTimeout`（默认 300ms）后弹出 | 移出后 `hideTimeout`（默认 300ms）自动关闭                |
| `expandType="normal"` + `menuTrigger="hover"` | 悬停后就地平铺展开       | **移开不收起**，交由手风琴逻辑在展开同级菜单时互斥关闭          |
| 任意 `expandType` + `menuTrigger="click"`     | 点击标题切换             | 再次点击标题，或点击菜单外部                                    |

平铺展开之所以不做「移出关闭」：子项是在父项下方撑开的，鼠标移向子项的路上必然先离开父项，若此时按 hover 语义倒计时关闭，刚展开的子项会当场收回而根本点不到。

`menuTrigger="hover"` 或 `uniqueOpened` 为 `true` 时，同一时刻只保留一条展开路径（**单一展开 / 手风琴**）；`expandMutex` 则进一步保证**同级互斥**。两者在平铺与浮层两种展开方式下行为一致。

> 折叠态与 `mode="horizontal"` 下 `expandType` 被强制为 `popup`，因此平铺展开只存在于展开状态的垂直菜单中。

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供；**把 `ui` 传给最外层 `RebornMenu` 即可**，所有键会通过依赖注入下发到 `RebornSubMenu` / `RebornMenuItem` / `RebornMenuItemGroup` / `RebornMenuDivider`（后四者也接受自己的 `ui`，用于只改某一个分支）。

| 键名                 | 落在哪个节点                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`               | 菜单最外层容器 `<div>`。默认 `relative shadow-sm bg-gray-1 transition-[width]`，整块菜单的底色、圆角、内边距、阴影改这里；`class` prop 也并到该节点。**折叠态的宽度由内联样式下发，不走这里**（见下方「折叠动画」）。 |
| `menu`               | 顶层 `<ul>`。默认 `flex transition-all duration-300`，主轴方向由 `mode` 决定；条目间距也在这里（水平 `gap-x-4` = 16px，垂直 `gap-y-1` = 4px）。                                                |
| `menuItem`           | 单个菜单项（`RebornMenuItem` 的 `<li>`，以及 `RebornSubMenu` 内部那一行标题）。默认 `group relative flex cursor-pointer select-none items-center transition-all`，行高、hover 底色、圆角改这里。`group` 供水平一级菜单的 hover 高亮反查父级状态，覆盖时请保留。 |
| `menuItemContent`    | 菜单项内部的横向排布容器，默认 `flex w-full items-center gap-2`；图标与文字的间距改这里。                                                                                                      |
| `menuItemIcon`       | 图标位。**仅填充了 `icon` 插槽时渲染**，默认 `flex w-5 shrink-0 items-center justify-center`——定宽一列、图形居中，折叠动画依赖这个定值（见「折叠动画」）；容器本身不受插槽内容影响，`ui.menuItemIcon` 始终生效。 |
| `menuItemTitle`      | 文字节点，默认 `flex-1 truncate`，字号字重灰阶由 `level` 变体补上；它在 default / `title` 插槽的外层，填充插槽后依然生效。                                                                     |
| `menuItemExtra`      | 右侧附加内容位。**仅提供了 `extra` 属性或 `extra` 插槽时渲染**，默认 `ml-auto shrink-0 text-sm text-gray-5`（`text-sm` 在本主题为 12px，比标题低一档），快捷键提示的样式改这里。               |
| `menuItemArrow`      | 子菜单的展开箭头。**仅在垂直方向的 `RebornSubMenu` 上渲染**（根级水平菜单不显示箭头），默认 `flex shrink-0 items-center justify-center transition-transform`，展开态由内部 `opened` 变体旋转。 |
| `subMenu`            | `RebornSubMenu` 的最外层 `<li>`，默认 `relative`——它是浮层定位的参照物，非必要不要改 `position`。                                                                                              |
| `subMenuPopup`       | 浮层展开时的子菜单面板（默认 Teleport 到 body）。**仅 `expandType="popup"` 时渲染**，默认 `absolute z-50 border border-gray-2 bg-gray-1 p-1 shadow-xl rounded-ui-xs`，浮层底色与层级改这里。   |
| `subMenuContent`     | 子菜单内部的 `<ul>`，默认 `flex flex-col gap-y-1`（条目间隔 4px）；平铺展开与浮层展开都会用到。                                                                                                |
| `menuItemGroup`      | `RebornMenuItemGroup` 的 `<li>`，默认 `flex flex-col`。                                                                                                                                        |
| `menuItemGroupTitle` | 分组标题容器，默认 `px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400`。该节点在 `title` 插槽外层，填充插槽后依然生效。                                                       |
| `menuItemGroupContent` | 分组内部承载子项的 `<ul>`，默认 `flex flex-col gap-y-1`（组内条目间隔 4px）；只想调分组内的疏密改这里，不影响分组标题。                                                                      |
| `menuDivider`        | `RebornMenuDivider` 的 `<li>`，默认 `my-1 list-none`，线条本身由 `dashed` 变体给出（`false` → `h-px bg-gray-2`，`true` → `h-0 border-t border-dashed border-gray-2`）。                        |

```vue
<template>
  <RebornMenu
    :items="items"
    :ui="{
      root: 'shadow-none bg-transparent p-0',
      menuItem: 'rounded-lg px-3 py-2 hover:bg-primary/10',
      menuItemTitle: 'text-sm',
      menuItemExtra: 'text-gray-6',
      subMenuPopup: 'rounded-xl',
    }"
  />
</template>
```

# 示例代码

## 基础垂直菜单

```vue
<template>
  <RebornMenu
    v-model:selected-keys="selectedKeys"
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

// 存的是完整路径，选中「用户管理」时为 ['2', '2-1']
const selectedKeys = ref(["1"]);
</script>
```

## 配置式数据（items）

```vue
<template>
  <RebornMenu
    v-model:selected-keys="selectedKeys"
    :items="items"
    mode="vertical"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RebornMenu, type ItemType } from "~/components/reborn/ui/reborn-menu";

const selectedKeys = ref(["home"]);

const items: ItemType[] = [
  { key: "home", label: "首页", icon: "lucide:home", extra: "⌘H" },
  { type: "divider" },
  {
    type: "group",
    label: "工作台",
    children: [
      { key: "project", label: "项目管理", icon: "lucide:folder-kanban" },
      {
        key: "team",
        label: "团队协作",
        icon: "lucide:users",
        children: [
          { key: "team-member", label: "成员列表" },
          { type: "divider", dashed: true },
          { key: "team-audit", label: "操作审计", disabled: true },
        ],
      },
    ],
  },
  { key: "logout", label: "退出登录", icon: "lucide:log-out", danger: true },
];
</script>
```

## 水平菜单与溢出折叠

```vue
<template>
  <RebornMenu
    v-model:selected-keys="selectedKeys"
    mode="horizontal"
    ellipsis
  >
    <RebornMenuItem index="1">首页</RebornMenuItem>
    <RebornMenuItem index="2">产品中心</RebornMenuItem>
    <RebornMenuItem index="3">解决方案</RebornMenuItem>
    <RebornMenuItem index="4">开发者文档</RebornMenuItem>
    <RebornMenuItem index="5">社区论坛</RebornMenuItem>
  </RebornMenu>
</template>
```

> 开启 `ellipsis` 后组件会监听容器宽度变化，把放不下的条目收进末尾的「更多」子菜单，容器变宽时自动还原。若容器宽度是被 JS 直接改写而没有触发 `resize`，可以调用实例方法 `handleResize()` 手动重算。

## Router 模式

```vue
<template>
  <RebornMenu
    v-model:selected-keys="selectedKeys"
    router
  >
    <RebornMenuItem index="/dashboard">仪表盘</RebornMenuItem>
    <RebornMenuItem index="/users">用户管理</RebornMenuItem>
    <!-- 需要具名路由或带参跳转时用 route，它优先于 index -->
    <RebornMenuItem
      index="settings"
      :route="{ name: 'settings', query: { tab: 'profile' } }"
    >
      系统设置
    </RebornMenuItem>
  </RebornMenu>
</template>
```

## 折叠菜单

```vue
<template>
  <div>
    <button @click="isCollapse = !isCollapse">
      {{ isCollapse ? "展开" : "折叠" }}
    </button>

    <RebornMenu
      v-model:selected-keys="selectedKeys"
      mode="vertical"
      :collapse="isCollapse"
    >
      <RebornMenuItem
        index="1"
        title="首页"
      >
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

> 折叠态下文字被隐藏，建议给 `RebornMenuItem` 补上 `title` 属性，鼠标悬停时仍能看到完整名称。

## 菜单项分组与分割线

```vue
<template>
  <RebornMenu
    v-model:selected-keys="selectedKeys"
    mode="vertical"
  >
    <RebornSubMenu index="1">
      <template #title>数据分析</template>

      <RebornMenuItemGroup title="报表">
        <RebornMenuItem index="1-1">日报表</RebornMenuItem>
        <RebornMenuItem index="1-2">周报表</RebornMenuItem>
      </RebornMenuItemGroup>

      <RebornMenuDivider />

      <RebornMenuItemGroup title="图表">
        <RebornMenuItem index="1-3">柱状图</RebornMenuItem>
        <RebornMenuItem
          index="1-4"
          extra="⌘L"
        >
          折线图
        </RebornMenuItem>
      </RebornMenuItemGroup>
    </RebornSubMenu>
  </RebornMenu>
</template>
```

## 受控展开

```vue
<template>
  <RebornMenu
    v-model:selected-keys="selectedKeys"
    v-model:open-keys="openKeys"
    mode="vertical"
    expand-type="normal"
    menu-trigger="click"
  >
    <RebornSubMenu index="2">
      <template #title>系统管理</template>
      <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
    </RebornSubMenu>
  </RebornMenu>
</template>

<script setup lang="ts">
import { ref } from "vue";

const selectedKeys = ref<string[]>([]);
// 直接改这个数组即可外部控制展开态
const openKeys = ref<string[]>(["2"]);
</script>
```

# 从旧版本迁移

本次重构对齐 Element Plus 的属性命名，包含**破坏性变更**：

| 旧写法                      | 新写法                             |
| :-------------------------- | :--------------------------------- |
| `v-model:active="path"`     | `v-model:selected-keys="path"`     |
| `v-model:expanded="opened"` | `v-model:open-keys="opened"`       |
| `@update:active`            | `@update:selected-keys`            |
| 实例方法 `updateActive()`   | 实例方法 `updateActiveIndex()`     |

不提供向后兼容别名，请全量替换。此外有几处**行为与视觉变化**需要留意：

- **浮层子菜单的 hover 展开现在有 `showTimeout`（默认 300ms）延时**，此前是立即展开。需要恢复原有手感可传 `:show-timeout="0"`。
- **禁用项不再使用 `pointer-events-none`**，改为 `cursor: not-allowed` + 事件层拦截，光标反馈符合设计规范；如果此前依赖禁用项完全不响应鼠标事件（例如 hover 变色），请复核样式。
- **展开态标题的渐变流光动画已移除**，改为纯色高亮。此前默认 `hover` 触发下鼠标一划过就会跑渐变，观感嘈杂；依赖该动画的自定义样式请改用 `ui.menuItemTitle`。
- **平铺展开（`expandType="normal"`）+ `menuTrigger="hover"` 时，鼠标移开不再自动收起**，收起改由手风琴 / 同级互斥逻辑接管。此前移开会在 `hideTimeout` 后关闭，导致刚展开的子项点不到。
- **平铺展开下点击子菜单标题始终可切换展开状态**，不再要求 `menuTrigger="click"`。此前「悬停 + 平铺」这组合没有任何收起路径：唯一的切换入口挂在 `click` 触发方式上，而移出关闭又被上一条刻意关掉了。
- **水平菜单的一级条目取消了 hover / active 背景块**，改为图标与文字高亮，并给无子菜单的选中项加 2px 底部指示器；条目间距固定为 16px。原有的背景观感可通过 `ui.menuItem` 自行加回。
- **选中态色值从 `bg-{color}/10` + `text-{color}` 改为色阶第 2 / 第 6 档**（见「选中态与展开态配色」）。此前用不透明度模拟层次，与设计规范的配色表对不上；新增 `showActiveBackground` 可整块关掉背景。
- **平铺子菜单的缩进从容器挪到了条目自身**：`subMenuContent` 不再带 `ml-4`，改由条目的 `padding-left` 逐层加 16px 承担。此前整列条目被容器一起右推，hover / active 的背景块跟着缩进、行首露出 16px 空白铺不满整行。依赖 `ui.subMenuContent` 上的外边距做布局的话请复核。
