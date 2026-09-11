---
title: SearchBox 搜索框
description: 用于带下拉面板的双端搜索框组件，支持历史记录、推荐词与 SKU 属性筛选。
category: 表单与输入
tags: [css, tailwind, input, search, reborn]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSearchBoxDemo.vue" config="RebornSearchBoxConfig" componentId="reborn-search-box" :componentFiles='["RebornSearchBox.vue", "reborn-search-box.config.ts"]' :uniappFiles='["RebornSearchBox.vue", "reborn-search-box.config.ts"]'}
::

## 简介

SearchBox 是搜索框组件，两端都围绕内部的 `RebornInput` 组合，都支持历史记录（最多 10 条，可自定义存取），也都提供 `search` / `focus` / `blur` 事件。

::warning
**本组件两端未对齐，API 差异较大，必须分端查看。** 最关键的三点：`modelValue` 类型不同（Web 为对象、UniApp 为字符串）；Web 端是**纯插槽基元**（不渲染任何默认内容，形态完全由使用方组合），UniApp 端是**固定形态**（内置原/译切换、相机入口、站点选择弹层，只能替换相机区域）；下拉面板仅 Web 端实现。跨端复用时需要分别处理绑定值与形态。
::

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
Web 端是围绕 `RebornInput` 的**纯插槽基元**：内部输入框恒为 `borderless`，**外层边框**落在最外层的**控件行**上，把外置插槽一并囊括在内（默认 `gray-4`；输入框区的水平内边距同时充当与外置插槽的间距）。

激活高亮只由**输入框自身的焦点**驱动（组件内以 `focus` / `blur` 事件维护，而非 CSS `focus-within`），且画在哪一层取决于有没有外置插槽：

- 没有 `leading` / `trailing` 时整行就是输入框，直接把外层边框换成当前 `color` 色族 5 阶；
- 一旦存在外置插槽，外层边框**恒为 `gray-4` 不变色**，改为只在**输入框区内另起一圈**描边（`::before` 覆盖层，撑满输入框区、只在未接触外置插槽的一侧保留圆角）。这样点外置插槽里的选择器、按钮时不会出现任何描边，外置插槽也不会跟着变色。

插槽分为两族：`input-leading` / `input-trailing` 转发到内部输入框的 `prefix` / `suffix`，内容落在**输入框内部**、贴着文本排布；`leading`（前置选择器区）、`trailing`（后置功能区）是搜索框自身的插槽，与输入框区并列排在控件行里、高度撑满整行。这些区域与 `dropdown`（下拉面板）一样**不渲染任何默认内容**，完全由插槽组合——左侧选择器自行放入 `RebornSelect`、相机与搜索按钮按需放进输入框内或外置区（`trailing` 作用域透出 `search` 方法）、历史/推荐/SKU 面板经 `dropdown` 拼装（作用域透出样式辅助键与历史操作方法）。

`shape` 与 `RebornInput` 的同名 API 对齐（circle 胶囊 / square 令牌圆角），底色卡片圆角随之与输入框对齐、面板只保留下半圆角；`inputAttrs` 可向内部输入框 v-bind 透传任意属性（`variant` 除外，恒为 `borderless`）。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
UniApp 端是**固定形态**的移动端搜索框，`v-model` 绑定字符串。结构自内向外为：

- 内部 `RebornInput`，`prefix` 位固定为放大镜图片，`suffix` 位固定为「原/译」切换卡片 + 分隔线 + 相机入口；
- 相机入口的内容可由**默认插槽**替换（不传时为 `i-lucide-camera` 图标）；
- 输入框右侧另有独立的**站点选择器**（图标为内置图片地址），点击拉起 `RebornPopup` 右侧弹层。

`search` 由键盘确认键（内部输入框的 `confirm` 事件）触发，触发后调用 `uni.hideKeyboard()` 收起键盘。`rounded` / `clearable` / `border` / `disabled` 控制外观与交互，`placeholderClass` 透传占位符样式类。历史记录写入 `uni.setStorageSync`。

无 `ui` / `inputUi` / `inputAttrs` / `shape`，样式定制只能经 `customClass` 与内置图标覆盖；`leading` / `trailing` / `dropdown` 等插槽也不存在。
:::

::

适用场景：

- 电商、文档站搜索框，需要历史记录与推荐搜索下拉面板时（Web 端经 `dropdown` 插槽构建）。
- 按商品属性筛选：把 `RebornSku` 放进 `dropdown` 插槽组合使用（仅 Web）。
- 需要目录选择器、图片搜索等自定义入口时（Web 端经 `leading` / `trailing` 插槽提供并自行处理交互）。
- 移动端带相机入口与站点切换的搜索栏（UniApp 端开箱即用）。

不适用场景：

- 普通文本录入改用 `reborn-input`。
- 从固定选项集中选择改用 `reborn-select`。

## API

::warning
两端 API 不通用，请按平台查看：`modelValue` 类型、可用 props、事件参数与插槽集合均不同。
::

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `SearchBoxModelValue` | `{ inputValue: "", selectValue: "" }` | 绑定值（`v-model`），为对象，见下方「SearchBoxModelValue」。 |
| `placeholder` | `string` | `"请输入搜索内容"` | 占位文本。 |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | 尺寸大小；高度由内部 `RebornInput` 承担，本组件另按尺寸给出输入框区的水平内边距。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 主题颜色，作用于聚焦描边（取对应色族 5 阶）。 |
| `shape` | `"circle" \| "square"` | `"circle"` | 外形轮廓，与 `RebornInput` 的同名 API 对齐：circle 胶囊 / square 统一取 `rounded-ui-xs` 令牌（不分尺寸）；底色卡片圆角随之与输入框对齐，下拉面板只保留下半圆角。 |
| `showDropdown` | `boolean` | `true` | 聚焦时是否展开下拉面板（面板内容完全由 `dropdown` 插槽提供）；置为 `false` 时会强制收起已展开的面板。 |
| `saveHistory` | `(history: string[]) => void` | `undefined` | 自定义保存历史记录的方法，不传时写入 `localStorage`。 |
| `removeHistory` | `() => void` | `undefined` | 自定义清空历史记录的方法，不传时清除 `localStorage`。 |
| `class` | `any` | `undefined` | 追加到根节点的自定义类名。 |
| `ui` | `SearchBoxUi` | `{}` | 组件自身 UI 覆盖，见下方「自定义样式（ui）」。 |
| `inputUi` | `InputUi` | `{}` | 内部 `RebornInput` 的 UI 覆盖（键见 `reborn-input`）。 |
| `inputAttrs` | `Partial<InputProps>` | `undefined` | v-bind 透传给内部 `RebornInput` 的属性；`variant` 不可覆盖（恒为 `borderless`，外层边框统一由控件行承担），`size` / `color` / `shape` / `placeholder` 等显式 prop 优先级更高。 |

UniApp 端独有、Web 端没有的 props：`mode`、`skuAttributes`、`placeholderClass`、`disabled`、`rounded`、`clearable`、`border`、`customClass`。其中 `disabled` / `clearable` 等原生能力在 Web 端经 `inputAttrs` 透传（内部输入框的 `clearable` 已恒为开启）。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | 绑定值（`v-model`），为输入文本字符串。 |
| `placeholder` | `string` | `"请输入搜索内容"` | 占位文本。 |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | 尺寸大小；仅影响转发给内部输入框的图标字号与图标间距（`md` 与 `lg` 取值相同），高度由 `RebornInput` 的尺寸体系承担。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 主题颜色；仅作用于「原/译」切换卡片的激活态边框与文字色。 |
| `rounded` | `boolean` | `true` | 是否使用圆角（药丸形）外观，映射为内部输入框的 `shape`（`circle` / `square`）。实际圆角受内部 `!rounded-ui-base` 覆盖影响，见上方「圆角与外观」。 |
| `border` | `boolean` | `false` | 是否显示输入框边框，映射为内部输入框的 `variant`（`outlined` / `filled`）。 |
| `clearable` | `boolean` | `true` | 是否显示一键清空按钮。 |
| `disabled` | `boolean` | `false` | 是否禁用输入。 |
| `placeholderClass` | `string` | `"text-gray-5"` | 透传给内部输入框的占位符样式类。 |
| `saveHistory` | `(history: string[]) => void` | `undefined` | 自定义保存历史记录的方法，不传时写入 `uni.setStorageSync`。 |
| `customClass` | `any` | `undefined` | 追加到根节点的自定义类名。 |
| `mode` | `"associate" \| "sku"` | `"associate"` | **声明保留**：当前实现未使用该属性。 |
| `showDropdown` | `boolean` | `true` | **声明保留**：UniApp 端未实现下拉面板，该属性当前不生效。 |
| `skuAttributes` | `SkuAttribute[]` | `[]` | **声明保留**：当前实现未使用该属性。 |
| `removeHistory` | `() => void` | `undefined` | **声明保留**：组件内部没有清空历史的入口，该回调不会被调用。 |

Web 端独有、UniApp 端没有的 props：`shape`、`class`、`ui`、`inputUi`、`inputAttrs`。
:::

::

### SearchBoxModelValue（仅 Web）

| 字段            | 类型               | 说明                                                                                  |
| --------------- | ------------------ | ------------------------------------------------------------------------------------- |
| `inputValue`    | `string`           | 输入框文本。                                                                          |
| `selectValue`   | `string \| number` | 供 `leading` 插槽里的选择器使用的选中值（组件本身不内置选择器，由插槽内容自行读写）。 |
| `[key: string]` | `any`              | 扩展字段：在 `dropdown` 插槽中组合 `RebornSku` 等筛选内容时可自行并入。               |

### SkuAttribute（仅 UniApp）

| 字段            | 类型     | 说明       |
| --------------- | -------- | ---------- |
| `label`         | `string` | 属性名。   |
| `value`         | `any`    | 属性值。   |
| `[key: string]` | `any`    | 扩展字段。 |

::tip
该类型随 `skuAttributes` 一同为声明保留，当前实现未消费。
::

### Emits

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: SearchBoxModelValue)` | 绑定值变化时触发（由 `defineModel` 生成）。 |
| `search` | `(value: SearchBoxModelValue)` | 按下回车、调用 `trailing` 作用域的 `search()`，或经 `dropdown` 作用域 `selectHistory` 选中历史时触发。非空 `inputValue` 会写入历史记录，触发后收起面板并让输入框失焦。 |
| `focus` | `(event: FocusEvent)` | 输入框获得焦点时触发；`showDropdown` 开启时同时展开下拉面板。 |
| `blur` | `(event: FocusEvent)` | 输入框失去焦点时触发；若新焦点仍在组件内部则不收起面板。 |

Web 端**不声明** `clickCamera` 与 `selectSku`：相机入口经插槽提供并自行处理点击，选择器变化由 `leading` 插槽内容自行处理。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 输入内容变化时触发，参数为最新文本。 |
| `search` | `(value: string)` | 键盘确认键（内部输入框 `confirm`）触发。非空关键字会写入历史记录，触发后调用 `uni.hideKeyboard()`。 |
| `clickCamera` | `-` | 点击右侧相机区域时触发（模板用 `@click-camera` 监听）。 |
| `focus` | `(event)` | 输入框聚焦时触发，参数为 uni 合成事件对象。 |
| `blur` | `(event)` | 输入框失焦时触发，参数为 uni 合成事件对象。 |
| `selectSku` | `(attr)` | **声明保留**：当前实现的模板尚未触发。 |
:::

::

### Slots

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `input-leading` | `{ ui, inputUi, search }` | 输入框内置前置插槽，转发到内部 `RebornInput` 的 `prefix`，**内容落在输入框内部、贴着文本排布并随输入框一起进入激活态**，无默认内容；`inputUi` 为输入框自身的样式辅助键。 |
| `input-trailing` | `{ ui, inputUi, search }` | 输入框内置后置插槽，转发到内部 `RebornInput` 的 `suffix`，内容落在输入框内部、随输入框一起进入激活态，无默认内容。 |
| `leading` | `{ ui }` | 搜索框外置前置插槽，**与输入框区并列排在控件行里（被外层边框囊括在内、高度撑满整行），获得焦点时不出现描边，无默认内容**：自行放入 `RebornSelect` 等内容；包裹层点击会收起面板并阻止冒泡；分隔线等装饰样式由插槽内容自行提供。 |
| `trailing` | `{ ui, search }` | 搜索框外置后置插槽，位置与约束同 `leading`，无默认内容：搜索按钮、相机图标等自行提供（样式也由内容自带），`search()` 调用即触发搜索。 |
| `dropdown` | `{ ui, history, selectHistory, removeHistoryItem, clearHistory, selectRecommend }` | 下拉面板内容，**无默认内容、完全由该插槽提供**：`history` 为历史记录列表，`selectHistory(kw)` 选中并搜索、`removeHistoryItem(kw)` 删除单条、`clearHistory()` 清空、`selectRecommend(kw)` 回填输入框；面板内容的装饰样式由插槽内容自行提供。 |

Web 端**没有默认插槽**。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `-` | 自定义右侧相机区域的内容，不传时渲染 `i-lucide-camera` 图标。点击该区域仍会触发 `clickCamera`。 |

UniApp 端**只有默认插槽**：`leading` / `trailing` / `input-leading` / `input-trailing` / `dropdown` 均不存在，前置放大镜、「原/译」切换、分隔线、站点选择器都是固定内置内容。
:::

::

### 自定义样式（ui）

::warning
`ui` / `inputUi` 是 **Web 端专属**，UniApp 端不接受这两个属性，样式定制只能经 `customClass` 追加根节点类名。
::

Web 端 `ui` 属性按 `SearchBoxUi` 的键覆盖对应节点类名：

| 键名              | 说明                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `wrapper`         | 根容器。                                                                                                         |
| `backdropCard`    | 展开状态下的底色卡片。                                                                                           |
| `control`         | 控件行：横向排布「外置前置插槽 + 输入框区 + 外置后置插槽」，承担**外层边框**；无外置插槽时聚焦高亮也落在这一层。 |
| `inputWrapper`    | 输入框区（结构层，承担水平内边距；有外置插槽时聚焦描边以 `::before` 覆盖层画在这一层内）。                       |
| `dropdownOuter`   | 下拉面板外层（负责高度过渡动画）。                                                                               |
| `dropdown`        | 下拉面板内容容器。                                                                                               |
| `leadingWrapper`  | 外置前置区（高度撑满整行，内容自身居中）。                                                                       |
| `trailingWrapper` | 外置后置区（高度撑满整行，内容自身居中）。                                                                       |

另有 `inputUi`（键见 `reborn-input`）用于覆盖内部输入框样式。外层边框落在 `control` 这一层，默认 `border-gray-4`；激活态由组件内部的 `focus` / `blur` 事件维护，而非 CSS `focus-within`，因此点中 `leading` 里的 `RebornSelect` 等可聚焦元素不会点亮任何描边。聚焦描边画在哪一层由**有无外置插槽**决定：无外置插槽时直接把 `control` 的边框换成 `color` 对应色族 5 阶（primary→brand-5、success→green-5 …）；有外置插槽时 `control` 恒为 `gray-4`，改由 `inputWrapper` 的 `::before` 覆盖层在输入框区内画一圈同色描边（绝对定位、`inset-0` 撑满输入框区、不参与布局，只在未接触外置插槽的一侧保留圆角，圆角随 `shape` 对齐）。组件样式统一走浅色令牌，不内置 `dark:` 前缀样式；需要深色适配时经 `ui` / `inputUi` 覆盖。

### 设计令牌

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
搜索框自身只定义输入框区的水平内边距，高度、字号、图标尺寸全部沿用内部 `RebornInput` 的令牌：

| 项目               | sm                     | md         | lg         | 说明                                                        |
| :----------------- | :--------------------- | :--------- | :--------- | :---------------------------------------------------------- |
| 输入框区水平内边距 | `8px`                  | `12px`     | `12px`     | 兼作输入框与外置插槽之间的间距，可用 `ui.inputWrapper` 覆盖 |
| 控件行高度         | `24px`                 | `32px`     | `40px`     | 取 `RebornInput` 的 `--height-input-sm/md/lg`               |
| 内置图标字号       | `text-xl`              | `text-2xl` | `text-2xl` | 转发给输入框的图标覆盖                                      |
| 内置图标间距       | `4px`                  | `6px`      | `6px`      | 输入框 `iconBox` 的 gap 覆盖                                |
| `square` 圆角      | `rounded-ui-xs`（6px） | 同 sm      | 同 sm      | 不分尺寸，与 `RebornInput` 的 square 对齐                   |

底色卡片外扩 6px（`-top-[6px]` / `-left-[6px]` / `w-[calc(100%+12px)]`），下拉面板同宽外扩；面板高度按内容 `scrollHeight` 动态计算，控件行高度由 `ResizeObserver` 实时测量。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
搜索框自身只定义「原/译」切换与站点选择器的尺寸，输入框高度沿用 `RebornInput` 的 rpx 令牌：

| 项目            | 取值            | 说明                                                   |
| :-------------- | :-------------- | :----------------------------------------------------- |
| 「原/译」切换区 | `64rpx × 64rpx` | 切换按钮的点击区                                       |
| 切换卡片        | `32rpx × 32rpx` | 单张卡片，字号 `18rpx`、圆角 `rounded-ui-sm`、2px 描边 |
| 卡片位移动画    | `300ms`         | 切换时两张卡片互换层级与位移                           |
| 分隔线          | `1px` 宽 / 半高 | `bg-gray-4`                                            |
| 相机图标        | `48rpx`         | 默认插槽未覆盖时的 `i-lucide-camera` 字号              |
| 前置放大镜      | `38 × 38`       | 内置远程图片，`mode="widthFix"`                        |
| 站点选择器图标  | `30px` / `14px` | 站点图标与展开箭头，均为内置远程图片                   |

`size` 只影响转发给输入框的图标字号（sm 较小、md 与 lg 相同）与图标间距；输入框 `wrapper` 被内部固定为 `bg-gray-3/80` + `!rounded-ui-base`。
:::

::

## 两端差异对照

| 维度              | Web                                                                                    | UniApp                                                         |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `modelValue` 类型 | `SearchBoxModelValue` 对象                                                             | `string`                                                       |
| 绑定值默认值      | `{ inputValue: "", selectValue: "" }`                                                  | `""`                                                           |
| 双向绑定实现      | `defineModel`                                                                          | `props` + 手动 `emit('update:modelValue')`                     |
| 组件定位          | 纯插槽基元，无任何默认内容                                                             | 固定形态，仅相机区域可替换                                     |
| 可用插槽          | `leading` / `trailing` / `input-leading` / `input-trailing` / `dropdown`（无默认插槽） | 仅默认插槽                                                     |
| 下拉面板          | 已实现，内容由 `dropdown` 插槽提供                                                     | 未实现（`showDropdown` 声明保留）                              |
| 外形属性          | `shape`（circle / square）                                                             | `rounded` / `border` 两个布尔量映射到输入框                    |
| 圆角实际来源      | `shape` 变体                                                                           | 内部 `!rounded-ui-base` 覆盖（`rounded` 不改观感）             |
| 边框归属          | 外层边框在控件行，内部输入框恒 `borderless`                                            | 边框由输入框自身的 `variant` 承担                              |
| 聚焦高亮          | 由 `focus` / `blur` 维护，分「点亮控件行」与「输入框区 `::before` 另起一圈」两种画法   | 交由 `RebornInput` 自身的聚焦样式                              |
| `search` 触发方式 | 回车、`trailing` 作用域 `search()`、选中历史                                           | 键盘确认键（`confirm`）                                        |
| `search` 后置动作 | 收起面板 + 输入框失焦                                                                  | `uni.hideKeyboard()`                                           |
| 相机事件          | 无（经插槽自行处理点击）                                                               | `clickCamera`                                                  |
| `selectSku` 事件  | 不声明                                                                                 | 声明保留，未触发                                               |
| 样式覆盖          | `class` / `ui` / `inputUi` / `inputAttrs`                                              | 仅 `customClass`                                               |
| 历史记录存储      | `localStorage`                                                                         | `uni.setStorageSync`                                           |
| 清空历史          | `clearHistory()`（`dropdown` 作用域）+ `removeHistory` 回调                            | 无入口（`removeHistory` 不会被调用）                           |
| 内置装饰          | 无                                                                                     | 放大镜图片、原/译切换、分隔线、站点选择器 + `RebornPopup` 弹层 |
| 渲染节点          | `div`                                                                                  | `view` / `text`                                                |
| 尺寸单位          | px                                                                                     | rpx                                                            |

## 注意事项

- **`modelValue` 类型两端不同**：Web 端为 `{ inputValue, selectValue, ... }` 对象，UniApp 端为字符串，跨端复用时需分别处理，不能直接共享同一个 ref。
- **Web 端所有插槽区域均无默认内容**：选择器经 `leading` 放入、搜索按钮经 `trailing` 提供（作用域 `search()` 触发搜索）、输入框内的图标经 `input-leading` / `input-trailing` 放入、面板由 `dropdown` 拼装；不填插槽则对应区域不渲染，仅剩输入框本体（回车仍可搜索）。
- **Web 端外层边框由控件行承担、把外置插槽囊括在内**：内部 `RebornInput` 恒为 `variant: 'borderless'`（`inputAttrs` 不可覆盖，避免双层描边），`leading` / `trailing` 与输入框区一同被围在里面，且高度都撑满整行。
- **Web 端激活高亮只认输入框的焦点，且分两种画法**：无外置插槽时聚焦换掉控件行的边框色；有外置插槽时控件行恒为 `gray-4`，改在输入框区内用 `::before` 覆盖层另起一圈——两种情况下点中 `leading` 里的 `RebornSelect`、`trailing` 里的按钮都不会出现描边。
- **Web 端插槽分两族、决定内容落在输入框内还是外**：`input-leading` / `input-trailing` 转发到 `RebornInput` 的 `prefix` / `suffix`，内容贴着输入文本排布；`leading` / `trailing` 与输入框区并列排在控件行里，间距按尺寸取 8px / 12px。
- **UniApp 端有 4 个声明保留的 props**：`mode`、`showDropdown`、`skuAttributes`、`removeHistory` 当前实现均未消费，传值不会有任何效果；`selectSku` 事件同样声明保留、尚未触发。请不要依赖它们。
- **UniApp 端的圆角不随 `rounded` 变化**：内部对输入框 `wrapper` 追加了 `!rounded-ui-base`，优先级高于 `rounded` 映射出的 `shape` 圆角。
- 下拉面板与 SKU 组合仅 Web 端可用；UniApp 端的 `shape` / `ui` / `inputUi` / `inputAttrs` 属性不存在。
- 历史记录 key 两端一致（`reborn-search-history`，最多保留 10 条）；即便面板不展示历史，`search` 仍会把非空关键字写入历史。
- Web 端内部只组合 `RebornInput`，可通过 `inputUi` / `inputAttrs` 透传定制；选择器等内容一律经 `leading` 插槽由使用方组合。
- UniApp 端内置「原/译」切换按钮与站点选择入口（图标为内置远程图片地址），业务中如不需要可自行覆盖样式隐藏；站点选择弹层内目前是占位内容。
