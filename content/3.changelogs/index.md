---
title: 更新日志
description: 按月份记录 Reborn UI 的组件新增、功能调整与问题修复，内容整理自仓库提交记录。
navigation: false
---

## 2026 年 10 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-10-13" color="success" placement="top"}

本批次对应 `reborn-ui@0.1.84` 与 `reborn-ui-registry@0.1.1`。

- 修复 **Upload**（Web）：等待 `beforeUpload` 时也可通过 `abort()` 取消，重新提交后旧钩子结果不再影响新任务；组件卸载时中止请求并屏蔽迟到的进度、成功与失败回调。
- 新增 **Table**（Web）：提供 `RebornTable` 与 `RebornTableColumn`，支持数据驱动列和声明式列、固定列与多级表头、单选和多选、排序筛选、远程分页、展开行、树形数据与懒加载、合并单元格及表尾合计。`size` 提供 `lg` / `md` / `sm` 三档，行高分别为 56 / 48 / 36px；文字沿用项目字号令牌，边框使用 `gray-3`。
- 调整 **Table**（Web）：设置 `height` / `maxHeight` 后默认固定表头，`fixedHeader=false` 可关闭固定；不设置高度时表头随内容滚动。支持 `tableLayout` 切换 `fixed` / `auto`，溢出提示复用 `RebornTooltip`，可通过表级或列级选项、格式化回调和插槽自定义。
- 调整 **Table**（Web）：纵向滚动条从实际表头底部开始，只占表体区域，多级表头按总高度避让；关闭固定或隐藏表头后恢复完整轨道。新增 `scrollTo({ top, left, behavior: 'smooth' })`，同一动画同步两个方向；默认定位及原有 `setScrollTop` / `setScrollLeft` 仍立即生效。
- 修复 **Table**（Web）：消除末行与外框叠加导致的粗边框，修正分组表头跨行列的分隔线；合并单元格与覆盖行的悬停样式双向联动，复选框水平、垂直居中。普通悬停与勾选使用 `bg-gray-2`，当前行使用 `bg-brand-2`，悬停时保留当前行高亮；固定列不再遮挡滚动条或拦截拖拽。
- 调整 **Scrollbar**（Web）：新增 `verticalOffset`，默认 0，用于让纵向轨道避开顶部固定内容，不改变横向滚动或内容布局。新增 `scrollTo({ top, left }, options)` 支持双轴同步动画，保留单轴方法与 `silent` 选项；系统开启减少动态效果时立即定位，动画完成或取消均结束等待中的 Promise。
- 修复 **Scrollbar**（Web）：统一缩放容器中的轨道点击与滑块拖拽坐标，保证定位准确；连续静默定位时，后续无位移请求不再清除前一次待派发的静默标记，避免滚动条无故闪现。
- 文档 **Table**（Web）：整理为 24 个独立示例，与文档用法同名同序。状态行通过 `row-class-name` 自定义，全宽溢出提示增加长短文本，固定列示例扩充至十列，多选提供两批各八条数据；单选示例将 radio 与当前行联动，并支持隐藏 radio 列。
- 文档 **Table**（Web）：金额插槽使用 `RebornText` 的 `value` 接口与条件配色，查看、删除使用 `RebornButton`；金额表头使用 `RebornInputNumber` 实际筛选数据，展开行内嵌子表，并提供父表、子表独立边框开关。同步 Table、Scrollbar 的 API 文档与知识库。
:::

:::reborn-timeline-item{timestamp="2026-10-09" color="error" placement="top"}

- 破坏 **CheckboxGroup**（双端）：选项字段别名 `props` 改名为 `fieldNames`，与 Select、RadioGroup、Cascader、Tree 的字段映射统一叫法，键位 `label` / `value` / `disabled` 不变。
- 破坏 **Cascader**（UniApp）：删除 `labelKey` / `valueKey` / `childrenKey`，改用 `fieldNames`（`label` / `value` / `children`），与 Web 端一致。Web 端的 `valueKey` 保留：它指定对象绑定值按哪个属性比对，不是字段映射。
- 破坏 **Sku**（Web）：属性组上的 `labelKey` / `valueKey` 合并为 `fieldNames`。对象选项的默认取值随之改变：以前不配 `valueKey` 时整个对象作为选中值，现在读 `value` 字段，`modelValue` 里只存字段值；对象没有 `value` 字段又没配 `fieldNames` 时各项都取到 `undefined`，会被当成同一个值。
- 调整 **Select**、**RadioGroup**（双端）：新增 `fieldNames`，接口字段名不是 `label` / `value` 时不必先把数据 map 一遍；对象项展开成「原字段 + 补齐的映射字段」，插槽里照样读得到没参与映射的字段。Web Select 与两端 RadioGroup 映射 `label` / `value` / `disabled`，UniApp Select 映射 `label` / `value` / `children`（多列联动）。
- 新增 **Transfer**（Web）：`virtual-scroll` 开启虚拟滚动，列表只渲染可视区附近的条目，头部下拉同样按虚拟列表渲染，适合上千条又不想分页的数据。配套 `virtual-item-height`（行步长，默认 `32`，对应只有 label 的条目；带 description 时传 `54`）与 `virtual-buffer`（可视区上下多渲染的条数，默认 `4`）；`ui` 新增 `virtualPhantom`、`virtualWindow`。
- 调整 **SelectTrigger**（Web）：`closeOn` 默认由 `click` 改为 `mousedown`。现在面板外按下任意鼠标键、滚动滚轮、触摸按下或页面滚动都会立即收起，与原生 select 一致；在面板内按下、拖到外部再松手不算外部操作，不会误收。依赖「页面滚动时面板跟随触发器」的地方，传 `close-on="click"` 即可恢复原行为。
- 调整 **Select**、**DatePicker**、**TimePicker**、**TreeSelect**、**Cascader**、**Dropdown**、**SelectDate**、**Breadcrumb**（Web）：外部关闭时机统一跟随 SelectTrigger，默认 `mousedown`。Dropdown、SelectDate 新增 `closeOn`；Cascader 通过 `triggerProps.closeOn` 传入；Breadcrumb 去掉内置的 `close-on="mousedown"`，改为沿用默认值，可用 `dropdown-props` 覆盖。
- 调整 **Tree**、**TreeSelect**（Web）：`height` 改为滚动区的最大高度（行内样式由 `height` 换成 `max-height`，与 antd 一致）。节点少时下拉面板按内容撑开，不再固定 240px 留出空白；节点超出后仍在区内滚动，虚拟滚动不受影响。直接使用 Tree 并依赖 `height` 撑出固定占位的，节点不足时区域会变矮，需要定高请在外层容器上给高度。
- 修复 **SelectTrigger**（Web）：`mousedown` 时机下只有带动触发器位移的滚动（页面滚动、触发器所在容器滚动）才收起，轮播图自动播放之类无关容器的滚动不再误收；页面本身不能滚动时，滚轮同样计为外部操作。
- 修复 **SelectTrigger**（Web）：外部关闭判定改在捕获阶段执行，外部元素上的 `@click.stop` 不会再让面板收不起来。浮层里再套触发器时（如日期面板里的时间选择器），子浮层会逐级登记到父级，在子浮层里操作不会把父浮层一起收起。
  :::

:::reborn-timeline-item{timestamp="2026-10-08" color="error" placement="top"}

- 破坏 **Transfer**（Web）：删除 `size`。原先列表按档位限高（`md` 为 300px）后滚动，现在根节点撑满父元素高度：父元素给了高度就在列表内滚动，高度为 auto 时列表随条目增高，条目多的地方要给父元素设高度或传 `height`。`ui` 删除 `searchWrapper`、`searchIcon`、`panelBodyFill`、`panelBodyRounded`、`operationBtnLabeled`，替换方式见「破坏性变更速查」。
- 破坏 **Transfer**（Web）：头部下拉改用 `RebornSelect`（`borderless` 多选、`sm` 档），计数文案显示在触发器里，开启下拉时头部复选框不再带文案；下拉不再提供批量操作，改为逐行列出当前面板搜索结果内的全部条目（不受分页限制），点一行切换该条勾选，下拉保持打开，禁用条目置灰不可点。原先的「全选所有 / 全选当页 / 反选当页」与单向模式的「撤回当页 / 撤回全部」随之删除，替换方式见「破坏性变更速查」。浮层挂到 body 下，不再被面板的 `overflow-hidden` 裁切。计数文案由「已选数 / 总数」改为「选中 N 项」，未勾选时为「N 项」。`ui` 删除 `headerSelectIcon`、`headerSelectDropdownInner`，`headerSelectMenu`、`headerSelectTrigger`、`headerSelectDropdown`、`headerSelectItem` 依次对应 `RebornSelect` 的 class、`triggerUi.trigger`、`triggerUi.dropdown`、`ui.option`。
- 破坏 **Transfer**（Web）：单向模式下只有开启后移入右侧的条目可以撤回：行尾显示「撤回」按钮，右侧下拉里也只有这些条目可以取消选中；开启前就在右侧的条目（含 `v-model` / `default-target-keys` 给出的初始值）视为已定结果，没有撤回按钮，在下拉中置灰。每次开启单向模式都会重新计算可撤回范围，中间的「撤回上一步」按钮撤销时一并还原。行尾按钮的悬停提示由跟随 `operation-buttons.undo.title`（默认「撤回上一步」）改为固定的「撤回」，无障碍名称由「移回左侧」改为「撤回到左侧」。
- 调整 **TreeSelect**（Web）：多选默认改为父子联动，与 Tree 的勾选规则一致——子级全选则父级勾选、部分选中则父级半选，勾选父级会带上全部可勾选后代，绑定值包含全部勾选节点。新增 `checkStrictly`，原先依赖逐节点独立勾选的地方加上 `check-strictly` 即可恢复。
- 调整 **Transfer**（Web）：新增 `variant`（`outlined` / `borderless`）与 `color`。`outlined` 为 8px 圆角描边面板；`borderless` 去掉边框且不渲染头部，适合嵌进外层已有边界的卡片或弹窗。头部全选与每一行改用 `RebornCheckbox`，计数文字作为全选的文案（开启头部下拉时改在下拉触发器里显示），勾选的条目铺上所选语义色的浅色底。`header-select` 默认值由 `checkbox` 改为 `both`，需要保持原样的地方显式写 `header-select="checkbox"`。
- 调整 **Transfer**（Web）：搜索框改用 `RebornInput`（`sm`、描边、后置搜索图标）并入内容区，不再画上下分隔线；列表滚动改用 `RebornScrollbar`；中间操作按钮改用 `RebornButton` 的 `sm` 档，颜色跟随 `color`，按钮禁用时固定为 `neutral`，避免彩色底的禁用按钮被误认为可点。新增 `title`、`extra`、`default`、`footer`、`operation` 插槽，分别替换头部勾选区、头部右侧、条目文案、面板底部与整个操作按钮；原 `item` 插槽保留，与 `default` 同时提供时 `default` 优先。
- 文档：Transfer 补充 `filter-option` 的默认行为与示例：不传时按 `label` 做包含匹配（英文不区分大小写），描述等字段要参与搜索时传入判断函数；分页示例的搜索占位改为「按姓名搜索」，与默认匹配范围一致。
  :::
  ::

## 2026 年 9 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-09-29" color="warning" placement="top"}

- 修复 **Switch**、**Checkbox**（Web）：外壳补上 `relative`，作为视觉隐藏的原生 input 的定位参照。此前 input 以 `<html>` 为包含块，在内部滚动的布局里会停在首屏下方，把页面撑出一段空白滚动区。
  :::

:::reborn-timeline-item{timestamp="2026-09-28" color="primary" placement="top"}

- 调整 **DatePickerPanel**（Web）：范围类选择选好起点后，悬停的格子会实时预览将要覆盖的区间，日、月、年、季度都支持，跨左右面板和向前悬停同样生效。
- 调整 **DatePickerPanel**（Web）：整面板禁用不再整体降低透明度，改为逐元素设置——标题转 gray-4、图标变淡、显示禁用光标、每格铺灰色底带、移除选中高亮；时间段选择框与快捷选项的禁用样式随之对齐。
- 修复 **DatePickerPanel**（Web）：`datetimerange` 区间带子的首格不再漏出。
  :::

:::reborn-timeline-item{timestamp="2026-09-24" color="primary" placement="top"}

- 调整 **主题令牌**（Web）：新增 `motion.css` 动效缓动令牌，配套[动效规范](/getting-started/motion)文档。
- 调整 **Menu**（Web）：新增 `autoScrollIntoView`，挂载和选中变化时把选中项滚入可见区域；折叠态一级菜单的提示可通过 `tooltip` 配置，传 `false` 关闭。
- 修复 **Menu**（Web）：平铺展开的子菜单统一按点击触发，解决悬停先展开、点击又收起导致要点两三次的问题；选中项不再被裁掉上方圆角。
- 修复 **Slider**（Web）：禁用时显示禁用光标。
  :::

:::reborn-timeline-item{timestamp="2026-09-22" color="primary" placement="top"}

- 调整 **Cascader**（Web）：第二列起的下级面板淡入并左滑入场，系统开启减少动态效果（`prefers-reduced-motion`）时不播放。
- 调整 **Cascader**（UniApp）：补齐 `checkStrictly`，单选可以选中任意层级，多选解除父子勾选关联。
- 调整 **Cascader**（双端）：严格多选的勾选框改为圆形，与文字间隔定为 8px；设置 `max-tag-count` 后标签放不下时换行，不再裁掉尾部和「+N」。
  :::

:::reborn-timeline-item{timestamp="2026-09-21" color="error" placement="top"}

- 破坏 **Tabs**（双端）：`destroy-on-hide` 改名为 `destroy-on-hidden`；`#extra` 插槽拆成 `#left-extra` 和 `#right-extra`。
- 调整 **Tabs**（双端）：新增 `overflow` 溢出导航（箭头或下拉）、`draggable` 拖拽排序（触发 `sort` 事件）和 `stretch` 撑满。
- 调整 **Menu**（Web）：子菜单弹层与分组结构重做。
- 文档：新增主题选择器，基础配色随之调整。
  :::

:::reborn-timeline-item{timestamp="2026-09-18" color="primary" placement="top"}

- 调整 **Button**（Web）：形状改由独立的布尔参数 `round`、`circle` 控制，可以和任意 `variant` 组合；旧的 `variant="round"` / `variant="circle"` 仍兼容。禁用样式同步完善。
- 调整 **Badge**（Web）：新增 `square`、`round`、`circle` 形状参数，`circle` 优先级最高。
  :::

:::reborn-timeline-item{timestamp="2026-09-17" color="neutral" placement="top"}

- 文档：页头标题拆成英文名与中文名两段（`titleEn`），技术栈徽章改用 RebornBadge。
- 文档：示例卡片改为描边样式，侧栏按设计稿调整字号与分类间距。
  :::

:::reborn-timeline-item{timestamp="2026-09-16" color="error" placement="top"}

- 新增 **Empty** 空状态、**Result** 结果页（双端）。
- 破坏 **圆角令牌**（Web）：删除 `rounded-ui-*`，改为覆盖 Tailwind 原生的 `rounded-sm` ~ `rounded-3xl` 并锁定为 px，对应关系见「破坏性变更速查」。取值与原生档一致，替换后视觉不变。
- 调整 **组件字号**（Web）：组件内部的 `text-xs` 统一换成七级令牌 `text-sm`，字号同为 12px，行高由 16px 变为 20px。
- 调整 **Popover**、**Tooltip**（Web）：浮层定位抽成共用的 `app/lib/floating.ts`，两者行为保持一致。
  :::

:::reborn-timeline-item{timestamp="2026-09-14" color="success" placement="top"}

- 新增 **Anchor** 锚点（Web）：API 对齐 Element Plus，支持 `container`、`offset`、`bound`、`duration`、`marker`、`type`、`direction`、`select-scroll-top`，提供 `change`、`click` 事件与 `scrollTo` 方法；支持 `items` 数据化配置，单项可设 `target`、`replace`、`offset`。
- 调整 **Tabs**（Web）：主题色改用语义类名。
- 修复 首页 3D 场景在 http 协议下因缺少 `GPUShaderStage` 崩溃的问题。
- 工程：部署链路补上三类线上事故的检查门禁。
  :::

:::reborn-timeline-item{timestamp="2026-09-13" color="primary" placement="top"}

- 修复 **Switch**（双端）：`auto-width` 在受挤压的 flex 行里失效；圆点内的文案居中。
- 调整 **Tabs**（双端）：`card` 去掉边框，`rounded` / `capsule` 悬停不再有动效，切换动画加快。
- 文档：组件导航按「系列 → 分类」两级分组，顶栏新增 Web / UniApp 切换，文档元数据新增 `platform`、`category`。
  :::

:::reborn-timeline-item{timestamp="2026-09-11" color="success" placement="top"}

- 新增 **Tree** 树形控件（Web）：支持展开、选中、勾选三组 key，父子级联、异步加载、拖拽、虚拟滚动与七种主题色。
- 新增 **TreeSelect** 树选择器、**Notification** 通知、**Popconfirm** 气泡确认框、**Progress** 进度条（Web）。
- 调整 **Tabs**（双端）：新增液体切换动画，修复卡片选中态样式。
- 破坏 **Tabs**（Web）：移除旧的组合式 Tabs，改用 `RebornTabs`。
  :::

:::reborn-timeline-item{timestamp="2026-09-10" color="neutral" placement="top"}

- 文档：首页改为全屏视频。
  :::

:::reborn-timeline-item{timestamp="2026-09-08" color="primary" placement="top"}

- 调整 **SearchBox**（Web）：`square` 形态统一圆角档位。
- 调整 多个组件按规范审查结果修正，双向绑定统一改用 `defineModel`。
- 文档：AI 助手改为流式接口，Playground 支持运行时 Tailwind。
  :::

:::reborn-timeline-item{timestamp="2026-09-04" color="success" placement="top"}

- 新增 **Alert** 警告提示（双端），支持文字滚动；Badge、Toast、Tooltip 同步优化。
- 调整 **Dropdown**（Web）：按 Arco 规格改造，支持 `options`、12 个弹出方向、`trigger`（`click` / `hover` / `manual`）与 `show-arrow`，新增 **Doption**、**Dsubmenu**、**Dgroup** 子组件。
- 调整 **SelectTrigger**（Web）：支持多方向定位与箭头。
- 调整 **ContextMenu**（Web）：支持选中文字后触发。
- 调整 **DropdownSelect**（UniApp）：展开收起加入高度动画。
  :::

:::reborn-timeline-item{timestamp="2026-09-01" color="primary" placement="top"}

- 调整 **Radio**（Web）：对齐 Arco API 重构，新增 `button` / `pure-button` 类型、`filled` / `outlined` 变体、七种主题色与 `options` 数据化配置。
- 修复 **Input**（双端）：`borderless` / `underlined` 形态的下划线显示与横向内边距。
- 修复 **Checkbox**（双端）：禁用态的填充色与边框色按令牌语义纠正。
- 文档：Playground 一键运行时补全 script 依赖，支持导入组件 config 中的常量；Checkbox 文档按双端拆表。
  :::
  ::

## 2026 年 8 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-08-31" color="primary" placement="top"}

- 调整 **Select**（Web）：触发器改为自绘，接入 `variant` 体系，多选标签改用 RebornBadge；新增 `allow-search` 与 `filter-option` 搜索、`loading`、`virtual` 虚拟列表（`virtual-item-height`、`virtual-buffer`）、`dropdown-scroll` 以及 `header`、`footer` 插槽。
- 修复 **Select**（Web）：`pointer-events` 导致需要点击两次才能展开的问题。
- 文档：Scrollbar、Breadcrumb、Pagination、Input、InputNumber 补充总览缩略图。
  :::

:::reborn-timeline-item{timestamp="2026-08-28" color="neutral" placement="top"}

- 文档：示例分组改为独立卡片，每张卡片提供折叠、复制、预览、Playground、问 AI 五个操作。
  :::

:::reborn-timeline-item{timestamp="2026-08-27" color="error" placement="top"}

- 破坏 **Input**（双端）：移除 `rounded`、`border`，改用 `shape` 与 `variant`，对应关系见「破坏性变更速查」。
- 调整 **Input**（双端）：对齐 Element Plus，支持 `maxlength`、`show-word-limit`、`clearable`、`formatter`、`parser`、`show-password`，以及 textarea 的 `rows`、`autosize`、`resize` 和 `prepend`、`append` 插槽。
- 调整 **InputNumber**（双端）：`controlsPosition` 支持按钮在左侧或右侧上下堆叠；Web 端悬停或聚焦时滑入，UniApp 端常显。
- 调整 **Pagination**（UniApp）：新增 `color`，简洁模式支持直接输入页码。
- 新增 **Layout** 布局容器（含 Aside、Header、Footer、Main）与 **FieldTrigger**（Web）。
  :::

:::reborn-timeline-item{timestamp="2026-08-26" color="error" placement="top"}

- 破坏 **Button**（UniApp）：`round`、`circle` 改为 `variant="round"`、`variant="circle"`。
- 文档：确立「画布是唯一表面」的示例规范。
- 工程：知识库产物改为部署时构建；CI 覆盖 `refactor/**` 与 `fix/**` 分支。
  :::

:::reborn-timeline-item{timestamp="2026-08-25" color="primary" placement="top"}

- 调整 **Scrollbar**（Web）：滚动条提供 4 / 6 / 8px 三档样式，且不占用布局宽度；补充示例与文档。
  :::

:::reborn-timeline-item{timestamp="2026-08-24" color="primary" placement="top"}

- 调整 **主题**（Web）：色板对齐设计稿并提供暗色模板，新增 `secondary` 色板与暗色语义映射。
- 调整 **Button**（Web）：新增 `text` 变体。
- 文档：新增总览缩略图示例，Button API 按端拆分，AI 面板改为浮层。
  :::

:::reborn-timeline-item{timestamp="2026-08-22" color="error" placement="top"}

- 破坏 **字号令牌**（Web）：字号收敛为七级（12 / 14 / 16 / 20 / 24 / 30 / 38px），删除 `text-caption-*`、`text-body-*`、`text-title-*`。
- 破坏 **Button**（Web）：`size` 从七档收敛为 `sm` / `md` / `lg`，高度 24 / 32 / 40px；新增 `borderStyle`（`solid` / `dashed`）。
- 工程：AI 接口加入登录鉴权与滑动窗口限流。
  :::

:::reborn-timeline-item{timestamp="2026-08-21" color="neutral" placement="top"}

- 文档：接入 AI 助手，新增站内 Playground、飞书登录与聊天记录。
- 文档：顶栏改为单层结构，Logo 拆分为独立组件。
- 修复 线上 AI 助手回复为空的问题。
  :::

:::reborn-timeline-item{timestamp="2026-08-20" color="neutral" placement="top"}

- 工程：新增 `reborn-ui-mcp` MCP 服务，为 144 个组件补充面向 AI 的描述，新增 `AGENTS.md` 并在 CI 中校验一致性。
- 文档：修正 150 处文档与源码不一致的描述，重写 24 个表单组件和 25 个导航、基础组件的文档。
- 修复 **TextHoverEffect**（Web）：默认动画时长。
  :::

:::reborn-timeline-item{timestamp="2026-08-18" color="neutral" placement="top"}

- 工程：清理 CLI，重新生成组件注册表，建立 144 个组件的知识库结构与生成脚本。
  :::

:::reborn-timeline-item{timestamp="2026-08-14" color="neutral" placement="top"}

- 文档：组件页改为三栏布局，右侧新增 UniApp 示例面板。
- 工程：部署改用 GitHub Actions。
  :::
  ::

## 2026 年 7 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-07-21" color="success" placement="top"}

- 新增 **`v-loading` 指令** 与 **`useLoading`** 服务（Web）。
- 调整 **Carousel**（Web）：类型定义抽离为独立文件。
- 文档：文档页布局重构。
  :::
  ::

## 2026 年 6 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-06-11" color="primary" placement="top"}

- 调整 **Popup**（UniApp）：优化拖拽手感。
  :::

:::reborn-timeline-item{timestamp="2026-06-10" color="warning" placement="top"}

- 修复 **Signature**（UniApp）：多端兼容问题；补充相关文档。
  :::

:::reborn-timeline-item{timestamp="2026-06-09" color="primary" placement="top"}

- 调整 **Descriptions**、**Transfer**、**Fab**（Web）：样式与交互优化。
- 调整 **Signature**（UniApp）：样式优化。
- 文档：Markdown 标题锚点支持点击复制链接。
  :::

:::reborn-timeline-item{timestamp="2026-06-05" color="success" placement="top"}

- 新增 **Descriptions** 描述列表、**Transfer** 穿梭框（Web）。
- 调整 **Select**、**InputOtp**（Web）：样式优化。
  :::
  ::

## 2026 年 5 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-05-29" color="warning" placement="top"}

- 修复 **Toast**、**SwipeAction**、**Signature**、**Input**、**Cascader**、**Fab**、**Draggable**（UniApp）：多端兼容问题。
  :::

:::reborn-timeline-item{timestamp="2026-05-15" color="warning" placement="top"}

- 修复 **Fab**、**BackTop**、**Popup**（UniApp）：交互与兼容问题。
  :::

:::reborn-timeline-item{timestamp="2026-05-14" color="warning" placement="top"}

- 修复 **Menu**、**Affix**、**InputNumber**（Web）：样式问题。
- 修复 **Popup**、**Rate**、**Cascader**（UniApp）：交互问题；修复 Collapse 样式。
  :::

:::reborn-timeline-item{timestamp="2026-05-09" color="success" placement="top"}

- 新增 **SlideVerify** 滑动验证（UniApp）。
  :::

:::reborn-timeline-item{timestamp="2026-05-07" color="primary" placement="top"}

- 调整 **SwipeAction**（UniApp）：新增两种删除模式，并修复多端兼容与交互问题。
  :::

:::reborn-timeline-item{timestamp="2026-05-06" color="primary" placement="top"}

- 调整 **Signature**（UniApp）：封装横屏签名弹窗，修复示例在三端的样式冲突。
  :::
  ::

## 2026 年 4 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-04-29" color="primary" placement="top"}

- 调整 **SwipeAction**（UniApp）：解决左手操作的手势冲突，优化右手滑动判定。
- 调整 **Guide**、**Checkbox**、**Menu**：样式与交互调整。
  :::

:::reborn-timeline-item{timestamp="2026-04-27" color="success" placement="top"}

- 新增 **Watermark** 水印、**Splitter** 分割面板、**Breadcrumb** 面包屑（Web）。
- 新增 **Signature** 签名（UniApp）。
  :::

:::reborn-timeline-item{timestamp="2026-04-24" color="success" placement="top"}

- 新增 **ContextMenu** 右键菜单、**Marquee** 跑马灯、**useOverlay**、打字机效果（Web）。
- 调整 **Carousel** 支持缩略图，**Image** 支持放大镜（Web）。
  :::

:::reborn-timeline-item{timestamp="2026-04-23" color="success" placement="top"}

- 新增 **Menu** 导航菜单（Web）。
  :::

:::reborn-timeline-item{timestamp="2026-04-20" color="success" placement="top"}

- 新增 **Tooltip** 文字提示（Web）、**NoticeBar** 通告栏（双端）。
  :::

:::reborn-timeline-item{timestamp="2026-04-13" color="success" placement="top"}

- 新增 **Coupon** 优惠券。
  :::

:::reborn-timeline-item{timestamp="2026-04-10" color="primary" placement="top"}

- 调整 **Dialog**：样式按设计规范更新。
  :::

:::reborn-timeline-item{timestamp="2026-04-03" color="success" placement="top"}

- 新增 **DatePickerPanel** 日期面板（Web）。
  :::
  ::

## 2026 年 3 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-03-30" color="success" placement="top"}

- 新增 **IconCloud** 图标云、**LiquidGlass** 液态玻璃效果（Web）。
- 新增 **Header**、**Container** 布局组件（Web）。
  :::

:::reborn-timeline-item{timestamp="2026-03-27" color="success" placement="top"}

- 新增 **SearchBox** 搜索框（双端）。
  :::

:::reborn-timeline-item{timestamp="2026-03-19" color="warning" placement="top"}

- 修复 在荣耀 300、小米 11 Pro 等机型上的兼容问题。
- 调整 **Fab**、**Pagination**、**Input**：样式与交互优化。
  :::

:::reborn-timeline-item{timestamp="2026-03-12" color="success" placement="top"}

- 新增 **Popover** 气泡卡片、**ColorPicker** 颜色选择器（Web），同时补齐 Drawer、Overlay、Toast、Transition、Draggable 的 Web 实现。
- 新增 **Waterfall** 瀑布流（UniApp），调整 Loading、LoadMore。
- 调整 **Tabbar**（UniApp）：修复变体样式。
  :::

:::reborn-timeline-item{timestamp="2026-03-06" color="success" placement="top"}

- 新增 **Tabbar** 标签栏（UniApp），支持多种变体与下沉模式。
  :::

:::reborn-timeline-item{timestamp="2026-03-03" color="success" placement="top"}

- 新增 **QRCode** 二维码、**Footer** 页脚、**DropdownSelect** 下拉选择。
  :::
  ::

## 2026 年 2 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-02-28" color="warning" placement="top"}

- 修复 微信小程序兼容问题（UniApp）。
  :::

:::reborn-timeline-item{timestamp="2026-02-24" color="primary" placement="top"}

- 调整 **Rate**、**Slider**、**Select**：功能完善与样式调整。
  :::

:::reborn-timeline-item{timestamp="2026-02-14" color="success" placement="top"}

- 新增 **Text** 文本、**Radio** 单选框、**InputOtp** 验证码输入（UniApp）。
  :::

:::reborn-timeline-item{timestamp="2026-02-05" color="success" placement="top"}

- 新增 **Form** 表单、**Affix** 固钉、**Sticky** 吸顶与 **BackTop** 回到顶部。
- 文档：新增基于 zod 的表单校验指南。
  :::

:::reborn-timeline-item{timestamp="2026-02-02" color="success" placement="top"}

- 新增 **Image** 图片。
  :::
  ::

## 2026 年 1 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-01-30" color="success" placement="top"}

- 新增 **Textarea** 文本域。
- 修复 **Tabs**：指示条位置与滑动切换问题。
  :::

:::reborn-timeline-item{timestamp="2026-01-29" color="success" placement="top"}

- 新增 **Collapse** 折叠面板。
  :::

:::reborn-timeline-item{timestamp="2026-01-27" color="success" placement="top"}

- 新增 **Chip** 标签。
- 修复 暗色模式下的样式问题，以及页面刷新时报错的问题。
  :::

:::reborn-timeline-item{timestamp="2026-01-20" color="neutral" placement="top"}

- 工程：初始化 UniApp 工程；新增安装脚本、样式配置与快速开始文档。
  :::

:::reborn-timeline-item{timestamp="2026-01-15" color="success" placement="top"}

- 新增 **Checkbox** 复选框、**InputNumber** 数字输入框、**Switch** 开关。
  :::

:::reborn-timeline-item{timestamp="2026-01-13" color="success" placement="top"}

- 新增 **Input** 输入框、**Tabs** 标签页。
  :::

:::reborn-timeline-item{timestamp="2026-01-09" color="success" placement="top"}

- 新增 **Button** 按钮、**Badge** 徽标。
  :::

:::reborn-timeline-item{timestamp="2026-01-07" color="neutral" placement="top"}

- 工程：项目初始化。
  :::
  ::
