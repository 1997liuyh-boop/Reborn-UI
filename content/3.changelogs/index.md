---
title: 更新日志
description: 按月份记录 Reborn UI 的组件新增、功能调整与问题修复，内容整理自仓库提交记录。
navigation: false
---

## 2026 年 10 月

::reborn-timeline{:ui='{"content":"[&>ul]:my-0"}'}
:::reborn-timeline-item{timestamp="2026-10-26" color="error" placement="top"}

- 新增 **Splitter**（Web）：`change` 事件在拖拽松手、折叠 / 展开或父级改写 `size` 后派发一次，载荷为全部面板尺寸与拖拽条下标，拖拽过程中与尺寸未变时不派发；`limit` 事件在拖拽中某个面板进入 `min` / `max` 边界时派发一次，停在边界上不重复。`collapse` 事件追加第二个参数，表示操作后是否折叠。
- 修复 **Sticky**（双端）：放在按内容收缩宽度的容器里（如 `items-start` 的 flex 列）时，吸顶后宽度不再塌成 0；吸附期间占位容器保留吸附前的宽度，父容器变窄时跟着收窄。Web 端侧栏折叠等只平移占位容器的布局变化后，吸顶内容也会重新对齐。
- 修复 **Affix**（双端）：吸边改按悬浮块中心判断左右；Web 端视口宽度改读 `documentElement.clientWidth`，页面有纵向滚动条时右侧吸边不再贴进滚动条下面，左右间距一致；UniApp 端改用窗口宽高定位。窗口尺寸变化（含 H5 地址栏收起、软键盘、横竖屏）时，未拖动过的悬浮块按 `left` / `right` / `top` / `bottom` 重新锚定，拖动过的只夹回可视范围，开启吸附时贴回原侧边缘。
- 调整 **Anchor**（Web）：`type="default"` 的轨道线由 `gray-2` 调为 `gray-3`，放进填充面板时不再与底色重合，`default` 与 `underline` 可以区分；滚动补间移到 `app/lib/scroll-tween.ts`，CLI 单独安装锚点不再连带整套菜单。
- 调整 **ContextMenu**（Web）：带描述的菜单项里，标签与描述之间留出 4px 间距。
- 修复 **Dropdown**（Web）：显示箭头时尖端不再压进触发器（左右方向最明显，向上展开时还会和按钮里的下拉图标叠成两个箭头）：带箭头的默认间距由 8px 改为 12px，`popupOffset` 显式传值时不受影响。
- 修复 **SelectTrigger**（Web）：展开时触发器在同一次渲染里被挤动，浮层与箭头首帧就贴住新位置，不再等入场动画结束才归位；Select、Cascader、DatePicker、TimePicker、TreeSelect、Dropdown 共用。开启 `arrow` 且未传 `offset` 时间距默认取 12px（Cascader 经 `triggerProps` 开箭头时生效）。
- 修复 **TextRevealCard**（Web）：星点层补上漏掉的 `Motion` 导入，星点恢复渲染；随机位置改为挂载后生成，服务端与客户端首帧一致。
- 破坏 **Anchor / Breadcrumb / Menu**（Web）：导出的注入键 `ANCHOR_INJECTION_KEY`、`BREADCRUMB_INJECTION_KEY`、`MENU_INJECTION_KEY` 由字符串改为类型化 Symbol，按字符串 `inject('reborn-anchor')` 注入会拿到 `undefined`，需改为导入这些常量。
- 破坏 **Cascader / CascaderPanel / Checkbox / CheckboxGroup**（Web）：改为严格受控。只传 `:model-value`（Cascader 还包括 `:input-value`、`:popup-visible`）而不接更新事件时，交互只派发事件、显示保持父值，不再点击后接管为内部状态；需要「给初值、之后组件自管」请改用 `defaultValue` / `defaultChecked` / `defaultInputValue` / `defaultPopupVisible`。Checkbox 在父级拒收时原生 input 也对齐回父值。
- 破坏 **Popover / Popconfirm**（Web）：传入 `open` 后，点击触发器、点击外部、滚动关闭与 `close()` 只派发 `update:open`，不再先改内部显隐；父级不接事件或拒收时气泡保持父值，与 UniApp 端一致。
- 破坏 **Tabs**（Web）：未写 `pane-key` 时的默认编号改为插槽书写位置（`v-if` 隐藏的面板仍占一位），嵌套在 `v-for` / `<template>` 里的面板默认编号由数字下标改为「外层-内层」字符串；依赖默认数字编号的 `v-for` 面板请显式传 `pane-key`。前面的面板被隐藏或列表增删时，后面面板不再被错位复用，默认插槽里的普通元素不再多出 `panekey` 属性，根节点恢复为单个元素。
- 破坏 **Timeline**（Web）：`items` 里未声明的字段不再透传到每个 `li` 上，借 `items` 透传任意属性的写法失效；根节点恢复为单个 `ol`。
- 破坏 **Collapse / Sticky**（Web）：布局动画登记的注入键 `LAYOUT_ANIMATION_KEY` 从 `reborn-collapse.config.ts` 移到 `~/composables/useLayoutAnimation`，改用 `provideLayoutAnimation` / `useLayoutAnimationRegistration` 登记，直接导入旧位置的扩展代码需改导入路径。
- 调整 **Splitter**（Web）：面板识别只认 `RebornSplitterPanel`（含全局异步注册的包装器），默认插槽里的其他组件不再被分配尺寸；面板外包了元素或组件时降级为普通容器并在开发环境警告，不再抛错。调整过尺寸后再增删面板，相邻面板补偿后的尺寸会发出 `update:size`。
- 调整 **SearchBox**（Web）：`history` 不再有默认值 `[]`，以是否为 `undefined` 判断父级是否绑定；未绑定时历史写入本地存储，不再发出 `update:history`。
- 调整 **受控模型**（Web）：IInput、Compare、BalanceSlider、Alert、Drawer、Fab、Header 的受控判定改用共享的 `useRawProp` / `useControlledModel`（`app/composables`，CLI 随组件分发），不再各自读取 `vnode.props`；对外行为不变。
- 调整 **Collapse**（Web）：受控时已处于目标状态再调用 `show()` / `hide()` 不再重复派发 `update:modelValue`。
- 调整 **TextReveal**（Web）：只有插槽文字或 `duration` / `delay` / `stagger` 变化时才重播入场动画，与文字无关的父级重渲染不再触发重播；类名变化时就地重新换行。
- 调整 **Meteors**（Web）：根节点由 `display: contents` 改为铺满定位父容器的 `absolute inset-0` 层（`pointer-events-none`），透传到根上的 `style` 作用到整层流星；`class` 仍加在每颗流星上。
- 调整 **DatePickerPanel**（Web）：未传绑定值与 `defaultValue` 时，服务端首帧主内容区隐藏，挂载后定位到本月再显示，不再露出「1970 年 1 月」；悬停范围预览不再重复调用 `disabledMethod`。年 / 月 / 季度网格合并为 `DatePickerUnitGrid`，对外行为不变。
- 修复 **Cascader**（Web）：`loadMore` 写成内联箭头函数、`fieldNames` 写成内联对象时，父级重渲染不再清空已加载的下级。
- 修复 **Form**（Web）：字段名本身含连字符（如 `user-name`）时，校验结果能对应回该字段。
- 修复 **Pagination**（Web）：改每页条数导致当前页越界时，`current-change` 与 `update:modelValue` 只派发一次。
- 修复 **Breadcrumb**（Web）：运行时解析得到的条目（站内 Playground、`resolveComponent`）与单根包装组件里的条目，`max-count` 折叠与 `order` 排序恢复生效。
- 修复 **Menu**（Web）：插槽模式开启 `ellipsis` 后，选中项回写等自身更新不再把折叠重置后重新切分，「更多」子菜单不再卸载重挂。
- 修复 **Carousel**（Web）：越界的 `initialSlide` / `v-model`（含 loop 下的 -1）在服务端首屏与客户端首帧即按张数钳制。
- 修复 **Marquee**（Web）：悬停暂停只响应跑马灯自身，放进带 `group` 类的卡片里不再被卡片悬停误触发。
- 修复 **Select**（Web）：远程搜索叠加父级拒收时，原已选项的文本与标签不再消失。
- 修复 **Dialog / Drawer**（Web）：服务端渲染初始打开的对话框不再进入共用弹层栈，服务端内存不再随请求增长，`z-index` 与客户端水合一致。
- 修复 **Dropdown**（Web）：`options` 中有重复的原始值、数字值与对象项下标相同，或数字和同字面量字符串并存时，选项 key 不再重复。
- 修复 **Tree**（Web）：开启 `autoExpandParent` 时，父组件写回与上次内部写入相同的展开集合不再被误判而跳过父链补全。
- 修复 **MultiStepLoader**（Web）：首屏 `loading` 为 `true` 时，步骤计时与 `action` 改为客户端挂载后才开始，服务端渲染不再执行一遍 `action`。
- 修复 **ContainerTextFlip**（Web）：替换 `words` 后立即重测外框宽度；新数组更短时下标夹回范围内。
- 修复 **Coupon**（Web）：服务端首屏的缺口 / 锯齿遮罩恢复生效。
- 修复 **Table**（Web）：绑定 `v-model:selected-keys` 且提供具名插槽时，勾选一行只重绘该行。
- 修复 **TimePicker**（Web）：整面板禁用时选中项恢复高亮。
- 修复 **ContextMenu**（Web）：展开期间滚动重新定位复用 `useFloatingDismiss` 的滚动监听，不再重复登记。
- 修复 **RadioGroup**（UniApp）：父级把绑定值置回 `undefined` 时回到 `defaultValue`，与 Web 端一致。
- 修复 **CheckboxGroup / RadioGroup**（UniApp）：微信小程序 options 模式下选项恢复显示勾选框 / 单选框。
- 修复 **Checkbox**（UniApp）：独立使用时 `v-model` 初值为 `null` 按未选中处理，不再渲染报错。
- 修复 **Form**（UniApp）：字段名含连字符时不再被当成嵌套路径而跳过校验。
- 修复 **Select**（UniApp）：弹层打开期间父级替换 `options` 数组时，不再把未确认的滚轮位置拉回已提交值。
- 修复 **Rate**（UniApp）：半星快速点按的结果不再取决于手速；越界的 `v-model` 夹取到 `0 ~ count`，与 Web 端一致。
- 修复 **Popover**（UniApp）：打开后测量期间被快速关闭或方位变化打断时，不再丢失 `open` / `change(true)` 事件。
- 修复 **NoticeBar**（UniApp）：小程序端垂直轮播恢复入场动画；切换 `disabled` 不再把轮播重置到第一条。
- 修复 **Breadcrumb**（UniApp）：微信小程序 routes 模式下分隔符恢复显示。
- 修复 **Draggable**（UniApp）：H5 默认长按模式下手指落在列表上可正常滚动页面，项内按钮可点击；只有长按进入拖拽后才拦截滚动。
- 修复 **Collapse**（UniApp）：展开动画结束后面板不再塌成 0 高；`ui.content` 默认类由 `absolute top-0 left-0 w-full` 改为 `w-full flow-root`，自定义了 `ui.content` 定位的需留意；闭合态挂载不再闪动。
- 修复 **Popup**（UniApp）：微信小程序上只传 `title` 时弹层标题恢复显示（Select / Cascader / DatePicker 的弹层标题一并恢复）。
- 修复 **Toast**（UniApp）：tabBar 页面来回切换后，消息不再只渲染在已隐藏的页面里；每个页面的 `<RebornToast />` 各自渲染同一份队列。
- 修复 **Sticky**（UniApp）：吸顶状态切换后的内部重测只刷新宽高，临界位置附近不再来回闪动。
- 修复 **UniApp 兼容性**：表单控件与 Alert、Badge、Chip、Collapse、Overlay、Popup、Popover、Fab、SlideVerify 等不再使用 `Object.hasOwn`，Toast 不再使用 `Array.prototype.at`，iOS 15.4 以下的小程序 / WebView 不会在 setup 阶段报错。
- 修复 **useDarkMode**（UniApp）：存储里没有主题记录时按宿主主题取初值，不写存储、不改 `<html>` 的类名；使用方自己管理暗色时，首次渲染 PickerView 不再把 `dark` 类去掉。
- 文档站：Dropdown 演练场新增「菜单结构」，可在基础平铺（`options`）与树形多级菜单（content 插槽）之间切换。
- 文档站：交互演练场改为上下布局，控件在上、预览在下，分组标题独占一行，组内一行四个控件，默认显示两行，其余收进「展开全部参数」；同一行的控件按行对齐，标签折行不再错位。卡片源码抽取补上展开运算符引用的声明（如 `{ ...defaultState }`）；未选择过主题色的访客不再收到 `Set-Cookie`。

:::

:::reborn-timeline-item{timestamp="2026-10-23" color="error" placement="top"}

- 破坏 **DatePicker**（UniApp）：`reborn-select-date` 改名为 `reborn-date-picker`，组件名改为 `RebornDatePicker`，导入路径改为 `components/reborn-date-picker/RebornDatePicker.vue`，类型 `SelectDateShortcut` 改名为 `DatePickerShortcut`；`labelFormat` 改名为 `format`，与 Web 端同名同义，其余参数与事件不变。
- 破坏 **SelectDate**（Web）：删除 `RebornSelectDate`，日期选择统一使用 `RebornDatePicker`；DatePicker 文档合并为双端，新增两端差异对照。
- 破坏 **TreeSelect**（Web）：移除 `title` 插槽，统一用 `item`，两者作用域参数相同（`node` / `selected` / `expanded`）。继续写 `#title` 不报错，但内容不再渲染，节点回落为数据里的标题。
- 调整 **Form**（双端）：`size` 默认值改为 `md`（Web 原为 `sm`，UniApp 原为空）。控件上显式写的 `size` 优先于所在表单与表单项，未写时才跟随表单，与 Element Plus 一致；此前表单尺寸会覆盖控件自己的设置。
- 修复 **FormItem**（双端）：错误信息出现或消失时不再推动下方表单项。`inlineMessage` 为 `false` 时错误浮在控件下方、占用表单项的下间距；为 `true` 时排在控件右侧同一行，单行截断，Web 端悬停可看全文。此前 `inlineMessage` 声明了但没有生效。
- 修复 **Form**（双端）：动态列表删掉中间项时，后面的项前移改用同一路径注册，被删项卸载时不再把这条路径一起注销，接管的表单项照常参与校验。
- 修复 **Form**（Web）：`scrollToField` 改用原生 `scrollIntoView`，表单放在弹窗、抽屉或独立滚动容器里也能定位；校验失败后按页面上的先后定位第一个出错字段，此前按注册先后，动态新增或 `v-if` 后显示的字段会排错。
- 调整 **Rate**、**TimePicker**、**ColorPicker**、**Upload**、**Transfer**、**Mention**（Web）：接入表单校验，值变化后按表单的 `trigger` 触发字段校验。TimePicker、ColorPicker、Upload、Transfer 校验失败时显示错误描边；Rate、TimePicker、ColorPicker 的尺寸与禁用跟随表单，Upload、Transfer 的禁用跟随表单。ColorPicker 面板里的输入框不再继承外层表单项的错误态。
- 修复 **Dialog**、**Drawer**（Web）：关闭时一并收起内部展开的下拉、Popover 与 Tooltip。此前内容不卸载的弹窗、抽屉关闭后，传送到 body 的浮层会留在页面上，按 Esc 关闭时最明显。
- 修复 **Popover**（Web）：路由变化或所在页面被 keep-alive 停用时关闭气泡，并取消待执行的悬停任务；没有安装 Vue Router 的应用照常使用。
- 修复 **SelectTrigger**（Web）：向上展开的面板改用 `bottom` 贴住触发器，展开与收起动画期间不再与触发器错开。
- 修复 **Transition**（Web）：组件卸载时不再中止正在播放的离场动画。此前下拉刚开始收起、所在弹窗随即销毁时，节点会一直留在页面上。
- 调整 **DatePicker**（Web）：`arrowAnimation` 默认改为 `false`，展开时日历图标不再旋转。
- 调整 **Calendar**（Web）：悬停任意日期以及选中的日期，显示与有事项日期相同的浅底与顶边。
- 修复 **Steps**（Web）：`lineType="dashed"` 的连接线先清零四边宽度，未引入 Tailwind preflight 时不再出现浏览器默认的 3px 边框。
- 文档：组合式函数一节新增 `showLoading`、`useGlobalScrollLock` 两页，其余各页按源码校对；该节页面加入像素拼图背景。

- 破坏 **布尔模型**（双端）：Alert 的 `show`、Badge 的 `show` / `checked`、Collapse 的 `modelValue`、Chip 的 `show`、Fab 与 Overlay 的 `modelValue` 声明默认统一为 `undefined`。未绑定时保留组件原本初值；显式 `false` / `null` / `undefined` 按关闭或未选中处理，不能再用空值表示“未绑定”。Fab 的 `active` 只初始化未绑定模型，初始化不再派发更新；需要展开请给模型真实初值。
- 修复 **受控模型**（Web）：IInput、BalanceSlider、Compare、Alert、Badge、Collapse、Chip、Fab、Drawer、Dropdown、Header、Overlay 在本地交互后重新绑定空模型，正确读取父级值；父级拒收时保持父值，重复提交相同目标仍派发原 `update:*` 事件。动态增加或移除 camelCase / kebab-case 模型绑定均重新判断归属，Header 的旧异步拦截、Dropdown / Fab 的旧悬停任务不能覆盖新状态。
- 修复 **受控模型**（UniApp H5 / 小程序）：Alert、Badge、Collapse、Chip、Fab、Overlay 以及 Popover 的 `open`、Popup 的 `modelValue`、SignatureLandscape 的 `show`、SlideVerify 的 `modelValue` 均以显式父模型为准；父级拒收后不自行切换显示，重复请求仍发更新，移除绑定恢复本地状态。Popover 的 `defaultOpen` 只初始化未绑定状态，显式空值不能再借用默认展开。小程序即使模型属性缓存变化没有触发子组件更新，也能在原生更新完成后接管；兄弟实例、多个模型与祖先插槽彼此隔离。
- 破坏 **Tabs / TabPane**（双端）：业务选择改用新增的 `paneKey`（模板 `pane-key`），不再读取 Vue `key` 作为模型值；旧 `:key="item.id"` 业务写法须补 `:pane-key="item.id"`，Vue `key` 继续保留实例身份。新增 `order`；动态小程序面板还须逐项传 `:order="index"`，静态未传 `paneKey` 仍自动编号，数字 `0` 与字符串值均保留。上下文改用类型化 Symbol，扩展组件须导入配置文件公开的注入键。
- 调整 **TabPane / BreadcrumbItem**（双端）、**TabbarTrigger**（仅 UniApp H5 / 小程序）：新增的 `order` 仅在整组均为有限数值时按升序生效，同值保持相对次序；混传、缺项、`NaN` / `Infinity` 整组回退。小程序动态项必须全部传入序位，静态缺省保持登记次序；H5 / Web 缺省沿用 VNode / 插槽顺序。Breadcrumb 的 `routes` 自动传下标；Tabbar 模型仍用 `name` 或排序后索引。
- 修复 **Tabs / Breadcrumb**（双端）与 **Tabbar**（UniApp）：动态头部或中间插入、删除、重排后，同步首尾、激活索引与折叠；Web Breadcrumb 服务端首屏即得到折叠结果。Web Tabs 拖拽后保留本地头部顺序，仅父级真正改写完整有效的业务值 / `order` 映射时重新接管，普通标题更新不复位。UniApp Tabbar 的视觉顺序、索引点击与指示球测量一致，同数量换序也重新测量。
- 调整 **SlideVerify**（UniApp）：`defaultVerified` 仅初始化未绑定模型；显式 `false` / `null` / `undefined` 优先，不被默认 `true` 覆盖。初始化不派发 `update:modelValue`、交互 `change` 或表单校验；通过验证仍发送本次实际成功载荷。
- 修复 **Form**（双端）：清除或重置会使旧异步校验失效；整表校验与字段校验并发时等待较新的最终结果。解析拒绝或校验异常不会返回假成功，字段提示“校验未完成，请重试”，无登记字段时也返回失败；UniApp 重置每次复制快照，保留 `Date` / `undefined`，动态 `FormItem.prop` 随路径更新。
- 破坏 **Form**（UniApp）：删除从未生效的 `hideRequiredAsterisk`、`requireAsteriskPosition`、`statusIcon`、`validateOnRuleChange`，移除这些表单级参数；`FormItem.requireAsteriskPosition` 继续有效。
- 破坏 **ColorPicker / ColorPickerPanel**（UniApp）：`onChange` 改为 `change`，监听从 `@on-change` 迁移到 `@change`，不保留别名；仅用户提交或手势结束派发，外部赋值不派发。输入草稿在失焦 / 确认时提交，拖动仍实时更新模型。
- 破坏 **Draggable**（UniApp）：`ui.base` 拆为 `ui.root` / `ui.item`，不保留别名；根样式迁到 `root`，条目样式迁到 `item`。回传元素保留原始对象或原始值，不再注入 `uid` 或复制；父级原地增删同步显示，快速松手使过期测量失效，只有拖拽中阻止页面滚动，非 H5 通过 WXS 更新拖动样式。
- 修复 **UniApp 组件**：Cascader / DatePicker 未绑定模型时保留选择，DatePicker 文本随格式与分隔符刷新；Cascader 丢弃旧懒加载结果，Collapse 展开后内容增长不被裁切，Fab 点击动作不再双发，BackTop 隐藏时不再命中。Badge / Chip / Checkbox / Input 恢复 H5 属性透传，动态插槽随更新生效；Affix 拖动阻止页面滚动并响应定位变化，Footer 卸载释放偏移，Image 换图重置状态并使用小程序可用的错误图标，Input 清除触发字段校验。
- 调整 **二维码演示**（UniApp）：移除从未影响导出的 500 / 750 / 1000 像素尺寸选择；`toPng()` 仍不接受尺寸参数，演示导出固定为 600 × 600 像素。恢复六个配置页签，颜色确认后提交，三个编辑弹窗各自保存草稿；码点 / 外框 / 内点只接受各自选项集合的值，Logo 开关只接收布尔值。
- 修复 **Textarea / Input**（UniApp）：Textarea 默认恢复可编辑，`readonly` 与表单禁用切换后正确更新原生禁用态；Input 根样式支持字符串、对象与数组，父级后续替换仍生效。SwiperAction 演示补齐列表索引，删除操作读取正确条目。
- 调整 **组件与演示写法**：统一具名 Props 接口、类型化事件、模型声明与静态模板引用，原始值使用浅引用，移除模板中的 TypeScript 断言；需要深层编辑的数据保留响应性。缓存可复用的样式和计算，定时、监听与异步任务随组件或作用域结束清理。
- 修复 **Web 演示**：Lens 的 Rays / Beams SVG 引用使用各实例实际标识；Steps 显式导入 `defineComponent`；TimePicker 选择或清空后，父模型、控件与代码展示同步，复制的代码补齐 `RebornTimePicker` 导入。
- 修复 **IInput**（Web）：受控 `undefined` / `null` 清空显示，不再回显旧交互副本；未绑定时保留 `defaultValue` 初值和本地输入。
- 调整 **BalanceSlider / Compare**（Web）：受控模型显式空值将显示比例复位到 `initialValue` / `initialSliderPercentage`，不主动回写父模型；与非受控本地值分开。
- 修复 **MultiStepLoader**（Web）：全屏层实际传送到专用 `#teleports`，摆脱 transform 祖先的包含块；宿主须提供目标并在 SSR 时注入对应传送内容。删除原生按钮无效 size 属性。
- 破坏 **AnimatedList**（Web）：列表改由 `items` 传入、在 `item` 作用域插槽（`{ item, index }`）中渲染，不再读取默认插槽；修复卸载后轮播仍无限运行、静态子组件写法列表为空、离场动画不生效。
- 调整 **BalanceSlider**（Web）：新增 `v-model`（`modelValue`，0-100 的数字），未绑定时仍以 `initialValue` 为初值；去掉写死的 `id="track"`。
- 破坏 **HaloSearch**（Web）：除 `class` 外的透传属性（含 `style`、原生事件）改落到内部输入框，原先落在外层容器；新增 `v-model` 绑定关键词与回车派发的 `search` 事件。内部 id 选择器改为 class，多实例不再产生重复 id。
- 修复 **ColorPicker**（Web）：`hideDefaultSwatches` 不再连自定义色板一起隐藏；HEX 与数字通道输入框在输入中途不再被改写，`value-change` 只在输入合法时触发；`type` 变化后同步到面板；对比度区域的 AA / AAA 标记改用 RebornBadge 渲染（原先引用了不存在的 `UiBadge`）。
- 调整 **Compare**（Web）：新增 `percentage` prop，可用 `v-model:percentage` 双向绑定滑块位置（此前只派发 `update:percentage`，写 `v-model:percentage` 时值会落到根元素上）；`initialSliderPercentage` 改为未绑定时的初值，修改后立即复位。卸载后不再派发 `update:percentage`。
- 调整 **ColorPicker**（Web）：`open` 改由 `defineModel` 实现，导出的 `ColorPickerProps` 类型不再包含 `open`（运行时 prop 与 `v-model:open` 用法不变）。
- 破坏 **FileUpload**（Web）：事件 `onChange` 改名为 `change`，监听由 `@on-change` 改为 `@change`；回调参数改为文件列表的副本，修改它不再影响组件内部列表。
- 修复 **HyperText**（Web）：`animateOnLoad` 为 `false` 时不再在挂载时自动播放（此前无论取值都会播放一次），服务端渲染不再启动定时器。
- 破坏 **iPhone15ProMockup**（Web）：`src` 恢复为屏幕图片地址（此前任意值都只显示写死的站内 UniApp 页面）；嵌入页面改用新增的 `iframeSrc`。屏幕圆角裁剪路径改为按实例生成 id，多个模型同页不再冲突。
- 破坏 **Lens**（Web）：`hover-update` 事件移除，悬停状态改用 `v-model:hovering`（事件 `update:hovering`）；挂载时不再主动派发一次 `false`。镜头离场的缩小淡出动画开始生效（原写的 `leave` 不是 motion-v 的属性）。
- 修复 **RebornCheckbox / RebornCheckboxGroup**（Web）：显式 undefined/null 清空选择，不回落旧内部值；组上下文改类型化 Symbol 和只读状态。
- 调整 **RebornCheckbox**（Web）：class/style 落 label，其他原生属性落 input，并随父级更新；indeterminate 直接绑定 DOM 属性。
- 修复 **RebornCascader / RebornCascaderPanel**（Web）：显式空模型清空选择，恢复 style/id/aria/data 透传与焦点事件入口。
- 调整 **RebornCascader / RebornCascaderPanel**（Web）：懒加载结果保存在内部缓存，不写业务 options，支持冻结对象；配置或数据换引用时旧回调失效。
- 修复 **RebornCascader**（Web）：搜索支持虚拟窗口；结果变化同步真实滚动归零，虚拟行高与步长一致，占位层保持总高；关闭/清空取消旧搜索防抖。
- 修复 **RebornAnchor**（Web）：链接登记表变化后重算激活项；两处静态模板引用统一 useTemplateRef。
- 修复 **RebornAvatar / RebornAvatarGroup**（Web）：补查水合前已失败图片；分组 Fragment 路径参与 key，避免相邻列表撞键。
- 调整 **RebornCalendar**（Web）：SSR 首屏复用日期/时区快照并支持普通 Vue，客户端挂载后刷新日期，减少跨时区和午夜错位。
- 修复 **RebornCarousel**（Web）：保留真实片 VNode，取消帧时同步清除登记；初始索引在 setup 确定。
- 修复 **RebornBadge / RebornButton / RebornBreadcrumbItem**（Web）：动态插槽存在性随渲染更新，不继续使用 setup 首帧快照。
- 调整 **RebornBadge**（Web）：`class` 只作用于徽标主体（与 `ui.base` 同一节点），不再同时加到外层动画容器；依赖外层容器布局（`w-full`、外边距等）的写法改用 `ui.root`。
- 破坏 **RebornButton**（Web）：`trailing` 插槽作用域参数 `ui` 从 `trailingIcon` 类名字符串改为与 `leading` 相同的样式函数对象，与 UniApp 一致；原先把 `ui` 直接当类名用的写法改为 `ui.trailingIcon()`。
- 修复 **RebornDatePicker**（Web）：文档移除过时的 style 不生效说明，确认原生属性落在触发器根节点。
- 修复 **RebornCollapse**（Web）：绑定 `v-model` 时 `toggle` 事件载荷是切换前的旧值（展开收到 `false`）；现在与文档一致，载荷为切换后的状态。
- 破坏 **RebornCollapse**（Web）：Expose 的 `isAnimating` 改为只读（`Readonly<Ref<boolean>>`），外部不能再改写动画状态。
- 修复 **RebornColorPicker**（Web）：透明度改动没有写回 `v-model`；现在带透明度时输出 `#rrggbbaa`，不透明时仍为 `#rrggbb`。
- 修复 **RebornColorPicker**（Web）：色值输入框边输边被改写，现在失焦或回车时才解析提交，不合法的输入恢复为当前色值。
- 修复 **RebornColorPicker**（Web）：外部改写 `v-model` 会被面板转成小写六位十六进制后回传（颜色名等无法解析的值被改成黑色）；现在外部改值只同步显示、不回传。
- 修复 **RebornColorPicker**（Web）：不绑 `v-model` 时取色无效；改用 `defineModel`，非受控用法由组件自己保存颜色。
- 修复 **RebornColorPicker**（Web）：触屏拖动被系统手势打断后 window 上的监听残留、拖滑块时页面跟着滚动；改用 Pointer Events，卸载时清理。
- 调整 **RebornColorPicker**（Web）：新增 `change` 事件（`RebornColorPickerPanel` 同样提供），一次取色交互结束且颜色变化时派发；表单校验从「拖拽中逐帧」改为在 `change` 时触发一次。
- 破坏 **RebornColorPicker**（Web）：`size` 类型去掉从未生效的 `'xs'`，只接受 `'sm' | 'md' | 'lg'`，与 UniApp 端一致。
- 修复 **RebornCountdown**（Web）：`:value="dayjs(...)"` 内联构造时，父组件每次重渲染都会重启倒计时、重复派发 `change` / `finish`；现在按时间戳判断目标是否变化。
- 修复 **RebornCoupon**（Web）：每次重算都新建 5 组媒体查询且卸载后不释放，长时间停留或反复进出页面时监听持续累积。
- 调整 **RebornCoupon**（Web）：断点覆盖项（`sm` / `md` / `lg` / `xl` / `xxl`）改为挂载后生效，服务端渲染时水合首帧与服务端一致。
- 调整 **RebornDialog**（Web）：嵌套弹窗按 `Esc` 只关闭最上层；`z-index` 改为基础层级，打开时与 RebornDrawer 共用弹层栈自动递增，后打开的始终在上层。
- 修复 **RebornDialog**（Web）：未开 `scrollable` 时，面板里自带滚动的表格、textarea、下拉列表能用滚轮滚动；`append-to` 改为打开时解析并在找不到目标时回退 body；拖拽中关闭或卸载会移除 window 监听。
- 破坏 **RebornDrawer**（Web）：expose 的 `panel` 改为只读引用，首次打开前的值从 `undefined` 变为 `null`。
- 调整 **RebornDrawer**（Web）：事件在脚本中改为 camelCase 声明（`openAutoFocus`、`closeAutoFocus`、`resizeStart`、`resizeEnd`），模板写法 `@open-auto-focus` 等不受影响。
- 修复 **RebornForm**（Web）：`resetFields` 的初始值快照改为保留类型的深拷贝，`Date` 不再被重置成字符串，初值为 `undefined` 的字段也能被清空；`validate()` 只解析一次 schema，连续触发的异步校验只采纳最新结果；`validate` 的回调抛错不再让 Promise 挂起。
- 修复 **RebornFormItem**（Web）：expose 的 `prop` 随属性实时更新；`label` 插槽动态出现或消失后表单项间距随之刷新；错误提示不再叠加两套进场动画。
- 修复 **RebornInput / RebornInputNumber**（Web）：`style` 透传到根节点生效；前置 / 后置插槽动态增删后圆角压平随之刷新。
- 破坏 **RebornInput / RebornInputNumber**（Web）：expose 的 `ref` / `inputRef` 改为只读引用。
- 修复 **RebornInputNumber**（Web）：`v-model` 绑定为 `undefined` 时不再在挂载时被改写成 `null`。
- 修复 **RebornInputOtp**（Web）：`input-type="text"` 时移动端弹出全键盘；`id`、`name`、`aria-*` 等透传属性落到隐藏的原生输入框，`style` 落到根节点。
- 修复 **RebornDialog / RebornEmpty / RebornFormItem**（Web）：插槽动态增删后头部、底部、标题区与表单项间距随之刷新；RebornDialog 的 `id`、`style`、`data-*` 等透传属性落到面板上。
- 修复 **RebornFireworks**（Web）：`class` 以外的透传属性落到容器上；运行时切换 `teleport` 后烟花画到新画布上。
- 修复 **RebornFab**（Web）：`v-model` 改为点击即写回，不再延迟 400ms，与 UniApp 端时序一致；动画期间父组件写入的值不再被覆盖；运行时修改 `top` / `bottom` / `left` / `right` 立即落位，`variant` 离开 `circle` 时清除环形布局残留样式。
- 调整 **RebornDropdown**（Web）：内部注入键改为带类型的 Symbol；放进只提供部分上下文的宿主（如面包屑 `#droplist`）时不再因缺方法报错。
- 修复 **RebornDraggable**（Web）：在列表项以外松手或取消拖拽时显示顺序回滚到 `v-model`，不再与数据脱节；允许重复的原始值，对象项不再用 `name` 作为渲染 key。
- 调整 **RebornGuide**（Web）：`steps` 换新引用但目标与形态不变时只刷新内容，不再重放切步动画；事件在脚本中改为 camelCase 声明（`nextStepClick`、`prevStepClick`），模板写法不变。
- 修复 **RebornImage**（Web）：预览打开期间组件卸载（如离开路由）会一并关闭预览遮罩；连续点击图片不再叠出多个预览；图片加载完成时不再无条件读取布局。
- 破坏 **NoticeBar**（Web）：点击 `right-icon` 属性渲染的右侧图标改为派发 `close` 并阻止冒泡，不再触发 `click`；`right-icon` 插槽内容不参与关闭。此前 Web 端 `close` 从未派发，与文档和 UniApp 端不一致。
- 修复 **NoticeBar**（Web）：水平模式调用 `replay()` 后滚动停住；运行时修改 `speed` / `scrollable` / `wrapable` / `disabled` / `interval` 或容器宽度变化后滚动与轮播状态失步；`text` 变为单条或空数组后轮播定时器不停、派发 `change(NaN)`。
- 修复 **NoticeBar**（Web）：`customStyle` 此前被静默丢弃，现在追加到根节点内联样式；移除从未生效的 `ui.content` 键。
- 修复 **Popover / Popconfirm**（Web）：`v-model:open` 初始为 `true` 时气泡不打开；`open` 与 `defaultOpen` 同时传入时改为以 `open` 为准。Popover 的 `open` 改由 `defineModel` 声明，props / 事件名不变。
- 调整 **Pagination**（Web）：`total` 变小导致当前页越界时，组件钳制页码并回写 `v-model`、派发 `current-change`（此前只在显示层钳制）；`total` 为 0 时不钳制。
- 修复 **Pagination**（Web）：`style`、`id`、`data-*` 与原生事件监听器此前被 `inheritAttrs: false` 静默吞掉，现在透传到根 `<nav>`。
- 破坏 **Notification**（Web）：同 `key` 再次调用改为以最后一次的 config 整体替换实例，上次传过、这次没传的字段（`footer`、`ribbon`、`onClose`、`progress` 等）不再沿用；进度条随计时一起从头播放。
- 修复 **Notification**（Web）：`message` / `icon` / `closeIcon` / `footer` 传 VNode 时，新增或关闭任意通知、悬停暂停都会让该节点卸载重挂，内部组件状态与输入焦点丢失。
- 修复 **Menu**（Web）：受控 `openKeys` 被拒收时保持父值，实例 `open/close` 解析完整祖先路径，插槽增删会重新测量溢出，点击继续自然冒泡。
- 调整 **Menu**（Web）：展开状态只由模型持有，关闭句柄触发或取消即释放；浮层只在展开时监听滚动和窗口尺寸。
- 调整 **Menu/Anchor**（Web）：共用可取消滚动补间，菜单仍只滚动最近容器。
- 破坏 **Slider**（Web）：`thumb` 插槽改为只替换滑块中心圆，外层滑块的定位、聚焦、方向键与气泡始终由组件渲染；作用域参数由 `{ value: { value, style } }` 改为平铺的 `{ value, index, active, disabled }`，范围模式也可使用。原先用插槽画整个滑块的写法，改为用 `ui.thumb` 调整外形、插槽只放内容。
- 修复 **Slider**（Web）：范围模式下用方向键或拖拽推过相邻节点后，焦点跟到被移动滑块的新位置，继续按方向键不再移动被越过的节点；受控绑定被父级拒收时，滑块停在父级的值。
- 修复 **Switch**（Web）：键盘聚焦后按空格可以切换，并与点击一样经过 `beforeChange`、发出 `update:modelValue` / `change`；原生 checkbox 的勾选态与开关状态保持一致。
- 调整 **Switch**（Web）：未声明的 attrs 中 `style` 与 `data-*` 改为落到根节点，其余仍落到内部隐藏的原生 checkbox。
- 修复 **Switch**、**RadioGroup**（Web）：绑定值被父级置回 `undefined` 时回到 `defaultValue`（Switch 缺省取 `inactiveValue`），不再停在上一次的值。
- 修复 **Select**（Web）：远程搜索替换 `options` 后，已选项仍能在触发器上回显文本与标签；多选标签按选择先后排列。
- 修复 **Rate**（Web）：受控绑定被父级拒收时星形停在父级的值；卸载时取消排队中的指针换算，`trigger="hover"` 下不会在卸载后发出 `update:modelValue`。
- 破坏 **SearchBox**（Web）：删除 `saveHistory` / `removeHistory` 回调，历史改用 `v-model:history`，未绑定时按 `historyKey` 使用浏览器本地存储。主模型与 `search` 载荷仍是 `{ inputValue, selectValue, ...扩展字段 }` 对象，`dropdown` 插槽自定义面板，`showDropdown` 保留；不要套用 UniApp 的字符串模型和插槽名。根节点属性透传恢复。
- 破坏 **Segmented**（Web）：字段映射属性由 `props` 改为 `fieldNames`，不保留别名。
- 破坏 **RootPortal**（Web）：移除未使用的 `config` 导出与配置文件，仅保留传送组件和默认插槽。
- 破坏 **Splitter**（Web）：默认插槽不再暴露内部 ui；折叠插槽只提供按钮内部内容并接收 `collapsed`，size 载荷保留输入格式且挂载不触发更新。
- 调整 **Sticky**（Web）：`rect` 只读，调用 `forceUpdate` 重新测量；DOM 测量合并同帧快照，吸顶/吸底状态独立，Collapse 动画按类型化登记协调。
- 修复 **SelectTrigger**（Web）：完整复用共享外部关闭与嵌套浮层登记，离场中保留补位，结束后释放监听。
- 调整 **RadioGroup/Segmented/Statistic**（Web）：底板动画直接写 DOM 帧，统计格式器按规范化精度复用。
- 破坏 **TimelineItem**（Web）：`content` 默认按文本转义；需要 HTML 时显式启用 `dangerouslyUseHTMLString`，`items` 支持同名字段。
- 破坏 **Timeline**（Web）：父子注入键改为类型化 Symbol，扩展组件须导入配置文件公开的注入键，不再按旧字符串注入；Tabs 的对应迁移见同日 TabPane 条目。
- 修复 **Table**（Web）：异步数据到达前保留预选；动态插槽、重复字段列替换正确更新。行更新边界、共享溢出观察器与默认跨度短路减少整表工作。
- 调整 **Tabs / TimePanel**（Web）：Tabs 指示器和高度动画直接写 DOM 帧并释放已移除标签的观察目标；TimePanel 按列缓存选项，无关列不随秒值更新。
- 修复 **Toast**（Web）：`content`、`icon`、`closeIcon` 传 VNode 时，其他消息新增、关闭或同 key 更新不再让它卸载重建，内部状态（倒计时、输入框）与动画得以保留。
- 调整 **Toast**（Web）：服务端渲染期间调用 `message.*` 改为空操作，返回的 Promise 立即兑现；导出的 `messageState` 改为只读，修改须经命令式 API。
- 修复 **TimePicker**（Web）：受控绑定下选择时间，父级只收到一次 `update:modelValue`，此前同一个值会连续派发两次。
- 修复 **TimePanel**（Web）：单独使用且绑定值为空时，服务端与客户端首帧都选中 `00:00:00`，挂载后再切到当前时刻，不再出现水合不一致；禁用回调换成新函数时只按新规则校正当前选择，父级频繁重渲染时秒列不再反复跳到「此刻」。
- 调整 **TimePanel**（Web）：选项类名预先按状态算好，每次选择不再逐项合并样式，毫秒格式下切换更轻。
- 调整 **Text**（Web）：未声明的属性（`id`、`data-*`、`aria-*`、`style`、`@click` 等）透传到承载文字的 `span`，开启 `tooltip` 时同样落在文字节点上；此前这些属性全部被丢弃。
- 修复 **Text**（Web）：`tooltip` 挂载后再开启，或关闭再开启时，容器宽度变化后仍会重新判断是否省略，气泡开关与实际省略状态保持一致。
- 修复 **Textarea**（Web）：父级把绑定值重置为 `undefined` 时输入框与字数统计一并清空；重置或回填为 `null` 时不再在开启 `show-word-limit` 后报错。`autofocus` 不再预设聚焦样式，以真实聚焦为准。
- 修复 **Transfer**（Web）：`disabled` 从 `true` 切回 `false`、或所在表单解除禁用后，勾选、搜索、分页与穿梭按钮恢复可用；整体禁用时条目不再显示悬停底色与手型光标。此前禁用一次后再也解除不了。
- 修复 **Transfer**（Web）：`default-target-keys` 在首次拿到非空 `dataSource` 时初始化一次，`dataSource` 异步加载时也能生效；未绑定 `v-model` 时服务端首屏即把默认条目放进右栏。此前挂载时数据为空，默认值就永久丢失。
- 调整 **Transfer**（Web）：未提供条目插槽时，勾选一条只重新渲染这一行；开启 `virtual-scroll` 后滚动只在跨行时更新可视窗口，头部下拉的选项不再随勾选整批重建。
- 修复 **TextHighlight**（Web）：默认渐变终色使用正确的 `textEndColor`，继承文字颜色；样式限定根节点，不再误匹配所有后代 span。
- 破坏 **RebornTypewriter**（Web）：通过 ref 暴露的 `displayText` / `isTyping` / `isDeleting` 改为只读，外部不能再直接赋值，请改用 `startTyping` / `startDeleting`。
- 修复 **RebornTypewriter**（Web）：`resetOnChange` 为 `false` 时初始文本不出现；手动调用 `startTyping` / `startDeleting` 时与在途动画并行、卸载后残留光标定时器；SSR 下服务端启动定时器且永不清理（打字改为挂载后开始）。
- 调整 **RebornWatermark**（Web）：`customClass` 现在会追加到根元素（此前声明了但不生效）；图片加载失败时回退为文字水印。
- 修复 **RebornWatermark**（Web）：SSR 页面上水印不显示；`image` 连续变化时旧图片后加载完会覆盖新水印。
- 调整 **ShaderToy**（Web）：新增 `error` 事件与 `fallback` 插槽，不支持 WebGL 2 时不再抛错，改为触发事件并渲染降级内容；`shaderCode` / `mouseMode` 挂载后修改即生效，切换着色器不再需要 `:key` 重建。
- 修复 **ShaderToy**（Web）：卸载时未释放 WebGL 上下文与尺寸观察器，反复切换后触发浏览器上下文数量上限；`rebornShaderToy.setFrameRate()` 设为低于 60 时 rAF 回调逐帧翻倍。
- 调整 **TextReveal**（Web）：插槽内容或参数变化时会还原拆分、重建文字容器并重播入场动画（此前插槽更新不生效，可能抛 DOMException）。
- 调整 **SpringCalendar**（Web）：新增 `activeIndex` 属性，支持 `v-model:active-index` 受控选中；`update:activeIndex` 事件名不变。
- 修复 **SpringCalendar**（Web）：任何一次重渲染都会重挂事件列表并重播动画；`calendarData` 变短后下标越界抛错。
- 修复 **SafariMockup**、**TextHoverEffect**、**TracingBeam**、**TextMorph**（Web）：写死的 SVG id 在同页多实例时互相引用；SafariMockup 的 SVG 属性名不生效（地址栏文字字号恢复为 12px）。
- 破坏 **VanishingInput**（Web）：挂载后默认不再自动聚焦输入框；需要时传新增的 `autofocus`，聚焦时不滚动页面。
- 修复 **Sparkles**（Web）：高 DPR 屏幕上粒子只出现在左上区域。
- 修复 **Ripple**（Web）：虚线圈落在倒数第二圈，改为最外圈。
- 修复 **ScratchToReveal**（Web）：修改 `width` / `height` 后刮层不重绘、内容直接露出；页面任意位置松开鼠标都会读取整张画布像素。
- 修复 **useOverlay**（Web）：SSR调用不再保留首个请求的应用上下文。
- 调整 **useMotionList / useUniDemoPanel**（Web）：资源清理随独立 effectScope 停止，手动注销仍幂等。
- 调整 **tv**（Web）：按主题对象、组件名及config身份复用主题函数，保留服务端标记算法和变体输出。
- 调整 **useFloatingDismiss**（Web）：增加外部点击时机、滚动意图、离场期间关闭守卫及共享滚动回调，SelectTrigger实际宿主已接线。
- 调整 **useDarkMode**（UniApp演示）：新增 `setDarkMode(boolean)` 同步共享只读状态、存储与H5根节点，`toggleDarkMode`复用该入口，供App外部消息接线。
- 破坏 **useOverlay**（Web）：`overlays` 由调用时的快照数组改为 `ComputedRef<OverlaySummary[]>`，每项为 `{ id, component, isOpen, props }`，不再暴露内部状态；读取当前值请取 `.value`。
- 调整 **useOverlay**（Web）：在组件 `setup` / `effectScope` 内 `create()` 的实例随作用域注销，创建者卸载时浮层立即移除、`open()` 以 `undefined` 解析；新增 `persistent` 选项保留旧的「跨组件长期持有」用法。服务端调用 `create()` 返回不登记的空实例。
- 调整 **useOverlay**（Web）：浮层改由宿主组件 `RebornOverlayHost` 统一渲染（放在 app.vue 的 `UApp` 内），浮层内 `useId`、`provide`、全局组件与指令、错误处理随主应用继承；未放置宿主时退回共用的独立应用，`useId` 前缀为 `rb-overlay-N`。
- 修复 **useOverlay**（Web）：`patch()` 不再重建组件，表单输入、滚动位置与焦点保留；关闭时播放组件的离场动画（`closeDelay` 生效）；已打开时再次 `open()` 会以 `undefined` 解析上一次的 Promise，不再永远挂起；`isOpen()` 可在模板与 `computed` 中响应式使用。
- 破坏 **useFieldGroup**（Web / UniApp）：表单与表单项的上下文改用 `FORM_KEY` / `FORM_ITEM_KEY`（Symbol）提供与注入，按字符串 `inject('rebornForm')` / `inject('rebornFormItem')` 的自定义代码需改为导入这两个键；新增导出上下文类型 `FormContext`、`FormItemContext`、`FormFieldEntry`。
- 破坏 **useFieldGroup**（Web / UniApp）：`errors`、`fields`、`fieldInstances` 改为只读返回，`getErrors()` 改为同步返回 `FormValidateError[]`（`await` 写法不受影响，`.then()` 写法需改）；删除从未生效的 `errorLock`。RebornForm 暴露的 `fields` 随之变为只读。
- 修复 **useFormInject**（Web）：控件尺寸不再读取表单项的兜底尺寸，`RebornFormItem` 单独使用或表单 `size=""` 时，内部控件保持各自默认尺寸，不再被缩成 `sm`，与 UniApp 端一致。
- 修复 **useFormInject**（Web / UniApp）：父级增删控件的 `size` 属性时，尺寸来源在显式值与表单值之间正确切换。
- 调整 **useGlobalScrollLock**（Web）：在组件 `setup` / `effectScope` 内调用时，作用域销毁自动释放持有的锁。
- 破坏 **copyToClipboard**（Web）：`useCopyToClipboard` 改名为 `copyToClipboard` 并移到 `app/utils/copyToClipboard.ts`（仍自动导入），返回 `Promise<boolean>`；写入失败时弹出失败提示，不再产生未捕获的 Promise 拒绝。文档地址改为 `/composables/copy-to-clipboard`。
- 破坏 **showLoading**（Web）：`useLoading` 改名为 `showLoading`，过渡导出已删除，调用方须更新导入名称；源码文件与导入路径 `~/composables/useLoading` 保留。服务实例不随调用组件卸载关闭，文档地址改为 `/composables/show-loading`。
- 修复 **showLoading**（Web）：在组件 `setup` 中创建的全屏遮罩不会因组件卸载提前释放滚动锁。
- 破坏 **useMouseState**（Web）：移除全局组合式函数 `useMouseState` 及其文档（与 card-3d 目录内的同名文件重复，站内已无引用）；需要悬停状态时在组件内用一个 `shallowRef(false)` 即可，3D 卡片改用其目录内自带的 `useMouseState.ts`。
- 修复 **defineShortcuts**（Web）：链式快捷键不再区分大小写，开着大写锁定或按住 Shift 时 `g-h` 也能命中；焦点切换不再触发整张快捷键表重新解析，非法键名只告警一次（改用 `console.warn`）。
- 修复 **useIsRootPage**（文档站）：总览页判定改为只比较路径，带 hash / query / 尾斜杠打开 `/components`、`/changelogs` 时不再出现布局错乱与水合告警。
- 修复 **useComponentCode**（文档站）：快速切换文件树时不再被先发出的慢请求覆盖；入参支持 getter，组件 props 变化后源码面板随之刷新。
- 修复 **useLockScroll**（UniApp H5）：嵌套弹层关闭内层时页面仍保持锁定；以打开状态挂载的遮罩会上锁；KeepAlive 激活时重新上锁。
- 修复 **useDarkMode**（UniApp 演示）：各页面共用同一个暗色状态，从子页面切换主题后返回，上一页的开关与主题同步。
- 修复 **useChildren**（UniApp）：注销未登记的子组件不再误删最后一个兄弟项；动态排序遵循同日 `order` 规则，Tabbar / Tabs / Breadcrumb 的登记与注销保持实例身份。
- 修复 **InputNumber**（UniApp）：defaultValue 作为非受控初始值，回到 0 正常触发 change，非法文本回退最近提交值。
- 调整 **Popup**（UniApp）：size 默认不限制并实际应用；遮罩、关闭、层级别名未传时回退主属性，安全区随位置变化，面板统一渲染。
- 破坏 **Popover**（UniApp）：删除 update:modelValue 与无效 useContentSlot，只使用 v-model:open；每次打开重新测量并避免重复关闭事件。
- 破坏 **SearchBox**（UniApp）：删除 `saveHistory` / `removeHistory` 回调，改用 `v-model:history`，未绑定时按 `historyKey` 使用 uni 本地存储；主模型与 `search` 载荷为字符串。删除未实现的 `mode` / `showDropdown` / `skuAttributes` / `selectSku`，新增 `prefix` / `extra` 插槽，移除业务图片与站点占位弹层；Web 的对象模型和 `dropdown` 插槽不适用于此端。
- 破坏 **Pagination**（UniApp）：class 改为 customClass，pager-item 新增 select() 并受禁用守卫。
- 修复 **Qrcode/Signature/Rate/NoticeBar**（UniApp）：绘制与触摸异步竞态、节点测量、卸载后定时任务与导出 Promise 收尾。
- 破坏 **Slider**（UniApp）：thumb 插槽从嵌套 scope 改为平铺 value/index/active/disabled，插槽仅替换中心内容，外层定位与交互由组件维护。
- 破坏 **Textarea**（UniApp）：expose.isFocus 改为只读；null/undefined 模型统一显示为空文本。
- 调整 **Slider / Switch / Textarea / Tabbar**（UniApp）：模型改用 defineModel；Switch 收到 undefined 时回落 defaultValue/inactiveValue，新增 blur 复位样式聚焦态。
- 调整 **Waterfall / Toast**（UniApp）：`append()` 的 Promise 在分列完成后兑现，`clear()` 或卸载使旧批次失效；Toast 页面实例优先仲裁唯一渲染者，H5 命令式容器沿用应用上下文。
- 修复 **Switch / Slider / SlideVerify / SwiperAction / Sticky / Tabbar / Text / Watermark**（UniApp）：禁用与拦截并发、早松手异步竞态、受控成功载荷、外部取值同步、重新测量、动画解锁、数字脱敏、画布作用域及过期导出。
- 修复 **Tabbar / TabPane / Tabs / Sticky / Textarea / Transition / Watermark**（UniApp）：销毁时清理定时器，异步回调不再写入已销毁实例。
- 修复 **文档站**：主题常驻与静态首屏恢复；总览 payload 裁剪；侧栏复用；异步生命周期清理。
- 修复 **Web 演示主题**：BalanceSlider、GradientButton 与 LineShadowText 读取站点主题，避免挂载时改变整站明暗。
- 修复 **演练场配置**：修正 AnimateGrid 默认光晕与 UniApp 预览地址，删除没有对应演示的配置入口。
- 修复 **Lens / ColorPicker 演示**：更正 SVG 属性与实例标识，分离颜色输入及结果回显，并同步避免 HSL 回喂的文档说明。
- 修复 **MultiStepLoader 演示**：关闭、重开和卸载取消旧异步任务，阻止已失效续段继续排入计时。
- 调整 **Web 演示**：对齐 AnimatedList、Lens 和 iPhoneMockup 当前 API，恢复 Alert 受控显隐，区分 Affix 吸附行为并匹配边界尺寸。
- 修复 **Web 组件演示**：级联配置误清空、勾选文案互相覆盖、嵌套 label 与优惠券辅助属性透传。
- 调整 **日历与日期演示**：日历共享右键菜单；日期演示按职责拆分，保留全部章节和交互；总览下拉触发框静态化。
- 调整 **Web 演示写法**：显式导入、类型化模板引用、按数据编辑方式选择响应式状态、定时器清理与静态模板数据；ColorPicker 同步三档尺寸和 change 提交回显。
- 修复 **Web 演示**：表单实例隔离、联系人身份与校验路径一致，弹窗与加载流程随卸载清理，菜单示例独立并生成可编译代码。
- 调整 **组件总览**（Web）：Dropdown/Mention 缩略图静态绘制，避免长期挂载浮层定位监听。
- 破坏 **服务命名**（Web）：删除 useLoading 与 isRootPage 兼容入口，调用方使用 showLoading 与 useIsRootPage。
- 修复 **Web 演示**：修正分页互相钳制、page-size 不回写、自定义页码绕过公开动作、Popover 外部关闭重新打开。
- 修复 **Web 演示**：取消卸载后的通知、确认、搜索、滚动加载与表格懒加载任务，保留远程 Select 已选项，接通通知 footer 操作。
- 调整 **Web 演示**：Popover/Popconfirm 缩略图静态化，稳定 data/config 引用，统一响应式状态、模板引用与显式导入。
- 调整 **Web 演示**：对齐 Slider/Segmented API，补 SearchBox 外部历史与独立存储键。
- 修复 **Web 演示**：ShaderToy 预设切换、主题读取、树数据重置、上传媒体预览与异步清理正确响应；补齐 Textarea `maxlength` 与 Watermark `customClass`，日志使用稳定 key 并限制容量，降低 TextRevealCard 默认演示负载。
- 修复 **分页演示**（UniApp）：错误请求不提前写数据，只有显式重试重新请求当前页。
- 调整 **组件演示**（UniApp）：各实例独立持有模型，使用公开事件与插槽，删除无效属性。
- 修复 **演示生命周期**（UniApp）：离页取消模拟请求、延时更新及Promise后续提示。
- 调整 **条件插槽演示**（UniApp）：显式切换带插槽与不带插槽实例。
- 修复 **首页入口**（UniApp）：标签页路径正确，补Card/Page入口。
- 修复 **Transfer**（Web）：同一条目对象原地修改 `disabled`、`label`、`description` 后，普通与虚拟列表以及单向撤回按钮立即更新；未提供自定义插槽时仍只重绘受影响行。
- 修复 **useOverlay**（Web）：异步确认按每次打开隔离；关闭后重开或连续 `open()` 时，旧确认的成功 / 失败不能关闭新浮层、兑现新 Promise 或清除新加载状态。
- 修复 **Menu**（Web）：初始 `openKeys` / `defaultOpeneds` 展开完整祖先路径，关闭祖先或同级互斥时移除旧分支；父级连续拒收后仍按实际展开集合处理下一次操作。
- 修复 **Switch**（Web）：根节点与原生 checkbox 的属性、样式及监听分流随父级新增、替换、删除同步，不再保留首帧快照。

:::

:::reborn-timeline-item{timestamp="2026-10-22" color="error" placement="top"}

- 新增 **Calendar** 日历（Web）：按月或按年展示事项，支持公历与农历、直角边框、`date-cell` 插槽自定义日期格、`timezone` 时区与 `valueFormat` 字符串绑定值。
- 新增 **Steps** 步骤条（Web）：横向与纵向排列，内容可放在四个方向，三档尺寸，支持进度圆环、单步状态，以及 `icon` / `title` / `description` / `connector` 插槽。
- 新增 **Table**（Web）：`type: 'drag'` 列提供行拖拽排序。按住手柄拖动或聚焦手柄按 `↑` / `↓` 移动，拖到滚动区边缘自动滚动，树形数据只在同级之间移动。表格不改动 `data`，松手后派发 `row-drag-end`，回调里的 `data` 是移动后的新数组，回写即完成排序。
- 破坏 **尺寸令牌**（Web）：删除按钮、输入框、徽章、分页等组件的专属尺寸变量，包括 `--height-button-*`、`--height-input-*`、`--spacing-input-px-*`、`--height-badge-*`、`--height-pagination-*`，改用 Tailwind 原生刻度（如 `h-6` / `h-8` / `h-10`、`px-2.5` / `px-3` / `px-4`），随 `--spacing` 缩放。默认根字号 16px 时尺寸不变；业务代码引用了这些变量或 `h-input-*` 一类类名的，需要换成原生类。Radio 中档圆点没有对应的原生刻度，保留 `--spacing-radio-dot-md`。
- 调整 **动效**（Web）：引入 `motion-v`，Dialog 的 bounce 入场、Notification 的栈内补位、Collapse 与 SubMenu 的高度展开、Switch、Draggable、Guide、Statistic 等改由 Motion 插值；动画途中再次切换时从当前画面续接，不再跳回上一次的目标。
- 调整 **Dialog**、**Drawer**（Web）：可滚动的正文改用浮层滚动条 `RebornScrollbar`，悬停或滚动时显示，不占正文宽度；`ui` 新增 `scrollbar`、`scrollbarWrap`。
- 调整 **光标**（Web）：禁用态统一显示禁止光标，加载中显示等待光标（Button、Switch、Upload），Tooltip 触发器与 Text 的截断提示显示帮助光标。Rate 禁用时不再给根节点加 `pointer-events-none`，改为 `cursor-not-allowed` 并只屏蔽子元素交互，禁止光标才显示得出来。
- 文档：组件总览卡片改为一行 4 张、缩略预览在上、悬停时预览铺满整张卡片，New / Update 改用图标标记，平台改用 Badge；补齐全部 159 个组件的总览缩略图；单个组件的文档页加入《欢乐颂》乐谱滚动背景。
- 文档：切换主题色时 `brand-1` ~ `brand-10` 整条色阶随之切换；AI 助手模型改为 deepseek-flash，调用失败时显示中文提示。

:::

:::reborn-timeline-item{timestamp="2026-10-19" color="success" placement="top"}

- 新增 **Avatar** 头像、**AvatarGroup** 头像组（Web）：头像支持图片、图标与文字，三档固定尺寸或自定义像素尺寸，图片加载失败时回退；头像组重叠展示成员，尺寸与形状由组下发，超出数量折叠，隐藏的头像在浮层中列出。
- 新增 **Statistic** 统计（Web）：数字指标展示，支持连续计数动画、精度、分隔符、自定义格式化，以及标题和前后缀插槽。
- 新增 **Countdown** 倒计时（Web）：基于目标时间倒计时，支持天数与毫秒格式，回传剩余毫秒并在结束时通知。
- 新增 **Segmented** 分段控制器（Web）：一组互斥选项排成一条，选中块滑动切换，三档尺寸，可带图标、撑满宽度或竖排，参与表单校验。
- 调整 **Guide**（Web）：重写引导流程，自动把目标滚到居中并锁定；步骤支持 `children` 父子嵌套、`cover` 封面与 `component` 整块替换面板，新增 `indicator`（数字 / 点状）、`close` 事件与 `close()` 方法。默认值随之变化：`hideSkip` 由 `false` 改为 `true`，默认不显示跳过按钮；`highlightPadding` 由 `8` 改为 `4`；在最后一步调用 `next()` 会完成引导，此前不动作。
- 调整 **Popover**（双端）、**ContextMenu**、**ColorPicker**（Web）：定位改用 `placement`（「方向-对齐」写法，共 12 种，与 Tooltip、Popconfirm 一致）加 `sideOffset`。旧的 `content` 对象（`side` / `align` / `sideOffset`）标记为废弃，仍可使用，与新属性同时传入时以新属性为准。ColorPicker 的 `placement` 两端写法一致，默认值 Web 为 `bottom`、UniApp 为 `right`。
- 调整 **Popover**、**Popconfirm**（Web）：新增 `closeOnScroll`，默认 `true`，页面或触发器所在容器滚动时关闭，关掉后气泡跟随触发器重新定位；`dismissible` 把 iframe 内的点击也算作外部，嵌套浮层里的点击不算。Popconfirm 放在 Popover 里时，点确认框的按钮不会关掉外层气泡。
- 文档 **Form**：新增「完整表单联动」示例，在一张活动报名表里演示人数上限收紧、条件字段切换、级联选项、按开关增减必填规则、填写进度与提交重置。

:::

:::reborn-timeline-item{timestamp="2026-10-16" color="success" placement="top"}

- 新增 **Mention** 提及（Web）：输入前缀唤起候选列表，支持多前缀、远程搜索（`loading`）、`whole` 退格整体删除与面板随光标行定位；面板默认与输入框等宽。
- 新增 **PageHeader** 页头（Web）：返回区、标题、内容与扩展操作排成一行，可在上方放面包屑；返回区可用键盘触发 `back`。路径较浅时可代替面包屑提供返回入口。
- 新增 **Crowd** 人群漫步（Web）：把人物精灵图切格后在 2D 画布上左右随机走过，可控人数与速度，用作页脚装饰。
- 新增 **Launch** 电脑动画（Web）：可设置品牌文字和屏幕动效的复古电脑动画，支持悬停展开、点击固定与紧凑取景。
- 调整 **BackTop**（Web）：新增 `direction="bottom"` 去底部（进度环逆时针）、`shape="square"` 圆角方形（进度框随形状）、`icon` 自定义图标与 `xs`（24px）尺寸，键盘与读屏均可操作。
- 调整 **Carousel**（Web）：重写滚动实现，`loop` 改用相邻克隆片衔接首尾。新增 `slidesPerView`（旧拼写 `slidesPerview` 继续兼容）、`draggable` 鼠标拖动与 `keyboard` 方向键 / Home / End；`pagination` 新增 `progress` 类型、`display` 显示时机与 `indicatorBackground` 背景开关；`autoplay` 支持 `pauseOnHover` / `pauseOnFocus`；`height` 可传数字；`indicatorOffset` 默认值改为 `8`。`change` 改为真实索引变化时立即触发，不再等动画结束，外部改 `v-model` 不触发；`prev` / `next` 插槽新增 `disabled`。
- 调整 **Image**（Web）：预览新增 `previewToolbar`，按书写顺序配置菜单按钮（含旋转、翻转与全屏轮播）；多图时遮罩两侧出现切换箭头，底部缩略图栏改由 `previewNavbar` 开启、默认隐藏；新增 `showPreview()`；`mode` 在 Web 端映射为 `object-fit` / `object-position`。根节点去掉默认的 `rounded-xl`，需要圆角写在 `ui.root`。
- 调整 **Menu**（Web）：新增 `checkStrictly`，悬停触发的浮层菜单里带子菜单的父级也能被选中，单个父级可用 SubMenu 的 `selectable` 退出。
- 修复 **Menu**（Web）：重复点击已选中的项仍派发 `select`，但不再写回 `selectedKeys`；router 模式下目标就是当前页时不重复跳转。
- 调整 **Table**（Web）：固定列阴影只画在靠近滚动内容的一侧，阴影伪元素不拦截点击与拖拽；溢出提示改为首次交互时才创建浮层实例，溢出单元格多时减少渲染开销。
- 文档：站点新增全局回到顶部与去底部按钮，顶栏阅读进度改为海浪与小船，首页加入水印、斜向走马灯与网格背景，组件总览页底部改用 Crowd。
- 工程：知识库条目写入 `ui` 键位，AI 助手与 MCP 优先引导用 `ui` 修改样式。

:::

:::reborn-timeline-item{timestamp="2026-10-14" color="error" placement="top"}

- 新增 **DepthImage** 深度视差图（Web）：按深度图对透明背景图片做跟随指针的 2.5D 视差与补光，WebGL 渲染，失败时退回静态图。
- 破坏 **Chip**（双端）：新增 `variant`，可选 `solid`（实心圆点）、`outline`（空心圆环）、`textDot`（实心底白字）、`textOutline`（描边加同色文字），不传时有 `text` 取 `textDot`、否则取 `solid`。`size` 收为 `sm` / `md` / `lg` 三档（Web 原为 `xs` ~ `xl`，UniApp 原为 `3xs` ~ `3xl`），各档尺寸按变体重新定义；`text` 只在两种文字变体下渲染，原先用 `xs` / `sm` 做纯圆点的地方改用 `variant="solid"`。
- 调整 **Text**（Web）：新增 `ellipsisPosition`（`end` / `start` / `middle`），省略时可保留结尾或首尾，适合文件路径、带扩展名的文件名与订单号。
- 调整 **Tooltip**（Web）：新增 `rawContent`，把文案按 HTML 渲染，只接受可信或已净化的内容；新增 `virtualTriggering` 与 `virtualRef`，由外部元素触发和定位；长单词改用 `wrap-anywhere` 换行。
- 调整 **Descriptions**（Web）：新增 `rowspan`，单项可跨多个数据行，并可与 `span` 组合。
- 调整 **Menu**（Web）：垂直菜单折叠后，没有图标的一级条目以标题首字占位；分组标题过长时截断为省略号。
- 调整 **DatePicker**、**DatePickerPanel**（Web）：新增 `weekrange` 周范围类型；DatePickerPanel 新增 `defaultValue`，未选值时面板停在指定日期所在的月或年。

:::

:::reborn-timeline-item{timestamp="2026-10-13" color="success" placement="top"}

本批次对应 `reborn-ui@0.1.84` 与 `reborn-ui-registry@0.1.1`。

- 新增 **Upload** 上传（Web）：`text` / `picture` / `picture-card` 三种列表形态，支持拖拽、选择文件夹、手动上传、自定义请求与分片断点续传，图片与视频都能显示缩略图，参数与钩子对齐 Element Plus。
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
