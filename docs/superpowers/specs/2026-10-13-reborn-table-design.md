# RebornTable 设计

用户已确认 Web 端表格方案并要求开始；文字直接沿用 text-base 的 14px / 22px，不局部覆盖行高。

## 范围

- 独立实现，不依赖 Element Plus、Arco 或 Ant Design；API 命名以 Element Plus 为主。
- RebornTable + 声明式 RebornTableColumn，也可传 columns；两种入口不混合，columns 优先。
- 基础、斑马纹、边框、固定表头、固定列、分组表头、选择、排序筛选、分页、展开、树、合并、合计、插槽。
- 复用 RebornScrollbar / RebornCheckbox / RebornPagination / RebornPopover，不修改既有组件。
- 不实现虚拟滚动、内置编辑器、拖拽列宽和拖拽排序，不发布 npm、不提交已有工作区改动。

## 契约

data 只读；rowKey 默认 id，缺少时基础展示可用索引，但跨页选择和树数据必须提供稳定唯一键。列使用 prop/label/width/minWidth/fixed/align/type/sortable/filters/formatter/children。排序 ascending/descending/null，sortable=custom 仅发事件。remote 为 true 时分页、排序筛选交给调用方。选择、展开、当前行、页码和页容量提供具名 v-model。分页默认关闭；开启后筛选与排序先于分页，树表以根节点分页。

标题与内容 font-medium text-base text-gray-9 tracking-normal；lg/md/sm 单行高度 56/48/36px，默认 md。悬停和可选表头背景 gray-2，分隔线 gray-3。固定列使用不透明底色并跟随整行状态；多行内容可撑高。

## 结构与验证

table.types.ts 类型契约；table.utils.ts 无副作用数据计算；table.state.ts 管理受控状态与事件；TableView.ts 渲染语义化表格与测量固定布局；RebornTable.vue 公开 API 并在渲染上下文解析列插槽，确保 SSR 首帧正确；RebornTableColumn.vue 仅声明列。

测试覆盖纯函数、真实组件 SSR、内存渲染器交互、状态更新、禁选与跨页选择、插槽、树与分组表头、危险 HTML 转义及固定列布局。最后执行 ESLint、registry 构建、知识库构建/校验与全量测试。
