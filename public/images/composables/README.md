# 组合式函数页的像素背景素材

`throne-pixel.png`：128×85，透明背景，每个像素就是背景里的一个像素点。由文档站「组合式函数」一节（`/composables` 及其子页）的 `DocsPixelBackground` 读取，进入页面时像素点从顶部落下逐行拼成整图，整层透明度 0.1。

素材由 `scripts/composables-pixel/build.mjs` 从 `scripts/composables-pixel/source.png`（512×341 原图）生成：修补右下角的平台水印、与边缘连通的白底转透明、4×4 降采样、每通道按 32 级量化。改了原图或参数后重新执行：

```bash
node scripts/composables-pixel/build.mjs --preview
```
