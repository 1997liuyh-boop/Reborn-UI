---
title: Signature 签名
description: 用于手写签名并导出图片的画布组件，支持笔锋模拟、撤销恢复与透明背景导出。
category: 输入与表单
tags: [uniapp, signature, canvas, form]
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::warning
Web 端独立组件说明暂不维护；文档站预览通过 UniApp H5 渲染。
::
::ComponentViewer{demoFile="RebornSignatureDemo.vue" config="RebornSignatureConfig" componentId="reborn-signature" :componentFiles='[]' :uniappFiles='["RebornSignature.vue", "reborn-signature.config.ts", "index.ts"]'}
::

# API

## Props

| 属性              | 类型                                                                                   | 默认值                                                               | 描述                                                                          |
| :---------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| `customClass`     | `any`                                                                                  | `''`                                                                 | 根节点额外 class（组件内部会与 `ui` 合并）                                    |
| `customStyle`     | `any`                                                                                  | `''`                                                                 | 根节点内联样式                                                                |
| `ui`              | `SignatureUI`                                                                          | `{}`                                                                 | 按 slot 名称覆盖 Tailwind / Uno 类名                                          |
| `size`            | `'sm' \| 'md' \| 'lg'`                                                                 | `'md'`                                                               | 尺寸变体                                                                      |
| `color`           | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'`                                                          | 主题色（描边聚焦、默认工具栏按钮风格）                                        |
| `height`          | `number \| string`                                                                     | `360`                                                                | 画布区域高度；**数字单位为 rpx**                                              |
| `penColors`       | `string[]`                                                                             | ` ['#111827, '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']` | 可选画笔颜色列表                                                              |
| `showPenColors`   | `boolean`                                                                              | `true`                                                               | 是否显示默认色板                                                              |
| `lineWidth`       | `number`                                                                               | `4`                                                                  | 画笔宽度（px）                                                                |
| `penPressure`     | `boolean`                                                                              | `false`                                                              | 是否启用笔锋模拟                                                              |
| `minLineWidth`    | `number`                                                                               | `-`                                                                  | 笔锋最小宽度（px），未传时由内部推导                                          |
| `maxLineWidth`    | `number`                                                                               | `-`                                                                  | 笔锋最大宽度（px），未传时由内部推导                                          |
| `backgroundColor` | `string`                                                                               | `'#FFFFFF'`                                                          | 画布背景色；**空字符串可导出透明背景**                                        |
| `placeholder`     | `string`                                                                               | `'请在此处签名'`                                                     | 无笔迹时的占位文案                                                            |
| `showToolbar`     | `boolean`                                                                              | `true`                                                               | 是否显示默认底部工具栏                                                        |
| `showClose`       | `boolean`                                                                              | `false`                                                              | 是否显示退出按钮；点击后会清空画布并触发 `close` 事件                         |
| `toolbarPosition` | `'left' \| 'right' \| 'bottom'`                                                        | `'bottom'`                                                           | 工具栏相对画布布局（横屏常用 left/right）                                     |
| `showUndo`        | `boolean`                                                                              | `true`                                                               | 是否显示撤销                                                                  |
| `showRedo`        | `boolean`                                                                              | `true`                                                               | 是否显示恢复                                                                  |
| `disabled`        | `boolean`                                                                              | `false`                                                              | 禁用绘制与工具栏；可与表单注入状态叠加                                        |
| `readonly`        | `boolean`                                                                              | `false`                                                              | 只读（不可绘制）                                                              |
| `allowEmpty`      | `boolean`                                                                              | `false`                                                              | 是否允许空白画布导出                                                          |
| `fileType`        | `'png' \| 'jpg'`                                                                       | `'png'`                                                              | 导出图片格式                                                                  |
| `quality`         | `number`                                                                               | `1`                                                                  | JPG 导出质量                                                                  |
| `destScale`       | `number`                                                                               | `3`                                                                  | 导出相对画布展示尺寸的倍数                                                    |
| `minDistance`     | `number`                                                                               | `2`                                                                  | 记录触点的最小移动距离（过滤抖动）                                            |
| `rotate`          | `0 \| 90 \| 180 \| 270`                                                                | `0`                                                                  | 外层 CSS `rotate` 顺时针角度，用于修正触点坐标；**微信小程序横屏常设为 `90`** |
| `closeOnSave`     | `boolean`                                                                              | `false`                                                              | 保存成功后是否额外触发 `close`（便于关弹窗）                                  |

## v-model

| 绑定                | 类型     | 默认值      | 描述                                                 |
| :------------------ | :------- | :---------- | :--------------------------------------------------- |
| `v-model`           | `string` | `''`        | 上次「完成」导出后的临时文件路径；清空、撤销等会重置 |
| `v-model:pen-color` | `string` | `'#111827'` | 当前画笔颜色                                         |

## Emits

| 事件名   | 回调参数                                                                   | 描述                                      |
| :------- | :------------------------------------------------------------------------- | :---------------------------------------- |
| `start`  | `point: SignaturePoint`                                                    | 笔触开始                                  |
| `draw`   | `point: SignaturePoint`                                                    | 笔触移动采样                              |
| `end`    | `stroke: SignatureStroke`                                                  | 一笔结束                                  |
| `change` | `payload: { strokes, isEmpty }`                                            | 笔迹或状态变更                            |
| `clear`  | `-`                                                                        | 清空画布                                  |
| `undo`   | `stroke: SignatureStroke \| undefined`                                     | 撤销一笔                                  |
| `redo`   | `stroke: SignatureStroke \| undefined`                                     | 恢复一笔                                  |
| `save`   | `payload: SignatureSavePayload`（含 `tempFilePath`、`strokes`、`isEmpty`） | 点击完成并成功导出                        |
| `close`  | `-`                                                                        | 需手动触发或由 `closeOnSave` 在保存后触发 |
| `error`  | `error: Error`                                                             | 导出等失败                                |

## Expose

| 名称             | 类型                                                      | 描述                                       |
| :--------------- | :-------------------------------------------------------- | :----------------------------------------- |
| `clear`          | `() => void`                                              | 清空并重置模型值                           |
| `undo`           | `() => void`                                              | 撤销                                       |
| `redo`           | `() => void`                                              | 恢复                                       |
| `save`           | `() => Promise<string>`                                   | 导出并 `emit('save')`，返回临时路径或 `''` |
| `toPng`          | `(options?: { allowEmpty?: boolean }) => Promise<string>` | 仅导出临时路径                             |
| `getStrokes`     | `() => SignatureStroke[]`                                 | 当前笔迹拷贝                               |
| `selectPenColor` | `(color: string) => void`                                 | 切换画笔颜色                               |
| `penColor`       | `Ref<string>`                                             | 与 `v-model:pen-color` 同步                |
| `isEmpty`        | `ComputedRef<boolean>`                                    | 是否尚无笔迹                               |
| `canUndo`        | `ComputedRef<boolean>`                                    | 是否可撤销                                 |
| `canRedo`        | `ComputedRef<boolean>`                                    | 是否可恢复                                 |
| `strokeCount`    | `ComputedRef<number>`                                     | 笔画数量                                   |
| `pointCount`     | `Ref<number>`                                             | 触点总数                                   |

### Slots（模板）

| 插槽名        | 描述                                                                                                                                                                                                            |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeholder` | 无笔迹时展示；默认显示 `placeholder` 文案。作用域：`{ isEmpty }`                                                                                                                                                |
| `toolbar`     | 自定义整条工具栏（色板、撤销/恢复、清空、完成）。作用域：`isEmpty`、`disabled`、`readonly`、`clear`、`undo`、`redo`、`save`、`penColor`、`penColors`、`selectPenColor`、`toolbarPosition`、`canUndo`、`canRedo` |

### UI

| 名称               | 描述          |
| :----------------- | :------------ |
| `root`             | 根容器        |
| `board`            | 画布外框      |
| `canvas`           | `canvas` 节点 |
| `placeholder`      | 占位区域      |
| `colorBar`         | 色板容器      |
| `colorSwatch`      | 单色块按钮    |
| `colorSwatchInner` | 色块内圆      |
| `toolbar`          | 工具栏容器    |
| `action`           | 操作按钮      |
| `actionIcon`       | 按钮图标      |
| `actionText`       | 按钮文字      |

### Variants

| 变体              | 选项                        | 描述                   |
| :---------------- | :-------------------------- | :--------------------- |
| `size`            | `sm` / `md` / `lg`          | 控制色块、按钮等尺寸   |
| `color`           | `primary` … `neutral`       | 聚焦环与默认按钮强调色 |
| `disabled`        | `true`                      | 整体变淡、禁用交互样式 |
| `readonly`        | `true`                      | 只读背景样式           |
| `error`           | `true`                      | 错误态描边（表单校验） |
| `toolbarPosition` | `bottom` / `left` / `right` | 横屏签名时操作按钮位置 |

## 使用注意

- `height` 传数字时单位为 `rpx`，传字符串时按原值使用，例如 `420rpx`、`50vh`。
- 默认不允许空白签名导出，空白点击「完成」会触发 `error`；需要空白导出时设置 `allowEmpty`。
- `backgroundColor` 默认为白色，设置为空字符串可以导出透明背景 PNG。
- `fileType="jpg"` 时可通过 `quality` 控制导出质量；PNG 会忽略 JPG 质量参数。
- 小程序横屏或外部 `transform: rotate()` 场景需要同步传入 `rotate`，否则触点坐标会与画布位置偏移。
- 导出的 `tempFilePath` 是临时文件路径，页面关闭或应用回收后可能失效，正式业务请及时上传或转存。
- 在弹窗中使用时，建议关闭点击遮罩关闭，并开启 `closeOnSave`。保存成功后组件会额外触发 `close`，业务侧可以直接关闭弹窗。
- 需要在表单提交统一保存时，可以通过 `ref` 调用 `save()` 或 `toPng()`。`save()` 会更新 `v-model` 并触发 `save` 事件；`toPng()` 只返回临时图片路径，不触发 `save` 事件。
