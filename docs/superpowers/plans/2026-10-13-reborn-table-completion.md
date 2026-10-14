# RebornTable 能力补齐执行计划

沿用用户批准方案，不重构底层，不提交或发布。保留 checkbox 居中、合并悬停、边框、双轴复位及当前行品牌二阶高亮。

- [x] 主线程：先添加失败测试，再接入 `fixedHeader`（默认 true，仅有滚动高度时启用）、`tableLayout`（默认 fixed）。
- [x] 状态任务：先测试再实现 `lazy` / `load` / `treeProps.hasChildren`，覆盖异步去重、空结果、失败重试、过期结果和选择。
- [x] 主线程：复用 RebornTooltip，真实溢出检测，表/列级 options、formatter 与 tooltip 插槽；覆盖优先级和键盘。
- [x] 文档任务：Playground 保留，24 个同名同序 DemoSection 与用法章节；同步 API 和知识库 overrides。
- [x] 集成：测试、ESLint、浏览器交互、registry build、KB build/check；检查相关类型错误。

影响分析：Table 尚未进入现有图谱，impact 返回 UNKNOWN，不能视作低风险；以文本引用确认 Table、Demo、测试调用范围并用回归覆盖。共享组件不修改。

审查补充：Tooltip 插槽子组件独立更新已补 DOM 内容监听及失败→通过测试；索引 Demo 已移除重复页偏移。懒加载原地重排缓存和子节点响应式已追加回归，保留同步失效保护。

验证：全仓 410 项测试通过，其中 Table 120 项；修改文件 ESLint 通过；registry 构建及 162 组件知识库校验通过。浏览器验证 24 示例、固定表头开关、懒加载、Tooltip 键盘与插槽、第二页编号、双轴复位及三档 checkbox 几何。类型检查仍有其他文件的 270 条既有错误，Table 相关文件无报错。
