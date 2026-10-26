# 第二轮整改：协调者收尾记录

各分片报告（V1–V11）里「转交协调者」的条目，以及收尾时统一执行的生成与验证，处理结果记在这里。

## 已处理

| 来源 | 条目 | 处理 |
| --- | --- | --- |
| V1 L03 | IInput / Compare / BalanceSlider / Alert 声明了 `defineModel` 却手读 `vnode.props` | 新建 `app/composables/useRawProp.ts`、`useControlledModel.ts`（含 `useBooleanModel`），按 V1 起草的代码落地；同写法的 Drawer、Fab、Header 一并替换。Fab / Header 监听父级改写改用 `useRawProp` 的 `present` 加 `defineModel` 引用（本地交互不写它）。新增 `tests/composables/use-controlled-model.test.ts`；`tests/w1-controlled`、`w1-lifecycle`、`reborn-drawer`、`uniapp-u1` 全部通过 |
| V5 | UniApp SearchBox 历史记录与 Web 对齐 | 不再需要：V6 已改用共享 `useRawProp`，小程序端 `vnode.props` 不随父级更新，必须这样读 |
| V7 | UniApp PickerView 调用演示用 `useDarkMode()`，首次调用会写存储并去掉使用方的 `dark` 类 | 改在 `useDarkMode` 源头：存储里没有记录时只按宿主主题取初值，不写存储、不碰 `<html>` 类名；读不到宿主主题（低版本基础库、测试桩）按浅色。补 `tests/composables/use-dark-mode.test.ts` 第二条 |
| V9 转交 1 | 知识库同目录多份演示标题都是「Web 演示」 | `scripts/kb/merge.ts`：同一端有多份演示时标题带文件名 |
| V9 转交 2 | 卡片源码抽取漏掉 `...defaultState` 引用的声明 | `app/utils/demoSectionSfc.ts` 的 `collectIdentifiers` 识别展开运算符；`tests/demo-section-sfc/sections.test.ts` 补用例 |
| V3 | Tabs 默认编号改为书写位置后，`tests/consistency` 旧断言仍按数字下标 | 断言改为 `'0-0'`、`'0-1'` |
| 全站冒烟 | TextRevealStars 一直没导入 `Motion`，星点从未渲染 | 补导入 |
| 全站冒烟 | RootPortal 文档删掉不存在的配置文件时，把 `ComponentViewer` 必填的 `config` 也删了 | 补回 `config="RebornRootPortalConfig"` |
| vue-tsc | 改动行上的类型错误（MorphingText 索引可能越界、useComponentCode 谓词类型） | 已修；Radio 的 tv 只读数组报错是既有问题（行号变动才被算进改动行），与 SelectTrigger 未改动行上的同类错误一起保留 |
| Dropdown 代理遗留 | Cascader 经 `triggerProps` 开箭头时默认 4px 间距会压到触发器 | 「带箭头默认 12px」下沉到 SelectTrigger（`TRIGGER_OFFSET` / `ARROW_TRIGGER_OFFSET`），Dropdown 配置改为再导出；`tests/reborn-select-trigger/direction.browser.test.ts` 补用例 |
| 更新日志 | 各分片「更新日志」小节 50 条 | 与本轮新改动一起并入 `content/3.changelogs/index.md` 的 2026-10-26 条目 |
| 生成物 | registry、模板、知识库 | `pnpm kb:bootstrap`（含 `registry:build` 与 `templates:sync`）、`pnpm kb:check` 通过 |

## 需要使用者决定

1. **UniApp 暗色由谁驱动**（V11 转交 1）：`packages/uniapp-project/tailwind.config.ts` 是 `darkMode: 'media'`，`dark:` 只跟随系统，页内开关与 `page-meta :root-class` 都不驱动样式。二选一：改为类名驱动（每个页面都要声明 `page-meta`），或保持跟随系统并删掉页内开关文案。
2. **严格受控口径是否推广到 UniApp**（V2 新问题 2）：Web 端 Cascader / Checkbox / Popover 已改为严格受控（只传值不接事件时显示保持父值）；UniApp 同名组件仍是「只传值时点击后接管为本地状态」。
3. **SplitText 中文不拆分**（V4 发现）：是否按字拆分中文。
4. **Anchor `type` 语义与 Element Plus 相反**：本组件 `default` 画轨道、`underline` 不画，Element Plus 正好相反；改成一致会让文档站目录失去轨道线。
5. **知识库示例的辅助文件**（V9 转交 1 后半）：演示里相对导入的 `_shared/*` 不会进 `examples`，发布快照解析不到。收录它们需要给知识库 schema 加字段。

## 待实测

- **dev 服务端渲染不刷新 demo-heading-meta**（V9 转交 3）：改演示后客户端拿到新元数据，dev 服务端仍按旧值渲染目录，日期选择器两页首屏有水合告警。生产构建不受影响；重启 dev server 后复查 `/components/input-and-forms/reborn-date-picker` 与 `reborn-date-picker-panel`。
