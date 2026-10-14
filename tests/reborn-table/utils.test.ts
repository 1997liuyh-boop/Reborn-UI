/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { TableColumn, TableRow, TableSort, TableSpan } from '../../app/components/reborn/ui/reborn-table/table.types';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, it } from 'node:test';
import {
  flattenRows,
  getColumnKey,
  getColumnWidth,
  getHeaderRows,
  getLeafColumns,
  getRowKey,
  getSpan,
  getSummary,
  getValue,
  processRows,
  toCssSize,
} from '../../app/components/reborn/ui/reborn-table/table.utils';

/** 冻结真实输入，原地排序或改写任意层级都会直接失败。 */
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const noSort: TableSort = { prop: '', order: null };

describe('getValue', () => {
  it('读取嵌套自有字段并保留零、布尔值、空串和 null', () => {
    const row = { user: { name: '小明', score: 0, active: false, note: '', value: null } };
    for (const [prop, value] of Object.entries(row.user)) {
      assert.equal(getValue(row, `user.${prop}`), value);
    }
  });

  it('缺失路径、空路径和中途遇到非对象时返回 undefined', () => {
    const row = { user: null, count: 3, name: '小明' };
    for (const path of [undefined, '', 'missing.value', 'user.name', 'count.name', 'name.length', '.name', 'name.']) {
      assert.equal(getValue(row, path), undefined);
    }
  });

  it('支持数组的数字路径', () => {
    assert.equal(getValue({ users: [{ name: '小明' }] }, 'users.0.name'), '小明');
  });

  it('每层只读自有属性，不读取原型链和危险键', () => {
    const nested = Object.assign(Object.create({ secret: 42 }), { own: '可读' });
    const row: TableRow = Object.assign(Object.create({ inherited: '不可读' }), { nested });
    assert.equal(getValue(row, 'inherited'), undefined);
    assert.equal(getValue(row, 'nested.secret'), undefined);
    assert.equal(getValue(row, 'nested.own'), '可读');
    const unsafe = JSON.parse('{"__proto__":{"value":1},"constructor":{"value":2},"prototype":{"value":3}}');
    for (const prop of ['__proto__.value', 'constructor.value', 'prototype.value', 'toString']) {
      assert.equal(getValue(unsafe, prop), undefined);
    }
    const dictionary = Object.assign(Object.create(null), { value: 7, hasOwnProperty: 9 });
    assert.equal(getValue(dictionary, 'value'), 7);
    assert.equal(getValue(dictionary, 'hasOwnProperty'), 9);
  });
});

describe('列键和行键', () => {
  it('列键按 columnKey、prop、索引依次回退，保留显式空串', () => {
    assert.equal(getColumnKey({ columnKey: 'custom', prop: 'name' }, 5), 'custom');
    assert.equal(getColumnKey({ prop: 'user.name' }), 'user.name');
    assert.equal(getColumnKey({ columnKey: '', prop: 'name' }), '');
    assert.equal(getColumnKey({}, 5), 'column-5');
    assert.equal(getColumnKey({}), 'column-0');
  });

  it('默认使用 id，支持路径和函数，并保留零与空串键', () => {
    const row = { id: 0, user: { key: 'nested' }, empty: '' };
    assert.equal(getRowKey(row, 9), 0);
    assert.equal(getRowKey(row, 9, 'user.key'), 'nested');
    assert.equal(getRowKey(row, 9, item => `row-${item.id}`), 'row-0');
    assert.equal(getRowKey(row, 9, 'empty'), '');
  });

  it('缺失、无效或继承而来的行键回退到索引', () => {
    for (const id of [undefined, null, false, {}, [], Number.NaN, Infinity]) {
      assert.equal(getRowKey({ id }, 7), 7);
    }
    assert.equal(getRowKey(Object.create({ id: 'inherited' }), 8), 8);
    assert.equal(getRowKey({}, 9, 'missing.key'), 9);
  });
});

describe('getColumnWidth', () => {
  it('宽度优先于最小宽度，识别数值、纯数字串和 px', () => {
    for (const width of [80, '80', '80px', ' 80px ']) {
      assert.equal(getColumnWidth({ width, minWidth: 150 }), 80);
    }
    assert.equal(getColumnWidth({ width: '80.5px' }), 80.5);
    assert.equal(getColumnWidth({ minWidth: '160px' }), 160);
  });

  it('无效宽度继续尝试最小宽度，最终使用类型默认值', () => {
    for (const width of [0, -10, Number.NaN, Infinity, '', ' ', 'auto', '80%', '2rem', '80px-extra', '-1px']) {
      assert.equal(getColumnWidth({ width, minWidth: 100 }), 100);
      assert.equal(getColumnWidth({ width, minWidth: width }), 120);
    }
  });

  it('特殊列默认 48，普通列默认 120，显式宽度仍优先', () => {
    for (const type of ['selection', 'radio', 'index', 'expand'] as const) {
      assert.equal(getColumnWidth({ type }), 48);
      assert.equal(getColumnWidth({ type, width: 60 }), 60);
    }
    assert.equal(getColumnWidth({ type: 'default' }), 120);
    assert.equal(getColumnWidth({}), 120);
  });
});

describe('getLeafColumns', () => {
  it('按原顺序提取叶列，隐藏组整组移除，全隐藏子列的组不变成叶列', () => {
    const columns: TableColumn[] = [
      { prop: 'a' },
      { hidden: true, children: [{ prop: 'b' }] },
      { children: [{ prop: 'c', hidden: true }, { children: [{ prop: 'd' }] }] },
      { children: [{ prop: 'e', hidden: true }] },
      { prop: 'f', children: [] },
    ];
    assert.deepEqual(getLeafColumns(freeze(columns)).map(column => column.prop), ['a', 'd', 'f']);
    assert.deepEqual(getLeafColumns([]), []);
  });

  it('多级继承 fixed，但子列显式 false 或 right 可覆盖父组', () => {
    const columns: TableColumn[] = [{ fixed: 'left', children: [
      { prop: 'a' },
      { fixed: 'right', children: [{ prop: 'b' }, { prop: 'c', fixed: false }] },
      { fixed: false, children: [{ prop: 'd' }] },
    ] }, { fixed: true, children: [{ prop: 'e' }] }];
    const snapshot = structuredClone(columns);
    assert.deepEqual(getLeafColumns(freeze(columns)).map(column => column.fixed), ['left', 'right', false, false, true]);
    assert.deepEqual(columns, snapshot);
  });

  it('保留格式化、渲染、筛选等函数和类名数组，不用序列化克隆', () => {
    const column: TableColumn = {
      prop: 'name', formatter: row => String(row.name), cellRender: scope => String(scope.row.name),
      headerRender: scope => scope.column.label, filterMethod: (value, row) => row.name === value,
      sortMethod: (a, b) => String(a.name).localeCompare(String(b.name)), selectable: row => !!row.id,
      className: ['selected'],
    };
    const [leaf] = getLeafColumns(freeze([{ fixed: 'left', children: [column] }]));
    for (const key of ['formatter', 'cellRender', 'headerRender', 'filterMethod', 'sortMethod', 'selectable', 'className'] as const) {
      assert.equal(leaf![key], column[key]);
    }
    assert.equal(leaf!.formatter!({ name: '保留功能' }, leaf!, '保留功能', 0), '保留功能');
    assert.equal(column.fixed, undefined);
  });
});

describe('getHeaderRows', () => {
  it('不等深的三级表头具有正确跨度和连续的可见叶列索引', () => {
    const columns: TableColumn[] = [
      { type: 'selection', label: '选择' },
      { prop: 'hidden', hidden: true },
      { label: '用户', fixed: 'left', children: [
        { prop: 'name', label: '姓名' },
        { label: '联系方式', children: [
          { prop: 'email', label: '邮箱' }, { prop: 'secret', hidden: true }, { prop: 'phone', label: '电话' },
        ] },
      ] },
      { prop: 'note', label: '备注' },
    ];
    const rows = getHeaderRows(freeze(columns));
    assert.deepEqual(rows.map(row => row.map(cell => [cell.column.label, cell.colSpan, cell.rowSpan, cell.start])), [
      [['选择', 1, 3, 0], ['用户', 3, 1, 1], ['备注', 1, 3, 4]],
      [['姓名', 1, 2, 1], ['联系方式', 2, 1, 2]],
      [['邮箱', 1, 1, 2], ['电话', 1, 1, 3]],
    ]);
    assert.equal(rows[2]![0]!.column.fixed, 'left');
  });

  it('不可见分支不增加表头深度或占用 start，空数组子列仍是叶列', () => {
    const rows = getHeaderRows([
      { children: [{ children: [{ hidden: true, prop: 'hidden' }] }] },
      { prop: 'visible', children: [] },
    ]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0]!.map(({ colSpan, rowSpan, start }) => ({ colSpan, rowSpan, start })), [{ colSpan: 1, rowSpan: 1, start: 0 }]);
    assert.deepEqual(getHeaderRows([]), []);
    assert.deepEqual(getHeaderRows([{ hidden: true }]), []);
  });
});

describe('processRows', () => {
  it('按嵌套字段稳定排序，不修改数组与行', () => {
    const rows = freeze([{ id: 'a', user: { score: 2 } }, { id: 'b', user: { score: 1 } }, { id: 'c', user: { score: 2 } }]);
    const columns = freeze([{ prop: 'user.score', sortable: true }]);
    const ascending = processRows(rows, columns, { prop: 'user.score', order: 'ascending' }, {});
    const descending = processRows(rows, columns, { prop: 'user.score', order: 'descending' }, {});
    assert.deepEqual(ascending.map(row => row.id), ['b', 'a', 'c']);
    assert.deepEqual(descending.map(row => row.id), ['a', 'c', 'b']);
    assert.equal(ascending[0], rows[1]);
    assert.deepEqual(rows.map(row => row.id), ['a', 'b', 'c']);
  });

  it('字符串按本地规则排序，自定义比较函数决定顺序且相等时稳定', () => {
    const rows = freeze([{ name: 'b', rank: 2 }, { name: 'a', rank: 1 }, { name: 'c', rank: 2 }]);
    assert.deepEqual(processRows(rows, [{ prop: 'name', sortable: true }], { prop: 'name', order: 'ascending' }, {}).map(row => row.name), ['a', 'b', 'c']);
    const columns: TableColumn[] = [{ prop: 'name', sortable: true, sortMethod: (a, b) => Number(a.rank) - Number(b.rank) }];
    assert.deepEqual(processRows(rows, columns, { prop: 'name', order: 'descending' }, {}).map(row => row.name), ['b', 'c', 'a']);
  });

  it('多个 NaN 或空值视作相等，降序也不颠倒它们的先后', () => {
    for (const values of [[Number.NaN, Number.NaN, Number.NaN], [null, undefined, null]]) {
      const rows = values.map((value, index) => ({ id: index, value }));
      for (const order of ['ascending', 'descending'] as const) {
        assert.deepEqual(processRows(rows, [{ prop: 'value', sortable: true }], { prop: 'value', order }, {}).map(row => row.id), [0, 1, 2]);
      }
    }
  });

  it('未排序、不可排序和未知排序字段都保留输入顺序', () => {
    const rows = freeze([{ value: 2 }, { value: 1 }]);
    for (const sortable of [undefined, false, 'custom'] as const) {
      assert.deepEqual(processRows(rows, [{ prop: 'value', sortable }], { prop: 'value', order: 'ascending' }, {}), rows);
    }
    assert.deepEqual(processRows(rows, [{ prop: 'value', sortable: true }], { prop: 'value', order: null }, {}), rows);
    assert.deepEqual(processRows(rows, [{ prop: 'value', sortable: true }], { prop: 'other', order: 'ascending' }, {}), rows);
  });

  it('同列多值取或、跨列取且，默认使用严格等值并保留 false 和零', () => {
    const rows = freeze([
      { id: 1, status: 0, enabled: false }, { id: 2, status: 1, enabled: false },
      { id: 3, status: 2, enabled: false }, { id: 4, status: 0, enabled: true }, { id: 5, status: '0', enabled: false },
    ]);
    const columns = [{ prop: 'status', columnKey: 'state' }, { prop: 'enabled' }];
    assert.deepEqual(processRows(rows, columns, noSort, freeze({ state: [0, 1], enabled: [false] })).map(row => row.id), [1, 2]);
    assert.deepEqual(processRows(rows, columns, noSort, { state: [], unknown: [123] }), rows);
  });

  it('filteredValue 优先于内部筛选，显式空数组会清除内部筛选', () => {
    const rows = freeze([{ status: 0 }, { status: 1 }, { status: 2 }]);
    assert.deepEqual(processRows(rows, [{ prop: 'status', filteredValue: [1] }], noSort, { status: [0] }), [rows[1]]);
    assert.deepEqual(processRows(rows, [{ prop: 'status', filteredValue: [] }], noSort, { status: [0] }), rows);
    assert.deepEqual(processRows(rows, [{ prop: 'status', filteredValue: [2] }], noSort, {}), [rows[2]]);
  });

  it('自定义筛选接收值、原始行及列，可筛选分组内没有 prop 的列', () => {
    const rows = freeze([{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }]);
    const column: TableColumn = { columnKey: 'nameFilter', filterMethod(value, row, current) {
      assert.ok(rows.includes(row as typeof rows[number]));
      assert.equal(current.columnKey, 'nameFilter');
      return String(row.name).startsWith(String(value));
    } };
    assert.deepEqual(processRows(rows, [{ children: [column] }], noSort, { nameFilter: ['A', 'B'] }), [rows[0], rows[1]]);
    assert.deepEqual(processRows(rows, [{ filterMethod: (_, row) => row.name === 'Alpha' }], noSort, { 'column-0': [true] }), [rows[0]]);
  });

  it('sortable=custom 仅跳过排序，本地筛选仍执行', () => {
    const rows = freeze([{ score: 3, status: true }, { score: 1, status: true }, { score: 2, status: false }]);
    const columns: TableColumn[] = [
      { prop: 'score', sortable: 'custom', sortMethod: () => { throw new Error('不应本地排序'); } }, { prop: 'status' },
    ];
    assert.deepEqual(processRows(rows, columns, { prop: 'score', order: 'ascending' }, { status: [true] }), [rows[0], rows[1]]);
  });

  it('树筛选保留命中节点的全部祖先，移除无关分支且不改写原树', () => {
    const rows: TableRow[] = freeze([
      { id: 'root', status: 'no', children: [
        { id: 'middle', status: 'no', children: [{ id: 'hit', status: 'yes' }, { id: 'miss', status: 'no' }] },
        { id: 'discard', status: 'no' },
      ] },
      { id: 'other', status: 'no' },
    ]);
    const before = structuredClone(rows);
    const result = processRows(rows, [{ prop: 'status' }], noSort, { status: ['yes'] });
    assert.deepEqual(result, [{ id: 'root', status: 'no', children: [
      { id: 'middle', status: 'no', children: [{ id: 'hit', status: 'yes' }] },
    ] }]);
    assert.deepEqual(rows, before);
    assert.deepEqual(processRows(rows, [{ prop: 'status' }], noSort, { status: ['absent'] }), []);
  });

  it('每个节点独立满足跨列条件，不能拼接祖先与子孙的命中结果', () => {
    const rows = [{ status: 1, enabled: false, children: [{ status: 0, enabled: true }] }];
    assert.deepEqual(processRows(rows, [{ prop: 'status' }, { prop: 'enabled' }], noSort, { status: [1], enabled: [true] }), []);
    assert.deepEqual(processRows(rows, [{ prop: 'status' }], noSort, { status: [1] }), [{ status: 1, enabled: false, children: [] }]);
  });

  it('树根与每组兄弟分别稳定排序，支持自定义 children 字段', () => {
    const rows = freeze([
      { id: 'b', score: 2, nodes: [{ id: 'b2', score: 2 }, { id: 'b1', score: 1 }, { id: 'b3', score: 2 }] },
      { id: 'a', score: 1, nodes: [{ id: 'a2', score: 8 }, { id: 'a1', score: 5 }] },
    ]);
    const result = processRows(rows, [{ prop: 'score', sortable: true }], { prop: 'score', order: 'ascending' }, {}, { children: 'nodes' });
    assert.deepEqual(result, [
      { id: 'a', score: 1, nodes: [{ id: 'a1', score: 5 }, { id: 'a2', score: 8 }] },
      { id: 'b', score: 2, nodes: [{ id: 'b1', score: 1 }, { id: 'b2', score: 2 }, { id: 'b3', score: 2 }] },
    ]);
    assert.equal(rows[0]!.nodes[0]!.id, 'b2');
  });

  it('remote 原样返回同一数组，不执行筛选或排序回调', () => {
    const rows = freeze([{ id: 1, children: [{ id: 2 }] }]);
    const columns: TableColumn[] = [{ prop: 'id', sortable: true, filteredValue: [9],
      sortMethod: () => { throw new Error('远程不能排序'); }, filterMethod: () => { throw new Error('远程不能筛选'); } }];
    assert.equal(processRows(rows, columns, { prop: 'id', order: 'ascending' }, { id: [9] }, { remote: true }), rows);
  });
});

describe('flattenRows', () => {
  const rows = freeze([
    { id: 'root', children: [{ id: 'branch', children: [{ id: 'leaf' }] }, { id: 0 }] },
    { id: 'other', children: [] },
  ]);

  it('只展开已展开路径，记录层级、连续可见索引和子节点状态', () => {
    const result = flattenRows(rows, ['root']);
    assert.deepEqual(result.map(({ key, level, index, hasChildren }) => ({ key, level, index, hasChildren })), [
      { key: 'root', level: 0, index: 0, hasChildren: true },
      { key: 'branch', level: 1, index: 1, hasChildren: true },
      { key: 0, level: 1, index: 2, hasChildren: false },
      { key: 'other', level: 0, index: 3, hasChildren: false },
    ]);
    assert.equal(result[0]!.row, rows[0]);
    assert.equal(result[1]!.row, rows[0]!.children[0]);
    assert.deepEqual(flattenRows(rows, ['branch']).map(row => row.key), ['root', 'other']);
  });

  it('includeCollapsed 递归返回整棵树，不需要展开键', () => {
    const result = flattenRows(rows, [], undefined, undefined, true);
    assert.deepEqual(result.map(({ key, level, index }) => [key, level, index]), [
      ['root', 0, 0], ['branch', 1, 1], ['leaf', 2, 2], [0, 1, 3], ['other', 0, 4],
    ]);
    assert.deepEqual(flattenRows(rows, ['root', 'branch']), result);
  });

  it('支持路径行键、自定义子节点字段和函数行键，展开键区分数字与字符串', () => {
    const data = freeze([{ meta: { key: 0 }, nodes: [{ meta: { key: 'child' } }] }]);
    assert.deepEqual(flattenRows(data, [0], 'meta.key', 'nodes').map(row => row.key), [0, 'child']);
    assert.equal(flattenRows(data, ['0'], 'meta.key', 'nodes').length, 1);
    assert.deepEqual(flattenRows(data, ['key-0'], row => `key-${getValue(row, 'meta.key')}`, 'nodes').map(row => row.key), ['key-0', 'key-child']);
  });

  it('没有行键时回退到平铺索引，空数组与非数组 children 不视作子节点', () => {
    const result = flattenRows([{ children: [{}] }, { children: null }, { children: 'invalid' }], [], undefined, undefined, true);
    assert.deepEqual(result.map(({ key, index, level, hasChildren }) => [key, index, level, hasChildren]), [
      [0, 0, 0, true], [1, 1, 1, false], [2, 2, 0, false], [3, 3, 0, false],
    ]);
    assert.deepEqual(flattenRows([], []), []);
  });
});

describe('getSummary', () => {
  it('首列为合计文案，其余仅累加有限数字与非空数字串', () => {
    const data = freeze([
      { price: 2, nested: { value: '3.5' } }, { price: '4', nested: { value: -1 } },
      { price: '', nested: { value: null } }, { price: ' ', nested: { value: true } },
      { price: null, nested: { value: Number.NaN } }, { price: false, nested: { value: Infinity } },
      { price: 'bad', nested: { value: 'Infinity' } }, { price: {}, nested: { value: [] } },
    ]);
    assert.deepEqual(getSummary([{ prop: 'price' }, { prop: 'price' }, { prop: 'nested.value' }, { prop: 'missing' }], data, '总计'), ['总计', 6, 2.5, '']);
  });

  it('合法的零可以合计；全无有效数字、无字段及特殊类型列留空', () => {
    const columns: TableColumn[] = [
      { prop: 'name' }, { prop: 'zero' }, { prop: 'invalid' }, {},
      ...(['selection', 'radio', 'index', 'expand'] as const).map(type => ({ type, prop: 'zero' })),
    ];
    assert.deepEqual(getSummary(columns, [{ zero: 0, invalid: false }, { zero: '0', invalid: '' }], '合计'), ['合计', 0, '', '', '', '', '', '']);
    assert.deepEqual(getSummary(columns.slice(0, 2), [], '合计'), ['合计', '']);
    assert.deepEqual(getSummary([], [{ value: 1 }], '合计'), []);
  });
});

describe('getSpan', () => {
  it('缺省为 1，接受元组与对象，保留用于隐藏单元格的零', () => {
    assert.deepEqual(getSpan(undefined), { rowspan: 1, colspan: 1 });
    assert.deepEqual(getSpan([2, 3]), { rowspan: 2, colspan: 3 });
    assert.deepEqual(getSpan({ rowspan: 2, colspan: 1 }), { rowspan: 2, colspan: 1 });
    assert.deepEqual(getSpan([0, 0]), { rowspan: 0, colspan: 0 });
    assert.deepEqual(getSpan([0, 2]), { rowspan: 0, colspan: 2 });
  });

  it('每个无效跨度独立回退为 1，不取绝对值、不截断小数', () => {
    for (const value of [-1, 1.5, Number.NaN, Infinity]) {
      assert.deepEqual(getSpan([value, 2]), { rowspan: 1, colspan: 2 });
      assert.deepEqual(getSpan({ rowspan: 2, colspan: value }), { rowspan: 2, colspan: 1 });
    }
    // 模拟 JavaScript 调用方传入缺少第二项的元组。
    assert.deepEqual(getSpan([2] as unknown as TableSpan), { rowspan: 2, colspan: 1 });
  });
});

describe('toCssSize', () => {
  it('数字和纯数字字符串补 px，保留小数、零和负值', () => {
    for (const [value, expected] of [[0, '0px'], [12.5, '12.5px'], [-2, '-2px'], ['80', '80px'], [' 80 ', '80px'], ['.5', '.5px'], ['-2.5', '-2.5px']] as const) {
      assert.equal(toCssSize(value), expected);
    }
  });

  it('保留原有 CSS 单位和表达式，未指定或无效数字返回 undefined', () => {
    for (const value of ['100%', '12px', '3rem', 'auto', 'calc(100% - 20px)', 'var(--height)']) {
      assert.equal(toCssSize(value), value);
    }
    for (const value of [undefined, '', ' ', Number.NaN, Infinity]) {
      assert.equal(toCssSize(value), undefined);
    }
  });

  it('超长数值及无效后缀在线性时间内处理，不触发正则灾难性回溯', () => {
    // 子进程超时能终止同步正则，避免阻塞整个测试运行器；不依赖机器级微秒计时。
    const source = new URL('../../app/components/reborn/ui/reborn-table/table.utils.ts', import.meta.url).href;
    const script = `
      import assert from 'node:assert/strict';
      import { getColumnWidth, toCssSize } from ${JSON.stringify(source)};
      const digits = '9'.repeat(100_000);
      assert.equal(toCssSize(digits), digits + 'px');
      assert.equal(getColumnWidth({ width: digits, minWidth: 80 }), 80);
      for (const value of [digits + 'x', digits + '.0x', '.' + digits + 'x']) {
        assert.equal(toCssSize(value), value);
        assert.equal(getColumnWidth({ width: value }), 120);
      }
    `;
    assert.doesNotThrow(() => execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
      cwd: new URL('../../', import.meta.url), timeout: 5000, stdio: 'pipe',
    }));
  });
});
