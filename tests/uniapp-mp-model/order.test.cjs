const assert = require('node:assert/strict')
const test = require('node:test')
const { compile } = require('@dcloudio/uni-mp-compiler')
const { transformSync } = require('esbuild')
const { load, evaluate, platformFunctions } = require('./harness.cjs')

function patch(data, changes) {
  for (const [key, value] of Object.entries(changes)) {
    const segments = key.replace(/\[(\d+)\]/g, '.$1').split('.')
    let target = data
    for (const segment of segments.slice(0, -1)) target = target[segment] ??= {}
    target[segments.at(-1)] = value
  }
}

async function group(kind, options = {}) {
  const tabs = kind === 'Tabs'
  const tabbar = kind === 'Tabbar'
  const loaded = await load(`reborn-${kind.toLowerCase()}/index.ts`)
  const { runtime, captures } = loaded
  const Container = loaded[`Reborn${kind}`]
  const Item = loaded[tabs ? 'RebornTabPane' : tabbar ? 'RebornTabbarTrigger' : 'RebornBreadcrumbItem']
  const native = platformFunctions(runtime)
  const observer = {}
  native.initPropsObserver(observer)
  const warnings = []
  const binding = runtime.shallowRef(options.initial ?? [{ key: 'a', order: 0 }, { key: 'c', order: 1 }])
  const template = tabs
    ? `<RebornTabs active-key="c"><RebornTabPane v-for="(pane,index) in panes" :key="pane.key" :pane-key="pane.${options.businessKeys ? 'paneKey' : 'key'}" :order="pane.order" :title="pane.key" /></RebornTabs>`
    : tabbar
      ? `<RebornTabbar :model-value="1"${options.drop ? ' animation="drop"' : ''}><RebornTabbarTrigger v-for="(pane,index) in panes" :key="pane.key" :order="pane.order" :title="pane.key" /></RebornTabbar>`
      : '<RebornBreadcrumb :max-count="2"><RebornBreadcrumbItem v-for="(pane,index) in panes" :key="pane.key" :order="pane.order" :to="pane.key" /></RebornBreadcrumb>'
  const code = compile(template, { mode: 'module', filename: 'mp-order-parent.vue', hashId: 'mp-order-parent' }).code
  const render = evaluate(transformSync(code, { format: 'cjs' }).code, runtime).render
  globalThis.uni = { createSelectorQuery() { const q = { in: () => q, select: () => q, selectAll: () => q, boundingClientRect: () => q, fields: () => q, scrollOffset: () => q, exec(callback) { if (options.rects) callback?.(options.rects()) } }; return q } }
  const app = runtime.createVueApp({})
  app.config.warnHandler = message => warnings.push(message)
  app.config.globalProperties.pruneComponentPropsCache = runtime.pruneComponentPropsCache
  const root = app.mount()
  let ready = false
  const items = new Map()
  function scope() { return { data: {}, properties: {}, selectAllComponents: () => [], triggerEvent() {}, setData(data, callback) { patch(this.data, data); callback?.() } } }
  const parentScope = scope()
  parentScope.setData = function (data, callback) { patch(this.data, data); if (ready) sync(); callback?.() }
  function create(type, nativeScope, owner) {
    const vm = root.$createComponent({ type, props: runtime.findComponentPropsData(nativeScope.properties.uP) || {} }, { parentComponent: owner.$, onBeforeSetup(instance) {
      Object.assign(instance.ctx, { mpType: 'component', $mpPlatform: 'mp-weixin', $scope: nativeScope })
      instance.emit = native.createEmitFn(instance.emit, instance.ctx)
    } })
    nativeScope.$vm = vm
    vm.$.isMounted = true
    return vm
  }
  function refresh(vm, token) { vm.$.ctx.$scope.properties.uP = token; observer.observers.uP.call(vm.$.ctx.$scope) }
  Container.render = () => ({ keys: captures.find(state => state.file.endsWith(`Reborn${kind}.vue`))[tabs ? 'panes' : 'children']?.value?.map(pane => pane.key) ?? [] })
  Item.render = () => ({})
  const parent = create({ setup: () => ({ panes: binding }), render }, parentScope, root)
  const containerScope = scope()
  containerScope.properties.uP = parentScope.data.b
  const container = create(Container, containerScope, parent)
  function sync() {
    refresh(container, parentScope.data.b)
    const nextKeys = new Set(parentScope.data.a.map(item => item.a))
    for (const [key, vm] of items) if (!nextKeys.has(key)) { root.$destroyComponent(vm); items.delete(key) }
    for (const entry of parentScope.data.a) {
      if (items.has(entry.a)) refresh(items.get(entry.a), entry.c)
      else { const itemScope = scope(); itemScope.properties.uP = entry.c; items.set(entry.a, create(Item, itemScope, container)) }
    }
  }
  ready = true
  sync()
  async function flush() { for (let i = 0; i < 8; i++) await runtime.nextTick() }
  await flush()
  const state = captures.find(item => item.file.endsWith(`Reborn${kind}.vue`))
  return { runtime, captures, container, items, state, code, warnings, flush, async update(keys) { binding.value = keys.map((key, order) => typeof key === 'object' ? key : { key, order }); await flush() }, order() { return tabs ? state.panes.value.map(pane => pane.key) : state.children.map(child => child.$.props[tabbar ? 'title' : 'to']) }, close() { for (const item of items.values()) root.$destroyComponent(item); root.$destroyComponent(container); root.$destroyComponent(parent) } }
}

for (const kind of ['Tabs', 'Breadcrumb', 'Tabbar']) test(`${kind} 实际 MP 父编译与 native props 更新覆盖头/中插入、删除、重排`, async () => {
  const fixture = await group(kind)
  try {
    assert.equal(fixture.container.$.subTree, null)
    assert.match(fixture.code, /order: pane.order/)
    assert.deepEqual(fixture.order(), ['a', 'c'])
    const original = fixture.items.get('c')
    for (const keys of [['a', 'b', 'c'], ['d', 'a', 'b', 'c'], ['c', 'b', 'a', 'd'], ['c', 'a']]) {
      await fixture.update(keys)
      assert.deepEqual(fixture.order(), keys)
      assert.equal(fixture.items.get('c'), original)
      if (kind === 'Tabs') assert.equal(fixture.state.currentKey.value, 'c')
      else if (kind === 'Breadcrumb') assert.equal(fixture.state.isItemLast(keys.length - 1), true)
      else for (const [index, key] of keys.entries()) {
        const item = fixture.captures.find(entry => entry.mpInstance === fixture.items.get(key).$)
        assert.equal(item.index.value, index)
        assert.equal(item.active.value, index === 1, '缺省 name 继续按排序后的索引选择')
      }
    }
    await fixture.update([{ key: 'c', order: 9 }, { key: 'a', order: 1 }])
    assert.deepEqual(fixture.order(), ['a', 'c'])
    await fixture.update([{ key: 'c', order: 0 }, { key: 'a' }])
    assert.deepEqual(fixture.order(), ['a', 'c'], '混传时 MP 保留当前相对次序')
    await fixture.update([{ key: 'c', order: Number.NaN }, { key: 'a', order: 5 }])
    assert.deepEqual(fixture.order(), ['a', 'c'], '无效数值不参与排序')
    await fixture.update([{ key: 'c', order: Number.POSITIVE_INFINITY }, { key: 'a', order: 5 }])
    assert.deepEqual(fixture.order(), ['a', 'c'], '无限大不参与排序')
    await fixture.update([{ key: 'c', order: 2 }, { key: 'a', order: 2 }])
    assert.deepEqual(fixture.order(), ['a', 'c'], '同值保持相对次序')
    assert.deepEqual(fixture.warnings, [])
  } finally { fixture.close() }
})

test('Uni TabPane 真实登记归一缺省、0、字符串业务值并按同一对象注销', async () => {
  for (const paneKey of [undefined, 0, 'panel']) {
    const fixture = await group('Tabs', { initial: [{ key: 'identity', paneKey, order: 0 }], businessKeys: true })
    try {
      const instance = fixture.items.get('identity').$
      const pane = fixture.captures.find(item => item.mpInstance === instance)
      assert.equal(pane.meta.key, paneKey ?? 0)
      assert.equal(fixture.state.panes.value[0], pane.meta)
      assert.equal(fixture.state.paneInstances.get(pane.meta), instance)
      await fixture.update([])
      assert.deepEqual(fixture.state.panes.value, [])
      assert.equal(fixture.state.paneInstances.size, 0)
      assert.deepEqual(fixture.warnings, [])
    } finally { fixture.close() }
  }
})

test('Tabbar drop 在同数量重排后按视觉位置重新测量索引目标', async () => {
  let queries = 0
  const fixture = await group('Tabbar', { drop: true, initial: [{ key: 'a', order: 0 }, { key: 'b', order: 1 }, { key: 'c', order: 2 }], rects: () => {
    queries++
    return [{ left: 0, width: 300 }, [{ left: 200, width: 100 }, { left: 0, width: 100 }, { left: 100, width: 100 }]]
  } })
  try {
    fixture.state.syncDropIndicator()
    assert.equal(fixture.state.dropBallLeft.value, 128, '查询按源码返回 a,b,c，索引 1 应选择视觉中间项')
    queries = 0
    await fixture.update([{ key: 'a', order: 2 }, { key: 'b', order: 0 }, { key: 'c', order: 1 }])
    await new Promise(resolve => setTimeout(resolve, 60))
    await fixture.flush()
    assert.ok(queries > 0, '同数量重排也应重新测量')
    assert.deepEqual(fixture.order(), ['b', 'c', 'a'])
    assert.equal(fixture.state.dropBallLeft.value, 128)
    assert.deepEqual(fixture.warnings, [])
  } finally { fixture.close() }
})
