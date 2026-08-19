---
title: 字符上提
description: 用于让一段文字逐字符错落上提进场的文字动画组件。
category: 文字动画
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="LetterPullupDemo.vue" config="LetterPullupConfig" componentId="letter-pullup" :componentFiles='["LetterPullup.vue"]'}

#api

## API

| 属性名 | 类型     | 默认值                    | 描述                             |
| ------ | -------- | ------------------------- | -------------------------------- |
| `class`| `string` | `-`                       | 应用于组件的类名。               |
| `words`| `string` | `Staggered Letter Pull Up`| 要做动画的文字。                 |
| `delay`| `number` | `0.05`                    | 每个字符动画的延迟（秒）。       |

#credits

- 感谢 [SivaReddy Uppathi](https://github.com/sivareddyuppathi) 提供该组件。
- 灵感来自 [Magic UI](https://magicui.design/docs/components/letter-pullup)。

::
