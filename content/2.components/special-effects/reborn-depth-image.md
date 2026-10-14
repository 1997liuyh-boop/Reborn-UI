---
title: 深度视差图
description: 按深度图对透明背景图片做跟随指针的 2.5D 视差与补光，WebGL 渲染，失败时退回静态图。
category: 特效
platform: web
tags: [webgl, canvas, parallax, image]
badge: New
---

::warning
仅 Web 端组件。UniApp 端展示图片请使用 `reborn-image`。
::

::ComponentViewer{demoFile="RebornDepthImageDemo.vue" config="RebornDepthImageConfig" componentId="reborn-depth-image" :componentFiles='["RebornDepthImage.vue", "reborn-depth-image.config.ts", "reborn-depth-image.utils.ts"]'}
::

## 简介

DepthImage 把一张彩色图和一张同尺寸的深度图叠成一个可「看进去」的画面：指针移动时近处位移多、远处位移少，并在指针附近按表面朝向补一束光。效果由 WebGL 1 着色器逐像素计算，不依赖 three；仅 Web 端实现。

两条轴互相独立：`parallax` 决定位移幅度（指针到触发区边缘时最近处移动多少 px），`focus` 决定哪一层深度原地不动（比它近的朝指针方向移，比它远的反向移）。`parallax` 取 0 时只剩补光，`focus` 取 0 时整张图同向平移、没有前后层次。

其余 API 分三组：补光由 `light` / `lightColor` / `lightIntensity` 控制；布局由 `position`（图片在容器内的对齐）与 `trigger`（监听指针的范围）控制；状态由 `ready` / `fallback` 两个事件回报，素材加载失败、不支持 WebGL、开启「减少动态效果」时都会退回 `src` 静态图。

### 何时使用

- 头图、落地页首屏里的人物或物件主视觉 —— 用 `trigger` 指向整个头图，指针在头图任意位置都能驱动视差。
- 产品渲染图、3D 角色的静态展示需要一点空间感 —— 默认 `parallax` 12px、`focus` 0.5 即可。
- 主视觉要跟随站点主题色 —— 用 `light-color="var(--color-primary)"`，切换主题后下一次指针进入即生效。

### 何时不使用

- 普通内容图片、需要懒加载与占位的图片列表 —— 改用 `reborn-image`。
- 整张卡片随指针倾斜（3D 翻转感），而不是画面内部分层 —— 改用 `card-3d`。
- 手里只有彩色图、没有深度图 —— 本组件不做深度估算，需先用建模软件或深度估算模型产出深度图。

## 用法

### 基础用法

传入彩色图 `src` 与深度图 `depthSrc`，尺寸写在 `class` 上。组件进入视口附近（200px 内）才加载素材、创建 WebGL 上下文；在此之前与失败时显示 `src` 静态图。

```vue
<template>
  <RebornDepthImage
    src="/images/depth-image/soldier.webp"
    depth-src="/images/depth-image/soldier-depth.webp"
    alt="行走中的装甲士兵"
    class="h-80 w-72"
  />
</template>
```

### 深度图的要求

深度图决定每个像素的前后关系，效果好坏主要取决于它，而不是参数：

| 要求 | 原因 | 不满足的后果 |
| --- | --- | --- |
| 宽高比与 `src` 一致 | 两张图按同一 uv 坐标采样 | 位移错位，边缘重影 |
| 白色最近、黑色最远 | 着色器把亮度直接当作深度 | 前后颠倒，近处反而不动 |
| 主体外的背景取 `focus` 对应的灰度（默认 0.5，即中灰） | 背景深度等于 `focus` 时位移为 0，主体移开后露出的地方保持透明 | 背景跟着反向位移、采到主体本身，出现残影 |
| 主体深度向轮廓外延展，延展宽度大于最大位移 | 主体朝外移动时，轮廓外的像素要取到主体的深度 | 主体移出轮廓的部分被裁掉 |
| 适度模糊，分辨率可降到原图的 1/3 | 视差只需要大块的前后关系 | 边缘采样抖动、出现台阶 |

::tip
仓库里的 `scripts/depth-image/render-model.mjs` 是一个完整的例子：用 three 渲染 glTF 角色的彩色图与几何深度，再按上表做延展、模糊与降采样。照片类素材可以用深度估算模型（如 Depth Anything）产出深度图，再按上表后处理。
::

### 视差与焦平面

`parallax` 是指针到触发区边缘时最近处（深度为 1）的位移，单位 px；`focus` 是原地不动的那一层深度：

| `focus` | 效果 | 典型用途 |
| --- | --- | --- |
| `0.5`（默认） | 中间层不动，前景朝指针、背景背离指针 | 人物半身像、单个物件 |
| 接近 `0` | 只有前景移动，整体像是凑近看 | 背景已经是纯色或透明的素材 |
| 接近 `1` | 前景不动，后面的层反向移动 | 想让主体保持稳定、只让背景晃动 |

```vue
<template>
  <RebornDepthImage
    src="/images/depth-image/soldier.webp"
    depth-src="/images/depth-image/soldier-depth.webp"
    :parallax="20"
    :focus="0.3"
    class="h-80 w-72"
  />
</template>
```

### 指针补光

`light` 默认开启，在指针附近按深度图推出的表面朝向提亮，朝向光源的面更亮、近处更亮。`lightColor` 接受任意 CSS 颜色，包括 CSS 变量；`lightIntensity` 取 0~1。

| 写法 | 效果 | 典型用途 |
| --- | --- | --- |
| `light-color="#ffffff"`（默认） | 白色高光 | 通用 |
| `light-color="var(--color-primary)"` | 主题色补光，跟随主题切换 | 头图、品牌主视觉 |
| `:light="false"` | 只有视差，没有补光 | 素材本身已有强烈光影 |

```vue
<template>
  <RebornDepthImage
    src="/images/depth-image/soldier.webp"
    depth-src="/images/depth-image/soldier-depth.webp"
    light-color="var(--color-primary)"
    :light-intensity="0.45"
    class="h-80 w-72"
  />
</template>
```

### 触发范围与对齐

`trigger` 决定在哪个区域内移动指针会驱动视差，位移按指针相对该区域中心的偏移计算；`position` 决定图片在容器内的对齐，图片始终按 contain 完整显示。

| `trigger` | 监听范围 | 典型用途 |
| --- | --- | --- |
| `'self'`（默认） | 组件自身 | 独立展示的图片 |
| `'parent'` | 父元素 | 图片占父容器一角，指针在整块卡片上都有反应 |
| `'window'` | 整个窗口 | 全屏首屏 |
| `HTMLElement` | 指定元素 | 图片嵌在网格里、要响应的是外层头图 |

```vue
<script setup lang="ts">
const heroRef = ref<HTMLElement | null>(null);
</script>

<template>
  <section ref="heroRef" class="relative h-80 overflow-hidden rounded-2xl">
    <RebornDepthImage
      src="/images/depth-image/soldier.webp"
      depth-src="/images/depth-image/soldier-depth.webp"
      position="bottom-right"
      :trigger="heroRef"
      class="pointer-events-none absolute inset-y-0 right-0 w-1/2"
    />
  </section>
</template>
```

### 回退与事件

画布接管显示时派发 `ready`；无法启用效果时派发 `fallback` 并保留静态图，回调参数说明原因：

| 原因 | 触发条件 | 典型处理 |
| --- | --- | --- |
| `'load-error'` | `src` 或 `depthSrc` 加载失败 | 检查地址；跨域图片需对方返回 CORS 头 |
| `'unsupported'` | 浏览器不支持 WebGL 或着色器编译失败 | 无需处理，静态图即最终效果 |
| `'context-lost'` | 运行中 WebGL 上下文丢失（显卡重置、上下文过多） | 无需处理，组件已释放资源 |
| `'reduced-motion'` | 系统开启「减少动态效果」 | 无需处理，这是有意的降级 |

```vue
<script setup lang="ts">
const status = ref("加载中");
</script>

<template>
  <RebornDepthImage
    src="/images/depth-image/soldier.webp"
    depth-src="/images/depth-image/soldier-depth.webp"
    class="h-80 w-72"
    @ready="status = '已启用'"
    @fallback="(reason) => (status = `已回退：${reason}`)"
  />
</template>
```

## API

### Props

| 属性名           | 类型                                                                    | 默认值      | 描述                                                                                         |
| ---------------- | ----------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `src`            | `string`                                                                | -           | 彩色图地址，必填。建议带透明通道，透明区域不参与视差与补光；也是首屏与回退时显示的静态图。   |
| `depthSrc`       | `string`                                                                | -           | 深度图地址，必填。白近黑远，宽高比须与 `src` 一致，要求见「深度图的要求」。                  |
| `alt`            | `string`                                                                | `''`        | 替代文本，挂在静态图上；画布接管后静态图只是透明，仍留在无障碍树里。                         |
| `parallax`       | `number`                                                                | `12`        | 指针到触发区边缘时最近处的最大位移，单位 px；0 关闭视差、只保留补光。                        |
| `focus`          | `number`                                                                | `0.5`       | 原地不动的深度层，0~1；比它近的朝指针方向移，比它远的反向移。                                |
| `light`          | `boolean`                                                               | `true`      | 是否在指针附近按表面朝向补光。                                                               |
| `lightColor`     | `string`                                                                | `'#ffffff'` | 补光颜色，任意 CSS 颜色写法，含 `var(--xxx)`；指针每次进入时重新解析。                       |
| `lightIntensity` | `number`                                                                | `0.5`       | 补光强度，0~1；颜色自带的透明度会再乘上去。                                                  |
| `position`       | `'center' \| 'top' \| 'bottom' \| 'bottom-left' \| 'bottom-right'`      | `'center'`  | 图片在容器内的对齐，等同 `object-position`；图片始终按 contain 完整显示。                    |
| `trigger`        | `'self' \| 'parent' \| 'window' \| HTMLElement \| null`                 | `'self'`    | 监听指针的范围；传 `null`（如模板 ref 尚未就绪）时按 `'self'` 处理，元素就绪后自动改绑。     |
| `class`          | `any`                                                                   | -           | 追加到根元素的类名，组件尺寸写在这里。                                                       |
| `ui`             | `DepthImageUI`                                                          | `{}`        | 按结构键覆盖各节点样式，键位见「自定义样式（ui）」。                                         |

### Emits

| 事件名     | 回调参数                                                                                    | 描述                                       |
| ---------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `ready`    | -                                                                                           | 素材加载完成、画布开始接管显示时触发。     |
| `fallback` | `(reason: 'unsupported' \| 'load-error' \| 'context-lost' \| 'reduced-motion') => void`      | 无法启用效果、退回静态图时触发。           |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。静态图与画布同一时间只显示一个，想让投影等效果在回退时也保留，`image` 与 `canvas` 要写同样的类：

| 键名     | 说明                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `root`   | 根容器，默认 `relative overflow-hidden`，不含尺寸；`class` 也合并到这里。                                                 |
| `image`  | 静态图，默认 `absolute inset-0 size-full object-contain`。画布接管后以行内样式置为透明，在 `ui.image` 里改透明度不会生效。 |
| `canvas` | WebGL 画布，默认 `pointer-events-none absolute`。位置与尺寸由脚本按图片实际显示区域写成行内样式，不要在这里改尺寸。       |

```vue
<template>
  <RebornDepthImage
    src="/images/depth-image/soldier.webp"
    depth-src="/images/depth-image/soldier-depth.webp"
    class="h-80 w-72"
    :ui="{ root: 'rounded-2xl', image: 'drop-shadow-lg', canvas: 'drop-shadow-lg' }"
  />
</template>
```

## 注意事项

- **触屏不触发视差**。只响应鼠标与触控笔：触屏没有悬停，手指按下时的位移会被当成误触，所以在手机上它就是一张静态图。
- **「减少动态效果」只在挂载时读取**。挂载后再切换系统设置不会生效，刷新页面或重新挂载组件后才按新设置处理。
- **补光颜色每次指针进入时才重新解析**。用 CSS 变量跟随主题时，切换主题后要等指针下一次移入才变色；`lightColor` 本身变化则立即生效。
- **跨域图片需要 CORS**。不同源的 `src` / `depthSrc` 会以匿名方式请求，对方不返回 `Access-Control-Allow-Origin` 时贴图上传被浏览器拒绝，组件派发 `fallback('load-error')`。
- **每个实例占一个 WebGL 上下文**。浏览器同时存在的上下文有数量上限（常见为 16 个左右），列表里批量使用会挤掉页面上其他画布；组件卸载时会主动释放上下文。
- **画布像素密度上限为 2**。高分屏下画布按 `min(devicePixelRatio, 2)` 倍渲染，静态图与画布尺寸逐像素对齐，但 3 倍屏上画布会比静态图略软。
- **素材地址变化会整体重建**。修改 `src` 或 `depthSrc` 时组件释放旧上下文、重新加载两张图，期间显示新的 `src` 静态图。
