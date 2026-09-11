# 首页动画重定向资源

- 来源：Three.js 官方示例，获取日期：2026-09-11。
- 版本参考：`148ef33ecb6d2502ff796d4554abd1549c95d519`。运行时仍使用项目现有 Three.js 0.182，不升级全站依赖。
- 示例：https://github.com/mrdoob/three.js/blob/148ef33ecb6d2502ff796d4554abd1549c95d519/examples/webgpu_animation_retargeting.html
- Michelle.glb：https://github.com/mrdoob/three.js/blob/148ef33ecb6d2502ff796d4554abd1549c95d519/examples/models/gltf/Michelle.glb
- Soldier.glb：https://github.com/mrdoob/three.js/blob/148ef33ecb6d2502ff796d4554abd1549c95d519/examples/models/gltf/Soldier.glb

两个模型在官方 skinning 示例中均标注来自 Mixamo。模型版权归原作者及相应权利人所有；随附的 THREE-LICENSE.txt 为 Three.js 代码的 MIT 许可，不将它推定为模型的独立许可。模型仅用于本项目首页演示，不加入组件 registry。

## 实现说明

首页使用 WebGPURenderer（不可用时自动尝试 WebGL2），GLTFLoader 和 SkeletonUtils.retargetClip 实时渲染。保留示例的骨骼映射、姿态补偿、双角色动画与反射地板，改为白色摄影棚背景，不包含 Inspector 或外部视频。

先在导入坐标系中生成重定向轨道，再设置舞台位置、朝向和目标角色的 0.01 缩放。不得把舞台变换提前，否则父级缩放会重复计入骨骼，导致模型过大或移出画面。


## 显示故障排查

- 页面会区分图形初始化、角色资源加载、动画准备和渲染中断，失败后可重新加载或手动切换 WebGL2 兼容模式。
- 图形初始化失败会自动使用新的 canvas 尝试 WebGL2，不能在同一 canvas 上混用两种上下文。
- 两个 GLB 必须与站点一同部署，资源请求会遵循 Nuxt 的 app.baseURL；不能只部署 Vue 文件而遗漏 public/models。
- 浏览器需要可用的 WebGPU 或 WebGL2。两者都不可用时，显示诊断提示并保留全部文档导航。
- 模型请求 20 秒超时且支持切页取消，不依赖 AbortSignal.any/timeout；减少动态效果时保留静态首帧。

## Logo 下方多角色示例

基于 Three.js 官方 webgl_animation_multiple.html，复用本目录 Soldier.glb，不新增模型下载。独立模式使用 SkeletonUtils.clone 创建三个独立骨骼，分别播放待机、跑步和行走；共享模式使用 DetachedBindMode 和一个 AnimationMixer 同步三个网格。保留共享骨骼切换，控制项使用 Vue 与 Tailwind 实现，不引入官方示例的 GUI 和新版 SunLight。两个首页场景共用暂停、减少动态效果和菜单打开时的暂停状态。

示例来源：https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_multiple.html

