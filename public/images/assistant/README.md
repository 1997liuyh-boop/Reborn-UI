# Ask AI 抽屉的图片素材

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `thinking-pixel.png` | 62×64，透明底 | 聊天区背景：「正在思考」表情图的像素风版本，贴聊天区底部居中、透明度 0.1，页面上用 `image-rendering: pixelated` 放大成像素块 |
| `avatar.webp` | 128×128，透明底 | AI 回答（客服机器人）的头像，截取立绘的头部，显示为 28px 圆形 |

两张图都由 `scripts/assistant-images/build.mjs` 生成，原图在同一目录：

- `thinking-source.webp`：表情图原图，来自 <https://img.aigengtu.com/0_preview/meme/812.webp>，已下载到本地，页面不引用外链。
- `avatar-source.png`：头像所用的全身立绘原图。

改了原图或参数后重新执行：

```bash
node scripts/assistant-images/build.mjs --preview
```
