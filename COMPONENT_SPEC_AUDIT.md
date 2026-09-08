# 组件规范审查报告

> 首次审查：2026-09-06（分支 `refactor/pc-components`）
> **最近复验：2026-09-07** —— 逐项核对 09-06 列出的未修项在当前工作区的真实状态，刷新了行号、rpx 清单、英文注释清单与 index.ts / emits 统计；本次复验只读，未改动任何代码，差异见「复验记录（2026-09-07）」。
> **已完成修复（第二～四轮，均在本分支未提交的工作区改动中）**：radio uniapp 端全量对齐 web、breadcrumb uniapp 样式对齐、alert emit 名统一与文档补漏、badge 图标尺寸与插槽 ui、button uniapp config rpx 化与 demo 死开关清理、**defineModel 全量现代化 + checkbox 布尔强转根治 + mp-weixin 构建打通**，详见文末三份修复记录。
> 审查范围：Button、Breadcrumb、Dropdown、Pagination、Input、Select、Radio、Checkbox、Tooltip、Message(Toast)、Alert、Badge 共 12 个组件（含 uniapp 端对应组件 `reborn-dropdown-select`，实际 13 个组件目录），覆盖双端源码、demo（web examples/configs + uniapp pages）、文档与知识库。
> 审查方式：只读逐文件核查，未修改任何组件代码。

## 规范依据

1. **注释中文**：代码中所有逻辑说明、Prop 说明必须使用中文，严禁英文注释（含 demo）。
2. **跨端一致性**：web 与 uniapp 同名组件的 Props / Emit / 插槽命名尽量一致。
3. **rpx 优先**：uniapp 端涉及尺寸的样式必须优先使用 rpx（注意：`packages/uniapp-project/postcss.config.ts` 未启用 px→rpx 转换，Tailwind 默认刻度 `px-3`/`gap-2`/`size-4` 等实际落成 rem/px）。
4. **语法现代化**：`defineModel` 语法糖 + 接口式 `defineProps`，类型完备；boolean 型 `defineModel` 需注意未传强转 `false` 的坑（需区分受控/非受控时必须 `default: undefined`）。
5. **componentId 四处一致**：源码目录、文档 `ComponentViewer componentId`、knowledge/index.json、registry。
6. **demo 齐备**：web `examples/<id>/` demo + `configs/<id>/` 配置演示 + 文档 md（双端组件声明 `:uniappFiles`）+ uniapp `pages/<id>/` demo 页（注册进 pages.json）。

## 总览

「未修项」为 2026-09-07 复验后仍成立的问题数（不含已修）。

| 组件 | 结论 | 未修项 | 当前最突出问题 |
| --- | --- | --- | --- |
| reborn-button | 基本合规 | 4 | web/uniapp 源码与 config 共 9 处英文区块注释；uniapp 端是审查范围内唯一仍用数组式 `defineEmits` 的组件 |
| reborn-badge | 基本合规 | 2 | config 残留 `ml-2`（相邻 badge 间距）未 rpx 化 |
| reborn-alert | 基本合规 | 3 | 双端均缺 `index.ts`；uniapp demo 1 处英文注释；demo 未覆盖 `color`/自定义 `icon`/`ui` |
| reborn-breadcrumb | 基本合规 | 1 | config 已全量 rpx；仅 demo 页混用非 rpx 尺寸 |
| reborn-pagination | 基本合规 | 3 | 第五轮已把 `pagerCount` 双端默认值与兜底统一为 3；剩余 uniapp 缺 `index.ts`、`PaginationProps` 未导出、demo 插槽覆盖缺口 |
| reborn-tooltip（仅 web） | 基本合规 | 1 | 第五轮已删除误声明的 `:uniappFiles`；剩余 `index.ts` 导出面窄 + demo 未覆盖受控/延时等文档已列条目 |
| reborn-input | 基本合规 | 3 | 第五轮已修完文档四处事实错误与 `--icon-size`；剩余 web `isFocus` 死状态、clear 事件序列/第二分割线双端差异未文档化、uniapp demo 缺键盘能力演示 |
| reborn-select | 基本合规 | 1 | 第五轮已修 config 预览 URL、文档文件清单、overrides size 默认值、配色枚举；剩余 `change` 事件 uniapp 为两参签名文档未记 |
| reborn-dropdown（仅 web） | 基本合规 | 2 | Dsubmenu 复用 `DropdownTrigger` 联合类型，含对子菜单无意义的 `manual` |
| reborn-dropdown-select（仅 uniapp） | 基本合规 | 1 | 第五轮已接入 `useFormInject` 并补文档、overrides「无文档页」过期陈述已改写；剩余缺 `index.ts` |
| reborn-radio | **合规** | 0 | 第二轮已全量对齐 web 端，config 亦已全量 rpx，本次复验无遗留 |
| reborn-checkbox | **合规** | 2 | 第四轮已修布尔强转与 mp 构建炸点；剩余 config 5 处 px 刻度 + demo 8 处英文注释 |
| reborn-toast（Message） | 基本合规 | 1 | 实现质量最高；第五轮已把「uniapp 用 useToast、双端不互通」的过期陈述改写为事实；剩余 web `index.ts` 导出面偏窄 |

## 待修项（2026-09-07 复验仍成立，按影响排序）

> **8 条已于 2026-09-07 第五轮全部修复**，逐条修法见文末「修复记录（2026-09-07 第五轮）」。

1. ~~**reborn-select config 预览指错组件**：`app/components/reborn/configs/reborn-select/RebornSelectConfig.vue:4` 的 uni-render URL 指向 `/pages/reborn-dropdown-select/RebornDropdownSelectDemo`；同时 `content/2.components/input-and-forms/reborn-select.md:16` 的 `:uniappFiles` 列的是 DropdownSelect 文件，`:componentFiles` 中的 `RebornSelectTrigger.vue`、`reborn-select-trigger.config.ts`、`RebornTransition.vue` 因路径按 componentId 目录拼接，永远加载不到。~~ → **已修**：URL 改为 `/uni-render/#/pages/reborn-select/RebornSelectDemo`（沿用该文件既有的 `#/pages` 前缀风格）；`:uniappFiles` 改为 uniapp select 真实三件套，`:componentFiles` 移除三个跨目录文件，正文补一句「触发器与动画源码见 reborn-select-trigger / reborn-transition 组件页」。
2. ~~**reborn-tooltip 文档误声明 `:uniappFiles`**：`content/2.components/navigation/reborn-tooltip.md:14`，纯 web 组件却渲染出 UniApp 页签，回落成 "No UniApp demo file found."。~~ → **已修**：删除该属性，UniApp 页签与 UniApp 安装页签一并消失。
3. ~~**reborn-pagination `pagerCount` 默认值三处不一致**：web `:16` = 3、uniapp `:50` = 7、文档只记 3；两端归一化 computed 的兜底值都写成 `|| 7`。另 web demo `:227` 仍留「需为不小于 5 的奇数」过期文案。~~ → **已修**：按跨端一致性统一为 3——uniapp 默认 7→3，两端兜底 `|| 7`→`|| 3`（`||` 对 0/NaN 的「非法值兜底」原意不变，且外层 `Math.max(3, …)` 结果等价），web demo 文案改为「不小于 3 的整数，奇偶均可，过小的值钳到 3」，uniapp demo 折叠数量选项补 `3` 并把初值从 7 改为 3。
4. ~~**reborn-toast 文档/知识库过期陈述**：`reborn-toast.md:104` 与 `knowledge/overrides/reborn-toast.json:10,15` 称 uniapp 仍是 `useToast` 且双端不互通。~~ → **已修**：改写为事实——双端 `message` 同名同形（`open/info/success/warning/error/loading/config/destroy`，见 `packages/uniapp-project/src/components/reborn-toast/index.ts`），差异只剩三处：uniapp `MessageNode` 仅 `string`（web 还支持 `VNode | () => VNode`）、`getContainer` 仅 H5 生效、小程序端页面须渲染 `<RebornToast />`（`RebornPage` 已内置）。
5. ~~**reborn-input 文档四处事实错误 + 一处未定义变量**（size 默认值 / `text-gray-4` / rows 4 / CSS 变量表 / `--icon-size`）。~~ → **已修**：size 改为分端标注（web `'md'` / uniapp `'sm'`）；`text-gray-4`→`text-gray-5`（源码 `RebornInput.vue:480/495/509` 的 `placeholder-class` 基准）；「rows 默认 4」改 2；CSS 变量表按事实拆成两张（UniApp `--input-sm/md/lg-height` = 80/90/96rpx，Web `--height-input-sm/md/lg` = 24/32/40px），删掉不存在的 768px 断点；uniapp 清除图标去掉失效的 `style="width: var(--icon-size)"`，改用 `class="size-[40rpx]"`（与 config `icon` 变体的 `text-40`＝40rpx 同规格，构建产物已确认类名与 `width/height:40rpx` 规则均生成）。**顺带修正同表第 5 处事实错误**：`variant` 默认值原标「通用 `'filled'`」，实际 web = `'outlined'`、uniapp = `'filled'`，已改为分端标注。
6. ~~**reborn-select 知识库把 size 默认值写反**：`knowledge/overrides/reborn-select.json:17` 称「Web 默认 'lg'」。~~ → **已修**：改为「Web 默认 `'md'`（`RebornSelect.vue:151`）、UniApp 默认 `'lg'`（`RebornSelect.vue:36`）」。文档 `reborn-select.md:49` 本就正确，无需改。
7. ~~**reborn-select 配色枚举双端不等未文档化**：web 7 色、uniapp config 无 `secondary`（6 色）。~~ → **已修（选优先方案：给 uniapp 补 secondary）**：uniapp `reborn-select.config.ts` 的 color 枚举补 `secondary`（7 色，与 web 相等）；该 config 本身不含配色映射，实际映射在下游三处——`reborn-select-trigger` 本就已有 7 色、`reborn-button` 本就已有，唯一缺口是 `reborn-picker-view.config.ts`，已按 badge「secondary 走灰阶」的做法补 `indicator: 'bg-secondary/10'` 与选中态 `text-gray-8 dark:text-gray-2`（`theme.css:82` 的 `--color-secondary` 即 `--color-gray-8`）。文档 color 行标「通用」自此成立。
8. ~~**reborn-dropdown-select 未接入 `useFormInject`**：放进 `RebornForm` 不参与注入与校验，文档未声明该限制。~~ → **已修**：参照同端 input/select 接入 `useFormInject(props)`，取 `size`/`disabled` 注入（新增 `resolvedSize`/`isDisabled` 并贯穿 tv 变体、触发器与开合守卫），`selectOption` 与 `onClear` 值变化后调用 `validate('change')`；`defineModel` 写法未动。文档新增「表单集成」章节，overrides 的「无文档页」过期陈述一并改写。

## 共性问题（跨组件系统性整改项）

### 1. ~~defineModel 采用率低（违反语法现代化）~~（第四轮已全部修复）
- ~~未用：input（双端）、select（双端）、checkbox（双端）、dropdown-select、radio（uniapp 端）~~ → 第二轮修 radio uniapp 端，第四轮修完其余全部 9 个文件，12 个组件的 v-model 已全量走 defineModel。
- 范式参考：tooltip / radio（`default: undefined` + 受控/非受控分流）、input web 端（`const [model, modifiers] = defineModel()` 保留修饰符）。

### 2. uniapp 端 rpx 执行不彻底
postcss 未启用 px 转换，Tailwind 默认刻度即 rem/px。**2026-09-07 重新扫描各 config 中的 px 刻度间距/尺寸类**（排除 `p-0`/`gap-0` 零值项，并逐条排除写在注释文字里的 `size-3.5`、`px-3 / gap-2 / size-4` 等示例引用）：

| config | 残留 px 刻度 |
| --- | --- |
| input | `gap-1`、`px-3`（prepend/append 各一）、`pl-3`、`pr-3`、`py-2`、`pl-9`（7 处，最多）|
| dropdown-select | `mt-1`、`w-4`、`h-4`、`py-3`、`px-2`、`px-3`（6 处；另 `text-sm`/`text-base` 字号未走 rpx 令牌，与 sm/md 档的 `text-26`/`text-28` 不统一）|
| checkbox | `gap-3`、图标 `size-4`、控件三档 `size-4`/`size-5`/`size-6`（5 处）|
| select | `py-3`、`gap-2`、`p-3`（3 处；另 `text-sm` 字号）|
| badge | `ml-2`（1 处，相邻 badge 间距 `[.reborn-badge+_&]`，第三轮 rpx 化的漏项）|
| button | `ml-2`（1 处，相邻 button 间距；其余七档尺寸已于第三轮 rpx 化）|
| alert / breadcrumb / pagination / radio / toast | **0 处，全量 rpx，可作范本** |

各 uniapp demo 页仍普遍混用 `text-[10px]`、`px-3` 等非 rpx 尺寸（存量，未逐页统计）。

### 3. 英文注释残留（2026-09-07 重新扫描，审查范围内共 22 处）
- **button（9 处，最多）**：web `RebornButton.vue:116/126`（`<!-- Content -->`、`<!-- Trailing -->`）、web `reborn-button.config.ts:95/132/169/352`、uniapp `RebornButton.vue:221`、uniapp `reborn-button.config.ts:153/190/374`（后六处为 `// Filled Variants` 类变体区块名）
- **checkbox demo（8 处）**：uniapp `RebornCheckboxDemo.vue:54/205/211/217/229/235/243/248`
- **其余 2 处**：uniapp alert demo `:44`、uniapp toast demo `:64`（均为 `<!-- Playground Section -->`）
- 已清零：radio 双端、badge 双端（含 demo）、button uniapp demo、breadcrumb、select、dropdown、pagination、tooltip、input uniapp 源码（`:522` 的 `<!-- Icons Section -->` 已于第五轮收尾改为中文）

### 4. uniapp 端 emits 类型化落后于 web 端
2026-09-07 复验：审查范围内**只剩 uniapp button** 仍是数组式 `defineEmits([...])`（`RebornButton.vue:56`）。badge、radio、input、dropdown-select 已在第二～四轮升级为类型化签名；alert、checkbox、select 双端本就已类型化。

### 5. 其他全仓不一致（非单组件问题）
- configs 里 uni-render URL 两种写法混用：`#/pages/...`（28 个文件）与 `#pages/...`（25 个文件）。
- `index.ts` 缺失面：web ui 20 个目录、uniapp 15 个目录无 index.ts；审查范围内为 **web alert、uniapp alert / pagination / dropdown-select** 四处。

## 各组件要点备忘

### reborn-button
web `RebornButton.vue:118-123` 默认插槽 fallback 内嵌套死代码；loading 态未走 disabled 样式轴（`:85` 传 `props.disabled` 而模板用 `isDisabled`）；uniapp `fluid` 为空壳 prop（已文档化）；`formType/openType` 裸 string；trailing 插槽作用域两端类型不一致（web 传字符串、uniapp 传对象，已文档化）。demo 缺：web `label`/`ui`；uniapp `block`/`gap`/`openType`（开放能力是主打卖点却无演示）。

### reborn-badge
web `props.class` 被注入 root/base/模板三处；`closeIcon` 默认值与关闭时序双端不同（已文档化）。`checked` 的 change 载荷用本地变量而非回读 model，正确规避了受控同步读旧值的坑。插槽 `ui` 作用域与图标尺寸问题已在第二、三轮修复。

### reborn-alert
双端一致性最好的组件之一（props/取值集/插槽全对齐，emit 名已于第二轮统一为 `afterClose`）；web `AlertUI` 独有 `carouselList` 键（平台实现差异，已文档化）。双端均缺 `index.ts`。demo 双端逐节对齐，均缺 `color`/自定义 `icon`/`message`/`close-element`/`ui` 演示。

### reborn-breadcrumb
API 双端完全一致（含有意分化的 `replace` 取值与 `droplistDivider`/`droplistMask` 键，均已文档化）；首/末项样式已于第二轮对齐。demo 双端均未覆盖 `custom-url`、`dropdown-props`。

### reborn-pagination
双端 defineModel 均为 number 无布尔隐患；uniapp 端缺 `index.ts`、`PaginationProps` 未导出。demo 六插槽全覆盖，web 缺 `ui`，uniapp 缺 `prev-text`/`next-text`。

### reborn-tooltip（仅 web）
`defineModel<boolean>('open', { default: undefined })` + `!== undefined` 分流是全场最佳实践。`index.ts` 只导出组件本体，未导出 `TooltipUI`/`rebornTooltip`/props 接口。demo 未覆盖 `v-model:open` 受控、`destroyOnHidden`、`fresh`、`getPopupContainer`、`openDelay/closeDelay`、expose 的 `open()/close()` 等文档已列条目。

### reborn-input
web `isFocus` 死状态（`RebornInput.vue:197` 只写不读）；`clear()` 事件序列双端不同、第二分割线显示条件双端不同（均未文档化）；文档同时存在「rows 默认 4」（`:27`）与「2」（`:195`）两种说法，实现为 2。demo：uniapp 缺 `confirmType`/`adjustPosition`/`holdKeyboard` 等键盘能力演示（文档主打卖点）。

### reborn-select
配色枚举 web 7 色 / uniapp 6 色（缺 `secondary`）而文档标通用；overrides 把 size 默认值写反（称 web 默认 lg，实际 web=md、uniapp=lg）；`change` 事件 uniapp 为两参签名文档未记；config 预览 URL 指向 dropdown-select 页面（见待修项 1）。web demo 覆盖非常完整（虚拟滚动/远程搜索/表单集成均有）。遗留的 `console.log('close')` 已于第四轮清除。

### reborn-dropdown / reborn-dropdown-select
两者是**三个独立组件**（dropdown=web 命令菜单，dropdown-select=uniapp 轻量取值控件，select=双端），命名关系已在文档互相声明。dropdown 整体质量高；`manual` 触发现已在文档中定义为 RebornDropdown 的有效取值（`reborn-dropdown.md:27`），但 Dsubmenu（`RebornDsubmenu.vue:28`）复用同一 `DropdownTrigger` 联合类型，对子菜单而言 `manual` 无对应控制出口。dropdown-select：overrides 仍称「无文档页」（文档已存在）；未接入 `useFormInject`；缺 `index.ts`。config 里注释掉的 `trigger:` 死代码已于第四轮清除。

### reborn-radio
**双端已全量对齐（第二轮重写 uniapp 端）**：Props/Emits/Slots 与 web 一致、`defineModel({ default: undefined })`、类型化 emits、接入 `useFormInject`，11 个旧调用点全部迁移，config 全量 rpx，文档与 overrides 已同步。本次复验无遗留项。

### reborn-checkbox
布尔强转缺陷（含 `defaultValue`/`trueValue`/`falseValue` 同源问题）与 mp 构建 `v-bind=""` 炸点已于第四轮修复。双端 props/emits/slots 高度对齐（`class`↔`customClass`、`trueValue/falseValue` 仅 web、`readOnly` 仅 uniapp 均已文档化）。剩余：uniapp config 5 处 px 刻度、uniapp demo 8 处英文注释。demo 双端覆盖度是表单类组件中最全的。

### reborn-toast（Message）
命令式 API 组件（无 props/v-model，defineModel 检查不适用）；双端 `message.open/info/success/warning/error/loading/config/destroy` 同名同形；rpx 执行全场最佳；demo 双端逐节一一对应。仅文档/知识库的 `useToast` 过期陈述与 web `index.ts` 导出面偏窄（demo 需绕过 index 直接从 config 导入）两点待修。

## componentId 四处一致性

13 个组件目录名、文档文件名与 `componentId`、`knowledge/index.json`（含 `platforms` 声明）全部核对一致，无缺漏。uniapp demo 页全部已在 `pages.json` 注册。

## 修复记录（2026-09-06 第二轮）

### 1. reborn-radio：uniapp 端全量对齐 web 端

改写 `packages/uniapp-project/src/components/reborn-radio/` 下 `RebornRadio.vue`、`RebornRadioGroup.vue`、`reborn-radio.config.ts`，新增 `index.ts`（导出配置与类型）：

- **API 对齐**：Radio 支持 `value`/`type`(radio|button|pure-button)/`color`(7 色)/`variant`(filled|outlined)/`disabled`/`buttonProps`/`ui`(root·icon·dot·label)；Group 支持 `modelValue`/`defaultValue`/`type`/`color`/`variant`/`size`/`options`/`direction`/`disabled`/`buttonProps`；插槽 `radio`（作用域 `{ checked, disabled }`）/`label({ data })`/`default`；`change` 事件路径与 web 一致。
- **规范落实**：双端均 `defineModel<RadioValue>({ default: undefined })` 规避布尔强转；emits 全部类型化、无 `any`；注释全中文；尺寸全 rpx（图标 24/28/32rpx、按钮高度走 `h-button-*` 令牌）；Group 接入 `useFormInject` 并 provide `isError`。
- **调用点迁移（11 个 demo 页）**：alert/badge/button/cascader/fab/input/loading/popup/qrcode/select-date/toast 中的旧写法（`:label`、`:show-icon`、`#default="{ isChecked }"`、`direction="row"`）全部迁移到新 API。
- **保留的平台差异**（已写入文档与 overrides）：`custom-class`、`@tap`、无 hover（按压反馈替代）、灰阶止于 gray-8、pure-button 的组容器选择器降级说明。
- 同步更新 `content/2.components/input-and-forms/reborn-radio.md`（跨端说明、`:componentFiles` 补 `RebornRadioGroup.vue`、`:uniappFiles` 更新）与 `knowledge/overrides/reborn-radio.json`（删除「uniapp 未对齐」过期 pitfalls）。

### 2. reborn-breadcrumb：uniapp 端样式对齐 web 端

改 `packages/uniapp-project/src/components/reborn-breadcrumb/reborn-breadcrumb.config.ts`：

- 首/末项与 web 端一致不再加粗变色（`first` 变体清空并保留钩子注释；`last` 仅保留分隔符隐藏——小程序伪类失效必须走索引判定）。
- 灰阶从原生色板（gray-400/500/600/800/900）换成设计令牌（gray-4/7/8，本端灰阶止于 8，gray-8 对应 web gray-9）；hover 语义换成按压反馈 `active:text-primary`/`active:bg-gray-2`。
- 尺寸全部 rpx 化：`gap-x-[12rpx]`、`gap-[8rpx]`、`w-[32rpx]`、`w-[28rpx]`（对齐 web `size-3.5`）、`mt-[8rpx]`、`py-[8rpx]`、`px-[24rpx] py-[16rpx]`。
- 同步更新 `reborn-breadcrumb.md` 的 UniApp ui 键位表默认值。

### 3. reborn-alert：emit 名统一 + 文档补漏

- uniapp `RebornAlert.vue` emit 声明 `'after-close'` → `afterClose`，与 web 端一致（模板 `@after-close` 监听不受影响，已全仓核查调用点）。
- `reborn-alert.md` Props 表补 `class`（仅 Web）与 `custom-class`（仅 UniApp）两行；`close-icon` 默认值改为分端标注（Web `'lucide:x'` / UniApp `'i-lucide-x'`）。

### 4. reborn-badge：demo 注释中文化 + 插槽透出 ui

- uniapp demo 页 7 处英文区块注释全部改中文。
- uniapp `RebornBadge.vue`：`leading`/`default`/`trailing` 插槽透出 `:ui`，`close` 插槽透出 `:ui` 与 `:close`，并新增与 web `BadgeSlots` 对齐的 `defineSlots` 类型声明；顺带把数组式 `defineEmits` 升级为类型化声明（`:ui="ui"` 作用域写法为 uniapp 端既有惯例，button/input 等已在用）。
- `reborn-badge.md`：Slots 表作用域列改为「双端一致」，`trailingIcon` 键的「uniapp 不透出 ui」过期说明已改写。

### 复验结果

| 校验项 | 结果 |
| --- | --- |
| eslint（改动文件，不带 --fix） | radio 目录 + demo 页零错误；alert/badge/breadcrumb 无新增错误（存量报错为文件既有引号/分号/类排序风格问题，未改动的行同样在报） |
| uniapp H5 构建（`uni build`） | ✅ 通过，所有改动文件编译无误 |
| uniapp mp-weixin 构建 | ❌ 挡在 `reborn-checkbox/RebornCheckboxGroup.vue` 的 `v-bind=""` 处——**该分支既有炸点（本次未改 checkbox，改动前同样失败）**，radio 新代码已刻意规避该写法（Group 插槽作用域逐项展开，未用 `v-bind="scope"`） |
| `pnpm kb:build --only reborn-radio,reborn-alert,reborn-badge,reborn-breadcrumb` | ✅ 4 个组件重建成功 |
| `pnpm kb:check` | ✅ 知识库校验通过（148 个组件） |

**遗留提醒**：~~mp-weixin 全量构建需先修复 checkbox 既有的 `v-bind=""` 炸点~~（第四轮已修复，mp 构建已打通）；alert 等 uniapp config 内残留的少量 px 刻度与各 demo 页混用非 rpx 属存量问题，未处理。

## 修复记录（2026-09-06 第三轮）

### 1. reborn-badge：前后图标与文字同尺寸

- **web 端**（`app/components/reborn/ui/reborn-badge/reborn-badge.config.ts`）：本项目覆写了字号令牌（`--text-sm: 12px`、`--text-base: 14px`，见 `app/assets/theme/typography.css`），因此真实不等发生在 md（图标 14px vs 文字 12px）与 lg（图标 16px vs 文字 14px）。修正为 sm/md `size-3`（=text-sm 12px）、lg `size-3.5`（=text-base 14px）。`closeIcon` 维持原尺寸（点击目标略大属有意为之）。
- **uniapp 端**（`packages/.../reborn-badge/reborn-badge.config.ts`）：原为 px 图标（`size-3/4`）配 rpx 文字（`text-24/28`），仅在标准屏偶合、缩放即不等。改为 sm/md `size-[24rpx]`（=text-24）、lg `size-[28rpx]`（=text-28）；顺带把 `gap-1` 改为 `gap-[8rpx]`，清掉该 config 最后的 px 刻度。

### 2. reborn-button：uniapp config 尺寸全面 rpx 化

`packages/.../reborn-button/reborn-button.config.ts` 七档 size：水平内边距按文档规格改为 `px-[12rpx]`（xs/sm）/`px-[16rpx]`（default/md）/`px-[24rpx]`（lg/xl/2xl），消除「文档说 rpx、实现是 px」的矛盾；图文间距 `gap-1.5/2` → `gap-[12rpx]/[16rpx]`、加载动画 `size-3~7` → `size-[24~56rpx]`（按 1px=2rpx 保持现有视觉，文档对这两项未定具体数值，仅要求「按 size 取固定值」，仍成立）。

### 3. reborn-button：uniapp demo `square` 死开关删除

`packages/.../pages/reborn-button/RebornButtonDemo.vue`：删除 `demoSquare` 状态、`:square` 绑定与对应 `RebornSwitch`（组件无此 prop，纯死控件）；顺带把该文件仅剩的 2 处英文注释（`// Demo State`、`// Options Mapping`）改为中文。

### 复验结果（第三轮）

- uniapp H5 构建（`uni build`）✅ 通过；eslint 无新增错误（存量为该 demo 文件既有格式风格问题）。
- `pnpm kb:build --only reborn-button,reborn-badge` ✅；`pnpm kb:check` ✅（148 个组件）。
- 文档无需改动：badge 文档未声明图标具体尺寸；button 文档的 12/16/24rpx 表格现在与实现一致。

## 修复记录（2026-09-06 第四轮）：defineModel 全量现代化

改造 9 个文件，12 个组件的 v-model 全部走 defineModel 语法糖：

### 1. reborn-checkbox（双端 4 文件）——兼根治布尔强转缺陷
- `defineModel<CheckboxValue | CheckboxValue[]>({ default: undefined })` 取代手写 prop+emit；受控/非受控分流参照 radio 范式，`defaultValue`/`defaultChecked` 从死属性变为真正生效的非受控初值。
- **额外挖出第二处同源缺陷**：`defaultValue`/`trueValue`/`falseValue` 自身编译后也是 boolean-castable 且无 default，同样被强转——已在 `withDefaults` 显式补 `undefined`，缺陷才算修全。
- 类型收紧：`trueValue/falseValue: any` → `CheckboxValue`；`inject<any>` → `inject<CheckboxGroupContext | null>`（新增导出接口）。
- **顺带修复 mp 构建炸点**：uniapp `RebornCheckboxGroup.vue` 模板 `<slot v-bind="scope">` 整包透传（mp 编译报 `v-bind="" is not supported` 的源头）改为作用域逐项展开——**mp-weixin 全量构建自此打通**。
- 语义变化说明（defineModel 固有语义，radio 同）：只传单向 `:model-value` 且不监听更新时，点击后组件接管为内部状态（此前会锁死）；已写入文档注意事项与 kb pitfalls。
- 同步更新 `reborn-checkbox.md`（defaultValue 描述、受控/非受控注意事项、trueValue 类型表）与 `knowledge/overrides/reborn-checkbox.json`。

### 2. reborn-input（双端 2 文件）
- web 端 `const [model, modelModifiers] = defineModel<string | number, 'trim' | 'number'>()` 保留 v-model 修饰符能力；uniapp 端 `defineModel<string | number>()`，数组式 emits 升级为类型化 7 事件声明。
- formatter/parser、输入法合成、clear、密码切换、textarea 分支与事件序列逐路径核对等价；编译产物验证运行时 prop 声明与改造前完全一致（无 default，非受控探测未破坏）。

### 3. reborn-select（双端）+ reborn-dropdown-select（2+1 文件）
- 三处均改 defineModel（select 双端保留 `default: null` 原语义）；dropdown-select 数组式 emits 升级类型化。
- change 载荷全部用本地新值，无一处赋值后回读 model；uniapp change 两参签名、changing/confirm 链路原样。
- 顺带清理：uniapp select 遗留 `console.log('close')`、dropdown-select config 3 行注释死代码。

### 调用点核查
三个代理合计全仓扫描 170+ 处调用点：`v-model` 写法全部无感；`:model-value` + `@update:model-value` 双向齐全者严格受控不变；纯单向 `:model-value` 仅存在于 demo 展示处（行为从「锁死」变「可切换」，已文档化）；`useFormInject` 两端均不读 modelValue，表单链路无耦合；零处使用被移除的内部实现。

### 复验结果（第四轮）
| 校验项 | 结果 |
| --- | --- |
| **mp-weixin 全量构建** | ✅ **首次通过**（checkbox `v-bind=""` 炸点已修，无其他阻断） |
| uniapp H5 构建 | ✅ 通过 |
| eslint（逐文件与改造前基线对比） | ✅ 零新增（input 22→22、select web 75→75、select uniapp 40→38、checkbox 36+14→36+14；减少的 2 条来自删掉的 console.log） |
| `pnpm kb:build --only` 4 组件 + `pnpm kb:check` | ✅ 148 个组件校验通过 |

## 复验记录（2026-09-07）

只读复验，未改动任何代码。逐项核对 09-06 遗留清单在当前工作区的真实状态，结果如下。

### 已确认全部修复（不再列为问题）
- **defineModel**：12 个组件的 v-model 全部走 defineModel；checkbox 双端与 radio 双端为 `default: undefined`，select 双端保留 `default: null`，input web 端保留 `'trim' | 'number'` 修饰符。
- **emits 类型化**：审查范围内只剩 uniapp button 一处数组式写法。
- **英文注释**：radio 双端、badge 双端（含 demo）、button uniapp demo 已清零。
- **其他**：alert emit 名已统一、breadcrumb 首末项样式已对齐、uniapp select 的 `console.log` 与 dropdown-select 的注释死代码已清除、button uniapp demo 的 `square` 死开关已删除。

### 与 09-06 记录不符、已在本次更正
1. **badge 的 rpx 化仍有一处漏项**：第三轮记录称已清掉该 config 最后的 px 刻度，实测 `[.reborn-badge+_&]:ml-2` 仍在（button config 同一写法也是 `ml-2`）。radio 与 breadcrumb 的「全量 rpx」结论经本次逐行核对成立——首轮扫描把写在注释里的 `size-3.5`、`px-3 / gap-2 / size-4` 误计为代码，已剔除。
2. **web button 的英文注释此前被漏记为已处理**：`RebornButton.vue:116/126` 与 `reborn-button.config.ts:95/132/169/352` 仍在，button 因此成为英文注释最多的组件（9 处）。
3. **uniapp `index.ts` 缺失面从 14 个目录变为 15 个**（本次实测值，未追溯具体新增目录）。
4. **`--icon-size` 与部分文档问题的行号已漂移**：uniapp input 该引用现位于 `:525`（原记 `:515`）。
5. **`manual` 触发不再是「文档未定义」**：`reborn-dropdown.md:27` 已把 `manual` 定义为 RebornDropdown 的有效取值并给出用法示例；问题收窄为 Dsubmenu 复用同一联合类型而无对应控制出口。
6. **reborn-input 文档 rows 自相矛盾**：`:27` 写 4、`:195` 写 2（实现为 2），原记录只提到「文档/overrides 称 4」。

### 本次复验的核查方式
- 逐文件 grep + 读取，覆盖 13 个组件目录的 `ui`/`examples`/`configs`/uniapp `components`/uniapp `pages`，以及对应的 `content/2.components/**` 文档与 `knowledge/overrides/*.json`。
- rpx 统计使用 pcre2 正则只匹配间距/尺寸类的 Tailwind 默认数字刻度（`p|px|py|m|gap|size|w|h|space` 系列），排除 `text-24` 这类项目自定义 rpx 令牌与 `p-0`/`gap-0` 零值项，避免上一轮的误统计。
- 未运行构建与 `kb:build`（本次无代码改动，第四轮的构建结论仍然有效）。

### 与本次审查无关的工作区改动（备注）
`app/app.config.ts`（header 背景改 `bg-white/40`）与 `app/components/common/component-list/ComponentsList.vue`（容器加 `mt-10`）是文档站视觉微调，不属于组件规范范畴，未纳入本报告统计。

## 修复记录（2026-09-07 第五轮）：待修项 8 条全清

本轮把「待修项」8 条逐条修完，共改动 9 个源码 / demo 文件、6 份文档与 3 份 overrides。逐条修法如下。

### 1. reborn-select：config 预览指错组件 + 文档文件清单加载不到

- `app/components/reborn/configs/reborn-select/RebornSelectConfig.vue:4`：uni-render URL 由 `/uni-render/#/pages/reborn-dropdown-select/RebornDropdownSelectDemo` 改为 `/uni-render/#/pages/reborn-select/RebornSelectDemo`（保留该文件既有的 `#/pages` 前缀写法，未顺手统一全仓两种风格）。
- `content/2.components/input-and-forms/reborn-select.md:16`：`:uniappFiles` 由 DropdownSelect 的六个文件改为 uniapp select 真实目录下的 `RebornSelect.vue` / `reborn-select.config.ts` / `index.ts`（`ls` 核实该目录只有这三个文件）；`:componentFiles` 移除 `RebornSelectTrigger.vue`、`reborn-select-trigger.config.ts`、`RebornTransition.vue`——`app/utils/getComponentCode.ts:26-31` 把路径拼成 `/components/reborn/ui/<componentId>/<fileName>` 与 `/components/<componentId>/<fileName>`，跨目录文件永远匹配不到。正文补一句说明：触发器与展开动画属独立组件，源码见 `reborn-select-trigger` / `reborn-transition` 组件页。

### 2. reborn-tooltip：删除误声明的 `:uniappFiles`

`content/2.components/navigation/reborn-tooltip.md:14` 去掉 `:uniappFiles` 属性。`ComponentTabs.vue:27` 以 `uniappFiles?.length > 0` 判定是否为双端组件，删除后「UniApp Code」页签与安装区的「UniApp」平台页签一并消失，不再回落成空内容。

### 3. reborn-pagination：`pagerCount` 统一为 3

按跨端一致性原则统一到文档与 web 现值 3：

- uniapp `RebornPagination.vue:50` 默认值 `7` → `3`。
- 两端归一化 computed 的兜底：web `:79`、uniapp `:81` 的 `|| 7` → `|| 3`。`||` 的语义仍是「`0`/`NaN`/非法值走兜底」，与外层 `Math.max(3, …)` 组合后结果与改前对 0 的处理完全等价，只是兜底值不再与默认值打架。
- web demo `RebornPaginationDemo.vue:227` 的「需为不小于 5 的奇数」→「不小于 3 的整数，奇偶均可，过小的值钳到 3」，与同文件 `:57` 注释、文档 `:27`/`:82` 和 overrides 全部一致。
- uniapp demo 页无「默认 7」文案，但折叠数量选项原为 `[5, 7, 9, 11]`（新默认值不可选）、初值硬编码 7，已补 `3` 并把初值改为 3。

### 4. reborn-toast：文档与知识库的 `useToast` 过期陈述改写

读 `packages/uniapp-project/src/components/reborn-toast/index.ts` 核实：uniapp 端导出的 `message` 与 web 端同名同形（`open`/`info`/`success`/`warning`/`error`/`loading`/`config`/`destroy`，`levelMethod` 同样支持 `(content, duration, onClose)` 与 `(config)` 两种形态并返回 Promise）。据此把 `reborn-toast.md:104` 与 `knowledge/overrides/reborn-toast.json` 的 `whenNotToUse[1]` / `pitfalls[2]` 改写为**三处真实差异**：

| 差异点 | Web | UniApp |
| --- | --- | --- |
| `MessageNode` | `string \| VNode \| (() => VNode)` | 仅 `string` |
| `getContainer` | 生效 | 仅 H5 生效（`index.ts` 内 `#ifdef H5`） |
| 容器挂载 | 首次调用自动挂到 body | 小程序无 DOM，页面须渲染 `<RebornToast />`（`RebornPage` 已内置） |

### 5. reborn-input：文档五处事实错误 + `--icon-size` 失效内联样式

文档（`content/2.components/input-and-forms/reborn-input.md`）：

- `size` 默认值：核实 web `RebornInput.vue:21` = `'md'`、uniapp `:131` = `'sm'`，改为分端标注并加一句「跨端复用同一份配置时需显式指定」。
- `placeholderClass`：uniapp 源码 `:480/:495/:509` 的 `placeholder-class` 基准是 `text-gray-5`（`:114` 注释亦然），`text-gray-4` → `text-gray-5`。
- 「`rows` 默认 4」→ 2，与同文档 Props 表和两端 `withDefaults`（均 `rows: 2`）一致。
- CSS 变量表整体重写：原表把 uniapp 的 rpx 值写成 px、又编了个不存在的「768px 断点桌面值」。改为两张分端表——UniApp（`packages/uniapp-project/src/styles/theme.css:166-168`）`--input-sm/md/lg-height` = 80/90/96rpx；Web（`app/assets/theme/typography.css:43-45`）`--height-input-sm/md/lg` = 24/32/40px。
- **额外发现并修正第 5 处**：`variant` 默认值原标「通用 `'filled'`」，实际 web = `'outlined'`、uniapp = `'filled'`，已改为分端标注。

源码（`packages/uniapp-project/src/components/reborn-input/RebornInput.vue:525`）：清除图标的 `style="width: var(--icon-size); height: var(--icon-size);"` 引用的变量全仓无定义，`var()` 求值失败使 width/height 落回 `auto`。改为静态类 `class="size-[40rpx]"` + 保留 `:class="props.clearIcon"`（分开写以过 `vue/prefer-separate-static-class`），40rpx 取自同组件 config 三档 size 统一的 `icon: 'text-40'`（`--text-size-40: 40rpx`），即图标本就应有的规格。mp-weixin 构建产物已核验：`RebornInput.wxml` 带 `size-_b40rpx_B` 类名，`app.wxss` 中该类的 `width/height: 40rpx` 规则存在。

### 6. reborn-select：overrides 的 size 默认值写反

`knowledge/overrides/reborn-select.json:17` 「Web 默认 'lg'」→「Web 默认 `'md'`、UniApp 默认 `'lg'`」，与 web `RebornSelect.vue:151` = `"md"`、uniapp `RebornSelect.vue:36` = `'lg'` 一致。文档 `reborn-select.md:49` 原本就写对了，未动。

### 7. reborn-select：配色枚举双端补齐（采用优先方案）

选了任务给出的**优先方案「给 uniapp 补 secondary」**，而非退而在文档标注「secondary 仅 web」。读完后确认可补：

- `packages/uniapp-project/src/components/reborn-select/reborn-select.config.ts` 的 `color` 只是类型枚举导出（该 config 的 `slots`/`variants` 里没有任何配色映射），补 `'secondary'` 后变为与 web 相等的 7 色，uniapp demo 的色板遍历 `v-for="c in selectColors"` 自动多出一档。
- 真正的配色映射在下游三个组件：`reborn-select-trigger.config.ts` 本就是 7 色且已有 `secondary` 的聚焦描边、`reborn-button.config.ts` 本就 7 色，唯一缺口是 `reborn-picker-view.config.ts`（6 色）。按 `reborn-badge.config.ts` 的「secondary 走灰阶」做法补齐：`variants.color.secondary.indicator = 'bg-secondary/10'`、compoundVariants 补选中态 `itemText: 'text-gray-8 dark:text-gray-2'`。依据是 `theme.css:82` 的 `--color-secondary: var(--color-gray-8)` 与 `tailwind.config.ts:80` 的 `secondary.DEFAULT = #333333`（gray-8），本端无独立 secondary 色阶。

### 8. reborn-dropdown-select：接入 `useFormInject`

`packages/uniapp-project/src/components/reborn-dropdown-select/RebornDropdownSelect.vue` 参照同端 `reborn-input:272` / `reborn-select:134` 的接入方式：

- `const { size: fieldGroupSize, disabled: fieldGroupDisabled, validate } = useFormInject(props)`，派生 `resolvedSize`（表单 size 优先）与 `isDisabled`（表单禁用或自身禁用）。
- 两者贯穿到 tv 变体入参、`RebornSelectTrigger` 的 `:size`/`:disabled`、以及 `toggleDropdown` 的开合守卫（原来只看 `props.disabled`，表单禁用挡不住展开）。
- `selectOption` 与 `onClear` 在写值并 emit `change` 之后调用 `validate('change')`，与同端 input/select 的校验时机一致。
- 第四轮的 `defineModel<any>()` 写法未动。
- 文档 `reborn-dropdown-select.md` 新增「表单集成」章节（注入规则 + 自动校验 + 示例），Props 表的 `size`/`disabled` 两行补「放入 `RebornForm` 时表单值优先」；overrides 的 `pitfalls[0]`「当前无文档页（docs missing）」为过期陈述，一并改写为表单集成说明。

### 复验结果（第五轮）

| 校验项 | 结果 |
| --- | --- |
| uniapp H5 构建（`npx uni build`） | ✅ Build complete |
| uniapp mp-weixin 构建（`npx uni build -p mp-weixin`） | ✅ Build complete |
| `pnpm kb:build --only reborn-select,reborn-toast,reborn-input,reborn-pagination,reborn-dropdown-select` | ✅ 5 个组件重建成功（后补建 `reborn-picker-view`，因本轮改了其 config） |
| `pnpm kb:check` | ⚠️ 本轮 6 个组件全部通过；唯一失败项为 `reborn-search-box` drift，属工作区既有的他人未提交改动（`app/components/reborn/ui/reborn-search-box/**` 与其文档），**不在本轮范围**，本轮未触碰该组件 |
| eslint（改动文件，不带 `--fix`） | ✅ 零新增。dropdown-select / select config / picker-view config / uniapp input 全绿；pagination 双端与其 demo、select config 预览页的报错均为文件既有的事件名 kebab-case、模板缩进、import 排序等风格问题，落在未改动的行上 |

**说明**：`knowledge/components/` 为生成物且已在 `.gitignore:109` 中，`kb:build` 不产生需提交的改动；需提交的只有 `knowledge/overrides/` 下的三份 JSON。
