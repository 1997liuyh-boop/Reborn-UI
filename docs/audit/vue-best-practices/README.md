# Vue 最佳实践全量审查：汇总

依据 `vue-best-practices` 技能，对仓库全部 Vue 代码做的一次只读审查，审查对象为分支 `audit/vue-best-practices` 创建时的工作区（`1931a81` 加当时未提交的改动）。口径、严重度定义与条目格式见 [METHOD.md](METHOD.md)。本次只列问题与改法，**没有修改任何源码**；每条问题的位置、现状、改法、影响都在对应分片报告里。

## 总览

共 19 个分片、1399 个文件逐个读完，**高 51 条、中 195 条、低 277 条，合计 523 条**。

| 分片 | 范围 | 高 | 中 | 低 |
| --- | --- | --- | --- | --- |
| [W1](W1.md) | Web 特效组件 animate-grid ~ rainbow-button、Affix、Alert | 6 | 21 | 19 |
| [W2](W2.md) | Web Anchor ~ Checkbox | 1 | 8 | 14 |
| [W3](W3.md) | Web Chip ~ Descriptions（含 DatePickerPanel） | 6 | 14 | 14 |
| [W4](W4.md) | Web Dialog ~ Layout（含 Form、Guide） | 1 | 12 | 15 |
| [W5](W5.md) | Web Loading ~ Qrcode（含 Menu、Popover） | 2 | 12 | 13 |
| [W6](W6.md) | Web Radio ~ Switch（含 Select、SelectTrigger） | 3 | 11 | 15 |
| [W7](W7.md) | Web Table ~ Transition | 1 | 13 | 14 |
| [W8](W8.md) | Web Tree ~ vanishing-input（含 Upload、Scrollbar、特效） | 7 | 13 | 25 |
| [U1](U1.md) | UniApp Affix ~ Input | 5 | 16 | 20 |
| [U2](U2.md) | UniApp InputNumber ~ Signature | 2 | 16 | 19 |
| [U3](U3.md) | UniApp SlideVerify ~ Watermark | 3 | 10 | 15 |
| [C1](C1.md) | 组合式函数（两端）、`app/lib`、`app/utils` | 1 | 8 | 13 |
| [S1](S1.md) | 文档站外壳：app.vue、布局、页面、站点组件 | 3 | 8 | 17 |
| [E1](E1.md) | Web 演示 animate-grid ~ back-top、演练场配置 | 1 | 7 | 11 |
| [E2](E2.md) | Web 演示 Badge ~ Descriptions | 1 | 3 | 12 |
| [E3](E3.md) | Web 演示 Dialog ~ NoticeBar | 1 | 7 | 10 |
| [E4](E4.md) | Web 演示 Notification ~ Table | 3 | 4 | 9 |
| [E5](E5.md) | Web 演示 Tabs ~ vanishing-input | 1 | 3 | 10 |
| [P1](P1.md) | UniApp 演示页、App.vue、main.ts | 3 | 9 | 12 |

> **SSR 类问题的定级**：文档站的演示都只在客户端渲染（`nuxt.config.ts` 中设为 client-only），站内看不到服务端渲染相关的问题。组件分发给使用方后默认走 SSR，所以审查按使用方的常见用法定级：SSR 下直接报错的定为高，水合不一致定为中或高。

## 建议先修：线上就能看到的问题

这些问题现在就影响站点访问或文档演示，修复范围小，建议先处理。

| 问题 | 出处 |
| --- | --- |
| 部分演示与总览缩略图用 `@vueuse/core` 的 `useColorMode`，挂载即按系统偏好改写 `<html>` 的明暗类：系统为浅色的访客打开组件总览页，整站就从暗色跳成浅色。改用 Nuxt 的 `useColorMode`（`BalanceSliderOverview.vue` 已是正确写法） | E1 高、W8 高（ScrollIsland）、E5 中 |
| 组件总览页把 173 篇文档完整正文放进 payload，`/components` 的 `_payload.json` 达 6.28 MB；只取卡片需要的字段即可 | S1 高 |
| 选了非默认主题色的用户，每次刷新先看到品牌蓝再跳色；首页、`/playground`、`/preview/*` 完全不应用该设置 | S1 高 |
| 用 `route.fullPath` 判断根页，带 query / hash 打开 `/components`、`/changelogs` 时服务端与客户端布局不一致，版式错乱 | S1 高、C1 中（`isRootPage.ts`） |
| 总览页一滚动，Popover / Popconfirm 两张缩略图的气泡永久消失；补 `:close-on-scroll="false"` | E4 高 |
| ShaderToy 文档页唯一的演示用了仓库里不存在的 `Select` 系列组件，三段着色器只能看到第一段 | E5 高 |
| Focus 组件模板用了未导入的 `<Motion>`，聚焦框完全失效 | W1 高 |
| AnimatedList 的 `while (true)` 轮播卸载后不停，每进一次文档页多一条永久循环 | W1 高 |
| UniApp 二维码演示的标签栏仍用旧 API，一个标签都不显示，六个配置页只剩「基础」可进 | P1 高 |
| **工作区未提交改动里的回退**：`RebornTransfer.vue:93` 的 `isDisabled` 计算属性读取自身，`disabled` 失效；`:1071` 的同名参数遮蔽外层变量，整体禁用时条目不置灰 | W7 高 |

## 全部高级问题

位置写的是主文件，完整位置、现状与改法见各分片报告。

### Web 组件库

| 分片 | 组件 | 问题 |
| --- | --- | --- |
| W1 | AnimatedList | `while (true)` 轮播没有退出条件，卸载后永远运行（`animated-list/AnimatedList.vue:18`） |
| W1 | AnimatedTestimonials | 卸载清理的判断写反，autoplay 定时器永不清除（`AnimatedTestimonials.vue:25`） |
| W1 | Focus | 模板用了 `<Motion>` 但没有导入，聚焦框失效（`focus/Focus.vue`） |
| W1 | AppleCard | 每张卡挂载即监听 window 的 Esc，任意一次 Esc 都会把轮播滚到最后一张（`AppleCard.vue:33-45`） |
| W1 | ContainerScroll / ImagesSlider | setup 顶层访问 `window` / `new Image()`，SSR 直接抛错 |
| W1 | ImagesSlider | 「下一张」越界判断差一，自动播放到不了最后一张（`ImagesSlider.vue:122`） |
| W2 | Badge | 自定义 class 同时加在外层容器与内层主体上，盒模型类生效两次（`RebornBadge.vue:121-160`） |
| W3 | Collapse | v-model 受控时 `toggle` 事件载荷是旧值（`RebornCollapse.vue:89-93`） |
| W3 | ColorPickerPanel | 透明度改动永远传不到 v-model（`RebornColorPickerPanel.vue:96`） |
| W3 | ColorPickerPanel | 十六进制输入框边输边被改写，输到 `#12` 变成 `#000000`（`:99-125`） |
| W3 | ContextMenu | 根菜单 id 取自模块级计数器，SSR 水合不一致，点击触发时菜单关了又开（`context-menu-singleton.ts:27`）；改用 `useId()` |
| W3 | Coupon | computed 里调用 `breakpoints.greaterOrEqual()`，每次求值新建 5 组媒体查询且永不释放（`RebornCoupon.vue:70-107`） |
| W3 | DatePickerPanel | 外部把值重置为空数组后仍高亮旧范围（`RebornDatePickerPanel.vue:1275-1318`） |
| W4 | LayoutAside | 设了 `breakpoint` 时 setup 阶段同步读 `matchMedia`，窄屏首屏水合后侧栏卡在展开态（`RebornLayoutAside.vue:163-181`） |
| W5 | NoticeBar | 水平模式调用 `replay()` 后滚动停住（`RebornNoticeBar.vue:188-200`） |
| W5 | NoticeBar | Web 端 `close` 事件从不派发，与文档、UniApp 端不一致（`:209-212`） |
| W6 | Splitter | 面板挂载后才登记下标：SSR 首屏无尺寸，动态增删面板后尺寸、拖拽条、折叠状态错位 |
| W6 | Select | 已选项只从当前 options 反查，远程搜索替换 options 后触发器上的已选文本消失 |
| W6 | Switch | 键盘按空格切换不了，绑定值不变、不发 `change` |
| W7 | Transfer | `isDisabled` 读取自身（未提交改动引入），见上节 |
| W8 | TreeSelect | v-model 受控时 `change` 带出旧值（`RebornTreeSelect.vue:215`） |
| W8 | Tree | 非受控模式下展开 / 收起过任一节点后，`scrollTo` 的 autoExpand 失效 |
| W8 | Typewriter | SSR 时在服务端启动定时器，每次请求泄漏一个 `setInterval` |
| W8 | Watermark | setup 阶段就生成水印，SSR 页面水合后水印不显示 |
| W8 | ScrollIsland | computed 里调用 `@vueuse/core` 的 `useColorMode`，泄漏监听并改写站点主题 |
| W8 | ShaderToy | 卸载不释放 WebGL 上下文和 ResizeObserver，多次切换后可能触发浏览器上下文上限 |
| W8 | TextRevealCard / TracingBeam | window 事件监听与 ResizeObserver 卸载时没有清理 |

### UniApp 组件库

| 分片 | 组件 | 问题 |
| --- | --- | --- |
| U1 | BackTop | 隐藏后仍占位并响应点击，首页右下角一直有一块透明的可点区域（类名 `pointer-none` 无效） |
| U1 | Collapse | 点击只改内部状态，不回写 v-model |
| U1 | ColorPickerPanel | 输入框每敲一个字就被规整写回，无法手输；程序化赋值也触发 `onChange` |
| U1 | Fab | 动作项同时绑 `@tap` 与 `@click`，H5 端一次点击派发两次 `action` |
| U1 | Draggable | 根节点 `@touchmove.stop.prevent` 无条件拦截，手指落在列表上时页面无法滚动 |
| U2 | Popup | `size` 算出的样式没有绑定到任何节点，尺寸控制完全不生效 |
| U2 | InputNumber | `defaultValue` 从未读取，非受控初始值恒为 0 |
| U3 | Switch | 表单级禁用只作用到按压反馈，点击照样切换（Web 端已修） |
| U3 | Waterfall | 追加延时 300ms 测量，不排队也不作废，连续追加会丢数据并报错 |
| U3 | Watermark | 小程序端调 canvas 接口没传组件实例，水印不生成（待真机确认） |

### 组合式函数与文档站

| 分片 | 位置 | 问题 |
| --- | --- | --- |
| C1 | useOverlay | 浮层登记在模块级 Map，不随调用方作用域注销，每次挂载永久多出记录；浮层开着离开页面会留在新页面上 |
| S1 | AppThemePicker | 主题色首屏不生效，部分页面不应用（见上节） |
| S1 | ComponentsList | 总览 payload 6.28 MB（见上节） |
| S1 | layouts/docs.vue | `route.fullPath` 判根页导致水合不一致（见上节） |

### 演示代码

| 分片 | 演示 | 问题 |
| --- | --- | --- |
| E1 | BalanceSlider / GradientButton / LineShadowText 等 | `useColorMode` 改写站点主题（见上节） |
| E2 | Cascader | 演练场 watch 的 getter 每次返回新数组，调任何参数都会清空已选值 |
| E3 | Form | `reactive({ ...initialForm })` 浅拷贝，联系人数组跨实例共享，重置清不掉 |
| E4 | Pagination | 「插槽定制」三个分页器共用页码，第三个翻不过第 5 页 |
| E4 | Popover / Popconfirm 缩略图 | 一滚动气泡永久消失（见上节） |
| E4 | Popover | 「外部关闭」按钮用取反切换，点了只闪一下 |
| E5 | ShaderToy | 用了不存在的 Select 组件（见上节） |
| P1 | Qrcode | 标签栏用旧 API，一个标签都不显示 |
| P1 | Loadmore / Waterfall | 出错后页码不前进，重试会重复拉同一页，出现重复数据与重复 key |
| P1 | Qrcode 颜色弹窗 | 每敲一个字就提交并关闭弹窗，无法手输颜色 |

## 跨分片的共性问题

下面这些问题在多个分片重复出现，建议先定统一改法，再按清单逐个改，避免同一问题各改各的。

1. **v-model 的旧值与清空**。受控 `defineModel` 赋值后同步读到的仍是旧值，事件载荷应使用本地新值：W3 Collapse、W8 TreeSelect。外部把值改回 `undefined` / `null` / `[]` 时，组件仍显示旧状态：W2 Cascader、Checkbox，W6 Switch、RadioGroup，W7 Textarea，W3 DatePickerPanel。此外，布尔类型的 model 没写 `default: undefined` 会被强转：W5 Popover、Popconfirm 的受控初始打开因此失效。UniApp 端有几处还没用 `defineModel`：U2 InputNumber、U1 Collapse、W5 / U 端 Overlay。
2. **在 computed 或渲染期调用组合式函数**。监听挂不到组件作用域，永不释放：W3 Coupon（`useBreakpoints`）、W8 ScrollIsland 与 E5 Sparkles（`useColorMode`）。统一规则：组合式函数只在 setup 顶层调用。
3. **副作用清理**。定时器、rAF、window 监听、ResizeObserver、WebGL 上下文没有随卸载清理：W1、W8 特效组件，C1 useOverlay，以及 E2、E4 演示里的定时器。SelectTrigger 在浮层未打开时也常驻 5 个全局监听（W6），可对齐已有的 `useFloatingDismiss`，只在展开期间挂载。
4. **SSR 与水合**。模块级计数器生成 id，应改用 `useId()`（W3 ContextMenu）。setup 阶段读 `window` / `matchMedia` 应挪到挂载后（W1、W4 LayoutAside、W8 Watermark、W8 Typewriter）。子组件挂载后才向父组件登记，导致 SSR 首屏不完整（W6 Splitter、W7 Tabs、Timeline），可参照 `reborn-steps.context.ts` 在渲染时下发位置。另有 S1 的主题色、根页判断，以及 W2 Calendar「今天」按服务端时区计算。
5. **关闭自动透传后没有回绑**。`inheritAttrs: false` 之后 `id`、`style`、`aria-*`、事件监听全部丢失：W6 SelectTrigger、Select、SearchBox、Sku，W2 Cascader、CascaderPanel，U2 Pagination。Cascader 要等 SelectTrigger 先把属性转发到根节点才能修。
6. **两端行为不一致**。NoticeBar `close`（W5）、Popover 受控初始打开（W5）、Switch 表单禁用（U3）、Form 重置的深拷贝（U1）、滚动锁计数（C1 useLockScroll）、取色器输入框（W3 / U1）、Affix 吸附时机（W1）。修复时两端一起改，并同步文档与知识库。
7. **总览缩略图违反「挂载不卸载」约定**。Cascader、DatePicker、Select 的缩略图挂的是真实组件，常驻全局监听（E2）；AnimateGrid 缩略图每格挂 window 监听（E1）；Popover、Popconfirm 缩略图没关 `closeOnScroll`（E4）；GradientButton 缩略图会改写站点主题（E1）。日历、右键菜单的缩略图已改成静态拼装，可以照做。
8. **演示代码用了组件没有的 API**。UniApp 二维码演示的 Tabs 旧写法，Popup 的 `:rounded`（组件属性是 `round`），签名弹窗的 `:close-on-click-modal`，Waterfall 演示监听 `@click`（组件派发 `reload`）（P1）；ShaderToy 的 Select（E5）；Menu 演练场生成的代码编译不过（E3）。U2 的根因：Popup 的三个别名属性自带默认值，导致主名永远不生效。
9. **全仓库写法，未逐条列出**。原始值用 `ref` 而不是 `shallowRef`、模板引用不用 `useTemplateRef`，在几乎每个分片都大量出现，收益很小。参考范本 `RebornButtonDemo.vue` 本身就用 `ref`，建议先在 `docs/authoring/` 里定规则，再决定是否批量改，不必逐个修。

## 改动会影响公开 API 的条目

这些修复会改 props、emits、插槽或默认行为，需要同步文档与知识库，涉及两端的要一起改。完整说明见各条的「影响」字段。

- **W1**：AnimatedList 改为 `items` 数组加作用域插槽；iPhone15ProMockup 的 `src` 目前被忽略；BalanceSlider、HaloSearch 新增 v-model；Lens、Compare 的属性与事件新增或改名；FileUpload 的事件名 `onChange` 需要调整。
- **W3**：取色器的取值格式与事件名、日期选择器的属性透传，修法会让两端 API 不一致，需要先定方案。
- **W4**：Fab 改为立即回写 v-model，属于行为变更，但能和 UniApp 端对齐。
- **W6**：SearchBox 新增 `v-model:history`、Slider 的 thumb 插槽参数调整，两端都要改；Segmented 的 `props` 改名为 `fieldNames`、SplitterPanel 的 `update:size` 触发时机变化，只涉及 Web 端。
- **P1**：分页的 `#pager-item` 插槽要补跳页方法，两端都要改。
- **U2**：Popup 修 `size` 时，默认值 `'30%'` 要一起去掉，否则现有不传 `size` 的底部弹层会变成 30% 高。

## 待确认

以下条目仅凭读代码无法定论，报告里已标「待确认」并写明验证方法，修之前先实测：

- **小程序真机或开发者工具**：U1、U2、U3、P1 中涉及 `<transition>`、内联 `svg`、`class` 透传、canvas 实例、`<template v-if>` 包具名插槽的条目，以及 C1 中小程序端判断「是否显式写了 size」的方式。
- **浏览器实测**：S1 总览页内锚点是否触发布局切换；W7 表格预选被裁剪、标签页移除后观察器是否回收；E4 表格演示的重算开销；E5 TextRevealCard 的帧耗时；C1 `lib/tv` 在每个实例里重建的开销。

## 范围外的附带发现

不计入上面的条数，修起来都很小：

- `content/4.composables/index.md:14` 对 useCopyToClipboard 的描述停在 `1931a81` 修复之前。
- UniApp 首页「标签页」入口跳 `/pages/reborn-tabs/index`，该页没在 `pages.json` 注册，点击会失败；应改为 `/pages/reborn-tabs/RebornTabsDemo`（P1）。
- W2 Calendar 文档写「客户端挂载后立刻修正今天」，与实际行为不符；U2 Popup 文档写的尺寸控制目前不生效。
- 70 篇文档写的 `#credits` 出处说明从不显示，在提交 `0e28d7a2` 里被删除，是否有意待确认（S1）。
- `app/components/landing` 下十几个组件与 ComponentLoader 等没有任何引用（S1，记为低）。

## 建议的推进顺序

1. 「建议先修」一节的 10 条：多数改动在一两处，收益立刻可见。Transfer 那条是未提交改动里的回退，应在提交前修掉。
2. 其余高级问题，按组件分批修。每批先跑影响分析，再到页面上实测。
3. 共性问题先定统一规则（第 1 ~ 5、7 条），再按清单批量改，减少逐个讨论的成本。
4. 中级问题按分片推进；低级问题和第 9 条全仓库写法，等规则定下来后再决定是否处理。
