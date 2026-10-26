# 文档站历史组件

这些组件已无站点、文档、知识库或 `Reborn-UI-demo` 调用。经图谱影响分析和全文核对后，保留原内容为 `.vue.txt`，避免参与 Nuxt 全局组件注册或 TypeScript 扫描。

当前首页继续使用 `RetargetingHero`，`retargetingHero.config.ts`、`videoHero.config.ts` 仍在原位置。

只服务于上述历史组件的脚本也归档为 `.ts.txt`，路径与原位置一致，便于和引用它们的 `.vue.txt` 对照：

- `app/components/common/landing/flameHero.config.ts.txt`、`flameShader.ts.txt`：原 `FlameHero.vue` / `FlameCanvas.vue` 的配置与着色器；
- `app/utils/lithosSpotlight.ts.txt`：原 `LithosHero.vue` 的光斑坐标换算。

它们原先只剩 `tests/landing/flameHero.test.ts`、`tests/lithos/spotlight.test.ts` 在引用，测试与源码互相维持，已一并删除。
