/**
 * 用仓库内的 @dcloudio/uni-mp-compiler 把 UniApp 组件模板编译成微信小程序 WXML + 数据函数，
 * 再用一个极简的 WXML 解释器按小程序语义求值，验证「小程序端实际会渲染什么」。
 *
 * 只覆盖本目录用例需要的语法：标签树、wx:if / wx:elif / wx:else、wx:for、{{}} 插值与 <slot>。
 * 编译选项与 @dcloudio/uni-mp-weixin 的 getMiniProgramOptions 一致（插槽后备内容不下发到 WXML）。
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { compile } from '@dcloudio/uni-mp-compiler'
import { parse } from '@vue/compiler-sfc'
import { transformSync } from 'esbuild'

export const componentRoot = path.resolve('packages/uniapp-project/src/components')

/** 按小程序条件编译保留 MP / MP-WEIXIN 分支 */
export function preprocessMp(source: string) {
  const stack: boolean[] = []
  return source.split(/\r?\n/).filter((line) => {
    const directive = line.match(/(?:\/\/|<!--|\/\*)\s*#(ifdef|ifndef|endif)\b(.*)$/)
    if (!directive) return stack.every(Boolean)
    if (directive[1] === 'endif') stack.pop()
    else {
      const flags = directive[2]!.replace('-->', '').replace('*/', '').trim().split(/\s*\|\|\s*/)
      const match = flags.some(flag => ['MP', 'MP-WEIXIN', 'VUE3'].includes(flag))
      stack.push(directive[1] === 'ifdef' ? match : !match)
    }
    return false
  }).join('\n')
}

export interface MpTemplate {
  /** 编译出的 WXML */
  wxml: string
  /** 以给定组件上下文执行数据函数，得到 setData 的数据 */
  render: (ctx: Record<string, any>) => Record<string, any>
}

/** 编译组件文件（相对 components 目录）的模板 */
export function compileMpTemplate(file: string, source = readFileSync(path.join(componentRoot, file), 'utf8')): MpTemplate {
  const { descriptor } = parse(preprocessMp(source), { filename: file })
  let wxml = ''
  const result = compile(descriptor.template!.content, {
    mode: 'module',
    filename: file.replace(/\.vue$/, ''),
    hashId: 'v6',
    miniProgram: {
      class: { array: true },
      slot: { fallbackContent: false, dynamicSlotNames: true },
      event: { key: true },
      directive: 'wx:',
      emitFile: ({ source: output }: { source: string }) => { wxml += output },
    },
  } as any)
  const cjs = transformSync(result.code, { format: 'cjs', loader: 'js' }).code
  // 运行时辅助函数只需保留数据形状：事件句柄、属性包、类名与插值按值透传
  const helpers: Record<string, any> = {
    e: (target: any, ...sources: any[]) => Object.assign(target, ...sources),
    o: (handler: any) => handler,
    p: (props: any) => props,
    n: (value: any) => Array.isArray(value) ? value.join(' ') : String(value ?? ''),
    t: (value: any) => String(value ?? ''),
    toDisplayString: (value: any) => String(value ?? ''),
    resolveComponent: () => ({}),
    // v-for：与 uni-mp-vue 的 vFor 相同，逐项调用渲染函数得到每项的数据
    f: (source: any, renderItem: (item: any, key: any, index: number) => any) => {
      if (Array.isArray(source) || typeof source === 'string') return Array.from(source).map((item, index) => renderItem(item, index, index))
      if (typeof source === 'number') return Array.from({ length: source }, (_, index) => renderItem(index + 1, index, index))
      return Object.keys(source ?? {}).map((key, index) => renderItem(source[key], key, index))
    },
  }
  const runtime = new Proxy(helpers, { get: (target, key: string) => target[key] ?? ((value: any) => value) })
  const module = { exports: {} as any }
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', cjs)(module, module.exports, () => runtime)
  return { wxml, render: ctx => module.exports.render(ctx, []) }
}

interface WxmlNode { tag: string; attrs: Record<string, string>; children: WxmlNode[]; text?: string }

/** 把 WXML 字符串解析成节点树 */
export function parseWxml(wxml: string): WxmlNode {
  const root: WxmlNode = { tag: '#root', attrs: {}, children: [] }
  const stack = [root]
  const pattern = /<\/([\w-]+)>|<([\w-]+)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g
  for (const match of wxml.matchAll(pattern)) {
    const parent = stack[stack.length - 1]!
    if (match[1]) { stack.pop(); continue }
    if (match[5]) { parent.children.push({ tag: '#text', attrs: {}, children: [], text: match[5] }); continue }
    const attrs: Record<string, string> = {}
    for (const attr of match[3]!.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) attrs[attr[1]!] = attr[2] ?? ''
    const element: WxmlNode = { tag: match[2]!, attrs, children: [] }
    parent.children.push(element)
    if (!match[4]) stack.push(element)
  }
  return root
}

function evaluate(expression: string, scope: Record<string, any>) {
  // eslint-disable-next-line no-new-func
  return new Function('$scope', `with ($scope) { return (${expression}) }`)(scope)
}

function bind(value: string, scope: Record<string, any>) {
  const whole = value.match(/^\{\{([\s\S]*)\}\}$/)
  if (whole) return evaluate(whole[1]!, scope)
  return value.replace(/\{\{([\s\S]*?)\}\}/g, (_, expression) => String(evaluate(expression, scope) ?? ''))
}

/**
 * 按小程序语义渲染 WXML，返回可见内容的扁平列表：
 * 文本节点输出其文字，<slot> 输出 `slot:<name>`，自定义组件标签输出 `<tag>`。
 * 支持 wx:for（含 wx:for-item / wx:for-index），同一节点上 wx:for 先于 wx:if 求值。
 */
/** 渲染到自定义组件标签时的回调：拿到该标签的原始属性与当前作用域，可用来求值 u-s / u-p */
export type OnTag = (tag: string, attrs: Record<string, string>, scope: Record<string, any>) => void

export function renderWxml(wxml: string, scope: Record<string, any>, onTag?: OnTag): string[] {
  const output: string[] = []
  function emit(node: WxmlNode, current: Record<string, any>) {
    if (node.tag === '#text') {
      const text = String(bind(node.text!, current) ?? '').trim()
      if (text) output.push(text)
      return
    }
    if (node.tag === 'slot') output.push(`slot:${node.attrs.name ?? 'default'}`)
    else if (node.tag.includes('-')) {
      output.push(`<${node.tag}>`)
      onTag?.(node.tag, node.attrs, current)
    }
    walk(node.children, current)
  }
  function walk(nodes: WxmlNode[], current: Record<string, any>) {
    let chainMatched = false
    for (const node of nodes) {
      const { attrs } = node
      if ('wx:for' in attrs) {
        const list = bind(attrs['wx:for']!, current) ?? []
        const itemName = attrs['wx:for-item'] ?? 'item'
        const indexName = attrs['wx:for-index'] ?? 'index'
        Array.from(list as ArrayLike<any>).forEach((item, index) => {
          const itemScope = Object.assign(Object.create(current), { [itemName]: item, [indexName]: index })
          if ('wx:if' in attrs && !bind(attrs['wx:if']!, itemScope)) return
          emit(node, itemScope)
        })
        chainMatched = false
        continue
      }
      if ('wx:if' in attrs) {
        chainMatched = !!bind(attrs['wx:if']!, current)
        if (!chainMatched) continue
      }
      else if ('wx:elif' in attrs) {
        if (chainMatched) continue
        chainMatched = !!bind(attrs['wx:elif']!, current)
        if (!chainMatched) continue
      }
      else if ('wx:else' in attrs) {
        if (chainMatched) continue
      }
      emit(node, current)
    }
  }
  walk(parseWxml(wxml).children, scope)
  return output
}

/** 取 WXML 中所有指定标签的属性表 */
export function findTags(wxml: string, tag: string): Record<string, string>[] {
  const found: Record<string, string>[] = []
  const visit = (node: WxmlNode) => {
    if (node.tag === tag) found.push(node.attrs)
    node.children.forEach(visit)
  }
  visit(parseWxml(wxml))
  return found
}

export { bind as bindWxml }
