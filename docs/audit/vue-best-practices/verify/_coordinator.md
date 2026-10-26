# 协调者的全局检查（复核轮）

对象：分支 `audit/vue-best-practices`，基线 `d0474cc`，加上整改留下的全部未提交改动（约 800 个文件）。以下检查由协调者直接执行，原始输出放在系统临时目录 `ov/verify/`，不进仓库。

## 机械检查

| 检查 | 方法 | 结果 |
| --- | --- | --- |
| eslint 增量 | ESLint Node API：608 个改动文件，HEAD 内容 `lintText` 对比当前 `lintFiles`，按「文件 + 规则」计数 | 5782 → 4789；没有任何「文件 + 规则」计数增加；新增未跟踪文件 error 为 0 |
| Web 类型检查 | `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` | 128 个错误。落在改动行上的 9 个中，8 个与基线同源（行号移动或基线即有：MorphingText、RebornRadio、useComponentCode）；**新增 1 处**：`RebornSku.vue:206/222`，见下文 C-3 |
| `.ts` 测试 | `npx tsx --test` 全量 93 个文件 | 906 项，900 过，6 败；单独重跑后仍败 3 项：`tests/motion/content.browser.test.ts`「平铺菜单切换可中断」、`tests/reborn-transition/motion.browser.test.ts` 两项（动画中间帧断言）。这 3 项在整改前基线里同样失败，属动画计时类用例，需在机器空闲时再测一次 |
| `.mjs` / `.cjs` 测试 | `node --test` | 336/336、30/30 全过 |
| 知识库 | `pnpm kb:check` | 通过（172 个组件） |
| UniApp 微信小程序构建 | `npx uni build -p mp-weixin`（输出到已忽略的 `dist/`） | `Build complete`，exit 0 |
| `shallowRef` 就地修改 | 自写启发式：640 个改动文件里所有 `shallowRef` 变量，检索 `.value.push/splice/...`、`.value.x =`、模板 `v-model="x.y"` 等 | 无命中（全仓 1732 处 `shallowRef`） |
| `useTemplateRef` 键名 | 同上脚本，检查 key 在模板 `ref="key"` 中存在、未被赋值 | 无命中（全仓 337 处） |
| UniApp 端 Vue 3.5 API | 检索 `useTemplateRef`、`useId`、`onWatcherCleanup` 等 | 源码无使用（仅自动生成的 `auto-imports.d.ts` 声明） |
| 删除 / 改名的残留引用 | 逐个名字全仓检索 | 源码无残留；文档残留见 C-4 |
| 全站页面冒烟 | playwright-core 逐页打开 dev server（127.0.0.1:3000）193 个文档页，收集 pageerror / Vue 警告 / 水合警告 | **190/193 页报同一个 pageerror**，见 C-1 |

## 发现

### [高] C-1 主题色工具文件被 Nuxt 自动导入误解析出一个不存在的导出 `value`，开发环境客户端整站崩溃
- 类型：新问题（整改引入）
- 位置：`app/utils/themeColor.ts:16`
- 现状：`export const themeColorBootstrap = \`(()=>{let value='blue';...})()\`` 写在同一行。Nuxt 自动导入依赖 mlly 的 `findExports`，它把这一行解析成 `['themeColorBootstrap', 'value']` 两个导出（已用 mlly 直接复现）。于是 `.nuxt/imports.d.ts:68` 注册了自动导入 `value`，凡是 unimport 认为「未声明就使用了 `value`」的模块都被注入 `import { value } from '~/utils/themeColor'`，包括 `lib/utils.ts`、`lib/tv.ts`、`useOverlay.ts`、`useFloatingDismiss.ts`、`useLoading.ts`、`RebornPopover.vue`、`RebornTransition.vue`、两个插件等 11 个模块。
  - 开发环境（浏览器原生 ESM）：模块加载即抛 `SyntaxError: ... does not provide an export named 'value'`，193 个文档页里 190 页报错，客户端应用无法启动（只剩服务端渲染的静态 HTML，交互全部失效）。
  - 生产构建：Rollup 只报 180 条 `"value" is not exported by "app/utils/themeColor.ts"` 警告（见整改方的 `nuxt-build-final.log`），被注入的 `value` 恰好都被局部变量遮蔽，所以生产验收没有暴露。整改方的整合报告把这些告警当作「exit 0 不等于无告警」保留，没有追查。
- 建议改法：不要让导出声明的同一行出现 `, 标识符` 这样的片段。例如把字符串放进函数或多行拼接，或者先 `const bootstrap = ...` 再单独 `export { bootstrap as themeColorBootstrap }`；改完确认 `.nuxt/imports.d.ts` 不再有 `value`，dev 页面冒烟 0 pageerror，生产构建不再有 `is not exported` 警告。

### [低] C-2 两处文档示例的残留问题（整改方已自认，未修）
- `content/2.components/device-mocks/iphone-mockup.md:46–48`：示例传 `:width="300" :height="611"`，组件把它同时用作 SVG 尺寸和 viewBox，机身固定在 433×882 坐标，结果右侧和下部被裁掉。改为不传 width/height，用外层容器和 `w-full h-auto` 控制大小，并更正第 25 行说明。
- `content/2.components/miscellaneous/multi-step-loader.md:65`：`action: () => fetch('/api/data')` 返回 `Promise<Response>`，与 `action?: () => void | Promise<void>` 不符，复制后 TS2322。改为 `action: async () => { await fetch('/api/data') }`。

### [低] C-3 RebornSku 新加的 `defineSlots` 让动态插槽调用类型报错
- 位置：`app/components/reborn/ui/reborn-sku/RebornSku.vue:91-95`（声明）、`:206`、`:222`（调用）
- 现状：索引签名写成 `((props: SkuGroupSlotProps) => any) | ((props: SkuItemSlotProps) => any)`，动态名 `:name="option.slots"` 调用时 TS 取参数交集 `SkuGroupSlotProps & SkuItemSlotProps`，传 `{ option, modelValue }` 报 TS2345。基线没有这两条错误。
- 建议改法：给分组插槽单独起类型并让索引签名只接受 `SkuGroupSlotProps`（`item` 插槽已有专门声明），或把动态分组插槽的参数统一成一个类型。

### [低] C-4 文档里残留已删除的文件 / 组件
- `.agents/skills/reborn-web/references/core-structure.md:12` 仍举例 `useCopyToClipboard.ts`（已删，改为 `app/utils/copyToClipboard.ts`）。
- `CONTRIBUTING.md:151-352` 仍教用 `::ComponentLoader`（组件已删，现在用 `ComponentViewer`）。
- `content/2.components/miscellaneous/reborn-root-portal.md:9`、`content/2.components/navigation/reborn-popup.md:9` 的 `uniappFiles` 列了 UniApp 端不存在的 `reborn-root-portal.config.ts`（基线即有，非本次引入）。
- 组合式函数文档改名（`use-copy-to-clipboard` → `copy-to-clipboard`、`use-loading` → `show-loading`，`use-mouse-state` 删除）后旧链接 404。属已定的破坏性变更，如需兼容可加重定向。
