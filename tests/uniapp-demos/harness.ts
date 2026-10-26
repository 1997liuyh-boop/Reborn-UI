import type { Component } from 'vue'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { runInThisContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { build } from 'esbuild'

export interface DemoFixture {
  hooks: { load: (() => void)[], reach: (() => void)[] }
  controls: Record<string, { props: Record<string, any>, slots: Record<string, unknown>, emit: (name: string, ...args: any[]) => void }[]>
  appended: { id: number, likes?: number }[]
}
export function createFixture(): DemoFixture {
  const fixture: DemoFixture = { hooks: { load: [], reach: [] }, controls: {}, appended: [] }
  Object.assign(globalThis, { __uniDemo: fixture, uni: { showToast() {} } })
  return fixture
}

/** 替换平台与基础控件，保留真实页面及其私有配置组件的状态和生命周期。 */
export async function loadUniDemo(entry: string, mockModules: Record<string, string> = {}) {
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    alias: { '@': path.resolve('packages/uniapp-project/src') },
    plugins: [{ name: 'uni-demo-fixture', setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => mockModules[args.path] === undefined ? undefined : { path: args.path, namespace: 'demo-mock' })
      builder.onLoad({ filter: /.*/, namespace: 'demo-mock' }, args => ({ contents: mockModules[args.path]!, loader: 'ts', resolveDir: path.resolve('.') }))
      builder.onResolve({ filter: /^@dcloudio\/uni-app$/ }, () => ({ path: 'uni', namespace: 'platform' }))
      // Node 不执行 UniApp 条件编译，夹具仅保留样式适配器的 H5 分支。
      builder.onLoad({ filter: /[\\/]lib[\\/]tv\.ts$/ }, ({ path: file }) => ({
        contents: readFileSync(file, 'utf8').replace(/\/\/ #ifdef MP-WEIXIN[\s\S]*?\/\/ #endif/g, ''),
        loader: 'ts', resolveDir: path.dirname(file),
      }))
      builder.onLoad({ filter: /.*/, namespace: 'platform' }, () => ({
        resolveDir: path.resolve('.'),
        contents: "const {onMounted,onUnmounted}=require('vue');export const onLoad=fn=>globalThis.__uniDemo.hooks.load.push(fn);export const onReachBottom=fn=>globalThis.__uniDemo.hooks.reach.push(fn);export const onUnload=onUnmounted;export const onPageScroll=()=>{};",
      }))
      builder.onResolve({ filter: /^@\/components\/.*\.vue$/ }, args => ({ path: path.basename(args.path, '.vue'), namespace: 'control' }))
      builder.onLoad({ filter: /.*/, namespace: 'control' }, args => ({
        contents: `const {defineComponent,h}=require('vue');export default defineComponent({
          inheritAttrs:false,props:['modelValue','value','state','text','logoOptions','cornersSquareOptions','cornersDotOptions','mode'],
          emits:['update:modelValue','reload','confirm'],setup(props,{emit,slots,attrs,expose}){
            const name=${JSON.stringify(args.path)},fixture=globalThis.__uniDemo;
            (fixture.controls[name]??=[]).push({props,slots,emit});
            if(name==='RebornWaterfall')expose({append:items=>fixture.appended.push(...items),remove:id=>{fixture.appended=fixture.appended.filter(item=>item.id!==id)}});
            return()=>name==='RebornLoadmore'?h('button',{'data-load-state':props.state,onClick:()=>{if(props.state==='error')emit('reload')}},props.state):
              h('div',{...attrs,'data-control':name,'data-title':name==='RebornText'&&props.value?props.value:undefined},slots.default?.()??props.value);
          }});`,
        loader: 'js', resolveDir: path.resolve('.'),
      }))
      builder.onLoad({ filter: /\.vue$/ }, ({ path: file }) => {
        const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file })
        return { contents: compileScript(descriptor, { id: file, inlineTemplate: true, fs: { fileExists: existsSync, readFile: name => readFileSync(name, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(file) }
      })
    } }],
  })
  const module = { exports: {} as { default: Component } }
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0]!.text}\n})`)(module, module.exports, createRequire(import.meta.url))
  return module.exports.default
}
