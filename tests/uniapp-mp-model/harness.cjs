const fs = require('node:fs')
const path = require('node:path')
const { compileFunction } = require('node:vm')
const babel = require('@babel/parser')
const { compile } = require('@dcloudio/uni-mp-compiler')
const { parse, compileScript } = require('@vue/compiler-sfc')
const { build, transformSync } = require('esbuild')

globalThis.__VUE_CREATED_DEFERRED__ = false

function preprocess(source) {
  const stack = []
  return source.split(/\r?\n/).filter(line => {
    const directive = line.match(/(?:\/\/|<!--)\s*#(ifdef|ifndef|endif)\b(.*)$/)
    if (!directive) return stack.every(Boolean)
    if (directive[1] === 'endif') stack.pop()
    else {
      const match = directive[2].replace('-->', '').trim().split(/\s*\|\|\s*/).some(flag => ['MP', 'MP-WEIXIN', 'VUE3'].includes(flag))
      stack.push(directive[1] === 'ifdef' ? match : !match)
    }
    return false
  }).join('\n')
}

function evaluate(code, runtime) {
  const module = { exports: {} }
  compileFunction(code, ['module', 'exports', 'require'])(module, module.exports, name => name === 'vue' && runtime ? runtime : require(name))
  return module.exports
}

function platformFunctions(runtime) {
  const source = fs.readFileSync(require.resolve('@dcloudio/uni-mp-weixin/dist/uni.mp.esm.js'), 'utf8')
  const names = ['createEmitFn', 'updateComponentProps', 'hasPropsChanged', 'initPropsObserver', 'resolvePropValue']
  const ast = babel.parse(source, { sourceType: 'module' })
  const code = ast.program.body.filter(node => node.type === 'FunctionDeclaration' && names.includes(node.id.name)).map(node => source.slice(node.start, node.end)).join('\n')
  return compileFunction(`const {findComponentPropsData,toRaw,updateProps,hasQueueJob,invalidateJob}=runtime;${code};return {createEmitFn,initPropsObserver}`, ['runtime'])(runtime)
}

async function load(name) {
  const root = path.resolve('packages/uniapp-project/src')
  const entry = path.join(root, 'components', name)
  const captures = []
  globalThis.mpCaptures = captures
  const built = await build({
    stdin: { contents: entry.endsWith('index.ts') ? `export * from ${JSON.stringify(entry.replaceAll('\\', '/'))};import * as runtime from 'vue';export {runtime}` : `import Comp from ${JSON.stringify(entry.replaceAll('\\', '/'))};import * as runtime from 'vue';export {Comp,runtime}`, resolveDir: process.cwd() },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': root },
    define: { __VUE_OPTIONS_API__: 'false', __VUE_PROD_DEVTOOLS__: 'false' },
    plugins: [{ name: 'real-uni-mp-runtime', setup(builder) {
      builder.onResolve({ filter: /^vue$/ }, () => ({ path: require.resolve('@dcloudio/uni-mp-vue') }))
      builder.onLoad({ filter: /\.ts$/ }, args => ({ contents: preprocess(fs.readFileSync(args.path, 'utf8')), loader: 'ts', resolveDir: path.dirname(args.path) }))
      builder.onLoad({ filter: /\.vue$/ }, args => {
        let source = preprocess(fs.readFileSync(args.path, 'utf8'))
        let descriptor = parse(source, { filename: args.path }).descriptor
        const options = { id: args.path, fs: { fileExists: fs.existsSync, readFile: file => fs.readFileSync(file, 'utf8') } }
        const first = compileScript(descriptor, options)
        if (!descriptor.scriptSetup) return { contents: first.content, loader: 'ts', resolveDir: path.dirname(args.path) }
        const imports = new Set(first.scriptSetupAst.filter(node => node.type === 'ImportDeclaration').flatMap(node => node.specifiers.map(specifier => specifier.local.name)))
        const names = Object.entries(first.bindings).filter(([name, type]) => !imports.has(name) && String(type).startsWith('setup-')).map(([name]) => name)
        const end = descriptor.scriptSetup.loc.end.offset
        source = `${source.slice(0, descriptor.scriptSetup.loc.start.offset)}\nimport { getCurrentInstance as mpCurrentInstance } from 'vue'\n${source.slice(descriptor.scriptSetup.loc.start.offset, end)}\nglobalThis.mpCaptures.push({mpInstance:mpCurrentInstance(),file:${JSON.stringify(args.path)},${names.join(',')}});\n${source.slice(end)}`
        descriptor = parse(source, { filename: args.path }).descriptor
        return { contents: compileScript(descriptor, options).content, loader: 'ts', resolveDir: path.dirname(args.path) }
      })
    } }],
  })
  return { ...evaluate(built.outputFiles[0].text), captures }
}

async function mount(name, modelName, initial = {}, stateName = 'model', explicit = false, throughSlot = false, options = {}) {
  const loaded = options.loaded ?? await load(name)
  const { runtime, Comp, captures } = loaded
  const native = platformFunctions(runtime)
  const warnings = []
  const events = []
  const binding = runtime.shallowRef(initial)
  const prefix = runtime.shallowRef(false)
  const nativeQueue = []
  let accepting = false
  let child
  let sibling
  let wrapper
  let wrapperRenders = 0
  globalThis.uni = {
    getDeviceInfo: () => ({ platform: 'ios' }), getAppBaseInfo: () => ({}),
    getWindowInfo: () => ({ windowWidth: 375, windowHeight: 800, screenWidth: 375, screenHeight: 800, safeAreaInsets: { bottom: 0 } }),
    getSystemInfoSync: () => ({ platform: 'ios', windowWidth: 375, windowHeight: 800 }),
    createSelectorQuery() { const query = { in: () => query, select: () => query, selectAll: () => query, boundingClientRect: () => query, fields: () => query, scrollOffset: () => query, exec() {} }; return query },
  }
  const modelAttribute = modelName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
  const attributes = explicit ? `:${modelAttribute}="binding.${modelName}"` : 'v-bind="binding"'
  const children = `<TestChild ${attributes} @update:${modelName}="onUpdate" /><TestChild v-bind="binding" @update:${modelName}="onUpdate" />`
  const parentCode = compile(`<view><OtherChild v-if="prefix" label="prefix" />${throughSlot ? `<TestWrapper>${children}</TestWrapper>` : children}</view>`, { mode: 'module', filename: 'mp-model-parent.vue', hashId: 'mp-model-parent' }).code
  const render = evaluate(transformSync(parentCode, { format: 'cjs' }).code, runtime).render
  const app = runtime.createVueApp({})
  app.config.warnHandler = message => warnings.push(message)
  app.config.globalProperties.pruneComponentPropsCache = runtime.pruneComponentPropsCache
  const root = app.mount()
  const observerOptions = {}
  native.initPropsObserver(observerOptions)
  const parentScope = {
    data: {}, properties: {}, selectAllComponents: () => [],
    setData(data, callback) {
      const publish = () => {
        Object.assign(this.data, data)
        if (child && Object.hasOwn(data, 'd')) {
          child.$.ctx.$scope.properties.uP = this.data.d
          observerOptions.observers.uP.call(child.$.ctx.$scope)
        }
        if (sibling && Object.hasOwn(data, 'f')) {
          sibling.$.ctx.$scope.properties.uP = this.data.f
          observerOptions.observers.uP.call(sibling.$.ctx.$scope)
        }
        callback?.()
      }
      if (child && options.deferNative) nativeQueue.push(publish)
      else publish()
    },
  }
  function before(scope) {
    return instance => {
      globalThis.mpCaptures = captures
      instance.ctx.mpType = 'component'
      instance.ctx.$mpPlatform = 'mp-weixin'
      instance.ctx.$scope = scope
      instance.emit = native.createEmitFn(instance.emit, instance.ctx)
    }
  }
  const parent = root.$createComponent({ type: { setup: () => ({ binding, prefix, onUpdate(value) { events.push(value); if (accepting) binding.value = { ...binding.value, [modelName]: value } } }), render }, props: {} }, { parentComponent: root.$, onBeforeSetup: before(parentScope) })
  parent.$.isMounted = true
  if (throughSlot) {
    const scope = { data: {}, properties: {}, selectAllComponents: () => [], setData(data, callback) { Object.assign(this.data, data); callback?.() } }
    wrapper = root.$createComponent({ type: { render: () => { wrapperRenders++; return {} } }, props: {} }, { parentComponent: parent.$, onBeforeSetup: before(scope) })
    wrapper.$.isMounted = true
  }
  const childScope = {
    data: {}, properties: { uP: parentScope.data.d }, selectAllComponents: () => [],
    setData(data, callback) { Object.assign(this.data, data); callback?.() },
    triggerEvent(event, detail) { if (event === `update:${modelName}`) parentScope[parentScope.data.c]({ type: event, detail }) },
  }
  Comp.render = () => {
    const state = captures.find(item => item.mpInstance === runtime.getCurrentInstance())
    return { value: !!state[stateName].value }
  }
  child = root.$createComponent({ type: Comp, props: runtime.findComponentPropsData(childScope.properties.uP) || {} }, { parentComponent: wrapper?.$ ?? parent.$, onBeforeSetup: before(childScope) })
  childScope.$vm = child
  child.$.isMounted = true
  const state = captures.find(item => item.mpInstance === child.$)
  async function flush() { for (let i = 0; i < 5; i++) await runtime.nextTick() }
  await flush()
  return { ...loaded, child, parent, wrapper, state, binding, warnings, events, flush, parentCode,
    get wrapperRenders() { return wrapperRenders },
    enablePrefix() { prefix.value = true },
    publishNative() { for (const publish of nativeQueue.splice(0)) publish() },
    get value() { return state[stateName].value }, get rendered() { return childScope.data.value },
    accept(value) { accepting = value }, async update(value) { binding.value = value; await flush() },
    addSibling() {
      const scope = { ...childScope, data: {}, properties: { uP: parentScope.data.f } }
      sibling = root.$createComponent({ type: Comp, props: runtime.findComponentPropsData(scope.properties.uP) || {} }, { parentComponent: parent.$, onBeforeSetup: before(scope) })
      scope.$vm = sibling
      sibling.$.isMounted = true
      return { vm: sibling, state: captures.find(item => item.mpInstance === sibling.$), scope }
    },
    removeChild() { root.$destroyComponent(child); child = undefined },
    removeSibling() { root.$destroyComponent(sibling); sibling = undefined },
    close() { if (child) root.$destroyComponent(child); if (sibling) root.$destroyComponent(sibling); if (wrapper) root.$destroyComponent(wrapper); root.$destroyComponent(parent) },
  }
}

module.exports = { load, mount, preprocess, evaluate, platformFunctions }
