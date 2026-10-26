# 整改前测试基线（基线提交 d0474cc，npx tsx --test "tests/**/*.test.ts"）

# tests 692
# pass 676
# fail 16

## 整改前已失败的用例

- not ok 51 - 平铺菜单切换可中断，浮层持久化与销毁模式均能恢复，关闭动画开关生效
- not ok 197 - 向上展开从底部向上增长，传送居中对齐的底边始终贴住触发器
- not ok 198 - 向上展开从底部向上增长，传送终点对齐的底边始终贴住触发器
- not ok 38 - tests\\reborn-table\\component.test.ts
- not ok 39 - tests\\reborn-table\\demo.test.ts
- not ok 287 - 真实滚动组件支持立即双轴定位、联合平滑滚动及实际表头高度测量
- not ok 44 - tests\\reborn-table\\tooltip.test.ts
- not ok 371 - 共享过渡保留缩放与平移，反向切换连续，完成后恢复定位和动画样式
- not ok 372 - 折叠高度实际插值，快速开关后恢复自动高度，减少动态立即完成
- not ok 377 - 未使用 item 时保留 title 插槽及其作用域
- not ok 553 - Button 声明独立形状参数，描边圆形不变为实底配色
- not ok 554 - Button text 圆形及 Badge 圆形继承表单尺寸
- not ok 555 - 圆形按钮加载时禁用，并用加载动画替换原图标
- not ok 556 - 独立形状不改变变体禁用色，兼容圆形仍保留灰阶底色
- not ok 557 - 圆形 Badge 保留数字零，纯图标不插入空标签
- not ok 558 - Badge 形状不影响默认内容和关闭插槽
