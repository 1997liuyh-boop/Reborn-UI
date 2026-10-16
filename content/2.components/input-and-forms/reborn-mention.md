---
title: Mention 提及
description: 输入前缀唤起等宽候选列表，支持多前缀、远程搜索、退格整体删除与光标行定位。
category: 表单与输入
platform: web
tags: [input, mention, autocomplete, textarea]
badge: New
---

::warning
仅 Web 端组件，UniApp 端暂无对应实现。
::

::ComponentViewer{demoFile="RebornMentionDemo.vue" config="RebornMentionConfig" componentId="reborn-mention" :componentFiles='["RebornMention.vue", "reborn-mention.config.ts", "reborn-mention.utils.ts"]'}
::

## 简介

Mention 在 `RebornInput` 外面包了一层：输入前缀字符（默认 `@`）时按光标处的检索词弹出候选列表，选中后把选项值插入输入框并补一个拆分符，多用于评论、消息里 @ 成员。输入框本身的能力（单行 / 多行、尺寸、形态、清除、前后缀插槽、事件）全部原样透传给 `RebornInput`，API 与 Element Plus 的 `el-mention` 对齐。

两条轴决定「什么时候弹、弹出什么」：`prefix` 决定由哪些字符触发（字符串或数组，每项 1 个字符），`split` 决定提及在哪里结束（默认空格，换行同样算结束）；光标停在「前缀之后、拆分符之前」时面板展开，检索词按 `filterOption` 过滤 `options`。传 `:filter-option="false"` 则交给 `search` 事件去远程取数。

其余 API 分三组：面板由 `placement` / `showArrow` / `offset` / `loading` 与 `#header` / `#footer` / `#label` / `#loading` 插槽控制；删除行为由 `whole` / `checkIsWhole` 控制，退格可以把整个提及一次删掉；事件有 `search` / `select` / `whole-remove`，暴露的实例里有内部 `input` 与面板显隐状态。

### 何时使用

- 评论、IM 输入框里 @ 成员 —— `options` 给成员列表，选中后插入 `@姓名 `。
- 一个输入框同时 @ 成员和 # 话题 —— `:prefix="['@', '#']"`，在 `search` 回调里按第二个参数（命中的前缀）切换 `options`。
- 成员太多不能一次下发 —— `:filter-option="false"` + `search` 里请求接口，请求期间开 `loading`。
- 提及要像一个整体标签那样删除 —— 开 `whole`，退格把「@姓名 」一次删掉。

### 何时不使用

- 从固定列表里选一个值、不需要自由输入 —— 改用 `reborn-select`（可开 `allow-search` 搜索）。
- 输入时整体补全一个值，而不是在文本中间插入 —— 本库暂无自动补全组件，用 `reborn-select` 的远程搜索近似实现。
- 富文本编辑器里的提及（需要把提及渲染成不可编辑的胶囊）—— 本组件基于原生 input / textarea，只能插入纯文本，需改用富文本编辑器自带的提及插件。

## 用法

### 基础用法

`v-model` 绑定输入值，`options` 给候选项。输入 `@` 后按检索词过滤，选中项的 `value` 插入输入框并补一个空格。

```vue
<script setup lang="ts">
const value = ref("");
const options = [
  { value: "张伟", label: "张伟" },
  { value: "李娜", label: "李娜" },
  { value: "陈静", label: "陈静", disabled: true },
];
</script>

<template>
  <RebornMention v-model="value" :options="options" placeholder="输入 @ 试试" />
</template>
```

键盘操作：

| 按键 | 面板展开时 | 面板收起时 |
| --- | --- | --- |
| `↑` / `↓` | 移动指向，跳过禁用项，到头从另一端继续 | 浏览器默认行为 |
| `Enter` | 选中当前指向的选项（不换行、不提交表单） | 浏览器默认行为 |
| `Esc` | 收起面板，直到下一次输入或移动光标 | 浏览器默认行为 |
| `Backspace` | 按字符删除 | 开启整体删除时，光标在完整提及之后会整段删除 |

### 多个前缀

`prefix` 传数组时任一字符都能触发。`search` 与 `select` 的第二个参数都是命中的前缀，用它决定给哪一组选项：

```vue
<script setup lang="ts">
const prefix = ref("@");
const options = computed(() => (prefix.value === "#" ? topics : members));
</script>

<template>
  <RebornMention
    v-model="value"
    :options="options"
    :prefix="['@', '#']"
    @search="(_, p) => (prefix = p)"
  />
</template>
```

### 多行文本

`type`、`rows`、`autosize`、`size`、`clearable` 等输入框属性原样透传给 `RebornInput`。多行时面板锚定在前缀所在那一行，换行后输入 `@`，面板出现在那一行下方：

```vue
<template>
  <RebornMention v-model="value" :options="options" type="textarea" :rows="4" />
</template>
```

| 输入框 | 面板的纵向锚点 | 面板的横向锚点 |
| --- | --- | --- |
| 单行（默认） | 整个输入框的上下沿 | 输入框左边缘，面板与输入框等宽 |
| 多行 `type="textarea"` | 前缀所在那一行的上下沿 | 输入框左边缘，面板与输入框等宽 |

::tip
面板横向与输入框对齐，输入检索词时不会一格一格往右挪；多行输入的纵向位置和箭头仍跟随前缀。字符位置用一个排版相同的隐藏镜像元素测出来，输入框滚动后同样重新定位。输入框宽度变化时面板自动同步，视口两侧至少保留 8px；可用 `ui.dropdown` 或 `popperStyle.width` 自定义宽度。
::

### 远程搜索与加载

`:filter-option="false"` 关闭本地筛选，`options` 原样展示；在 `search(pattern, prefix)` 里请求数据并回填。`loading` 为 `true` 时即使没有选项也会展开面板，显示加载占位（`#loading` 插槽可替换）。

```vue
<script setup lang="ts">
const options = ref([]);
const loading = ref(false);

async function onSearch(pattern: string) {
  loading.value = true;
  options.value = await searchUsers(pattern);
  loading.value = false;
}
</script>

<template>
  <RebornMention v-model="value" :options="options" :filter-option="false" :loading="loading" @search="onSearch" />
</template>
```

自定义筛选同样走 `filterOption`，返回 `true` 保留该选项：

| `filterOption` | 效果 | 典型用途 |
| --- | --- | --- |
| 不传（默认） | 选项文本包含检索词，不区分大小写 | 本地成员列表 |
| `(pattern, option) => boolean` | 按返回值筛选 | 拼音、工号等多字段匹配 |
| `false` | 不筛选，`options` 原样展示 | 远程搜索 |

### 整体删除

默认退格按字符删。开启后，光标紧跟在「前缀 + 选项值 + 拆分符」之后按退格，整段一次删掉并派发 `whole-remove`：

| 写法 | 什么样的提及会整体删除 |
| --- | --- |
| `whole` | 选项值存在于 `options` 里的提及 |
| `:check-is-whole="(pattern, prefix) => boolean"` | 返回 `true` 的提及，不要求在 `options` 里；传了它就不必再开 `whole` |

```vue
<template>
  <RebornMention
    v-model="value"
    :options="options"
    whole
    @whole-remove="(pattern, prefix) => console.log(prefix + pattern)"
  />
</template>
```

### 自定义选项与面板

`#label` 作用域插槽拿到 `item` / `index` 自定义每一行；`#header` / `#footer` 与列表是兄弟节点，列表滚动时固定不动。

```vue
<template>
  <RebornMention v-model="value" :options="members">
    <template #label="{ item }">
      <span class="flex w-full items-center gap-2">
        {{ item.label }}
        <span class="ml-auto text-sm text-gray-5">{{ item.role }}</span>
      </span>
    </template>
    <template #header>
      项目成员
    </template>
  </RebornMention>
</template>
```

后端字段不叫 `value` / `label` / `disabled` 时，用 `props` 映射，不必先转换数据：

```vue
<template>
  <RebornMention :options="users" :props="{ value: 'account', label: 'nickname', disabled: 'locked' }" />
</template>
```

### 面板位置

`placement` 决定展开方向，放不下时自动翻到另一侧；`showArrow` 加一个指向前缀的箭头；`offset` 在默认间距（不带箭头 4px、带箭头 10px）之上再拉开距离。

| 写法 | 效果 | 典型用途 |
| --- | --- | --- |
| `placement="bottom"`（默认） | 向下展开 | 页面中上部的输入框 |
| `placement="top"` | 向上展开 | 贴在页面底部的评论框、聊天输入框 |
| `show-arrow` | 面板带箭头，箭头对准前缀字符 | 面板与输入框之间距离较大时指明来源 |

```vue
<template>
  <RebornMention v-model="value" :options="options" placement="top" show-arrow :offset="4" />
</template>
```

## API

### Props

| 属性名                 | 类型                                                      | 默认值                                                  | 描述                                                                                                   |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `modelValue` / v-model | `string`                                                  | `''`                                                    | 输入框的值；未绑定时组件内部维护。                                                                     |
| `options`              | `MentionOption[]`                                         | `[]`                                                    | 候选项，每项含 `value` / `label` / `disabled` 与任意自定义字段，`label` 缺省取 `value`。               |
| `props`                | `{ value?: string, label?: string, disabled?: string }`   | `{ value: 'value', label: 'label', disabled: 'disabled' }` | `options` 的字段映射，只覆盖传入的键。                                                              |
| `prefix`               | `string \| string[]`                                      | `'@'`                                                   | 触发字符，每项只能是 1 个字符；传数组时任一字符都能触发。                                              |
| `split`                | `string`                                                  | `' '`                                                   | 拆分符，只能是 1 个字符：选中后补在提及之后，也是判定提及结束的字符（换行同样算结束）。               |
| `filterOption`         | `false \| ((pattern: string, option: MentionOption) => boolean)` | -                                                | 自定义筛选，返回 `true` 保留；不传时按文本包含检索词筛选（不区分大小写），传 `false` 不筛选。         |
| `placement`            | `'bottom' \| 'top'`                                       | `'bottom'`                                              | 面板展开方向，放不下时自动翻到另一侧。                                                                 |
| `showArrow`            | `boolean`                                                 | `false`                                                 | 面板是否带指向前缀字符的箭头。                                                                         |
| `offset`               | `number`                                                  | `0`                                                     | 在默认间距（不带箭头 4px、带箭头 10px）之上的额外偏移，单位 px。                                       |
| `whole`                | `boolean`                                                 | `false`                                                 | 退格时是否把完整的提及一次删除；只对 `options` 里存在的值生效。                                        |
| `checkIsWhole`         | `(pattern: string, prefix: string) => boolean`            | -                                                       | 自定义是否整体删除；传入后不开 `whole` 也按它的返回值处理。                                            |
| `loading`              | `boolean`                                                 | `false`                                                 | 面板是否处于加载状态；加载中即使没有选项也会展开面板，Enter 不会选中。                                 |
| `popperClass`          | `string \| Record<string, boolean>`                       | -                                                       | 追加到面板外壳的类名，等价于 `ui.dropdown`。                                                           |
| `popperStyle`          | `string \| CSSProperties`                                 | -                                                       | 面板外壳的行内样式；`left` / `top` 由组件计算，写了也会被覆盖。                                        |
| `class`                | `any`                                                     | -                                                       | 追加到根容器的类名，宽度写在这里。                                                                     |
| `ui`                   | `MentionUI`                                               | `{}`                                                    | 按结构键覆盖面板各节点样式，键位见「自定义样式（ui）」。                                               |
| `inputUi`              | `InputUi`                                                 | -                                                       | 透传给内部 `RebornInput` 的 `ui`，覆盖输入框各节点样式。                                               |

其余属性（`type`、`placeholder`、`size`、`variant`、`disabled`、`clearable`、`rows`、`maxlength` 等）全部透传给内部的 `RebornInput`，取值见 [Input 输入框](/components/input-and-forms/reborn-input)。

### Emits

| 事件名              | 回调参数                                         | 描述                                                                         |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `update:modelValue` | `(value: string)`                                | 输入值变化（由 `defineModel` 生成），包括选中与整体删除引起的变化。          |
| `search`            | `(pattern: string, prefix: string)`              | 光标进入一个提及（输入前缀、在检索词里输入或移动光标）时触发。               |
| `select`            | `(option: MentionOption, prefix: string)`        | 选中选项、选项值已插入输入框后触发。                                         |
| `whole-remove`      | `(pattern: string, prefix: string)`              | 退格整体删除了一个提及后触发。                                               |
| `input`             | `(value: string)`                                | 输入值变化时触发，与 `update:modelValue` 同时派发。                          |

`focus`、`blur`、`change`、`clear`、`keydown` 等输入框事件透传自 `RebornInput`。

### Slots

| 插槽名    | 作用域参数                                 | 描述                                                                   |
| --------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `label`   | `{ item: MentionOption, index: number }`   | 自定义每一行选项的内容，替换默认的文本。                               |
| `loading` | -                                          | 替换加载中占位的内容，`loading` 为 `true` 时渲染。                     |
| `header`  | -                                          | 面板顶部的内容，列表滚动时不动。                                       |
| `footer`  | -                                          | 面板底部的内容，列表滚动时不动。                                       |

`prefix` / `suffix` / `prepend` / `append` / `password-icon` 插槽原样转交 `RebornInput`。

### Expose

| 方法名            | 签名                              | 描述                                                         |
| ----------------- | --------------------------------- | ------------------------------------------------------------ |
| `input`           | `RebornInput` 组件实例            | 内部输入框实例，可调用 `focus()` / `blur()` / `select()` 等。 |
| `dropdown`        | `HTMLElement \| null`             | 下拉面板元素，未展开时为 `null`。                            |
| `dropdownVisible` | `ComputedRef<boolean>`            | 下拉面板是否展开。                                           |

### 自定义样式（ui）

`ui` 按内部结构键覆盖下拉面板对应节点的类名；输入框本身的样式改 `inputUi`：

| 键名             | 说明                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `root`           | 根容器，默认 `relative w-full min-w-0`；`class` 也合并到这里。                                               |
| `dropdown`       | 面板外壳，默认与输入框等宽，最大宽度为视口宽度减 16px；使用 `rounded-lg border border-gray-3 bg-gray-1 shadow-lg`。传送到 `body`，位置由脚本写成行内的 `left` / `top`。 |
| `header`         | 页头，仅传了 `#header` 插槽时渲染。                                                                          |
| `list`           | 选项列表（滚动层），默认 `max-h-60 overflow-y-auto`，改最大高度写在这里。加载中不渲染。                     |
| `option`         | 单个选项，默认 `text-base text-gray-8` 与 6/4 内边距。                                                       |
| `optionActive`   | 键盘或鼠标当前指向的选项，默认 `bg-gray-2 text-gray-10`，与 `option` 合并。                                  |
| `optionDisabled` | 禁用选项，默认 `text-gray-5` 且不可点，与 `option` 合并。                                                    |
| `optionLabel`    | 选项文本。**仅在未使用 `#label` 插槽时渲染**，用了插槽 `ui.optionLabel` 随之失效。                          |
| `footer`         | 页脚，仅传了 `#footer` 插槽时渲染。                                                                          |
| `loading`        | 加载中占位，`loading` 为 `true` 时替代列表。                                                                 |
| `loadingIcon`    | 加载中的转圈图标。**传了 `#loading` 插槽时不渲染**。                                                         |
| `arrow`          | 指向前缀的箭头，仅 `showArrow` 开启时渲染；位置由脚本写成行内样式，不要在这里改 `left` / `top`。            |

```vue
<template>
  <RebornMention
    :options="options"
    :ui="{ dropdown: 'w-60', list: 'max-h-40', optionActive: 'bg-brand-1 text-primary' }"
    :input-ui="{ wrapper: 'rounded-lg' }"
  />
</template>
```

### CSS 变量

变量由 `app/components/reborn/ui/reborn-mention/RebornMention.vue` 在定位时写入面板，样式在 `reborn-mention.config.ts` 中使用。

| 变量名 | 对应取值 | 值 |
| --- | --- | --- |
| `--rb-mention-width` | 默认面板宽度 | 输入框外层的实际宽度，单位 px；随容器缩放自动更新 |

## 注意事项

- **插入的是 `value` 不是 `label`**。下拉框里显示 `label`，选中后写进输入框的是 `value`；两者不同时（如显示「张伟（前端）」、插入「张伟」）要分别给。
- **前缀不要求前面是空格**。从光标往前找到最近的前缀字符就算命中，邮箱 `a@b` 里的 `@` 也会弹出面板；不想在单词中间触发，就用 `filterOption` 或在 `search` 回调里自行判断。
- **没有选项就不展开**。筛选结果为空且不在 `loading` 时面板直接收起，不会弹一个「暂无数据」的空框；需要提示无结果时在 `#footer` 里自行展示。
- **整体删除只看光标前一个字符**。只有光标紧跟在拆分符之后、拆分符前面是完整提及时才整段删除；光标在提及中间按退格仍按字符删除，有选区时按选区删除。
- **输入法合成期间不弹面板**。`RebornInput` 在合成结束后才派发输入，打中文名时面板在选完候选词后才按完整的词筛选；合成中按 Enter 选的是输入法候选词，不会选中提及选项。
- **`popper-options` 不支持**。面板定位用的是本库的 `~/lib/floating`，不依赖 popper.js，`placement` / `offset` 之外的定位参数无处可传。
- **面板是 fixed 定位并传送到 `body`**。页面或任一祖先滚动、窗口缩放时组件会重算位置；放在 `transform` 祖先里也不会被裁切。
- **`class` 落在根容器，不落在输入框**。这与 `RebornInput`（`class` 落在输入框外壳）不同；要改输入框外壳的样式用 `inputUi.wrapper`。
