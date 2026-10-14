# 深度视差演示素材

`reborn-depth-image` 的文档与 demo 用到的一对素材（最初为组件总览头图制作，头图现已换成 3D 自行车，见 `public/models/bike/README.md`）：

- `soldier.webp`：彩色图，720×840，透明背景。
- `soldier-depth.webp`：深度图，240×280，白近黑远，人物以外的背景为中灰。

两张图由 `scripts/depth-image/render-model.mjs` 从 `public/models/retargeting/Soldier.glb`（与首页共用）渲染得到：同一姿势（Walk 动画 0.26s，模型转 180° 朝向机位）、同一机位，像素对齐；深度直接读模型几何，不是估算。执行下面的命令可重新生成，加 `--preview` 用于挑选其他姿势：

```bash
node scripts/depth-image/render-model.mjs --model=Soldier --yaw=180 --clip=Walk --time=0.26
```

模型来自 Mixamo，版权归原作者及相应权利人所有（见 `public/models/retargeting/README.md`）。这两张渲染图与模型同样只用于本站演示，不加入组件 registry；`reborn-depth-image` 组件本身不附带任何素材。
