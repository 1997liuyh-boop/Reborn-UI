# SVG 图标水合回归

先执行 `pnpm exec nuxt prepare`，再执行：

```powershell
node --test tests/icon-hydration/hydration.test.mjs
pnpm exec eslint tests/icon-hydration
```

测试读取生成的 `.nuxt/app.config.mjs` 和图标 bundle，运行已安装的真实 `NuxtIconSvg`、共享加载器、Iconify 缓存、Nuxt 图标插件及本地 API handler。Nuxt composable 上下文、请求去重与缓存 handler 外壳由轻量适配器提供；Vue SSR 和 jsdom 水合均使用真实 Vue 运行时。图标来自本地 Lucide collection，构建产物写入 `node_modules/.cache/icon-hydration`。

- 旧行为对照：远程 provider 请求超过服务端预取期限，三个复制按钮 SSR 均为空 SVG、`viewBox="0 0 16 16"`，客户端已有图标缓存时捕获与 `24×24` 的水合冲突。
- 当前配置：通过本地 API 获取图标并写入 Nuxt payload，覆盖服务端与客户端的冷、热缓存四种组合，三个按钮均为非空 `24×24`，水合无告警且客户端不请求图标。

为保持快速、确定性，旧行为的预取期限缩短至 25ms，模拟响应在 75ms 后失败；当前配置沿用生成配置的期限。此测试不启动 Nuxt 或 Nitro，也不覆盖真实浏览器网络栈及页面的完整组件树。
