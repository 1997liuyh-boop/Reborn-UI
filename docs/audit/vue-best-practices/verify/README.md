# 整改复核：汇总

依据 `vuejs-ai/skills` 的 `vue-best-practices` 技能，对分支 `audit/vue-best-practices` 上整改留下的未提交改动（基线 `d0474cc`，约 800 个文件）做的独立复核。口径见 [../VERIFY-METHOD.md](../VERIFY-METHOD.md)，分片范围见 [_scopes.md](_scopes.md)。本轮只读，**没有修改任何源码**。

## 结论

- **原 523 条：已修复 492，部分修复 12，修复有误 19，未修复 0。** 没有一条被漏掉，但 31 条的修法不完整或带出了副作用。
- **整改引入的新问题：高 6、中 24、低 79。** 其中 1 条高级问题让开发环境下几乎所有文档页的客户端直接崩溃（C-1）。
- 机械检查基本干净：eslint 无新增，类型错误比基线少且只新增 1 处，`.mjs` / `.cjs` 测试全过，微信小程序构建通过，知识库校验通过。详见 [_coordinator.md](_coordinator.md)。
- 现有测试大多是绿的，但覆盖不到这次发现的高级问题：布局塌陷、小程序插槽编译、H5 触摸、tabBar 页面切换、开发环境模块加载、文档站章节抽取。

| 分片 | 原条目（修复 / 部分 / 有误） | 新问题与有误条目（高 / 中 / 低） | 报告 |
| --- | --- | --- | --- |
| 协调者 | — | 1 / 0 / 3 | [_coordinator.md](_coordinator.md) |
| V1 Web 特效组件、Affix、Alert | 43 / 0 / 3 | 0 / 3 / 5 | [V1.md](V1.md) |
| V2 Web Anchor ~ Checkbox、Loading ~ Qrcode | 43 / 0 / 7 | 0 / 4 / 10 | [V2.md](V2.md) |
| V3 Web Chip ~ Descriptions、Table ~ Transition | 58 / 3 / 1 | 0 / 4 / 12 | [V3.md](V3.md) |
| V4 Web Dialog ~ Layout、Tree ~ 特效 | 69 / 1 / 3 | 0 / 2 / 2 | [V4.md](V4.md) |
| V5 Web Radio ~ Switch | 28 / 1 / 0 | 0 / 2 / 8 | [V5.md](V5.md) |
| V6 UniApp Affix ~ Signature | 73 / 2 / 3 | 3 / 4 / 14 | [V6.md](V6.md) |
| V7 UniApp SlideVerify ~ Watermark、组合式函数 | 48 / 1 / 1 | 1 / 1 / 5 | [V7.md](V7.md) |
| V8 文档站外壳 | 24 / 4 / 0 | 0 / 0 / 7 | [V8.md](V8.md) |
| V9 Web 演示 Badge ~ Descriptions | 15 / 0 / 1 | 0 / 2 / 3 | [V9.md](V9.md) |
| V10 Web 演示其余部分、演练场配置 | 67 / 0 / 0 | 1 / 1 / 6 | [V10.md](V10.md) |
| V11 UniApp 演示页 | 24 / 0 / 0 | 0 / 1 / 4 | [V11.md](V11.md) |

## 高级问题（6 条，建议先修）

| # | 位置 | 问题 | 出处 |
| --- | --- | --- | --- |
| 1 | `app/utils/themeColor.ts:16` | 导出语句同一行里的内联脚本被 Nuxt 自动导入误解析出导出 `value`，11 个基础模块被注入 `import { value }`。开发环境下 193 个文档页有 190 页报 SyntaxError，客户端无法启动；生产构建只报 180 条警告，所以生产验收没有发现 | C-1 |
| 2 | UniApp `RebornPopupPanel` | 微信小程序上只传 `title`、没写 `#header` 时标题不显示（小程序编译器无视 `v-if`，始终认为 header 插槽已传入），Select、Cascader、DatePicker 的弹层都受影响 | V6 |
| 3 | UniApp `RebornCollapse` | 展开动画结束后外壳高度改为 `auto`，内容绝对定位撑不起高度，面板塌成 0 高 | V6 |
| 4 | UniApp `RebornDraggable` | H5 默认长按模式下 `touchstart` 仍被 `preventDefault`，手指放在列表上页面滚不动 | V6 |
| 5 | UniApp `RebornToast` | 改成「只让最后挂载的页面实例渲染」，tabBar 页面切换不卸载，切回先打开的页面后，消息都渲染到了隐藏页里 | V7 |
| 6 | `RebornTimelineDemo.vue:134-139` | 组件已改为默认按纯文本渲染 `content`，「数据驱动」示例仍按 HTML 写，页面直接显示 `<strong>` 字面标签 | V10 |

## 中级问题（24 条）

**组件行为**

- Web `RebornTabs`：渲染时按位置补 key，`v-if` / `v-for` 面板增删后，后面没写 key 的面板被错位复用，表单状态串到别的面板（V3，实测复现）
- Web `RebornTable`：同时绑了 `v-model:selected-keys` 和任意具名插槽时，勾选一行仍重建全部行（V3）
- Web `RebornCascader`：`fieldNames` / `loadMore` 换引用就清空懒加载缓存，内联箭头函数写法下父级一重渲染下级就消失（V2，实测复现）
- Web `RebornPagination`：改每页条数导致越界时，`current-change` 与 `update:modelValue` 各派发两次（V2，实测复现）
- Web `RebornBreadcrumb`：按组件身份识别条目，`/playground` 运行时编译下 `max-count` 折叠与 `order` 排序失效（V2）
- Web `RebornMenu`：插槽模式开启 ellipsis 后，每次更新都先展开全部再重新切分，「更多」子菜单反复卸载重挂（V2，需浏览器确认是否闪烁）
- Web `RebornSplitter`：增删面板时相邻面板尺寸被调整，却不派发 `update:size`，`v-model:size` 与实际尺寸不一致（V5）
- Web `RebornDialog`：SSR 下初始打开的对话框进入模块级弹层栈后永不出栈，服务端内存增长、`z-index` 越来越大（V4）
- Web `TextReveal`：任何一次组件更新都重播入场动画（V4）
- Web `MultiStepLoader`：`immediate` watcher 让 SSR 时服务端执行步骤 action 并派发 `complete`，水合后客户端再执行一遍（V1，实测复现）
- Web `RebornAffix`：窗口尺寸变化后传 `right` / `top` 的按钮不再贴边，与 UniApp 端行为相反（V1）
- Web `IInput` / `Compare` / `BalanceSlider` / `RebornAlert`：受控分支绕开 `defineModel`，读 `getCurrentInstance().vnode.props` 手动派发，同样的代码复制了 4 份（V1）
- Web `RebornDatePickerPanel`：拆分只完成一半，两个组合式函数不持有状态，面板仍有十几处直接改写它们交出的可写 ref，三套网格模板仍是三份（V3）
- UniApp `RebornRadioGroup`：绑定值置回 `undefined` 时仍显示旧值，Web 端已修、UniApp 端没同步，文档却已按修复后的行为写成两端通用（V5）
- UniApp `RebornAffix`：任何窗口尺寸变化都把用户拖过的悬浮块复位，H5 地址栏收起、软键盘弹出都会触发（V6）
- UniApp `RebornCheckbox`：`v-model` 绑定 `null` 时渲染报错（V6）
- UniApp `RebornForm`：字段名带连字符时校验被跳过，`validate()` 仍返回通过（V6）
- UniApp `RebornPopupPanel`：拖拽手势的组件事件与原生触摸事件同名，小程序上可能把内容滑动当成下拉关闭（V6，需开发者工具确认）
- UniApp `useRawProp.ts:53-54`、`reborn-toast.config.ts:135`：首次使用 `Object.hasOwn`、`Array.prototype.at`，iOS 15.4 以下的小程序会在初始化时报错，9 个组件依赖它（V7）

**文档与演示**

- DatePicker / DatePickerPanel 演示拆文件后，文档站与知识库的章节抽取失效：5 节内容重复出现、示例卡片的代码 / 复制 / 询问 AI / Playground 按钮消失、目录缺「交互演练场」、知识库示例缺共享文件（V9）
- Cascader 演示与文档仍写「done 回传的子节点会写回选项」，与组件改为内部缓存的行为不符（V9）
- Collapse 文档 UniApp 部分仍写「不回写 v-model」，与 UniApp 源码相反（V3）
- Loading 指令演示两个流程成功结束时 `close()` 调了两次，遮罩不再淡出（V10）
- UniApp SearchBox 演示同时绑 `v-model:history` 与 `history-key`，后者被忽略，「跨页面恢复」不成立（V11）

## 低级问题（79 条）

逐条见各分片报告。比较集中的几类：

- 文档、知识库与源码的说法不一致：默认值、事件载荷、两端差异表、过时注释，`CONTRIBUTING.md` 与技能参考里还引用已删除的 `ComponentLoader`、`useCopyToClipboard.ts`。
- 批量整改留下的格式残渣：`<code>` 旁的中文标点被拆到下一行（16 个文件 66 处，页面多出空格）；演示里 41 个 `demoUi1` 式编号常量；22 个文件把 `import` 插到了文件头注释前面；大段空行、空 if 块、孤立注释。
- 小的行为副作用：主题色插件给新访客的每个响应都设置 `theme-color` cookie，影响共享缓存（V8）；RebornCoupon 遮罩样式用驼峰键，SSR 输出无效 CSS（V3）；Tabs / Timeline 根节点变成 Fragment，外层 `<Transition>` 与 `$el` 失效（V3）；Dropdown 选项 key 可能重复（V4）；Waterfall 的 `remove` / `update` 改成严格比较，字符串 id 删不掉数字 id，也没记进更新日志（V7）。
- 类型：RebornSku 新加的 `defineSlots` 让动态插槽调用报 TS2345（C-3）。
- 整改方自认未修的 2 处文档示例：iPhone 样机示例裁掉机身、MultiStepLoader 示例返回类型不符（C-2）。
- `tests/web-demos/` 下混入了依赖 `.superpowers/`（不入库）的整改过程脚本，换台机器就跑不起来（V10）。

## 需要真机或浏览器确认

- 微信开发者工具：RebornPopupPanel 拖拽事件同名（V6）、iOS 15.4 以下真机的 `Object.hasOwn`（V7）、UniApp 二维码与 Watermark 等原报告的待实测项。
- 浏览器：RebornMenu「更多」浮层是否闪烁（V2）、LayoutAside 窄视口水合（V4）、Sticky 临界处是否来回跳（V7）。
- `tests/reborn-transition/motion.browser.test.ts` 两条动画中间帧用例在整改前后都失败，属既有问题；其余失败用例在机器空闲时重跑已通过。

## 建议

1. 先修 6 条高级问题。C-1 改一两行就能让开发环境恢复，建议马上处理。
2. 再修 24 条中级问题，优先处理组件行为类，因为它们会被使用方直接碰到。
3. 修复后补的测试要覆盖这次暴露的盲区：开发环境页面冒烟（检查 pageerror）、小程序模板编译后的插槽行为、布局高度、tabBar 多页面、文档站章节抽取。
4. 低级问题可以在合并前统一清理一轮，重点是格式残渣与文档一致性。
