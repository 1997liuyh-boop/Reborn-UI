# Web 组件 Motion 接入计划

**目标：** 将已确认清单中的 Web 动画统一接入 Motion，保持现有组件 API、静态 Tailwind 样式与交互机制。

**方案：** 使用已有安装版本 `motion-v@1.10.3`，新增共享执行器管理中断、卸载、减少动态偏好与无浏览器环境；各组件保留状态、定位与数据逻辑。用户已确认完整清单一起实施。

**约束：** 仅 Web；注释中文；不修改 UniApp；不覆盖工作区已有改动；不提交或推送。图谱查不到的符号先通过文本确认消费者，再编辑。

- [x] 公共层：`app/lib/motion.ts`、直接依赖和 CLI 安装依赖；验证取消、快速替换、减少动态偏好与 SSR。
- [x] 控件：Tabs / Radio / Segmented 的共享液体滑块、Switch、Statistic；验证快速切换、几何、禁用、格式化与 SSR。
- [x] 浮层：Transition / Guide / Dialog / Drawer / Popover / Tooltip / ContextMenu；保持定位、焦点、滚动锁、关闭事件与取消行为。
- [x] 列表：Toast / Notification / Draggable / Tree / AvatarGroup；验证进出和补位，Tree 虚拟模式不启用行动画。
- [x] 内容：Collapse / Menu / Carousel / Calendar；验证展开收起、自动高度和视图切换，保留原生滚动机制。
- [x] 集成：构建 registry 和知识库，校验 CLI 安装依赖；运行定向单测、真实浏览器、SSR 和 ESLint，修复本轮问题。
- [x] 审查：检查新增动画是否真正由 Motion 驱动，确认所有取消与卸载路径，记录验证结果。

**风险：** RebornTransition 为共享组件，文本确认有 11 处引用，除本组浮层还包括 Alert、Badge、Overlay、SelectTrigger，必须回归。GitNexus 当前部分 Vue 符号返回 UNKNOWN，不据此判定低风险。

## 验证记录

- 控件组 38/38：包含 7 项真实 Chromium 测试；连续反向、系统减少动态偏好切换、卸载清理已覆盖。
- 列表组 36/36：包含 8 项真实 Chromium 测试；6 方位消息栈、拖拽原样式、虚拟树与头像已覆盖。
- 日历与轮播 89/89：包含日期事项演示、农历、原生拖动、循环接缝、SSR 和本轮视图动画。
- 公共层及内容组 7/7：覆盖隐藏节点的中断帧保留、复用节点起点、菜单反向、折叠模式切换、轮播固定高度接管、CLI 递归与平台隔离。
- 浮层组：Transition / Drawer / Dialog 浏览器 5/5，Guide 浏览器 9/9，Drawer / Tooltip 交互 31/31；最后 Dialog 清理变更的单项复验通过。
- 真实消费者浏览器 6/6：Popover / Tooltip / ContextMenu / Overlay / Badge / SelectTrigger，覆盖首次入场、中断续播、定位、命中区、滚动锁与退出事件。
- 独立审查发现的 Collapse 位移残留、Menu 透明度跳变均修复，独立浏览器复验 2/2。
- 公共 helper 与 CLI 的 TypeScript 检查通过；本轮文件 ESLint 通过。Tabs / Pane 的既有类型错误已用 HEAD 基线复现，未新增同类错误。
- 最终源码的 registry / 知识库已重新生成 173 个组件，知识库 API 偏差为 0，`kb:check` 通过；CLI TypeScript 检查通过。
- 最终源码的 Nuxt 生产构建通过，782 条路由预渲染完成。默认 4GB 堆内存不足，使用 8GB 完成构建，未修改项目内存配置。
- 最终构建的 Popover / Dialog / Calendar / Steps 生产页面均返回 200，未发现页面脚本错误或 hydration 不一致；临时预览服务已关闭。
- 已修复共享 Transition 在节点插入前无法读取 Tailwind 起止样式的问题；首次入场与同帧反向均通过真实中间帧断言。
- 最终样式恢复经独立 Chromium 复审：动态 class、最新 transform / scale，以及外部 transition / animation 长属性均保留。

## 实现要点

- DOM 动画使用 `motion-v` 的 `animateMini`，数值动画使用 `animate`。避免 DOM 渲染队列在停止后覆盖样式清理。
- 同节点新动画取消旧任务；完成与中断都会释放等待，业务收尾使用切换序号排除过期任务。
- `v-show` 已隐藏的节点无法提交原生帧时，先保存计算样式，再取消并恢复当前帧。
- 标量终点会显式补上当前 CSS 起点，避免复用节点时读取旧动画缓存。
- CLI 沿共享模板引用递归解析依赖，保持 Web / UniApp 分离；生成器运行前同步模板。
