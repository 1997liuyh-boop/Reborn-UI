# RebornProgress 设计

用户已在任务中批准方案（2026-09-08）。仅实现 Web，新增 reborn-progress，保留 AnimatedCircularProgressBar。

- type 为 line/circle/dashboard；steps 大于零启用对应步骤形态。
- percent 为受控数值，归一化到 0–100，不自动推断成功状态。
- status 为 default/success/error；自定义颜色优先于状态颜色；默认内容在成功/失败时显示图标，format 和默认插槽可覆盖。
- size 为 sm/md/lg；直线高度 6/8/16px；普通环外径 48/76/114px、厚度 4/6/6px；步骤环厚度 6/8/16px；步骤直线宽度 2/32/32px。步骤间隔 2px。
- 圆环与仪表盘使用 SVG 实际像素坐标，仪表盘底部缺口为 90°；步骤使用平端保证间距。
- strokeColor 支持纯色、步骤颜色数组、{ stops: [{ offset, color }], angle? } 渐变。segments 使用 { percentage, color } 累计终点定义固定颜色区间。
- textInside 只改变直线文字位置，不改变高度；format 返回字符串；默认插槽暴露 percent/status。
- 非有限进度回退为 0；步骤数取整并限制至 1000，过密圆环缩小间距防止反向弧。
- 静态样式使用 Tailwind 与 tv 配置，动态几何用 SVG 属性或 style。注释中文，模板不含 TS 断言。
- Demo 遵循 RebornButtonDemo：演练场在前、场景分节在后。文档、registry 与知识库 id 一致，生成物通过命令生成。
