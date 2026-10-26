# Vue 最佳实践整改整合验证

19 分片的 523 条均有逐字处置记录，包括低级与待确认项。覆盖数只证明处置记录齐全；整分支初审见 `.superpowers/sdd/FIX-METHOD/review-final-whole-branch.md`，唯一集中修复波后的正式复核结论与残余项见同目录 `rereview-final-whole-wave.md`，不能把初审改写为已通过。

## 工作区与证据

- 分支 `audit/vue-best-practices`，接手与当前 HEAD 均为 `d0474cc`。保留 Claude 遗留和本次全部未提交修改，没有 add、commit、reset、restore、stash 或 checkout。
- 使用 `vuejs-ai/skills` 的 `vue-best-practices` 19.0.1，遵循项目 Vue、中文注释、Tailwind 与 UniApp Vue 3.4.21 约束；每组均经过独立审查及必要复核。
- 没有安装依赖、操作用户 3000 服务或手改 registry/知识库/CLI 模板生成物。生产验收只使用自己启动的 3417；临时会话密钥只存在于该进程。
- 下文证据文件名均相对于 `.superpowers/sdd/FIX-METHOD/`。原始日志、各轮冻结、精确 delta 全部保留，入口为 `final-evidence-index.md`。

## 验证快照

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| 原始标题覆盖 | 19 分片，523/523，missing=[]；只证明记录覆盖 | `check-matrices.cjs`、19 份 fixes 文件 |
| TypeScript 测试 | 四页水合补修前全量 91 文件，903/903；0 fail/cancelled/skipped/todo | `integration-final-ts.tap` |
| MJS 测试 | 四页水合补修前全量 24 文件，330/330；0 fail/cancelled/skipped/todo | `integration-final-mjs.tap` |
| CJS 测试 | 集中修复波前全量 3 文件，27/27；0 fail/cancelled/skipped/todo | `integration-final-cjs.tap` |
| 水合受影响测试 | 四个真实页面、真实 helper、已安装 Nuxt asyncContext、Vue SSR/客户端水合：修前红4，修后与主控刷新均绿4 | `production-hydration-red.tap`、`production-hydration-green.tap`、`production-hydration-related.tap` |
| Button 生产交互 | 真实SFC生产编译且保留注释，真实Vue生产runtime：红2→绿2；单次点击与动态原生attrs/监听器；相关Button浏览器1/1、Loader4/4 | `production-interaction-red.tap`、`production-interaction-green.tap`、`production-interaction-button-related.tap`、`production-interaction-loader-related.tap` |
| App 统一类型 | 集中修复波后刷新：223→128，added=[]；raw vue-tsc退出1，比较器退出0，保留既有诊断 | `integration-types-final.log`、`integration-type-final-delta.json` |
| Uni 严格类型 | 集中修复波后再次与d0474cc只读基线比较50→44，added=[]；raw退出2，比较器退出0 | `integration-uni-types-before.log`、`integration-uni-types-after.log`、`integration-uni-type-delta.json`、`uni-type-final-wave-run.log` |
| AST 一致性 | 最新972 Vue+471人工TS各候选0；新增一元数字/括号语法核验。原普通script/setup与WXS/renderjs897块下划线0的独立快照保留；扫描语法有边界 | `consistency-preflight-all.json`、`consistency-preflight-refresh.log`、`consistency-final-all-scripts.json`、`final-fix-wave/scanner-bounded.log` |
| 增量 ESLint | 集中波后732文件，5794→4801条，additions=[]；本次hash重查17文件，保留既有错误与警告 | `integration-lint.json`、`integration-lint-refresh-final.log` |
| 集中波受影响回归 | 最终U1组合35/35；加强MP共享尺寸/布尔订阅3/3；此前同波MP相关30/30、H5布尔10/10另计；文档结构/API35/35 | `final-fix-wave/`下的`u1-combined-final.log`、`i1-shared-final.log`、`mp-related.log`、`h5-model-related.log`、`docs-final-check.log` |
| Nuxt 隔离构建 | 集中修复波SOURCE-STOP后重建exit0、782路由、91.6MB；随后生产验收使用此新产物 | `nuxt-build-final.log` |
| Uni H5 / MP-WEIXIN | 集中修复波后两端隔离构建均exit0；保留caniuse过期告警，未升级依赖 | `uni-h5-final.log`、`uni-mp-weixin-final.log`、对应`*-final-run.log` |
| CLI templates / registry / KB | 集中修复波后正式顺序刷新均exit0；172组件，missingDocs=0、drifts=0，98.8%抽取干净率，2条无script告警保留；索引10组件tags/title及时间戳由正式生成更新 | `generate-final-refresh.log`、`templates-sync-final.log`、`registry-build-final.log`、`kb-build-final.log`、`kb-check-final.log`、`final-controller-deltas/` |
| 生产浏览器 | 新产物完整28页、额外2文档及本波35文档均exit0；200/mounted、主题/明暗契约、0 Vue/水合警告、0 pageerror；交互通过；35篇核验payload四节及Suggestion三节 | `production-final.json/.log`、`production-doc-pages-final.json/.log`、`production-final-wave-docs.json/.log`、`production-final-evidence-check.json` |
| 图索引 | 集中修复波后强制刷新exit0：25142nodes、45160edges、1163clusters、300flows；沙箱失败另存，提升后成功 | `graph-analyze-final.log`、`graph-analyze-final-wave-sandbox-failure.log` |
| 完整图变更 | 5358/5358符号、107/107流程、764tracked hunk文件，risk=critical；递归flags=[]、无error/partial/truncated，长度与summary一致 | `graph-changes-final-full.json/.log`、`graph-completeness-final.json` |
| 差异格式 | 指定15处空白/EOF精确清理，主控新鲜diff --check exit0；原失败日志保留 | `integration-diff-check-final.log`、`integration-diff-check.log`、`final-fix-wave/whitespace-proof.json` |

前三组测试共1260项，新增水合4项、Button生产2项及本次集中波受影响回归分别保留修后证据；没有将不同时间执行相加冒充一次全量快照。原始TAP保留Vue Suspense开发模式的一行框架info；AST原始输出也保留一次读取全局Git忽略文件的权限提示。无水合警告不等于日志完全无噪声。

## 生产验收与实际发现

最终脚本覆盖橙/绿×明/暗×7路由：首页、带query/hash总览、Button文档、Playground、Button/Loader/Overlay Preview。检查200、mounted、主题/明暗、零Vue/水合警告、零pageerror、唯一OverlayHost、无fallback、专用Teleport，以及Loader视口、Overlay内容点击保持/背景关闭/离场滚动锁、DemoSection真实MDC代码展开关闭重开、ThemeSlotsPanel当前demo高亮与清理。

首轮真实失败：Button文档SSR缺分类标题，客户端补入；文档网格缺失又使按钮被导航遮挡。失败JSON、日志、诊断和截图保留，没有force click或删警告断言。

- 产品水合根因是Nuxt withAsyncContext应用上下文遮蔽组件导航注入。四个文档入口先同步调用useDocsPageData再await，保持组合式函数与数据契约；真实四页回归红4→绿4，六路径冻结与独立task review见`fix-production-hydration.md`、`review-production-hydration.md`。
- 主控验收宿主原将buildDir放在嵌套gitignored目录，Tailwind漏扫157个Nuxt UI主题文件及三项网格候选。已承认并更正为根层`.tmp-vue-audit-final-nuxt`，数据库和Nitro输出仍隔离，没有改产品CSS/层级。Scanner1905/1748/1905文件对照及当前主题哈希等价保存，但不倒称诊断时输入已冻结。旧构建成功不替代最终布局验收。
- 继续真实验收又发现Button的根注释在生产保留为Fragment，移除显式attrs后自动透传失效，Loader启动点击无效。仅把注释移到按钮内部，保留真正单根与一次自动透传；真实生产红2→绿2。同批attrs清理有界排查23候选（Web18/Uni5），仅Button符合此根因。编辑前impact为CRITICAL，80direct/119total/0flow，已向用户告知，未按零流程降级。`fix-production-interaction.md`保存两路径精确冻结与证据。
- 主控脚本的后续宿主差异也保留：区块定位不再依赖状态变化后的“展开”标签；Button主题键使用真实base；代码provider由文档页提供，独立Preview无代码动作；建议内容须切换Suggestion。修正检查入口后仍保留原28页覆盖和全部行为断言目的，没有force click或跳过交互。
- 首次完整28页输出还暴露主控明暗预期错误：仅两种主题色的暗色偏好首页为light，其余26页均符合偏好。基线与当前首页都显式声明`colorMode: "light"`，已核对Color Mode文档的强制模式契约。只把首页预期改为light，其余页面仍严格跟随偏好；失败原件保留为`production-final-before-home-mode-fix.json/.log`，完整28页重新执行。

集中修复波后的新产物完整28页脚本exit0：28/28页面200且mounted、主题色匹配、首页固定light而其他页跟随偏好、Vue/水合警告0、pageerror0，逐页唯一OverlayHost、fallback0、专用Teleport1。总览payload含172条、107770bytes、不含body/toc。Loader实际位于根应用外且覆盖1280×800视口；Overlay内容点击保持、背景关闭与离场滚动锁恢复；DemoSection真实MDC展开/关闭/重开；ThemeSlotsPanel当前demo高亮2处且离开清理、关闭重开均通过。

额外Breadcrumb Suggestion及更新日志两页在相同新产物上均200/mounted/0warn/0error，实际MDC代码与两短句通过。新增35篇检查首次错误要求简介标题可见；HEAD与当前`trimComponentDocBody`都主动裁去简介，DocsPage先将三节建议搬入Suggestion。保留首次失败、旧脚本和真实DOM/PNG诊断后，改为逐页核验新产物payload四必备节完整、真实Suggestion三节可见；完整35/35重跑exit0，各200/mounted/0warn/0error，未为验收改产品或放弃四节完整性。

验收后已按进程名与启动时刻确认并停止自己3417 PID35928（node，2026-10-24 01:40:33启动），netstat无3417监听；Get-NetTCPConnection被沙箱拒绝后使用netstat替代。未操作用户3000。原修复波前证据另存`before-final-wave-production-*`，不能代替本次新构建验收。

## 整分支初审与集中修复

初审双结论Needs fixes，C0/I2/M3组：实际MP动态size所有权、H5 Draggable泛型插槽被memo冻结、负数ref漏扫、15处空白、35篇文档缺强制章节。唯一集中修复波在55路径SOURCE-STOP，5个新文件；主控核验live SHA55/55一致，delta可从before逐字节重建after。详见`fix-final-whole-wave.md`与`final-fix-wave/`，原whole包另存`review-package-whole-branch-frozen.patch`，未改写初审。

size与布尔模型复用唯一原始属性/祖先订阅helper，真实MP3.4.21父模板/cache/observer覆盖同默认值无dirty、延迟发布、中间层及同胞卸载；H5独立内容边界恢复泛型浅层/深层/外部响应式插槽。50项10帧同一插入位置内业务slot调用增量全0，仅拖动项style更新；原地字段只更新索引25，跨插入位置公开scope变化时全部更新符合契约。这是自定义宿主调用/样式计数，不是设备FPS。

35篇文档经源码AST严格API、骨架、真实选型、旧代码块与MDC结构核验；旧C1/U1证据说明在对应fixes末尾更正，保留历史。独立复核还对本波新增示例进行检查，已报告iPhone缩放参数会裁切、Loader示例返回Promise<Response>不符合Promise<void>两处新问题；最终分级、裁定及完整结论以`rereview-final-whole-wave.md`与`final-rulings.md`为准，不能用上述自动校验或本报告提前宣称全通过。

## 独立审查闭环

| 组 | 已完成的task gate |
| --- | --- |
| S1/W4/W5/W6 | 独立审查完成，Menu/Switch修复与scoped复核通过；四页SSR补修另有独立review |
| W1/W2/W3 | 原14项与相同旧值重绑N1均scoped PASS |
| W7/W8/C1 | 原2 Important、2 Minor与Transfer模板补漏均scoped PASS |
| E1…E5 | 原3 Important、1 Minor闭合；TimePicker复制import由consistency明确CLOSED |
| U1/U2/U3/P1 | round3确认原生时序、登记类型、四模型与Uni Tabbar等ADDRESSED；R3-M1 Breadcrumb文档由人工文档review关闭 |
| consistency | round2模型camel/kebab、Overlay默认说明、类型补漏及round3真挂载失败清理均关闭，双通过 |
| Uni类型 | 独立双通过，C/I/M=0/0/0；基线、冻结、SHA、patch与added=[]均独立复算 |
| 人工文档/日志 | 19片181来源→188新日志，同日原16条保留；Breadcrumb骨架/11示例与override通过。CL-M1/CL-M2 scoped复核后C/I/M=0/0/0，CRLF、旧日期字节、来源/行号无漂移 |
| 生产水合 | 六路径独立双通过，C0/I0；M1为已披露的Suspense框架info，不影响断言 |
| Button生产交互 | 两路径冻结与SHA、真实生产红绿、23候选有界筛查经独立复核，双通过，C/I/M=0/0/0 |

整分支审查覆盖d0474cc→当前全部未提交人工差异，含未跟踪与删除文件，不能用task gate替代。完整包为`review-package-final.patch`、`review-scope-final.json`；最终源码/文档哈希必须`changed=[]`，不能只看脚本exit0。

## 裁定与迁移成本

1. Web SearchBox保留真实Web契约，按Uni实际能力删其无效属性。成本为两端API仍有明确记载的差异。
2. Form删除四个未实现属性`hideRequiredAsterisk`、`requireAsteriskPosition`、`statusIcon`、`validateOnRuleChange`，两端/文档/override同步。成本为破坏性API删除，FormItem自身有效属性保留。
3. SlideVerify显式受控false优先于defaultVerified，缺省初始化不发交互事件。成本为依赖错误默认覆盖的行为改变。
4. QR演示删除无参toPng不支持的尺寸选择，该演示导出600×600、预览200px。成本为暂不支持自选导出尺寸，不泛化为组件所有调用。
5. 两端TabPane.paneKey替代Vue key业务读取，TabPane/BreadcrumbItem新增order。成本为旧业务key迁移pane-key；动态MP所有项需有效order。
6. UniApp TabbarTrigger增加order，保留索引模型。成本为动态MP所有项需order。Tabbar仅UniApp源码，覆盖H5/MP；已纠正原计划“双端”措辞，没有新造Web Tabbar。
7. 保留原始Suspense开发框架info，不屏蔽console或水合断言。成本为原始测试日志存在已知框架信息。
8. 首页验收遵循基线固定light，其他页面跟随偏好。成本为不认证首页暗色视觉。
9. 35篇文档验收遵循原有正文裁剪，payload核验四节、Suggestion核验三节。成本为不认证简介段落在页面显示；首次宿主失败与纠正证据保留。

后续最终轮残余裁定按时间追加在`.superpowers/sdd/FIX-METHOD/final-rulings.md`；本文件在独立复核前冻结，不在复核后悄悄改动受审摘要。

## 流程与设备边界

- U round2的Uni BreadcrumbItem、Uni tabs config两处字段声明，以及后续Breadcrumb人工override说明，遗漏了独立编辑前impact。事后UNKNOWN+引用补查保留，不倒称流程零缺口。
- UNKNOWN不作为低风险。最终图critical已提示；CLI只展示部分符号/流程，计数依据完整后端JSON。未跟踪人工源由审查包完整纳入，不声称图覆盖所有新增符号。
- App类型128、Uni类型44、lint4801是既有诊断，口径为无新增，没有声称全绿。Nuxt sourcemap、导入/分包、prop、图标等构建告警按原始日志保留，exit0不等于无告警。
- 标准Vue、精确Uni3.4.21的真实SFC+DOM宿主、实际MP编译/cache/observer/emit的模拟native宿主、平台编译及生产浏览器分别记载。Uni类型回归中的Logo/禁用证据使用根Vue3.5.29，不冒称全部在3.4.21或真机执行。
- 微信原生布局/触摸/滚动、App桥、其他小程序方言、GPU/WebGL/媒体编码与视觉性能仍依逐片“待实测”方法验收；编译、Node测试和模拟native发布不等同开发者工具或真机。

