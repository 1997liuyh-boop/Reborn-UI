import type { Component } from 'vue'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { runInThisContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { build } from 'esbuild'

/** 按目标端移除条件编译分支，防止跨端局部变量产生伪语法冲突。 */
export function preprocess(source: string, platform = 'H5') {
  let active = true
  const stack: boolean[] = []
  return source.split('\n').filter(line => {
    const marker = line.match(/#(ifdef|ifndef)\s+([A-Z0-9_ |]+)/)
    if (marker) {
      const matches = marker[2]!.trim().split(/\s*\|\|\s*/).includes(platform)
      stack.push(active)
      active = active && (marker[1] === 'ifdef' ? matches : !matches)
      return false
    }
    if (/#endif/.test(line)) { active = stack.pop() ?? true; return false }
    return active
  }).join('\n')
}

const mocks: Record<string, string> = {
  '@/composables/useFieldGroup': "import {shallowRef} from 'vue';export function useFormInject(props){return {orientation:shallowRef(undefined),size:shallowRef(undefined),disabled:shallowRef(props.disabled??false),isError:shallowRef(false),validate:()=>{}}}",
  '@/composables/useDarkMode': "import {shallowRef} from 'vue';export const useDarkMode=()=>({isDark:shallowRef(false)})",
  '@/composables/useLockScroll': 'export const useLockScroll=()=>{}',
  '@/lib/tv': "export const tv=()=>()=>new Proxy(()=>'',{get:(_,key)=>(options)=>String(key)+(options?.active?' active':' inactive')})",
  '@/lib/utils': "export const cn=(...values)=>values.flat().filter(x=>typeof x==='string').join(' ')",
  '@/lib/device': 'export const isAppIOS=()=>false;export const isAppAndroid=()=>false;export const isHarmony=()=>false;export const getSafeAreaBottomInset=()=>0;export const getSystemInfo=()=>({screenHeight:800,safeArea:{top:44,bottom:780},safeAreaInsets:{top:44,bottom:20}})',
  '../../lib/device': 'export const isAppIOS=()=>false;export const isHarmony=()=>false',
  '@/lib/file': "export const uuid=()=>String(Math.random())",
  '../../lib/file': "export const uuid=()=>String(Math.random())",
  '@/lib/animation': 'export const createAnimation=()=>({opacity(){return this},play(){return this},stop(){globalThis.__u2.stopped++}})',
  '@/lib/util': "export const addUnit=v=>typeof v==='number'?v+'px':v;export const objToStyle=v=>v;export const isDef=v=>v!==undefined;export const isUndefined=v=>v===undefined;export const omitBy=(v,p)=>Object.fromEntries(Object.entries(v).filter(([,x])=>!p(x)))",
}

/** 加载真实组件，替换无关子控件与设备服务；不依赖运行中的开发服务器。 */
export async function loadModule(entry: string, extra: Record<string, string> = {}, platform = 'H5') {
  const sourceMocks = { ...mocks, ...extra }
  const absolute = path.resolve(entry)
  const result = await build({
    entryPoints: [absolute], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
    alias: { '@': path.resolve('packages/uniapp-project/src') },
    plugins: [{ name: 'u2-components', setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => sourceMocks[args.path] === undefined ? undefined : { path: args.path, namespace: 'mock' })
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: sourceMocks[args.path]!, loader: 'ts', resolveDir: path.resolve('.') }))
      builder.onLoad({ filter: /\.ts$/, namespace: 'file' }, ({ path: file }) => ({ contents: preprocess(readFileSync(file, 'utf8'), platform), loader: 'ts', resolveDir: path.dirname(file) }))
      builder.onLoad({ filter: /\.vue$/ }, ({ path: file }) => {
        if (file !== absolute && !file.endsWith('RebornPopupPanel.vue')) {
          const name = path.basename(file, '.vue')
          return { loader: 'js', contents: `import {defineComponent,h} from 'vue';export default defineComponent({name:${JSON.stringify(name)},inheritAttrs:false,props:['modelValue','value','show','text','focus','columns','color','size','customStyle','customClass'],emits:['update:modelValue','change-index','confirm','focus','blur','click'],setup(props,{emit,slots,expose}){(globalThis.__u2.controls[${JSON.stringify(name)}]??=[]).push({props,emit});expose({focus(){},clear(){emit('clear')}});return()=>h('div',{'data-control':${JSON.stringify(name)},style:props.customStyle},[slots.prefix?.(),slots.header?.(),slots.default?.({showText:true,text:props.text,placeholder:'',ui:new Proxy({},{get:()=>()=>''}),item:{},index:0}),slots.suffix?.()])}})`, resolveDir: path.dirname(file) }
        }
        const { descriptor } = parse(preprocess(readFileSync(file, 'utf8'), platform), { filename: file })
        return { contents: compileScript(descriptor, { id: file, inlineTemplate: true, fs: { fileExists: existsSync, readFile: name => readFileSync(name, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(file) }
      })
    } }],
  })
  const module = { exports: {} as { default: Component } }
  runInThisContext(`(function(module,exports,require){${result.outputFiles[0]!.text}\n})`)(module, module.exports, createRequire(import.meta.url))
  return module.exports
}

export async function loadComponent(entry: string, extra: Record<string, string> = {}, platform = 'H5') {
  return (await loadModule(entry, extra, platform)).default
}
