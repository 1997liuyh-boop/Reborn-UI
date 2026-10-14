# 组件总览头图的自行车

- 来源：Three.js 官方示例 `misc_exporter_usdz`，获取日期：2026-10-13。
- 示例：https://github.com/mrdoob/three.js/blob/master/examples/misc_exporter_usdz.html
- 原始模型：https://github.com/mrdoob/three.js/blob/master/examples/models/gltf/CarbonFrameBike.glb（Draco + KTX2，3.4MB）

## 授权

"Carbon Frame Bike" by Robert Schweier and prefrontal cortex is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License（CC BY-SA 4.0）。
模型页：https://sketchfab.com/3d-models/carbon-frame-bike-398999b3360b4e6997a9aae253d6acbd ；许可证：https://creativecommons.org/licenses/by-sa/4.0/

本目录的两个文件都是对原作的修改（重新压缩、简化几何、贴图缩小转码；首帧图是渲染结果），同样以 **CC BY-SA 4.0** 发布。
署名显示在组件总览头图右下角（`ComponentsList.vue` 的 `hero-model-credit`），删改该署名前先确认授权要求。
模型仅用于本站组件总览头图，不加入组件 registry。

## 文件

| 文件 | 说明 |
| --- | --- |
| `carbon-frame-bike.glb.gz` | 约 0.97MB。gzip 后的 GLB（解开约 1.66MB）：Meshopt 几何与动画、WebP 贴图（最大 512），去掉切线与无贴图材质的 UV，轻度简化。由 `scripts/models/optimize-bike.mjs` 生成 |
| `carbon-frame-bike-poster.webp` | 约 50KB。3D 场景合体状态、默认俯仰的透明首帧，12:5（与画布同比例）。由 `scripts/models/render-bike-poster.mjs` 从本地开发站截取 |

**为什么整体 gzip**：Meshopt 的编码设计上要再过一道通用压缩，但生产环境的 Nitro 不会预压 `.glb`（`model/gltf-binary` 不在它的可压缩名单里），直接放 `.glb` 要传 1.66MB。所以文件本身就是 gzip，浏览器端用 `DecompressionStream` 解开；开发服务器会给 `.gz` 加 `Content-Encoding` 让浏览器提前解开，`lib/three/bikeScene.ts` 按魔数判断是否还要解压，两种情况都能用。

## 实现说明

场景见 `app/lib/three/bikeScene.ts`，挂载见 `app/components/common/component-list/OverviewBike.vue`。

- 模型自带 12 秒的 `Holobike_Loop`：0~3.5s 解体、随后静止、6~9.6s 合体。只取 0~3.5s 当进度条来回拖，反向就是合体。
- 取景：合体时车身约占头图高度的八九成；解体时镜头随进度拉远，保证所有零件完整落在画布中部（横向 ±60%，避开两侧各 18% 的渐隐带；纵向 ±90%）。所需距离预先按解体段 25 个时刻 × 3 档俯仰算成表（取每个零件的若干真实顶点投影，不用包围盒，避免轮胎这类环形零件被高估），运行时按进度与俯仰插值，对焦点跟着零件整体中心走。画布比舞台（3:2）左右各宽出 30%，两侧各 18% 渐隐。
- 1440 及更宽的屏幕上，解体后的零件落在正文与右侧锚点之间；1280 左右空间不够，前轮会从正文下方穿过：文字层级高于画布，并带一圈头图底色的光晕保证可读。
- 指针到车身中心的椭圆距离（以合体、默认俯仰时包围盒的投影半宽、半高为 1，不随解体时的镜头拉远变化）小于 0.4 时完全解体、大于 1.8 时完全合体；指针离开头图后合体。
- 指针在头图里的上下位置决定机位俯仰（12° ± 16°），方位角固定为示例的 3/4 侧视。
- 透明背景，RoomEnvironment 环境光 + ACES 色调映射，与原示例一致；地面投影片是模型自带的。
- 只在进度或机位还在变化时渲染，静止时不占 GPU。

**加载顺序**：先显示首帧图；头图进入视口且浏览器空闲后，并行请求 three 分包与模型，首帧渲染完成后画布淡入。视口窄于 xl（舞台隐藏）、减少动态效果、省流量模式下只显示首帧，不加载 3D；3D 失败也停在首帧。

改了 `bikeScene.ts` 的合体机位常量（方位角、默认俯仰、视场角、BODY_FILL）或舞台、画布比例后，要重新执行 `node scripts/models/render-bike-poster.mjs`，否则首帧与 3D 对不齐。
