import type { TableKey, TableModels, TableNotify, TableProps, TableRow, TableTreeNode } from '../../app/components/reborn/ui/reborn-table/table.types';
/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { computed, createRenderer, createSSRApp, effectScope, nextTick, reactive, ref, toRaw } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { useTableState } from '../../app/components/reborn/ui/reborn-table/table.state';

function createState(initial: TableProps = {}, expanded: TableKey[] = []) {
  // 保留运行时深响应，不递归展开样式插槽类型。
  const props = reactive<object>({ data: [{ id: 1, amount: 10 }, { id: 2, amount: 20 }, { id: 3, amount: 30 }], rowKey: 'id', ...initial }) as TableProps;
  const models: TableModels = { selectedKeys: ref([]), expandedRowKeys: ref(expanded), currentRowKey: ref(), currentPage: ref(1), pageSize: ref(2) };
  const events: { name: string; args: unknown[] }[] = [];
  const notify = ((name: string, ...args: unknown[]) => events.push({ name, args })) as TableNotify;
  const scope = effectScope();
  const state = scope.run(() => useTableState(props, computed(() => props.columns ?? []), models, notify))!;
  return { props, models, state, events, stop: () => scope.stop() };
}

it('多选全选跳过禁选行，并支持取消半选', async () => {
  const t = createState({ columns: [{ type: 'selection', selectable: row => row.id !== 2 }] });
  t.state.toggleAllSelection();
  assert.deepEqual(t.models.selectedKeys.value, [1, 3]);
  assert.equal(t.state.allSelected.value, true);
  t.state.toggleRowSelection(t.props.data![0]!);
  assert.equal(t.state.indeterminate.value, true);
  t.state.toggleRowSelection(t.props.data![1]!);
  assert.deepEqual(t.models.selectedKeys.value, [3]);
  t.state.clearSelection();
  await nextTick();
  assert.deepEqual(t.state.getSelectionRows(), []);
  t.stop();
});

it('选择保留按行键工作，更新同键对象时返回新记录', async () => {
  const t = createState({ columns: [{ type: 'selection', reserveSelection: true }] });
  t.state.toggleRowSelection(t.props.data![0]!, true);
  t.props.data = [{ id: 9, amount: 90 }];
  await nextTick();
  assert.deepEqual(t.models.selectedKeys.value, [1]);
  assert.equal(t.state.getSelectionRows()[0]!.amount, 10);
  t.props.data = [{ id: 1, amount: 99 }];
  await nextTick();
  assert.equal(t.state.getSelectionRows()[0]!.amount, 99);
  t.props.columns = [{ type: 'selection', reserveSelection: false }];
  t.props.data = [];
  await nextTick();
  assert.deepEqual(t.models.selectedKeys.value, []);
  t.stop();
});

it('本地先筛选排序再分页，页码越界自动钳制', async () => {
  const t = createState({ pagination: true, columns: [{ prop: 'amount', sortable: true, filters: [{ text: '20', value: 20 }] }] });
  t.state.sort('amount', 'descending');
  assert.deepEqual(t.state.visibleRows.value.map(item => item.row.amount), [30, 20]);
  t.state.setPage(2);
  assert.equal(t.state.visibleRows.value.length, 1);
  t.state.setFilter('amount', [20]);
  assert.equal(t.models.currentPage.value, 1);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.row.amount), [20]);
  t.models.currentPage.value = 99;
  await nextTick();
  assert.equal(t.state.page.value, 1);
  t.stop();
});

it('远程模式只发出查询状态，不重复处理当前页数据', () => {
  const t = createState({ remote: true, pagination: { total: 100 }, columns: [{ prop: 'amount', sortable: 'custom' }] });
  t.state.setPage(8);
  t.state.sort('amount', 'descending');
  assert.deepEqual(t.state.visibleRows.value.map(item => item.row.amount), [10, 20, 30]);
  assert.ok(t.events.some(event => event.name === 'sort-change'));
  assert.ok(t.events.some(event => event.name === 'change'));
  t.stop();
});

it('树按根节点分页且展开独立，合计使用过滤后的全部根节点', () => {
  const t = createState({ data: [{ id: 1, amount: 5, children: [{ id: 11, amount: 8 }] }, { id: 2, amount: 6 }], pagination: true, columns: [{ prop: 'id' }, { prop: 'amount' }] });
  t.models.pageSize.value = 1;
  assert.equal(t.state.visibleRows.value.length, 1);
  t.state.toggleRowExpansion(t.props.data![0]!, true);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
  assert.deepEqual(t.state.summary.value, ['合计', 11]);
  t.stop();
});

it('单选替换旧选择，加载中禁止内置状态切换', () => {
  const t = createState({ columns: [{ type: 'radio' }] });
  t.state.toggleRowSelection(t.props.data![0]!, true);
  t.state.toggleRowSelection(t.props.data![1]!, true);
  assert.deepEqual(t.models.selectedKeys.value, [2]);
  t.props.loading = true;
  t.state.toggleRowSelection(t.props.data![2]!, true);
  t.state.setPage(2);
  assert.deepEqual(t.models.selectedKeys.value, [2]);
  assert.equal(t.models.currentPage.value, 1);
  t.stop();
});

it('缺省键在排序筛选后仍指向源行，选择条件使用可见索引', () => {
  const t = createState({ data: [{ name: '甲', amount: 20 }, { name: '乙', amount: 10 }], columns: [{ type: 'selection', selectable: (_, index) => index === 0 }, { prop: 'amount', sortable: true }] });
  t.state.sort('amount', 'ascending');
  const item = t.state.visibleRows.value[0]!;
  t.state.toggleRowSelection(item.row, true);
  assert.equal(t.state.getSelectionRows()[0]?.name, '乙');
  assert.equal(t.state.selectedSet.value.has(item.key), true);
  t.state.clearSelection();
  t.state.setFilter('amount', [10]);
  t.state.toggleAllSelection();
  assert.equal(t.state.getSelectionRows()[0]?.name, '乙');
  t.stop();
});

it('无显式键的树祖先被筛选克隆后仍使用源身份', () => {
  const t = createState({ data: [{ name: '甲' }, { name: '乙', children: [{ name: '目标' }, { name: '其他' }] }], columns: [{ type: 'selection' }, { prop: 'name' }] });
  t.state.setFilter('name', ['目标']);
  const item = t.state.visibleRows.value[0]!;
  assert.equal(item.key, 1);
  t.state.toggleRowSelection(item.row, true);
  assert.equal(t.state.getSelectionRows()[0]?.name, '乙');
  t.stop();
});

it('远程总数减少时自动回页并发送新查询条件', async () => {
  const t = createState({ remote: true, pagination: { total: 100 } });
  t.state.setPage(8);
  t.events.length = 0;
  t.props.pagination = { total: 5 };
  await nextTick();
  assert.equal(t.models.currentPage.value, 3);
  assert.ok(t.events.some(event => event.name === 'change' && (event.args[0] as { page: number }).page === 3));
  t.stop();
});

/** 使用真实客户端挂载生命周期，无需浏览器 DOM。 */
function createClientState(initial: TableProps, expanded: TableKey[] = []) {
  const renderer = createRenderer<object, object>({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
    parentNode: () => null, nextSibling: () => null,
  });
  let result!: ReturnType<typeof createState>;
  const app = renderer.createApp({ setup() {
    result = createState(initial, expanded);
    return () => null;
  } });
  app.mount({});
  return { ...result, stop: () => app.unmount() };
}

function createLoader() {
  const requests: { row: TableRow; node: TableTreeNode; resolve: (children: TableRow[]) => void }[] = [];
  const load = (row: TableRow, node: TableTreeNode, resolve: (children: TableRow[]) => void) => { requests.push({ row, node: { ...node }, resolve }); };
  return { requests, load };
}

it('懒加载首次展开才请求，重复展开不重复请求，子节点不写回源数据', async () => {
  const loader = createLoader();
  const data = Object.freeze([Object.freeze({ id: 1, hasChildren: true })]);
  const t = createClientState({ data: [...data], lazy: true, load: loader.load });
  assert.equal(t.state.visibleRows.value[0]!.hasChildren, true);
  assert.equal(loader.requests.length, 0);
  t.state.toggleRowExpansion(t.props.data![0]!, true);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  assert.deepEqual(loader.requests[0]!.node, { level: 0, expanded: true, loading: true, loaded: false });
  assert.equal(loader.requests[0]!.row, t.props.data![0]);
  assert.deepEqual([...t.state.loadingKeys.value], [1]);
  assert.equal(t.state.visibleRows.value[0]!.loading, true);
  t.state.toggleRowExpansion(t.props.data![0]!, true);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  loader.requests[0]!.resolve([{ id: 11 }]);
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
  assert.deepEqual([...t.state.loadingKeys.value], []);
  assert.equal(t.state.visibleRows.value[0]!.loading, false);
  assert.deepEqual(data, [{ id: 1, hasChildren: true }]);
  t.stop();
});

it('未开启 lazy、没有 load 或没有子节点标记时不请求', async () => {
  const loader = createLoader();
  for (const options of [{ load: loader.load }, { lazy: true }, { lazy: true, load: loader.load, data: [{ id: 1 }] }]) {
    const t = createClientState({ data: [{ id: 1, hasChildren: true }], ...options });
    t.state.toggleRowExpansion(t.props.data![0]!, true);
    await nextTick();
    assert.equal(t.state.visibleRows.value[0]!.hasChildren, false);
    assert.equal(loader.requests.length, 0);
    t.stop();
  }
});

it('已有 children 与懒节点混用，自定义字段及层级正确', async () => {
  const loader = createLoader();
  const t = createClientState({
    data: [{ id: 1, more: true, nodes: [{ id: 11, more: true, nodes: [] }] }],
    treeProps: { children: 'nodes', hasChildren: 'more' }, lazy: true, load: loader.load,
  });
  t.state.toggleRowExpansion(t.props.data![0]!, true);
  await nextTick();
  assert.equal(loader.requests.length, 0);
  t.state.toggleRowExpansion(t.state.visibleRows.value[1]!.row, true);
  await nextTick();
  assert.equal(loader.requests[0]?.row.id, 11);
  assert.equal(loader.requests[0]?.node.level, 1);
  loader.requests[0]!.resolve([{ id: 111 }]);
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11, 111]);
  t.stop();
});

for (const mode of ['模型', '默认'] as const) {
  it(`${mode}展开在客户端挂载后触发加载`, async () => {
    const loader = createLoader();
    const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load, defaultExpandAll: mode === '默认' }, mode === '模型' ? [1] : []);
    await nextTick();
    assert.equal(loader.requests.length, 1);
    loader.requests[0]!.resolve([{ id: 11 }]);
    await nextTick();
    assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
    t.stop();
  });
}

it('外部模型追加展开键也会请求，非当前页的已展开节点不遗漏', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1 }, { id: 2, hasChildren: true }], lazy: true, load: loader.load, pagination: true });
  t.models.pageSize.value = 1;
  t.models.expandedRowKeys.value.push(2);
  await nextTick();
  assert.equal(loader.requests[0]?.row.id, 2);
  loader.requests[0]!.resolve([{ id: 21 }]);
  await nextTick();
  t.state.setPage(2);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [2, 21]);
  t.stop();
});

it('SSR 不触发加载且保留已有树的默认展开内容', async () => {
  const loader = createLoader();
  let t!: ReturnType<typeof createState>;
  const app = createSSRApp({ setup() {
    t = createState({ data: [{ id: 1, children: [{ id: 11, hasChildren: true }] }], defaultExpandAll: true, lazy: true, load: loader.load });
    return () => t.state.visibleRows.value.map(item => item.key).join(',');
  } });
  assert.equal(await renderToString(app), '1,11');
  assert.equal(loader.requests.length, 0);
  assert.deepEqual([...t.state.loadingKeys.value], []);
  t.stop();
});

it('空结果变叶子，重复回调不能覆盖第一次结果', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load }, [1]);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  loader.requests[0]!.resolve([]);
  loader.requests[0]!.resolve([{ id: 11 }]);
  await nextTick();
  assert.equal(t.state.visibleRows.value[0]!.hasChildren, false);
  t.state.toggleRowExpansion(t.props.data![0]!, false);
  t.state.toggleRowExpansion(t.props.data![0]!, true);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1]);
  t.stop();
});

it('折叠后晚返回仅缓存结果，不能重新展开或发送额外展开事件', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load }, [1]);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  t.state.toggleRowExpansion(t.props.data![0]!, false);
  const eventCount = t.events.filter(event => event.name === 'expand-change').length;
  loader.requests[0]!.resolve([{ id: 11 }]);
  await nextTick();
  assert.deepEqual(t.models.expandedRowKeys.value, []);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1]);
  assert.equal(t.events.filter(event => event.name === 'expand-change').length, eventCount);
  t.state.toggleRowExpansion(t.props.data![0]!, true);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
  t.stop();
});

for (const mode of ['抛错', '拒绝'] as const) {
  it(`${mode}清除加载状态，只在下次展开重试`, async () => {
    let attempts = 0;
    const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: (_row, _node, resolve) => {
      attempts++;
      if (attempts === 1) {
        if (mode === '抛错') throw new Error('加载失败');
        return Promise.reject(new Error('加载失败'));
      }
      resolve([{ id: 11 }]);
    } }, [1]);
    await nextTick();
    await nextTick();
    assert.equal(attempts, 1);
    assert.deepEqual([...t.state.loadingKeys.value], []);
    assert.equal(t.state.visibleRows.value[0]!.hasChildren, true);
    t.models.expandedRowKeys.value = [];
    await nextTick();
    t.models.expandedRowKeys.value = [1];
    await nextTick();
    assert.equal(attempts, 2);
    assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
    t.stop();
  });
}

it('Promise 完成不等于子节点已返回，仍等待 resolve', async () => {
  let finish!: (children: TableRow[]) => void;
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: (_row, _node, resolve) => { finish = resolve; return Promise.resolve(); } }, [1]);
  await nextTick();
  assert.equal(typeof finish, 'function');
  assert.deepEqual([...t.state.loadingKeys.value], [1]);
  finish([{ id: 11 }]);
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
  t.stop();
});

for (const mode of ['同键替换', '删除', '同对象新数组', '删除后原位插回'] as const) {
  it(`${mode}使旧请求失效，即使同一轮更新立即返回也不污染`, async () => {
    const loader = createLoader();
    const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load }, [1]);
    await nextTick();
    assert.equal(loader.requests.length, 1);
    const row = t.props.data![0]!;
    if (mode === '同键替换') t.props.data = [{ id: 1, hasChildren: true }];
    if (mode === '删除') t.props.data!.splice(0, 1);
    if (mode === '同对象新数组') t.props.data = [row];
    if (mode === '删除后原位插回') { t.props.data!.splice(0, 1); t.props.data!.push(row); }
    loader.requests[0]!.resolve([{ id: 99 }]);
    await nextTick();
    assert.equal(t.state.sourceRows.value.some(item => item.key === 99), false);
    if (mode !== '删除') {
      assert.equal(loader.requests.length, 2);
      assert.deepEqual([...t.state.loadingKeys.value], [1]);
      loader.requests[1]!.resolve([{ id: 11 }]);
      await nextTick();
      assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
    }
    else assert.deepEqual([...t.state.loadingKeys.value], []);
    t.stop();
  });
}

it('加载中的子节点随祖先删除一起失效', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, children: [{ id: 11, hasChildren: true }] }], lazy: true, load: loader.load }, [1, 11]);
  await nextTick();
  assert.equal(loader.requests[0]?.row.id, 11);
  t.props.data!.splice(0, 1);
  loader.requests[0]!.resolve([{ id: 111 }]);
  await nextTick();
  assert.deepEqual(t.state.sourceRows.value, []);
  assert.deepEqual([...t.state.loadingKeys.value], []);
  t.stop();
});

it('卸载使未完成请求失效', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load }, [1]);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  t.stop();
  loader.requests[0]!.resolve([{ id: 11 }]);
  await nextTick();
  assert.deepEqual(t.state.sourceRows.value.map(item => item.key), [1]);
  assert.deepEqual([...t.state.loadingKeys.value], []);
});

it('加载中外部传入的 children 优先于旧请求结果', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load }, [1]);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  t.props.data![0]!.children = [{ id: 12 }];
  loader.requests[0]!.resolve([{ id: 11 }]);
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 12]);
  assert.deepEqual([...t.state.loadingKeys.value], []);
  t.stop();
});

it('懒节点经过排序筛选仍可选择，缓存返回源对象且分页合计不计入孩子', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, amount: 5, hasChildren: true }, { id: 2, amount: 6 }], lazy: true, load: loader.load, pagination: true, columns: [{ type: 'selection' }, { prop: 'amount', sortable: true }] }, [1]);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  const children = [{ id: 11, amount: 30 }, { id: 12, amount: 10 }];
  loader.requests[0]!.resolve(children);
  await nextTick();
  t.state.sort('amount', 'ascending');
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 12, 11, 2]);
  assert.equal(t.state.total.value, 2);
  assert.deepEqual(t.state.summary.value, ['合计', 11]);
  t.state.setFilter('amount', [30]);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
  t.state.toggleAllSelection();
  assert.deepEqual(t.models.selectedKeys.value, [1, 11]);
  assert.equal(t.state.getSelectionRows()[0], t.props.data![0]);
  assert.equal(toRaw(t.state.getSelectionRows()[1]), children[0]);
  assert.equal(t.state.getSelectionRows()[1], t.state.visibleRows.value[1]!.row);
  t.props.data = [];
  await nextTick();
  assert.deepEqual(t.models.selectedKeys.value, []);
  t.stop();
});

it('缺省行键在懒树祖先被克隆及排序筛选后仍指向源身份', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ name: '甲', hasChildren: true }, { name: '乙' }], lazy: true, load: loader.load, columns: [{ type: 'selection' }, { prop: 'name', sortable: true }] }, [0]);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  loader.requests[0]!.resolve([{ name: '目标' }, { name: '其他' }]);
  await nextTick();
  t.state.sort('name', 'descending');
  t.state.setFilter('name', ['目标']);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [0, 1]);
  t.state.toggleRowSelection(t.state.visibleRows.value[0]!.row, true);
  assert.equal(t.state.getSelectionRows()[0], t.props.data![0]);
  t.state.toggleRowSelection(t.state.visibleRows.value[1]!.row, true);
  assert.equal(t.state.getSelectionRows()[1]?.name, '目标');
  t.stop();
});

for (const lazy of [false, true]) {
  it(`${lazy ? '懒加载' : '静态'}孩子被筛选全部移除后不保留空展开按钮`, async () => {
    const t = createClientState({ data: [{ id: 1, name: '父', hasChildren: true, ...(lazy ? {} : { children: [{ id: 11, name: '子' }] }) }], lazy,
      load: (_row, _node, resolve) => resolve([{ id: 11, name: '子' }]), columns: [{ prop: 'name' }] }, [1]);
    await nextTick();
    t.state.setFilter('name', ['父']);
    assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1]);
    assert.equal(t.state.visibleRows.value[0]!.hasChildren, false);
    t.stop();
  });
}

for (const mode of ['行键改变', 'children 数组替换'] as const) {
  it(`${mode}使进行中的请求失效`, async () => {
    const loader = createLoader();
    const t = createClientState({ data: [{ id: 1, hasChildren: true, children: [] }], lazy: true, load: loader.load }, [1]);
    await nextTick();
    assert.equal(loader.requests.length, 1);
    if (mode === '行键改变') {
      t.props.data![0]!.id = 2;
      t.models.expandedRowKeys.value = [2];
    }
    else t.props.data![0]!.children = [];
    loader.requests[0]!.resolve([{ id: 99 }]);
    await nextTick();
    assert.equal(t.state.sourceRows.value.some(item => item.key === 99), false);
    assert.equal(loader.requests.length, 2);
    loader.requests[1]!.resolve([{ id: 11 }]);
    await nextTick();
    assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [mode === '行键改变' ? 2 : 1, 11]);
    t.stop();
  });
}

it('同批加载中同步删除其余行，不对已经移除的行发送请求', async () => {
  const requested: unknown[] = [];
  const data = reactive<TableRow[]>([{ id: 1, hasChildren: true }, { id: 2, hasChildren: true }]);
  const t = createClientState({ data, lazy: true, load: (row, _node, resolve) => {
    requested.push(row.id);
    if (row.id === 1) data.splice(1, 1);
    resolve([]);
  } }, [1, 2]);
  await nextTick();
  assert.deepEqual(requested, [1]);
  assert.deepEqual(t.state.sourceRows.value.map(item => item.key), [1]);
  t.stop();
});

it('未产生懒树变化时远程处理仍返回传入数组', () => {
  const t = createState({ remote: true });
  assert.equal(t.state.processed.value, t.props.data);
  t.stop();
});

it('远程模式加载孩子后仍不执行本地筛选排序，单选沿用既有规则', async () => {
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], remote: true, lazy: true,
    load: (_row, _node, resolve) => resolve([{ id: 11, amount: 30 }, { id: 12, amount: 10 }]),
    columns: [{ type: 'radio' }, { prop: 'amount', sortable: true, filteredValue: [99],
      filterMethod: () => { throw new Error('不能本地筛选'); }, sortMethod: () => { throw new Error('不能本地排序'); } }],
  }, [1]);
  await nextTick();
  t.state.sort('amount', 'ascending');
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11, 12]);
  t.state.toggleRowSelection(t.state.visibleRows.value[1]!.row, true);
  t.state.toggleRowSelection(t.state.visibleRows.value[2]!.row, true);
  assert.deepEqual(t.models.selectedKeys.value, [12]);
  assert.equal(t.state.getSelectionRows()[0]?.amount, 10);
  t.stop();
});

it('默认展开仅作用于初始节点，新发现的懒节点等待显式展开', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], defaultExpandAll: true, lazy: true, load: loader.load });
  await nextTick();
  loader.requests[0]!.resolve([{ id: 11, hasChildren: true }]);
  await nextTick();
  assert.equal(loader.requests.length, 1);
  assert.deepEqual(t.models.expandedRowKeys.value, [1]);
  t.models.expandedRowKeys.value.push(11);
  await nextTick();
  assert.equal(loader.requests.length, 2);
  assert.deepEqual(loader.requests[1]!.node, { level: 1, expanded: true, loading: true, loaded: false });
  loader.requests[1]!.resolve([{ id: 111 }]);
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11, 111]);
  t.stop();
});

it('懒孩子的保留选择跨数据替换仍保留，重新加载同键孩子更新为新记录', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load, columns: [{ type: 'selection', reserveSelection: true }] }, [1]);
  await nextTick();
  loader.requests[0]!.resolve([{ id: 11, amount: 10 }]);
  await nextTick();
  t.state.toggleRowSelection(t.state.visibleRows.value[1]!.row, true);
  t.props.data = [];
  await nextTick();
  assert.deepEqual(t.models.selectedKeys.value, [11]);
  assert.equal(t.state.getSelectionRows()[0]?.amount, 10);
  t.props.data = [{ id: 1, hasChildren: true }];
  await nextTick();
  loader.requests[1]!.resolve([{ id: 11, amount: 99 }]);
  await nextTick();
  assert.deepEqual(t.models.selectedKeys.value, [11]);
  assert.equal(t.state.getSelectionRows()[0]?.amount, 99);
  t.stop();
});

it('函数行键始终读取源对象而不是懒树或筛选克隆', async () => {
  const row = Object.freeze({ name: '父', hasChildren: true });
  const child = Object.freeze({ name: '子' });
  const keys = new Map<TableRow, TableKey>([[row, 'parent'], [child, 'child']]);
  const t = createClientState({ data: [row], lazy: true, load: (_row, _node, resolve) => resolve([child]),
    rowKey: item => { const key = keys.get(item); assert.notEqual(key, undefined); return key!; }, columns: [{ prop: 'name' }],
  }, ['parent']);
  await nextTick();
  t.state.setFilter('name', ['子']);
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), ['parent', 'child']);
  t.state.toggleRowSelection(t.state.visibleRows.value[0]!.row, true);
  assert.equal(t.state.getSelectionRows()[0], row);
  t.stop();
});

for (const operation of ['reverse', 'sort'] as const) {
  it(`原地 ${operation} 不清除已加载缓存或已选孩子`, async () => {
    const loader = createLoader();
    const t = createClientState({ data: [{ id: 1, hasChildren: true }, { id: 2, hasChildren: true }], lazy: true, load: loader.load,
      columns: [{ type: 'selection' }],
    }, [1, 2]);
    await nextTick();
    loader.requests[0]!.resolve([{ id: 11 }]);
    loader.requests[1]!.resolve([{ id: 21 }, { id: 22 }]);
    await nextTick();
    const child = t.state.visibleRows.value.find(item => item.key === 11)!.row;
    t.state.toggleRowSelection(child, true);
    if (operation === 'reverse') t.props.data!.reverse();
    else t.props.data!.sort((a, b) => Number(b.id) - Number(a.id));
    await nextTick();
    assert.deepEqual(loader.requests.map(item => item.row.id), [1, 2]);
    assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [2, 21, 22, 1, 11]);
    assert.deepEqual(t.models.selectedKeys.value, [11]);
    assert.equal(t.state.getSelectionRows()[0], child);
    t.stop();
  });

  it(`原地 ${operation} 后立即返回的进行中请求仍然有效且不会重复`, async () => {
    const loader = createLoader();
    const t = createClientState({ data: [{ id: 1, hasChildren: true }, { id: 2, hasChildren: true }], lazy: true, load: loader.load }, [1, 2]);
    await nextTick();
    if (operation === 'reverse') t.props.data!.reverse();
    else t.props.data!.sort((a, b) => Number(b.id) - Number(a.id));
    loader.requests[0]!.resolve([{ id: 11 }]);
    loader.requests[1]!.resolve([{ id: 21 }]);
    await nextTick();
    assert.deepEqual(loader.requests.map(item => item.row.id), [1, 2]);
    assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [2, 21, 1, 11]);
    assert.deepEqual([...t.state.loadingKeys.value], []);
    t.stop();
  });
}

it('普通 JSON 懒孩子修改字段后会重新筛选，选择缓存与可见行保持同一身份', async () => {
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true,
    load: (_row, _node, resolve) => resolve([{ id: 11, name: 'no' }]), columns: [{ type: 'selection' }, { prop: 'name' }],
  }, [1]);
  await nextTick();
  const child = t.state.visibleRows.value[1]!.row;
  t.state.toggleRowSelection(child, true);
  t.state.setFilter('name', ['yes']);
  assert.deepEqual(t.state.processed.value, []);
  child.name = 'yes';
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
  assert.equal(t.state.visibleRows.value[1]!.row, child);
  assert.equal(t.state.sourceRows.value[1]!.row, child);
  assert.equal(t.state.getSelectionRows()[0], child);
  assert.deepEqual(t.props.data, [{ id: 1, hasChildren: true }]);
  t.stop();
});

it('多层懒子树的字段、数组排序和后续请求共享响应式身份', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, more: true }], lazy: true, load: loader.load,
    treeProps: { children: 'nodes', hasChildren: 'more' }, columns: [{ type: 'selection' }, { prop: 'amount', sortable: true }],
  }, [1, 11, 12]);
  await nextTick();
  loader.requests[0]!.resolve([{ id: 11, more: true, amount: 10 }, { id: 12, more: true, amount: 20 }]);
  await nextTick();
  const first = t.state.visibleRows.value.find(item => item.key === 11)!.row;
  assert.equal(loader.requests[1]!.row, first);
  // 保存加载源数组，后续展示树可能因嵌套懒加载而克隆祖先。
  const children = t.state.visibleRows.value[0]!.row.nodes as TableRow[];
  loader.requests[1]!.resolve([{ id: 111, amount: 30 }]);
  loader.requests[2]!.resolve([{ id: 121, amount: 40 }]);
  await nextTick();
  const leaf = t.state.visibleRows.value.find(item => item.key === 111)!.row;
  t.state.toggleRowSelection(leaf, true);
  children.reverse();
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 12, 121, 11, 111]);
  assert.deepEqual(loader.requests.map(item => item.row.id), [1, 11, 12]);
  assert.deepEqual(t.models.selectedKeys.value, [111]);
  t.state.setFilter('amount', [99]);
  assert.deepEqual(t.state.processed.value, []);
  leaf.amount = 99;
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11, 111]);
  assert.equal(t.state.getSelectionRows()[0], leaf);
  assert.equal(t.state.keyOf(leaf), 111);
  t.stop();
});

for (const change of ['删除', '行键', '子数组', '懒标记'] as const) {
  it(`${change}变化后同步回调也不能暂时写入失效孩子`, async () => {
    const loader = createLoader();
    const t = createClientState({ data: [{ id: 1, hasChildren: true, children: [] }], lazy: true, load: loader.load }, [1]);
    await nextTick();
    if (change === '删除') t.props.data!.splice(0, 1);
    if (change === '行键') t.props.data![0]!.id = 2;
    if (change === '子数组') t.props.data![0]!.children = [];
    if (change === '懒标记') t.props.data![0]!.hasChildren = false;
    loader.requests[0]!.resolve([{ id: 99 }]);
    assert.equal(t.state.sourceRows.value.some(item => item.key === 99), false);
    await nextTick();
    assert.equal(t.state.sourceRows.value.some(item => item.key === 99), false);
    t.stop();
  });
}

it('懒子孙删除后同轮插回也不能复用旧请求', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load }, [1, 11]);
  await nextTick();
  loader.requests[0]!.resolve([{ id: 11, hasChildren: true }]);
  await nextTick();
  const children = t.state.visibleRows.value[0]!.row.children as TableRow[];
  const child = children.splice(0, 1)[0]!;
  children.push(child);
  loader.requests[1]!.resolve([{ id: 99 }]);
  assert.equal(t.state.sourceRows.value.some(item => item.key === 99), false);
  await nextTick();
  assert.deepEqual(loader.requests.map(item => item.row.id), [1, 11, 11]);
  loader.requests[2]!.resolve([{ id: 111 }]);
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11, 111]);
  assert.equal(loader.requests[2]!.row, child);
  t.stop();
});

it('懒祖先行键改变后，子孙在批量清理前返回也无效', async () => {
  const loader = createLoader();
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: loader.load }, [1, 11]);
  await nextTick();
  loader.requests[0]!.resolve([{ id: 11, hasChildren: true }]);
  await nextTick();
  t.props.data![0]!.id = 2;
  loader.requests[1]!.resolve([{ id: 99 }]);
  assert.deepEqual(t.state.sourceRows.value.map(item => item.key), [2]);
  await nextTick();
  assert.deepEqual(t.state.sourceRows.value.map(item => item.key), [2]);
  assert.deepEqual([...t.state.loadingKeys.value], []);
  t.stop();
});

it('旧请求晚拒绝不清除同键新请求的加载状态', async () => {
  let rejectOld!: (reason: Error) => void;
  let finishNew!: (children: TableRow[]) => void;
  let count = 0;
  const t = createClientState({ data: [{ id: 1, hasChildren: true }], lazy: true, load: (_row, _node, resolve) => {
    if (++count === 1) return new Promise<void>((_resolve, reject) => { rejectOld = reject; });
    finishNew = resolve;
  } }, [1]);
  await nextTick();
  t.props.data = [{ id: 1, hasChildren: true }];
  await nextTick();
  assert.equal(count, 2);
  rejectOld(new Error('旧请求失败'));
  await nextTick();
  await nextTick();
  assert.deepEqual([...t.state.loadingKeys.value], [1]);
  finishNew([{ id: 11 }]);
  await nextTick();
  assert.deepEqual(t.state.visibleRows.value.map(item => item.key), [1, 11]);
  t.stop();
});
