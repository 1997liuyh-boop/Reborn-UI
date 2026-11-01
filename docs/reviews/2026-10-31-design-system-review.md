# 组件库设计规范与变量规范审查

审查日期：2026-10-31。源码基准：`14f44b956af3494bd1fb36c57f98dc76100a3e03`。

审查已进入整改阶段，下文问题与证据保留为基准快照。用户要求一次性修复后，DS-01～DS-13 已逐项实施，维护合同见 `docs/authoring/design-system.md`。基础色板保留，通用默认强调色通过统一语义角色消费。

## 整改结果

| 问题 | 已实施的修复 | 验证 |
| --- | --- | --- |
| DS-01 | 七种语义色提供实底配对前景，Button、Badge、Checkbox、Chip、BackTop、Radio、Switch、Steps、Carousel 使用对应角色 | 四种主题预设 × 明暗 × 默认/悬停/按下的实际 CSS 对比度均 ≥4.5:1；实底消费者检查 |
| DS-02 | Checkbox 标签改用 `text-sm/base/lg`，不再依赖 UniApp 旧变量 | 非默认父字号下实际计算字号为 12/14/16px |
| DS-03 | 补齐 ring、destructive、background、input、foreground、divider 等入口语义角色 | 真实主题编译与颜色回归 |
| DS-04 | 统一默认第 6 阶、悬停第 5 阶、按下第 7 阶；默认色、浅底和描边通过共享角色消费 | 明暗映射矩阵；局部自定义主色能穿透组件局部变量 |
| DS-05 | NoticeBar 默认色进入 config，显式颜色才使用内联样式 | 暗色、`ui`、显式颜色、`customStyle` 的浏览器红绿回归 |
| DS-06 | Button 内层继承外层配置 gap | sm 实际间距 6px，普通 `ui.base` 可覆盖 |
| DS-07 | 移除用户覆盖后追加的 `leading-none` | 实际标签行高与插槽覆盖回归 |
| DS-08 | 删除历史圆角提权，并调整下划线与连体边缘规则顺序 | 默认形状、输入框前后置块、全屏弹窗及普通圆角覆盖回归 |
| DS-09 | Button、Badge、Chip、Transfer、Watermark、Marquee 使用真实 UI 键与 ClassValue | TypeScript/Vue 类型夹具拒绝非法键，并接受组合类名 |
| DS-10 | Chip color/size/position 收紧到真实枚举 | 合法与非法调用类型编译、现有运行时回归 |
| DS-11 | 修正文档为显式 size → Form → 默认值，不从 FormItem 读取 | 实际组件 SSR 继承与显式覆盖回归 |
| DS-12 | BackTop xs 改为规范 `text-sm` | 实际字号及 1em 图标宽度均为 12px |
| DS-13 | 新增设计守卫、类型编译、组件与浏览器回归、改动源码 lint 及独立 GitHub workflow | 本地执行 CI 相同脚本通过；测试跳过会使运行器失败 |

额外修复类型编译所依赖的六处存量错误：Button 变体数组类型扩宽、Input 缺少 inside 变体键、Pagination 只读复合配置与 tv 不匹配、SelectTrigger 方位字面量扩宽、Select 缺少显式 useFormInject 导入、Transition 捕获组缺少可空检查。Radio 拼接按钮首尾圆角同步为所有尺寸 4px；固定黑白底的 RainbowButton 使用对应固定前景，避免错误借用语义实底前景。

验证记录：

- 设计回归 **247/247**，相关组件单元回归 **120/120**，额外浏览器交互回归 **65/65**，均无跳过。
- Web 设计守卫 **0 项违规**；改动源码 ESLint/Oxlint **0 错误、0 警告**；公开组件类型夹具编译通过。
- registry 构建 **172 个组件**；知识库生成及校验通过，文档偏差 **0**。原有 Footer/Ripple 无 script 的两个抽取告警保留。
- GitNexus `detect_changes(scope=all)`：**58 个已有文件、91 个符号**，`partial=false`、`truncated=false`，图谱汇总风险 low。CSS 与动态样式依赖仍以真实浏览器验证为准，图谱没有执行流程命中不代表共享主题没有影响。
- `git diff --check` 通过。新增规范、测试和 CI 文件不在基准图谱的已有符号计数内。

本次没有批量改变 UniApp 品牌色、rpx 体系或已发布组件变量名；对应兼容合同已写入维护规范。也没有将本次回归等同于全库视觉或完整无障碍审计。

复核补修：Tree 中性拖拽指示线恢复为 `gray-9`；Menu 选中背景与 Tree 内部放置不再借用 `-border` 描边角色，改回色板第 2 阶；FAB、Guide、Timeline 与 DatePickerPanel 的实底改用配对前景。设计守卫新增「描边角色误用」「实底搭配固定前景」两条规则，浏览器回归覆盖上述组件。实底按钮在悬停、按下时前景色会黑白翻转（如浅色 primary 悬停转黑字、error 按下转白字），经确认保留：悬停与按下沿用 5/7 阶，前景按 4.5:1 逐态配对，不为保持字色一致而改动取阶。

## 范围与证据

- 静态扫描 Web `app/components/reborn/ui` 下 161 个目录、494 个 Vue/TS 文件。其中 `reborn-*` 为 86 个目录、312 个 Vue/TS 文件；目录数量不是对外组件数量。
- 深查 Web 主题入口、颜色与排版令牌，以及 Button、Checkbox、Chip、NoticeBar、Badge、Alert、Steps、Slider、Header、BackTop 等代表性实现。UniApp 只核对主题和相关两端约定，没有逐个审查全部组件。
- 静态文本中，`reborn-*` 的语义颜色工具类命中 871 次、涉及 48 个文件；1～10 阶色板工具类命中 1240 次、涉及 82 个文件。此统计包含源码中的字符串与注释，表示两种消费方式的覆盖范围，不是违规数量。
- GitNexus `main` 索引已更新至本次源码基准。图谱用于辅助定位，样式与变量问题以当前源码、实际 CSS 产物及计算样式为准。
- 使用仓库安装的 Tailwind 编译器检查 CSS 产物；使用 Chromium 复核字号和明暗颜色；使用当前合并器复核覆盖顺序。没有运行全库行为回归、完整无障碍审计或全部组件视觉回归。

优先级：P1 应优先修复的可读性问题；P2 实际行为、主题或 API 合同问题；P3 规范与持续维护问题。

## 已确认的问题

### DS-01 · P1 · 实底按钮统一白字，部分配色对比度不足

证据：[Button 配色](../../app/components/reborn/ui/reborn-button/reborn-button.config.ts#L118)、[暗色反色令牌](../../app/assets/theme/base.css#L243)。

`success/info/warning` 的 filled 按钮均固定 `text-white`。按默认主题的 sRGB 色值计算，浅色模式白字与 success 背景约为 **1.63:1**，info **2.38:1**，warning **2.46:1**；暗色 success 约 **1.60:1**。这些按钮使用 12/14/16px 常规字号，低于常规文字 4.5:1 的参考标准。

主题已经提供暗色 `--color-inverted`，组件仍直接固定白色。整改应定义各语义色的实底前景，并验证 default/hover/active；只统一替换为 `text-inverted` 仍不能处理浅色绿色、橙色等背景。

### DS-02 · P2 · Checkbox 引用了 Web 中没有定义的旧字号变量

证据：[Checkbox size 配置](../../app/components/reborn/ui/reborn-checkbox/reborn-checkbox.config.ts#L85)、[Web 排版令牌](../../app/assets/theme/typography.css#L1)。

三个尺寸仍使用 `--text-size-24`、`--text-size-26`、`--text-size-28`。这些变量只在 UniApp 主题中定义，Web 没有定义，也没有 fallback。浏览器使用真实 config 生成标签类名并加载 Web 基础样式后，`sm/md/lg` 标签均继承为 **16px / 24px 行高**，没有形成尺寸阶梯。

应改为 Web 七级字号令牌，并增加“Web 引用的设计变量必须能在 Web 样式入口解析”的检查；不能用 UniApp 的同名变量证明 Web 依赖齐全。

### DS-03 · P2 · 使用了组件库样式入口无法生成的颜色类

证据：[Button 基础样式](../../app/components/reborn/ui/reborn-button/reborn-button.config.ts#L19)、[Header 弹层底部](../../app/components/reborn/ui/reborn-header/reborn-header.config.ts#L12)、[旧 ColorPicker](../../app/components/reborn/ui/color-picker/ColorPicker.vue#L329)。

用 `app/assets/css/main.css` 编译并逐类构建，`bg-primary` 可以生成，以下类没有 CSS 产物：

- `focus-visible:border-ring`、`focus-visible:ring-ring/50`。
- `aria-invalid:border-destructive`。
- `bg-background`、`text-primary-foreground`、`border-input`。
- `border-border-divider`。

因此预期的焦点色、错误色或背景/边框不能按这些声明生效。Button 仍有独立 ring 宽度类，不能据此断言所有焦点指示都完全消失。宿主站点如果额外定义这些令牌，可能掩盖组件库独立分发时的问题。

应清理残留的其他设计系统命名，或在组件库入口正式定义并分发对应语义令牌；不能依赖文档站偶然补齐。

### DS-04 · P2 · 同名 color 参数没有统一的主题消费合同

证据：[浅色语义映射](../../app/assets/theme/base.css#L115)、[暗色语义映射](../../app/assets/theme/base.css#L235)、[Button primary](../../app/components/reborn/ui/reborn-button/reborn-button.config.ts#L108)、[Chip primary](../../app/components/reborn/ui/reborn-chip/reborn-chip.config.ts#L69)、[Steps primary](../../app/components/reborn/ui/reborn-steps/reborn-steps.config.ts#L91)。

Button 使用 `bg-primary`，Chip 使用 `bg-brand-6`，Steps 的内部变量直接取 `--color-brand-6`。浅色下两者碰巧相同，暗色下语义主色取第 5 阶，原始色板仍取第 6 阶。浏览器实测暗色分别为 `rgb(49,123,250)` 与 `rgb(65,140,251)`。

只覆盖 `--color-primary` 时，也会出现部分组件跟随、部分组件保持色板值的情况。应定义“同一语义色、同一视觉角色”的映射；软背景、描边和文字可以取不同阶，但应由共同规则决定。

### DS-05 · P2 · NoticeBar 默认内联颜色绕过主题与普通 ui 覆盖

证据：[默认颜色](../../app/components/reborn/ui/reborn-notice-bar/RebornNoticeBar.vue#L45)、[内联样式](../../app/components/reborn/ui/reborn-notice-bar/RebornNoticeBar.vue#L125)、[根节点绑定](../../app/components/reborn/ui/reborn-notice-bar/RebornNoticeBar.vue#L259)。

默认背景 `#F7F7F9`、文字 `#888A8C` 始终写入内联样式。结果是默认外观不跟随暗色令牌，普通 `ui.root` 中的 `bg-*`、`text-*` 类也不能覆盖这些默认值。

默认色应放在 config 中消费令牌；用户显式传入自定义 CSS 色值时再生成内联覆盖，并明确其优先级。

### DS-06 · P2 · Button 小尺寸间距配置没有作用到内容

证据：[sm 配置](../../app/components/reborn/ui/reborn-button/reborn-button.config.ts#L51)、[真实内容容器](../../app/components/reborn/ui/reborn-button/RebornButton.vue#L131)。

`sm` 的 `gap-1.5` 设置在外层 button，图标与文字却位于内部 `gap-2` 容器。实际内容间距仍为默认根字号下的 8px，配置要求的 6px 无效，`ui.base` 修改 gap 也无法控制这里。

内部布局应该消费同一个配置，或提供明确的 content 样式槽，避免 config 与模板各自定义一份默认布局。

### DS-07 · P2 · Button 在合并末尾强制覆盖用户行高

证据：[label 合并顺序](../../app/components/reborn/ui/reborn-button/RebornButton.vue#L119)。

合并顺序是 `ui.label → 调用方 class → leading-none`。当前合并器会将 `leading-6 leading-none` 合并为 `leading-none`，因此公开的 `ui.label` 不能正常覆盖行高。

默认样式应留在 config；用户覆盖放在最后。若某个几何约束确实不可覆盖，应明确写进 API，而不是通过合并顺序隐式锁定。

### DS-08 · P2 · 历史 important 让普通 ui 覆盖规则失效

证据：[Button round](../../app/components/reborn/ui/reborn-button/reborn-button.config.ts#L72)、[Badge round](../../app/components/reborn/ui/reborn-badge/reborn-badge.config.ts#L92)、[Alert round](../../app/components/reborn/ui/reborn-alert/reborn-alert.config.ts#L76)。

这些位置使用 `rounded-full!`。普通的 `ui` 圆角类会与其同时保留，最终仍由 important 胜出。Button/Badge 注释已经说明，提权来自旧圆角类无法合并的历史原因；圆角迁移后合并已正常。

圆形或胶囊形状本身是合理能力。需要统一的是“形状约束与用户 ui 谁优先”，并删除不再需要的提权，而不是删除形状能力。

### DS-09 · P2 · 公共 ui 类型缺少统一约束，拼错键位会静默失效

证据：[Button ui](../../app/components/reborn/ui/reborn-button/RebornButton.vue#L33)、[Chip ui](../../app/components/reborn/ui/reborn-chip/RebornChip.vue#L45)、[Transfer ui](../../app/components/reborn/ui/reborn-transfer/RebornTransfer.vue#L204)、[Watermark ui](../../app/components/reborn/ui/reborn-watermark/RebornWatermark.vue#L29)。

上述接口直接暴露 `ui?: any`。例如 Button 消费 `base`，调用方写 `ui.root` 不会有类型提示，也没有效果。其他组件已经有显式的 UI 类型，使用体验不一致。

应按真实 slots 导出具名 UI 类型，并使用 ClassValue 约束类名值。不同组件不必强行拥有相同结构键，但相同结构角色应尽量同名，合法键必须可检查。

### DS-10 · P2 · Chip 类型允许任意字符串，运行时只有枚举实现

证据：[Chip props](../../app/components/reborn/ui/reborn-chip/RebornChip.vue#L26)、[运行时断言](../../app/components/reborn/ui/reborn-chip/RebornChip.vue#L71)、[配置枚举](../../app/components/reborn/ui/reborn-chip/reborn-chip.config.ts#L37)。

`color/size/position` 均允许枚举外的字符串，但运行时只做类型断言，没有自定义值处理。`color="purple"`、`size="xl"`、`position="center"` 可以通过类型检查，却没有相应配色、尺寸或定位规则。

应收紧为真实支持的枚举，或实现并记录自定义值的解析与回退方式。类型断言不等于运行时支持。

### DS-11 · P2 · 文档中的尺寸优先级与实现相反

证据：[Button 文档](../../content/2.components/button/reborn-button.md#L292)、[共享尺寸实现](../../app/composables/useFieldGroup.ts#L434)。

文档写 `FormItem > Form > 自身 size`，实际为 `显式控件 size > Form > 控件默认值`，并明确不读取 FormItem。按照文档配置表单，得到的尺寸可能与预期相反。

应把继承优先级列为可测试的公共合同。知识库 API 字段检查通过，不代表此类行为描述已经正确。

### DS-12 · P3 · Web 组件仍残留明确禁止的 text-xs

证据：[BackTop xs 图标](../../app/components/reborn/ui/reborn-back-top/reborn-back-top.config.ts#L72)、[排版规则](../../app/assets/theme/typography.css#L29)。

BackTop 仍使用 Tailwind 原生 `text-xs`，不属于 Web 七级固定 px 字号。默认根字号下可能与 `text-sm` 同为 12px，但根字号变化及行高行为不同。

图标应优先按 size 控制几何尺寸；如果确实以字体尺寸驱动，应使用规范字号。检查时要排除注释中描述迁移历史的 `text-xs`，避免把注释计为实际违规。

### DS-13 · P2 · 当前 CI 没有承接现有的样式与组件回归

证据：[根脚本](../../package.json#L5)、[构建流水线](../../.github/workflows/build.yml#L34)、[知识库流水线](../../.github/workflows/kb-check.yml#L75)。

当前三个 GitHub workflow 运行构建、知识库与发布任务，没有调用组件测试、设计令牌检查或 lint。仓库已经有 `tests/theme-slots` 等测试，但现有工作流没有执行它们。

这会让“构建成功、知识库检查通过”与“设计规范被遵守”脱节。应先接入可维护的组件回归集合，再加入未定义令牌、UI 键位、颜色映射及覆盖顺序检查；不需要靠堆积纯字符串快照代替行为验证。

## 审查时待定的设计约定

以下保留审查基准中的差异，现行约定已写入 `docs/authoring/design-system.md`，不再作为未完成事项。

| 项目 | 当前事实 | 需要确定的约定 |
| --- | --- | --- |
| 两端语义色 | Web primary 为品牌蓝、secondary 为薄荷绿；UniApp primary 为红、secondary 为灰。见 Web `base.css:115` 与 UniApp `theme.css:81`。Button 两端差异表未解释此色相差异。 | 两端是否共享品牌语义；若故意不同，必须进入差异表与验收矩阵。 |
| 交互态颜色 | 色板把第 5/6/7 阶标为 hover/default/active；Button hover 使用 `/75` 透明度，部分控件直接消费固定阶。 | 每类控件的 default/hover/active/focus/disabled 使用哪些角色；透明度方案何时允许。 |
| 组件变量命名 | 同时存在 `--checkbox-color`、`--step-color`、`--rb-avatar-size`、`--reborn-progress-duration`。 | 区分公开变量与内部变量；组件变量统一前缀与部件名，不能把内部变量偶然暴露为公共 API。 |
| 尺寸与行高例外 | Web 常规尺寸随 Tailwind spacing 缩放，字号/圆角锁 px；部分微型标记有行高或字面量例外。 | 保留现有单位策略，明确哪些几何关系例外、理由和验证方式，不能机械把所有 px 或 leading 类当违规。 |
| variant 与形状 | Button 已将 round/circle 与视觉风格分开，部分组件仍用 variant 表示形状；Alert filled 使用浅底是用户明确要求。 | 以组件类别描述 variant 的角色；逐步分离形状轴，保留兼容，不强求所有 filled 外观完全相同。 |

## 建议收口的规范

1. **颜色分三层**：基础色板（色相与阶数）→ 语义角色（品牌、成功等及其前景、背景、描边、交互态）→ 组件槽位。不同层可以共存，但组件不能各自随意解释同一角色。
2. **明确 color 的输入语义**：通用控件使用共享的语义色类型；真正接收 CSS 色值的能力保留明确的独立字段与解析规则。不要把两者混成“任意字符串也算支持”。
3. **补齐配色角色**：例如 primary 的默认色、hover、active、soft、border、foreground；具体命名需要统一选定。对于 1 阶背景、2 阶描边、6 阶图标等已确认设计，应进入共享映射及对应例外表。
4. **颜色必须成对验收**：前景与背景一起定义，覆盖浅色、暗色、主题预设与交互态。不要把 `text-white` 当作所有实底色的默认答案。
5. **变量按运行环境闭合**：Web 只依赖 Web 可分发的定义；UniApp 只依赖自身定义。不能以另一个平台存在同名变量作为通过依据。
6. **保留 Tailwind 官方主题命名空间**：`--color-*`、`--text-*`、`--radius-*`、`--spacing-*` 继续服务工具类生成；组件局部变量另按统一组件前缀命名，并记录公开范围、单位、默认值及 fallback。
7. **默认样式集中在 config**：模板只绑定槽位；动态几何、自定义 CSS 色值等运行时输入可以使用变量或内联样式，但不能用默认内联样式压过公开 ui。
8. **统一覆盖合同**：默认 config → variant/state → 用户覆盖；必要的强制几何规则单独说明。删除历史提权和末尾硬塞默认类的做法。
9. **UI 和尺寸合同类型化**：UI 键位来自真实 slots，size 来自真实实现；显式尺寸与 Form 默认尺寸的优先级应统一并纳入测试。
10. **建立分层检查**：静态检查未定义令牌与非法 UI 键；单元检查合并规则；浏览器检查实际字号、颜色与关键几何；CI 执行稳定的回归集合。

## 原始整改顺序（已执行）

第一批先修 DS-01/02/03/05/06/07，直接恢复可读性、字号、配色和配置作用；同时确定 DS-04 的角色映射，避免边修边产生新的取阶规则。

第二批统一 UI 类型、覆盖优先级、Chip 参数合同与文档，并接入 CI。

第三批按组件类别迁移配色与变量命名，再处理跨端品牌约定。Web 已迁移的圆角规范、UniApp 保留的 rpx 令牌，以及用户明确指定的 Alert/Toast 等局部设计，应作为迁移约束保留。
