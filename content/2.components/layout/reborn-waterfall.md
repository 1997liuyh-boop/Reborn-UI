---
title: Waterfall 瀑布流
description: 用于 uniapp 中按列分流渲染瀑布流布局的容器组件，数据经实例方法维护、每项由 item 插槽渲染。
category: 布局
tags: [uniapp, waterfall, layout, list]
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::warning
仅 UniApp 端组件。Web 端等高条目的规则网格直接用普通 grid 布局即可。
::
::ComponentViewer{demoFile="RebornWaterfallDemo.vue" config="RebornWaterfallConfig" componentId="reborn-waterfall" :componentFiles='[]' :uniappFiles='["RebornWaterfall.vue", "reborn-waterfall.config.ts"]'}
::

## 简介

Waterfall 是一个按列分流的瀑布流容器，适合商品、图片等不等高卡片的多列展示。它的用法与常规列表组件不同：**数据不通过 props 传入**，而是通过 `ref` 调用组件暴露的 `append` / `remove` / `update` / `clear` 实例方法增量维护；每个条目的内容由 `item` 具名插槽渲染。新增数据时组件先在隐藏区域虚拟渲染测量每项高度，再把条目插入当前最矮的一列，保证各列高度尽量均衡。

适用场景：

- 商品、图片等不等高卡片的多列瀑布流展示（`column` 默认 2 列，`gutter` 控制列间距）。
- 需要增量维护数据的长列表：通过 `append` / `remove` / `update` / `clear` 操作条目，配合触底加载。

不适用场景：

- Web 端项目：组件仅有 UniApp 实现。
- 等高条目的规则网格，直接用普通 grid 布局即可。

## 用法

### 基础用法

通过 `ref` 拿到组件实例后调用 `append` 写入数据；`item` 插槽提供 `{ item, index }` 作用域渲染每个卡片。为保证测高准确，建议给图片区域固定宽高比（如 `aspectRatio`）。

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import RebornWaterfall from "@/components/reborn-waterfall/RebornWaterfall.vue";
import RebornImage from "@/components/reborn-image/RebornImage.vue";

const waterfallRef = ref<InstanceType<typeof RebornWaterfall> | null>(null);

onMounted(() => {
  waterfallRef.value?.append([
    { id: 1, title: "精选热门风景推荐 1", image: "/static/demo/1.jpg", ratio: 0.75 },
    { id: 2, title: "精选热门风景推荐 2", image: "/static/demo/2.jpg", ratio: 1.25 },
  ]);
});
</script>

<template>
  <RebornWaterfall
    ref="waterfallRef"
    :column="2"
    :gutter="16"
  >
    <template #item="{ item }">
      <view class="mb-2 overflow-hidden rounded-xl bg-white shadow-sm">
        <view
          class="relative w-full overflow-hidden"
          :style="{ aspectRatio: item.ratio || 1 }"
        >
          <RebornImage
            :src="item.image"
            mode="aspectFill"
            width="100%"
            height="100%"
            :lazy-load="true"
            custom-class="absolute left-0 top-0 h-full w-full"
          />
        </view>
        <view class="p-3">
          <text class="text-28 font-medium">{{ item.title }}</text>
        </view>
      </view>
    </template>
  </RebornWaterfall>
</template>
```

### 触底加载更多

在页面 `onReachBottom` 中继续 `append` 新一页数据即可，可配合 `reborn-loadmore` 展示加载状态：

```vue
<script setup lang="ts">
import { onReachBottom } from "@dcloudio/uni-app";

const page = ref(1);

async function getList() {
  const list = await fetchList(page.value); // 每项须含唯一 id
  waterfallRef.value?.append(list);
  page.value++;
}

onReachBottom(() => {
  getList();
});
</script>
```

### 删除与更新条目

`remove` / `update` 按 `nodeKey`（默认 `id`）定位条目；`clear` 清空全部数据。

```ts
// 删除 id 为 3 的卡片
waterfallRef.value?.remove(3);

// 更新 id 为 5 的卡片标题
waterfallRef.value?.update(5, { title: "新标题" });

// 清空后重新加载
waterfallRef.value?.clear();
```

## API

### Props

| 属性名        | 类型     | 默认值 | 描述                                                         |
| :------------ | :------- | :----- | :----------------------------------------------------------- |
| `column`      | `number` | `2`    | 瀑布流列数；变更列数会清空并重排数据。                       |
| `gutter`      | `number` | `16`   | 列间距，单位为 px。                                          |
| `nodeKey`     | `string` | `"id"` | 数据项的唯一标识字段名，`remove` / `update` 依赖它定位条目。 |
| `ui`          | `any`    | `{}`   | 按内部结构键覆盖类名，见下方「自定义样式（ui）」。           |
| `customClass` | `string` | `-`    | 追加到根容器的自定义类名。                                   |

### Slots

| 插槽名 | 作用域参数        | 描述                                                                  |
| :----- | :---------------- | :-------------------------------------------------------------------- |
| `item` | `{ item, index }` | 渲染单个瀑布流条目，`item` 为数据对象，`index` 为其在所在列中的索引。 |

### Expose

| 方法     | 签名                                        | 描述                                                         |
| :------- | :------------------------------------------ | :----------------------------------------------------------- |
| `append` | `(data: any[]) => Promise<void>`            | 追加一批数据；内部先虚拟渲染测高，再将每项插入当前最矮的列。 |
| `remove` | `(id: string \| number) => void`            | 按 `nodeKey` 移除指定条目。                                  |
| `update` | `(id: string \| number, data: any) => void` | 按 `nodeKey` 找到条目并合并新数据。                          |
| `clear`  | `() => void`                                | 清空所有数据并按列数重建空列。                               |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的 Tailwind/Uno 类名：

| 键名      | 说明                                   |
| :-------- | :------------------------------------- |
| `root`    | 根容器（横向 flex 布局）。             |
| `column`  | 单列容器。                             |
| `item`    | 单个条目外层。                         |
| `inner`   | 列内部容器（用于测量列高）。           |
| `virtual` | 虚拟测高条目（默认绝对定位且不可见）。 |

## 注意事项

- 仅 UniApp 端可用。
- props 中没有数据字段，数据必须通过 `ref` 调用 `append` 等实例方法写入，而非模板传入。
- 每个数据项须携带 `nodeKey`（默认 `id`）指定的唯一标识，否则 `remove` / `update` 无法定位条目。
- `gutter` 单位为 px（不是 rpx）。
- `append` 采用「先虚拟渲染、延迟约 300ms 测高再分列」的策略：图片等异步内容建议固定宽高比或占位高度，否则测高偏差会导致列高不均；也应避免在前一次 `append` 未完成时立即再次调用。
- `column` 变化时组件会自动 `clear` 重排，需要业务侧重新写入数据。
