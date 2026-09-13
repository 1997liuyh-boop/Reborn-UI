---
title: Tabs 标签页
description: 双端标签页：key 驱动切换，7 种类型 × 4 种尺寸，支持可编辑、懒加载与滚动定位。
category: 导航
platform: both
tags: [css, tailwind, tabs, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornTabsDemo.vue" config="RebornTabsConfig" componentId="reborn-tabs" :componentFiles='["RebornTabs.vue", "RebornTabPane.vue", "reborn-tabs.config.ts"]'  :uniappFiles='["RebornTabs.vue", "RebornTabPane.vue", "reborn-tabs.config.ts"]'}
::

## 简介

Tabs 用于在多个平级内容区之间切换，Web 与 UniApp 两端同名同构，均由 `RebornTabs` 父组件 + `RebornTabPane` 子组件组合而成。标签头部由父组件根据子组件的注册信息统一渲染，使用者只需按内容的自然顺序写 `RebornTabPane`。

它的样式体系由两个正交维度构成：`type` 决定**标签的形态**（下划线、卡片、胶囊还是纯文字），`color` 决定**选中态的语义色**。7 种类型 × 7 种语义色覆盖了从页面级主导航到局部分段控件的完整梯度；`color` 只写入一个 CSS 变量 `--re-tabs-color`，下划线、选中态文字、胶囊底色都从这个变量取值，因此换色不需要为每种类型单独定制。

在此之上，其余 API 分成四组：**布局**由 `position`（四向）、`direction`、`justify`、`header-padding` 控制；**尺寸**由 `size` 的 4 档控制；**渲染策略**由 `lazy-load`、`destroy-on-hide`、`animation`、`hide-content` 控制；**交互**由 `trigger`、`scroll-position`、`editable` / `show-add-button` / `auto-switch` 控制。其中 `animation` 是一个总开关而不只是淡入淡出：开启后内容切换走缩放、位移与模糊的复合过渡，内容区高度也随之平滑过渡，详见[切换动画](#切换动画)。选中项统一用 `key` 标识（`v-model:active-key`），而不是索引，因此增删标签不会让选中项发生漂移。

### 何时使用

- 页面内多个平级视图之间切换，例如「概览 / 详情 / 日志」。
- 标签数量会随用户操作增减，需要新增与关闭标签 —— 用 `editable` + `show-add-button`。
- 标签较多需要横向滚动，且希望选中项自动进入可视区域 —— 用 `scroll-position`。
- 内容区较重（图表、长表单），希望首次展示时才挂载 —— 用 `lazy-load`。
- 需要纵向排布的侧边分区导航 —— 用 `position="left"`。

### 何时不使用

- 页面底部的全局导航 —— 改用 `reborn-tabbar`（仅 UniApp）。
- 侧边栏的层级式导航、带子菜单 —— 改用 `reborn-menu`。
- 内容需要同时展开对比，而非互斥切换 —— 改用 `reborn-collapse`。
- 只是二选一的状态开关 —— 改用 `reborn-switch` 或 `reborn-radio`。

## 用法

### 基础用法

用 `v-model:active-key` 绑定选中标签的 key。每个 `RebornTabPane` 的 key 来自 Vue 的 `key` 属性，`title` 决定头部文本。

```vue
<script setup lang="ts">
import RebornTabPane from "~/components/reborn/ui/reborn-tabs/RebornTabPane.vue";
import RebornTabs from "~/components/reborn/ui/reborn-tabs/RebornTabs.vue";

const activeKey = ref("overview");
</script>

<template>
  <RebornTabs v-model:active-key="activeKey">
    <RebornTabPane key="overview" title="概览">概览内容</RebornTabPane>
    <RebornTabPane key="detail" title="详情">详情内容</RebornTabPane>
    <RebornTabPane key="log" title="日志">日志内容</RebornTabPane>
  </RebornTabs>
</template>
```

不需要受控时可以省略 `v-model:active-key`，用 `default-active-key` 给初值；两者都不写则选中第一个标签。

::warning
选中标识取自 `RebornTabPane` 的 **Vue `key` 属性**，不是同名 prop。省略 `key` 时父组件会按注册顺序补 `0`、`1`、`2`… 的序号，此时增删标签会让 key 整体错位，因此除固定不变的静态标签外都应显式写 `key`。
::

### 类型

`type` 控制标签的形态，7 种取值覆盖不同的视觉权重：

| 类型 | 外观 | 典型用途 |
| --- | --- | --- |
| `line`（默认） | 无边框，标签之间留 32px 间距，选中项下方一条跟随动画的指示条 | 页面级主导航 |
| `card` | 不画边框，相邻标签靠 `gray-2` 底色直接相接成一排，只在背离内容的首末两角留 6px 圆角；选中态是一块 `gray-1` 底板（不透明底色直接盖住分隔线、与内容连成一片），切换时底板从旧标签滑到新标签 | 类文件管理器的多文档切换 |
| `card-gutter` | 卡片之间留 4px 间隙，各自带 6px 上方圆角与 `gray-3` 边框（三种卡片里唯一带边框的），底色与 `card` 相同，选中底板断开贴内容那侧的边框并滑动跟随，分隔线从间隙里透出来 | 需要卡片感但不追求连排的场景 |
| `card-fill` | 不画边框也不画分隔线，未选中只是 `gray-9` 文字加透明底，选中态是一块带 6px 上方圆角的 `gray-2` 底板并把标题换成主题色加粗，切换时同样滑动跟随；内容区同样铺 `gray-2`，与选中底板连成一整块 | 想要卡片感但不希望线条切碎版面的场景 |
| `text` | 纯文字，仅靠颜色与字重区分选中，间距同 `line` | 内容密度高的次级切换 |
| `rounded` | 选中项是一块填充语义色的实心胶囊，标题反白；切换时胶囊在标签间拉伸、压扁再回弹 | 强调当前项的分段切换 |
| `capsule` | 整条轨道为灰底胶囊，选中项是轨道内的白色滑块，滑动时同样带液体形变 | 工具栏里的分段控件 |

```vue
<template>
  <RebornTabs type="card-gutter">
    <RebornTabPane key="a" title="标签 A">A</RebornTabPane>
    <RebornTabPane key="b" title="标签 B">B</RebornTabPane>
  </RebornTabs>
</template>
```

::tip
只有 `line` 会渲染指示条，`card` / `card-gutter` / `card-fill` / `rounded` / `capsule` 五种换成一块承载选中态的滑动底板（`ui.tabSlider`），只有 `text` 两者都不渲染；`line` / `card` / `card-gutter` 会在头部与内容区之间渲染一条分隔线，`card-fill` / `text` / `rounded` / `capsule` 不渲染——`card-fill` 靠选中底板与内容区同色的底面直接连通，再画一条线反而会把这块整面切开。这几项都由组件按 `type` 推导，没有独立开关。
::

### 切换动画

`animation` 是一个总开关，默认关闭。打开后内容切换与内容区高度两件事一起生效；`rounded` / `capsule` 的选中底板形变不受它控制，只要选了这两种类型就一直有。

```vue
<template>
  <RebornTabs type="rounded" animation>
    <RebornTabPane key="brief" title="摘要">两行文字</RebornTabPane>
    <RebornTabPane key="detail" title="明细">
      <p v-for="index in 8" :key="index">第 {{ index }} 行明细</p>
    </RebornTabPane>
  </RebornTabs>
</template>
```

**底板的两段形变（仅 `rounded` / `capsule`，不受 `animation` 控制）。** 底板从旧标签移到新标签分两段：第一段前缘直奔目标、后缘留在原地，底板被拉成两个标签的并集，同时在交叉轴上压扁（压扁幅度随位移增长并封顶，相邻标签之间不会夸张形变）；第二段后缘追上前缘收拢到目标标签，缓动用 back-out，越过目标再弹回。两段分别 110ms / 150ms，整程 260ms，比内容区高度过渡（280ms）略快，先落定的是底板。

第一段的拉伸不只是观感。`rounded` 的选中标题是近白的 `gray-1`，只有踩在主题色底板上才看得见——如果底板只是等宽平移，行程中会有一段时间新标签的标题已经反色、底板却还没到，浅色模式下就是白字打在页面底色上。拉伸成并集让底板在行程中同时覆盖两个标签，两边的反色标题全程都有底色托着。三种卡片类型不参与形变：它们的底板就是那张卡片，压扁会看着像渲染坏了，节奏仍是原来的等宽平移。Web 端命中 `prefers-reduced-motion` 时直接落位，不走这两段。

**内容的复合过渡（`animation` 开启后对所有类型生效）。** 入场面板从「略小、下移、带模糊」过渡到常态，离场面板绝对定位后与入场面板重叠并反向淡出，两份内容有一段互相渗透的观感。

**内容区高度过渡（`animation` 开启后对所有类型生效）。** 切换时组件先把内容区锁在旧面板高度，量到新面板净高后再过渡到新高度，面板高低不同也不会突然撑开或收缩。`justify` 开启（高度由容器给）或 `hide-content` 开启（内容整块不渲染）时不做这一步。

**悬停不做任何动效（`rounded` / `capsule`）。** 鼠标移到未选中标签上时底板不动，标签的悬浮底色也是瞬时切换，只有文字色保留 150ms 过渡（它要在底板行程中遮住 `rounded` 反白文字的空档）；两段形变只在真正切换时才跑。`trigger="hover"` 下悬停本身就是切换，自然会触发形变。两端行为一致（UniApp 仅 H5 有悬停事件）。

::warning
高度过渡的那 ~280ms 里内容区是 `overflow-hidden`，面板内的下拉、气泡等需要溢出的浮层会被裁掉；过渡结束即释放。若面板里有一打开就溢出容器的浮层，关掉 `animation` 或把浮层挂到 `body` 上。
::

### 尺寸

`size` 有 4 档，两端档位名一致，度量单位按各自的屏幕适配方式分化。

同一档位下高度分两套：`line` / `text` 是整行的行高，要与页面标题栏对齐；其余类型是盒子本身的高度，比行高矮一截才不会显得笨重。`card-fill` 在 `medium` 上又比别的盒子矮一档，因为它没有边框撑形，做到 40px 会让那块底色显得过重。

水平内边距不跟着 `size` 变：`card` / `card-gutter` / `card-fill` 三种卡片全档固定 16px——它们之间没有间距或只有 4px，全靠这段内边距把标题拉开，缩到 8px 会让相邻标题几乎贴在一起。`rounded` / `capsule` 的标签之间另有 4px 间距，所以 `mini` 仍收到 8px。`line` / `text` 不留内边距，标签之间只靠列表的 32px 间距分隔。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
高度固定 px：

| `size` | `line` / `text` 高度 | 盒子型高度 | 盒子型水平内边距 | 字号 | 关闭图标 |
| --- | --- | --- | --- | --- | --- |
| `mini` | 24px | 24px | 16px（`rounded` / `capsule` 为 8px） | `text-xs`（12px） | 14px |
| `small` | 38px | 32px | 16px | `text-base`（14px） | 16px |
| `medium`（默认） | 48px | 40px（`card-fill` 为 32px） | 16px | `text-base`（14px） | 16px |
| `large` | 56px | 40px | 16px | `text-lg`（16px） | 18px |

字号列写的是本仓库重映射过的排版令牌，不是 Tailwind 默认值：`app/assets/theme/typography.css` 把 `--text-base` 定为 14px、`--text-lg` 定为 16px，所以 `text-base` 量出来是 14px 而非 16px。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
高度用 `rpx` 随屏宽缩放，数值为 Web 的两倍：

| `size` | `line` / `text` 高度 | 盒子型高度 | 盒子型水平内边距 | 字号 | 关闭图标 |
| --- | --- | --- | --- | --- | --- |
| `mini` | 48rpx | 48rpx | 32rpx（`rounded` / `capsule` 为 16rpx） | 24rpx | 28rpx |
| `small` | 76rpx | 64rpx | 32rpx | 28rpx | 32rpx |
| `medium`（默认） | 96rpx | 80rpx（`card-fill` 为 64rpx） | 32rpx | 28rpx | 32rpx |
| `large` | 112rpx | 80rpx | 32rpx | 32rpx | 36rpx |
:::

::

### 位置与方向

`position` 决定头部贴在容器的哪一边。取 `left` / `right` 时组件自动转成纵向排布，分隔线也跟着换边，无需再改 `direction`。

```vue
<template>
  <div class="h-40">
    <RebornTabs position="left">
      <RebornTabPane key="base" title="基本信息">基本信息</RebornTabPane>
      <RebornTabPane key="safe" title="安全设置">安全设置</RebornTabPane>
    </RebornTabs>
  </div>
</template>
```

::warning
`position` 取 `left` / `right` 时，标签列的滚动依赖容器有确定高度。外层没有高度约束时标签列会被内容撑开、不产生滚动，请给外层容器一个明确高度（例如 `h-40`）。
::

`justify` 让整个组件撑满外层容器高度，内容区吃掉剩余空间，只在水平方向（`position` 为 `top` / `bottom`）生效。

`header-padding` 让头部相对容器缩进一段边距，默认关闭，即首个标签与容器边缘对齐；它仅对 `line` 与 `text` 生效——其余类型的标签自带背景或边框，再加头部边距会让首尾标签与容器边缘对不齐。

### 禁用标签

在 `RebornTabPane` 上写 `disabled`，该标签的点击与悬停都不会切换，也不会派发 `tab-click`。

```vue
<template>
  <RebornTabs>
    <RebornTabPane key="a" title="可用">可用</RebornTabPane>
    <RebornTabPane key="b" title="禁用" disabled>禁用</RebornTabPane>
  </RebornTabs>
</template>
```

### 可编辑模式

`editable` 让每个标签显示关闭按钮，`show-add-button` 额外在标签末尾显示新增按钮。组件本身**只派发事件、不修改数据**，增删由使用方决定，因此可以自由控制插入位置与删除后的兜底逻辑。

```vue
<script setup lang="ts">
const panes = ref([
  { key: "order", title: "订单" },
  { key: "refund", title: "退款" },
]);
const activeKey = ref("order");
let seed = 0;

function handleAdd() {
  seed++;
  panes.value.push({ key: `custom-${seed}`, title: `新标签 ${seed}` });
}

/** 删除后若移除的正是当前项，则回退到相邻标签 */
function handleDelete(key: string) {
  const index = panes.value.findIndex(item => item.key === key);
  if (index === -1) return;
  panes.value.splice(index, 1);
  if (activeKey.value !== key) return;
  const fallback = panes.value[index] ?? panes.value[index - 1];
  activeKey.value = fallback ? fallback.key : "";
}
</script>

<template>
  <RebornTabs v-model:active-key="activeKey" editable show-add-button @add="handleAdd" @delete="handleDelete">
    <RebornTabPane v-for="pane in panes" :key="pane.key" :title="pane.title" />
  </RebornTabs>
</template>
```

单个标签不允许关闭时，在它自己的 `RebornTabPane` 上写 `:closable="false"`。开启 `auto-switch` 后，标签数量增加时会自动切到最后一个新标签。

### 标题与额外内容

`extra` 插槽把自定义内容放在标签行的尾部（新增按钮之后），常用于放置刷新、筛选等与标签平级的操作。

```vue
<template>
  <RebornTabs>
    <template #extra>
      <RebornButton size="sm" variant="text" color="neutral">刷新</RebornButton>
    </template>
    <RebornTabPane key="a" title="全部">全部</RebornTabPane>
  </RebornTabs>
</template>
```

标题需要图标、徽标等富内容时：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
用 `RebornTabPane` 的 `title` 插槽，它会替换掉 `title` prop 的纯文本：

```vue
<template>
  <RebornTabs>
    <RebornTabPane key="inbox">
      <template #title>
        <Icon name="lucide:inbox" />
        <span>收件箱</span>
        <span class="rounded-full bg-error px-1.5 text-xs text-gray-1">9</span>
      </template>
      收件箱内容
    </RebornTabPane>
  </RebornTabs>
</template>
```
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
**不支持 `title` 插槽**，标题只能用 `title` prop 传纯文本。小程序渲染层无法把子组件的插槽函数交给父组件渲染，这条能力在该端不成立。

需要图标时，用 `ui.tabTitle` 追加背景图或字体图标类名，或改用 `extra` 插槽承载富内容。
:::

::

### 滚动定位

标签总宽超出容器时头部自动横向滚动。`scroll-position` 决定切换后把选中标签滚到哪个位置：

| 取值 | 行为 |
| --- | --- |
| `auto`（默认） | 只在选中标签超出可视区域时补齐差值，已可见则不动 |
| `start` | 选中标签对齐到可视区起点 |
| `center` | 选中标签居中 |
| `end` | 选中标签对齐到可视区终点 |
| `number` | 直接把滚动容器滚到该偏移量（px），不做测量 |

```vue
<template>
  <RebornTabs v-model:active-key="activeKey" scroll-position="center">
    <RebornTabPane v-for="i in 20" :key="String(i)" :title="`标签 ${i}`">第 {{ i }} 项</RebornTabPane>
  </RebornTabs>
</template>
```

### 触发方式

`trigger="hover"` 让鼠标悬停即切换，适合快速预览型的标签组。禁用标签不响应悬停。

```vue
<template>
  <RebornTabs trigger="hover" type="rounded">
    <RebornTabPane key="day" title="日">日视图</RebornTabPane>
    <RebornTabPane key="week" title="周">周视图</RebornTabPane>
  </RebornTabs>
</template>
```

::warning
UniApp 端 `hover` 仅在 H5 生效。小程序与 APP 没有鼠标悬停事件，该取值会退化为默认的点击切换。
::

### 渲染策略

默认所有面板都挂载，仅用 `v-show` 控制显隐，切换时不丢失内容状态（表单填写、滚动位置都会保留）。两个开关可以改变这个行为：

- `lazy-load`：首次被选中时才挂载内容，之后保留。适合初始内容较重、但需要保留状态的场景。
- `destroy-on-hide`：离开即销毁，再次进入重新挂载。适合每次进入都要拉最新数据的场景，代价是丢失内容状态。

```vue
<template>
  <RebornTabs lazy-load>
    <RebornTabPane key="a" title="立即挂载">A</RebornTabPane>
    <RebornTabPane key="b" title="首次进入才挂载">B</RebornTabPane>
  </RebornTabs>
</template>
```

`destroy-on-hide` 也可以只写在单个 `RebornTabPane` 上，与父级同名参数取或——父级开启后所有面板都销毁，子级开启则只影响自己。

`animation` 为内容切换加缩放、位移与模糊的复合过渡，并让内容区高度跟着平滑变化，详见[切换动画](#切换动画)；`hide-content` 只渲染标签头部、隐藏整个内容区，用于把内容交给页面其他位置渲染的场景（此时没有内容可过渡，高度过渡自动跳过）。

### 主题色与样式定制

`color` 换语义色，`ui` 覆盖各节点类名。下面把指示条换成渐变条：

```vue
<template>
  <RebornTabs
    color="success"
    :ui="{
      indicator: 'h-1 rounded-none bg-linear-to-r from-blue-500 via-purple-500 to-pink-500',
      tab: 'tracking-wide',
    }"
  >
    <RebornTabPane key="a" title="设计">设计</RebornTabPane>
    <RebornTabPane key="b" title="研发">研发</RebornTabPane>
  </RebornTabs>
</template>
```

## API

以下 Props / Emits / Slots 两端完全一致，仅 `RebornTabPane` 的 `title` 插槽为 Web 独有（见「两端差异对照」）。

### Props

`RebornTabs` 的属性：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `activeKey` | `string \| number` | - | 当前选中标签的 key，支持 `v-model:active-key`。 |
| `defaultActiveKey` | `string \| number` | - | 非受控模式下默认选中的 key，为空时选中第一个标签。 |
| `position` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | 标签头部相对内容区的位置，`left` / `right` 自动转为纵向。 |
| `size` | `"mini" \| "small" \| "medium" \| "large"` | `"medium"` | 标签尺寸。 |
| `type` | `"line" \| "card" \| "card-gutter" \| "card-fill" \| "text" \| "rounded" \| "capsule"` | `"line"` | 标签形态。 |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | 排布方向，`position` 为 `left` / `right` 时强制纵向。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 选中态语义色，写入 `--re-tabs-color`。 |
| `editable` | `boolean` | `false` | 开启可编辑模式，标签上显示关闭按钮。 |
| `showAddButton` | `boolean` | `false` | 是否显示新增按钮，仅在 `editable` 为真时生效。 |
| `destroyOnHide` | `boolean` | `false` | 标签不显示时销毁其内容。 |
| `lazyLoad` | `boolean` | `false` | 首次展示该标签时才挂载内容。 |
| `justify` | `boolean` | `false` | 高度撑满外层容器，仅水平方向生效。 |
| `animation` | `boolean` | `false` | 开启内容切换的复合过渡（缩放 + 位移 + 模糊）与内容区高度过渡，见「切换动画」。 |
| `headerPadding` | `boolean` | `false` | 头部是否相对容器缩进一段边距，仅对 `line` / `text` 生效；默认贴边对齐。 |
| `autoSwitch` | `boolean` | `false` | 标签数量增加后自动切换到最后一个标签。 |
| `hideContent` | `boolean` | `false` | 隐藏内容区，只渲染标签头部。 |
| `trigger` | `"hover" \| "click"` | `"click"` | 切换标签的触发方式，`hover` 在 UniApp 端仅 H5 生效。 |
| `scrollPosition` | `"start" \| "end" \| "center" \| "auto" \| number` | `"auto"` | 选中标签的滚动落点，传数字则直接滚到该偏移量。 |
| `class` | `any` | - | 追加到根节点的自定义类名。 |
| `ui` | `TabsUI` | - | 覆盖内部节点类名，见下方「自定义样式（ui）」。 |

### TabPane Props

`RebornTabPane` 的属性：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | - | 标签标题文本，需要富内容时改用 `title` 插槽（仅 Web）。 |
| `disabled` | `boolean` | `false` | 禁用该标签，点击与悬停都不切换。 |
| `closable` | `boolean` | `true` | 是否允许关闭该标签，仅在父级 `editable` 为真时生效。 |
| `destroyOnHide` | `boolean` | `false` | 不显示时销毁内容，与父级同名参数取或。 |

::tip
选中标识不是 prop，而是 `RebornTabPane` 的 Vue `key` 属性。
::

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:activeKey` | `(key: string \| number)` | 选中项变化时触发（`v-model:active-key` 同步）。 |
| `change` | `(key: string \| number)` | 选中项变化时触发，禁用标签与重复点击当前项都不触发。 |
| `tab-click` | `(key: string \| number)` | 用户点击标签时触发，禁用标签不触发；点击当前项也会触发。 |
| `add` | `()` | 用户点击新增按钮时触发，组件不会自行增加标签。 |
| `delete` | `(key: string \| number)` | 用户点击关闭按钮时触发，组件不会自行移除标签。 |

### Slots

| 插槽名 | 所属 | 描述 |
| --- | --- | --- |
| `default` | `RebornTabs` | 放置 `RebornTabPane`，标签头部由父组件按其注册信息渲染。 |
| `extra` | `RebornTabs` | 标签行尾部的额外内容，位于新增按钮之后。 |
| `default` | `RebornTabPane` | 该标签对应的内容区。 |
| `title` | `RebornTabPane` | **仅 Web**。自定义标题内容，填充后 `title` prop 被忽略。 |

### Expose

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `refresh` | `() => void \| Promise<void>` | 重新测量指示条与选中底板并把选中标签滚进可视区域。外部改变了标签宽度（如异步改标题、改字体）后调用。Web 端是 `async`，可 `await` 到测量结束；UniApp 端用 `setTimeout` 延迟查询布局，调用即返回，无法等待。 |

### 自定义样式（ui）

`ui` 只写在 `RebornTabs` 上，其中 `pane` 经 context 注入给所有 `RebornTabPane`，不要往子组件上单独传。两端键名完全一致：

| 键名 | 说明 |
| --- | --- |
| `root` | 根节点，`class` prop 也并到这里。整体外边距、圆角、方向反转改这里。 |
| `nav` | 标签行容器，包含标签列表、新增按钮与 `extra`。头部与内容区之间的分隔线画在这里。 |
| `navWrapper` | 标签列表的滚动容器，横向 / 纵向滚动发生在这一层。 |
| `list` | 标签列表本身，标签之间的间距、`capsule` 的轨道底色在这里。它是指示条与选中底板的定位基准，`relative` 勿移除；`isolate` 把底板那套 z-index 关在标签列内部，移除后底板的层叠会外溢到页面其他元素上。 |
| `tab` | 单个标签按钮。高度、内边距、字号、选中 / 禁用态都由变体给出，覆盖写这里。 |
| `tabTitle` | 标签内的标题节点，也是测量指示条宽度的锚点。它带 `relative z-[1]` 压在选中底板之上，移除后底板滑过相邻标签时会盖住它们的文字。 |
| `tabClose` | 标签上的关闭按钮，仅 `editable` 时渲染。它与标题之间的 8px / 16rpx 间距由 `tab` 的 `gap` 给出，调间距要覆盖 `tab` 而不是这里。 |
| `indicator` | `line` 类型的指示条。位移与长度由组件测量后写成行内样式，这里只改高度、圆角、底色。 |
| `tabSlider` | `card` / `card-gutter` / `card-fill` / `rounded` / `capsule` 的选中底板，选中态的底色、边框、圆角全在这块底板上（标签自身只剩文字色与字重）。位置与尺寸由组件测量选中标签后写成行内样式，这里只改形态与过渡；`rounded` / `capsule` 的两段形变会在行程中额外写入 `transition-duration` / `transition-timing-function`，在这里写过渡时长会被那两段覆盖。 |
| `addButton` | 标签末尾的新增按钮，仅 `editable` + `showAddButton` 时渲染。按钮先套一整份「未选中标签」的盒子样式，本键的内容追加在其后，因此这里只写与标签不同的部分。 |
| `extra` | `extra` 插槽的包裹节点，仅填充了该插槽时渲染。 |
| `content` | 内容区容器，`stage` 的父节点。内容区内边距、最小高度改这里；`card-fill` 的 `gray-2` 底色也挂在这个键上。 |
| `stage` | `content` 与面板之间的无内边距中间层，高度过渡锁在这一层。它不带内边距是刻意的：量到的进场面板净高就是要写进行内样式的目标高度，不必把 `content` 的单边内边距算进去（UniApp 端没有 `getComputedStyle` 可读）。`animation` 开启时它还是离场面板 `absolute inset-0` 的定位基准，`relative` 勿移除。 |
| `pane` | 单个内容面板（`RebornTabPane` 根节点）。 |

### CSS 变量

两端通用，定义在各自的 `reborn-tabs.config.ts` 中：

| 变量名 | 写入方 | 消费方 |
| --- | --- | --- |
| `--re-tabs-color` | `color` prop 写在根节点上（`neutral` 取 `--color-gray-9`，其余取同名语义色） | 指示条底色、各类型选中态的文字色、`rounded` 的选中底板填充色 |

需要单个实例换成任意颜色时，直接在 `class` 里覆盖这个变量即可，不必逐个改 `ui` 键：

```vue
<template>
  <RebornTabs class="[--re-tabs-color:#7c3aed]">
    <RebornTabPane key="a" title="标签 A">A</RebornTabPane>
  </RebornTabs>
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| Props / Emits | 与 UniApp 完全一致 | 与 Web 完全一致（含 `class`，非 `customClass`） |
| 尺寸度量 | px，4 档 | rpx，4 档，档位名相同 |
| 标题插槽 | `RebornTabPane` 支持 `title` 插槽 | 不支持，标题只能用 `title` prop 传纯文本 |
| 内容过渡 | `<Transition>` 完整进出场，离场面板绝对定位与入场面板重叠 | 小程序无 `<Transition>`，只有入场面板做过渡，离场直接隐藏 |
| 内容过渡的属性 | 透明度 + 缩放（两轴）+ 位移 + 模糊 | 透明度 + 缩放（仅 X 轴）+ 位移，**不加模糊**：小程序渲染层对 `filter: blur` 支持不稳；只缩放 X 轴是因为高度过渡要异步量进场面板的净高，而 `boundingClientRect` 返回的是形变后的盒子，纵向缩放会把高度量少约 2%、过渡末尾跳一下 |
| 内容区高度过渡 | 切换的同一帧同步量到旧高度，双 `requestAnimationFrame` 起过渡，首次切换也过渡 | 靠静息时缓存的上一次面板高度作起点，新高度要等约 50ms 的异步查询才写入，**首次切换没有缓存、不过渡** |
| `prefers-reduced-motion` | 过渡类名与底板两段形变都会关掉 | 无此 API，不做判定 |
| 面板顺序 | 挂载后按 DOM 位置重排，条件渲染插到中间也正确 | 无 DOM 查询，顺序即注册顺序，`v-if` 插入中间会排到末尾 |
| 指示条测量 | `getBoundingClientRect` + `ResizeObserver`，尺寸变化即时重算 | `uni.createSelectorQuery` 五次查询（末一次量选中面板高度），切换后约 50ms 延迟刷新，无 `ResizeObserver` |
| 选中底板定位 | 两轴都测量，写成 `left` / `top` / `width` / `height` | 只测主轴，写成 `transform` 位移加主轴长度；交叉轴由 `position` 变体钉满（同一 `size` 下所有标签等高，纵向标签列又是 `items-stretch`，交叉轴无需测量） |
| 滚动容器 | 原生 `overflow` 滚动 | `<scroll-view>`；`position` 为 `left` / `right` 时须给根节点明确高度才会滚动 |
| `trigger="hover"` | 完整生效 | 仅 H5 生效，小程序 / APP 退化为点击 |
| 图标 | `Icon` 组件（`lucide:x` / `lucide:plus`） | UnoCSS 图标类名（`i-lucide-x` / `i-lucide-plus`） |

## 注意事项

- **选中标识来自 Vue `key`，不是 prop**。`RebornTabPane` 从自身 vnode 上读 `key`；省略时父组件按注册顺序补 `0`、`1`、`2`… 的序号，此时增删标签会让所有 key 错位、选中项漂移。动态标签列表必须显式写 `key`。
- **组件只派发增删事件，不改数据**。`add` / `delete` 不会自动增删 `RebornTabPane`，也不会在删掉当前项后自动切换。删除当前项后如果不重设 `activeKey`，头部将没有任何选中项——回退到相邻标签的逻辑需要使用方自己写（见「可编辑模式」示例）。
- **`destroy-on-hide` 与 `lazy-load` 同时开启时前者优先**。`destroy-on-hide` 意味着离开即销毁，`lazy-load` 的「挂载后保留」不再成立，此时两者等价于只开 `destroy-on-hide`。
- **切换标签默认不丢失内容状态**。面板用 `v-show` 控制显隐，表单填写与滚动位置都会保留；如果期望每次进入都是干净状态，必须显式开 `destroy-on-hide`。
- **指示条只属于 `line`，另外五种类型换成滑动底板，只有 `text` 两者都不渲染**。`card` / `card-gutter` / `card-fill` / `rounded` / `capsule` 不渲染指示器节点而渲染 `ui.tabSlider`。所以在这五种类型上覆盖 `ui.indicator` 没有任何视觉变化，要改选中态得覆盖 `ui.tabSlider`；在 `text` 上两者都无效，只能改 `ui.tab` 或 `--re-tabs-color`。
- **这五种类型的选中态整块搬到了底板上，标签自己不再换底色**。底色、边框、圆角都写在 `ui.tabSlider` 上，选中标签只剩文字色与字重；标签的底色改为恒定（`card` / `card-gutter` 恒为 `gray-2`，`card-fill` / `rounded` / `capsule` 恒为透明；三种卡片里只有 `card-gutter` 带边框）。这是滑动动画能被看见的前提：若底色仍随选中切换，新标签会在底板滑到之前就自己亮起来、旧标签立刻变灰，结果先于动画呈现，滑动也就没有意义。三处连带的机制不要改动——① 标签列有 `isolate`，底板取 `z-index: 0` 恰好压住所有标签的背景与边框（标签本身不定位，属于更下层），标题与关闭图标取 `z-[1]` 压在底板之上，底板才能滑过沿途标签而不遮字；② 底板是标签列的**末位**子节点，并由行内 `margin: 0` 抹掉任何落在相邻子节点上的负外边距（早先 `card` 共用边框时的 `[&>*+*]:-ml-px` 就曾命中它），放到首位则会让首个标签整体偏移；③ `card` 的圆角按标签在列中的首尾分配，而底板永远既非首也非末，用不了 `first:` / `last:`，因此组件按选中项下标推导端位（首 / 末 / 唯一 / 中间）再取对应圆角——圆角也参与过渡，从端部滑向中间时能看到外角逐渐收平。
- **`rounded` 的选中文字靠底板托底，覆盖 `ui.tabSlider` 关掉底色会让它在浅色模式下看不见**。这个类型的选中标题是近白的 `gray-1`，自身没有任何底色，可读性完全来自底板那块主题色实心胶囊。若用 `ui.tabSlider` 把背景改成透明或浅色，浅色模式下就是白字打在页面底色上。要改配色得同时改 `ui.tab` 的选中文字色，或直接调 `--re-tabs-color`。
- **底板形变期间会写行内过渡时长，在 `ui.tabSlider` 上写过渡时长无效**。`rounded` / `capsule` 的两段形变靠行内 `transition-duration` / `transition-timing-function` 驱动（行内优先级高于类名，两端都成立），行程中你在 `ui.tabSlider` 里写的时长会被覆盖。要改节奏只能改组件里的那两组常量，`ui.tabSlider` 留给形态。
- **高度过渡的那段时间内容区是 `overflow-hidden`**。`animation` 开启时，切换后约 280ms 内容区外层是裁剪状态，面板里需要溢出容器的浮层（下拉、气泡、`tooltip`）会被切掉一截，过渡结束即释放。若面板一打开就有溢出容器的浮层，关掉 `animation`，或把浮层挂到 `body` 上。
- **`justify` 或 `hide-content` 开启时不做高度过渡**。`justify` 下内容区高度由容器给（根节点撑满、内容区是弹性列），再锁一个固定高度会和版式打架；`hide-content` 下内容整块不渲染，没有高度可过渡。这两种情况下 `animation` 只剩内容的复合过渡（`hide-content` 连内容都没有，等于完全不生效）。
- **快速连点时底板的起点取上一次提交的落点，不是当前视觉位置**。形变的 `from` 读的是组件缓存的上一次落点，所以在上一段形变还没走完时再点下一个标签，新的一段会从「上一次该停的地方」起算，而不是它此刻实际停在的位置，看起来会有一次轻微跳接。这是为了避免每次切换都同步读一次布局（UniApp 端根本读不到），常规点击频率下看不出来。
- **UniApp 端的高度过渡首次切换不生效**。它的起点高度来自静息时缓存的上一次测量值，首次切换还没有缓存，那一次直接落位；之后每次切换都正常过渡。这条差异与 blur、hover 跟随、`prefers-reduced-motion` 一起列在「两端差异对照」里。
- **`header-padding` 默认关闭，且只对 `line` / `text` 生效**。默认头部贴着容器边缘，首个标签的文字与下方内容左对齐；需要缩进时显式写 `header-padding`。其余类型的标签自带背景或边框，再加头部边距会让首尾标签与容器边缘对不齐，因此组件在这些类型上直接忽略该参数。
- **`size` 在盒子型标签上不等于行高，也不改卡片的水平内边距**。`line` / `text` 的高度是整行行高（`medium` 为 48px），而 `card` / `card-gutter` / `rounded` / `capsule` 走另一套更矮的盒子高度（`medium` 为 40px），`card-fill` 在 `medium` 上再矮一档到 32px。水平内边距则完全不随 `size` 变：三种卡片类型全档固定 16px / 32rpx。同一个 `size` 在不同形态下量出的高度不同是预期行为，不是漏改。
- **`card` / `card-gutter` 的分隔线画在 `nav` 内部而不是 `nav` 的下边框上**。头部的滚动容器带 `overflow: auto`，标签一旦向外溢出就会被裁掉，所以这两种类型改用内阴影把这条线画进 `nav` 自身最后 1px：选中底板的不透明底色直接盖住这条线（`card-gutter` 还要去掉贴内容那一侧的边框）（后代节点总是画在祖先背景之上），不需要负外边距外移（外移还会因为标签列是底对齐而把选中项整体压低 1px，让相邻标签的顶边高出一截）。`card-gutter` 的 4px 间隙没有标签遮挡，分隔线会在间隙处透出来，这是预期效果。若用 `ui.nav` 覆盖了 `box-shadow`，这条分隔线会整条消失。
- **`card-fill` 的底色一半画在内容区上，覆盖 `ui.content` 会把它拆散**。这个类型靠「选中底板」与「内容区」两块 `gray-2` 拼成一整面，所以 `gray-2` 与 16px / 32rpx 的内边距都写在 `ui.content` 上：用 `ui.content` 覆盖背景色会只剩底板那一小块底色浮在页面上；覆盖内边距则要连四边一起给，因为组件是用 `p-4` 整体压掉 `position` 变量原本只给一边的 `pt-4`，只写 `pt-*` 会让左右两侧重新贴边。圆角只开在背离内容的一侧（`position="top"` 时是上方两角），贴内容的两角必须保持直角才能无缝拼接。
- **新增按钮是「未选中标签」的复用，不是一套独立外观**。它的高度、底色、边框、圆角、文字色与悬浮反馈全部取自当前 `type` / `size` / `position` 下未选中标签的那一套，`ui.addButton` 只在其后追加图标按钮特有的部分：去掉标题用的水平内边距，再按标签高度补一个等宽的方形。所以换类型、换尺寸时按钮会自动跟上，不必逐档配；反过来，`ui.tab` 的覆盖内容不会并到按钮上，两者只共用变体结果。另有一处按钮不跟随标签：`card` 类型的圆角按首尾分配，而按钮独立在标签列之外，若照搬首尾规则就只会剩一个孤零零的角，因此它背离内容的那条边两角都倒角。
- **纵向标签列需要外层有确定高度**。`position` 取 `left` / `right` 时滚动发生在标签列自身，外层没有高度约束时标签列会被内容撑开而不滚动，UniApp 端的 `<scroll-view>` 尤其如此。
- **标签宽度异步变化后需要手动 `refresh()`**。Web 端有 `ResizeObserver` 兜底容器尺寸变化，但字体加载完成、标题异步替换这类只改变文字宽度的情况两端都测不到，指示条与选中底板会停在旧位置、长度也是旧的，此时通过模板 ref 调 `refresh()`。
