/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

it('25 个独立表格示例与文档用法同名同序，保留顶部交互演练场', () => {
  const demo = readFileSync('app/components/reborn/examples/reborn-table/RebornTableDemo.vue', 'utf8');
  const doc = readFileSync('content/2.components/data/reborn-table.md', 'utf8');
  const expected = [
    '基础表格', '带斑马纹表格', '带边框表格', '带状态表格', '显示溢出工具提示的表格',
    '固定表头', '固定列', '固定列和表头', '流体高度', '多级表头', '单选', '多选', '排序', '拖拽排序', '筛选',
    '自定义列模板', '自定义表头', '展开行', '树形数据与懒加载', '可选择的树形数据',
    '表尾合计行', '合并行或列', '自定义索引', '表格布局', 'Tooltip 自定义',
  ];
  const sections = [...demo.matchAll(/<DemoSection\s+title="([^"]+)"/g)].map(match => match[1]);
  const usage = doc.split('## 用法')[1]?.split('## API')[0] ?? '';
  const headings = [...usage.matchAll(/^### (.+)$/gm)].map(match => match[1]!.trim());
  assert.deepEqual(sections, expected);
  assert.deepEqual(headings, expected);
  assert.ok(demo.indexOf('<Playground') < demo.indexOf('<DemoSection'));
});
