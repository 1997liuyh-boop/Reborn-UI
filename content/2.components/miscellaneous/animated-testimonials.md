---
title: 动态评价
description: 用于轮播展示用户评价（头像、姓名、职称、引言）并支持自动播放的组件。
category: 杂项
tags: [css, tailwind, aceternity-ui]
---

::ComponentViewer{demoFile="AnimatedTestimonialsDemo.vue" config="AnimatedTestimonialsConfig" componentId="animated-testimonials" :componentFiles='["AnimatedTestimonials.vue"]'}

#api

## API

| 属性名          | 类型            | 默认值 | 描述                                                     |
| --------------- | --------------- | ------ | -------------------------------------------------------- |
| `testimonials`  | `Testimonial[]` | `[]`   | 评价对象数组，包含引用、姓名、头像与职称。               |
| `autoplay`      | `boolean`       | `false`| 是否自动轮播评价。                                       |
| `duration`      | `number`        | `5000` | 自动切换到下一条评价前等待的时间（毫秒）。               |

### Testimonial 对象

每个评价对象需包含以下字段：

| 属性          | 类型     | 描述                               |
| ------------- | -------- | ---------------------------------- |
| `quote`       | `string` | 评价文本。                         |
| `name`        | `string` | 提供评价的人员姓名或实体。         |
| `designation` | `string` | 评价者的职位/角色（如 CEO、用户）。|
| `image`       | `string` | 评价者头像或图片的 URL。           |

#credits

- 移植自 [Aceternity UI Animated Testimonials](https://ui.aceternity.com/components/animated-testimonials)。

::
