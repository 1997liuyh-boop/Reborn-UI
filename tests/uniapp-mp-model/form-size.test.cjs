const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { compile } = require('@dcloudio/uni-mp-compiler')
const { build, transformSync } = require('esbuild')
const { load, evaluate, preprocess, platformFunctions } = require('./harness.cjs')

async function mountSize(initial = {}, inherited = 'lg', deferred = false) {
  const { runtime } = await load('reborn-alert/RebornAlert.vue')
  const built = await build({ stdin: { contents: "export * from './packages/uniapp-project/src/composables/useFieldGroup'; export * from './packages/uniapp-project/src/composables/useBooleanModel'", resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vue'], plugins: [{ name: 'mp-source', setup(builder) {
    builder.onLoad({ filter: /\.ts$/ }, args => ({ contents: preprocess(fs.readFileSync(args.path, 'utf8')), loader: 'ts', resolveDir: path.dirname(args.path) }))
  } }] })
  const group = evaluate(built.outputFiles[0].text, runtime)
  const source = compile('<view><TestChild v-bind="binding"/><TestChild v-bind="binding"/></view>', { mode: 'module', filename: 'form-size-parent.vue', hashId: 'form-size-parent' }).code
  const render = evaluate(transformSync(source, { format: 'cjs' }).code, runtime).render
  const observer = {}
  platformFunctions(runtime).initPropsObserver(observer)
  const binding = runtime.shallowRef(initial)
  const form = runtime.reactive({ size: inherited })
  const warnings = []
  const app = runtime.createVueApp({})
  app.config.warnHandler = message => warnings.push(message)
  app.config.globalProperties.pruneComponentPropsCache = runtime.pruneComponentPropsCache
  const root = app.mount()
  const children = []
  const queue = []
  function scope() { return { data: {}, properties: {}, selectAllComponents: () => [], setData(data, done) { Object.assign(this.data, data); done?.() } } }
  function before(nativeScope) { return instance => Object.assign(instance.ctx, { mpType: 'component', $mpPlatform: 'mp-weixin', $scope: nativeScope }) }
  const parentScope = scope()
  parentScope.setData = function (data, done) {
    const publish = () => {
      Object.assign(this.data, data)
      children.forEach(child => {
        if (!child.removed && Object.hasOwn(data, child.token)) {
          child.scope.properties.uP = this.data[child.token]
          observer.observers.uP.call(child.scope)
        }
      })
      done?.()
    }
    if (deferred && children.length) queue.push(publish)
    else publish()
  }
  const parent = root.$createComponent({ type: { setup() { runtime.provide(group.FORM_KEY, { props: form }); return { binding } }, render }, props: {} }, { parentComponent: root.$, onBeforeSetup: before(parentScope) })
  parent.$.isMounted = true
  // 中间宿主不读取绑定且不更新，属性存在性必须由真正拥有插槽的祖先刷新。
  let wrapperRenders = 0
  const wrapper = root.$createComponent({ type: { render() { wrapperRenders++; return {} } }, props: {} }, { parentComponent: parent.$, onBeforeSetup: before(scope()) })
  wrapper.$.isMounted = true
  function add(token) {
    const child = { token, scope: scope(), removed: false, updates: 0 }
    child.scope.properties.uP = parentScope.data[token]
    child.vm = root.$createComponent({ type: {
      props: { size: { type: String, default: 'md' }, active: { type: Boolean, default: undefined } },
      setup(props) { child.state = group.useFormInject(props); child.active = group.useBooleanModel('active'); runtime.onBeforeUpdate(() => child.updates++); return {} },
      render() { return { size: child.state.size.value } },
    }, props: runtime.findComponentPropsData(child.scope.properties.uP) || {} }, { parentComponent: wrapper.$, onBeforeSetup: before(child.scope) })
    child.scope.$vm = child.vm
    child.vm.$.isMounted = true
    children.push(child)
    return child
  }
  async function flush() { for (let i = 0; i < 8; i++) await runtime.nextTick() }
  function remove(child) { root.$destroyComponent(child.vm); child.removed = true }
  return { runtime, parent, wrapper, binding, form, warnings, add, remove, flush, get wrapperRenders() { return wrapperRenders },
    async update(raw) { binding.value = raw; await flush() },
    async publish() { queue.splice(0).forEach(fn => fn()); await flush() },
    close() { children.filter(child => !child.removed).forEach(remove); root.$destroyComponent(wrapper); root.$destroyComponent(parent) },
  }
}

test('真实 MP 编译父模板 + observer：动态 size 同默认值、不同值、移除及空值', async () => {
  const host = await mountSize()
  const child = host.add('a')
  try {
    assert.equal(host.runtime.version, '3.4.21')
    for (const [raw, expected] of [[{}, 'lg'], [{ size: 'md' }, 'md'], [{ size: 'sm' }, 'sm'], [{}, 'lg'], [{ size: null }, 'lg'], [{ size: undefined }, 'lg']]) {
      await host.update(raw)
      assert.equal(child.state.size.value, expected)
      assert.equal(child.scope.data.size, expected)
    }
    assert.deepEqual(child.vm.$.vnode.props, {})
    assert.equal(host.wrapperRenders, 1)
    assert.deepEqual(host.warnings, [])
  }
  finally { host.close() }
})

test('真实 MP：静态显式值优先；无表单尺寸时使用控件默认值', async () => {
  for (const [raw, inherited, expected] of [[{ size: 'md' }, 'lg', 'md'], [{ size: 'sm' }, 'lg', 'sm'], [{}, undefined, 'md']]) {
    const host = await mountSize(raw, inherited === undefined ? '' : inherited)
    const child = host.add('a')
    try { await host.flush(); assert.equal(child.scope.data.size, expected); assert.deepEqual(host.warnings, []) }
    finally { host.close() }
  }
})

test('真实 MP：原生 setData 延迟、同胞共享订阅与逐个卸载', async () => {
  const host = await mountSize({}, 'lg', true)
  const first = host.add('a')
  const second = host.add('b')
  try {
    await host.flush()
    assert.equal(host.parent.$.u.length, 1)
    await host.update({ size: 'md', active: true })
    assert.equal(second.scope.data.size, 'lg')
    await host.publish()
    assert.equal(first.active.value, true)
    assert.equal(second.active.value, true)
    assert.equal(first.scope.data.size, 'md')
    assert.equal(second.scope.data.size, 'md')
    host.remove(first)
    assert.equal(host.parent.$.u.length, 1)
    await host.update({})
    await host.publish()
    assert.equal(second.scope.data.size, 'lg')
    host.remove(second)
    assert.equal(host.parent.$.u.length, 0)
    assert.equal(host.wrapper.$.u.length, 0)
    assert.deepEqual(host.warnings, [])
  }
  finally { host.close() }
})
