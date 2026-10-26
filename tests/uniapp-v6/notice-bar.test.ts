/**
 * RebornNoticeBar（UniApp）回归：
 * 1. 非 H5 垂直轮播的入场动画：关键帧写在 scoped 样式里会被改名，引用它的 animation 必须在同一样式块，
 *    不能用生成在全局样式里的 Tailwind 任意值类。
 * 2. 切换 disabled 只停 / 启计时器，不把当前条目重置到第一条。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { nextTick, reactive } from 'vue'
import { fixture, loadComponent, mount } from '../uniapp-u1/harness'
import { componentRoot, preprocessMp } from './mp-template'

test('NoticeBar 小程序入场动画：使用的类在 scoped 样式内声明 animation，改名后仍指向同名关键帧', () => {
  const file = path.join(componentRoot, 'reborn-notice-bar/RebornNoticeBar.vue')
  const { descriptor } = parse(preprocessMp(readFileSync(file, 'utf8')), { filename: file })
  const template = descriptor.template!.content
  assert.doesNotMatch(template, /animate-\[notice-bar-enter/, '全局 Tailwind 类引用不到 scoped 改名后的关键帧')
  const enterClass = template.match(/class="(notice-bar-enter)"/)?.[1]
  assert.equal(enterClass, 'notice-bar-enter', '非 H5 轮播项应使用组件内的入场动画类')

  const style = descriptor.styles.find(block => block.scoped)!
  const { code } = compileStyle({ source: style.content, filename: file, id: 'data-v-v6test', scoped: true })
  const keyframes = code.match(/@keyframes (notice-bar-enter[\w-]*)/)?.[1]
  assert.ok(keyframes, '关键帧应存在')
  const rule = code.match(/\.notice-bar-enter\[data-v-v6test\]\s*\{[^}]*animation:\s*([\w-]+)/)
  assert.ok(rule, '入场类需要写在同一 scoped 样式块里')
  assert.equal(rule[1], keyframes, 'animation 引用的名字必须与改名后的关键帧一致')
})

test('NoticeBar 垂直轮播：切换 disabled 保留当前条目，换消息列表才回到第一条', async () => {
  fixture()
  // H5 分支的 out-in Transition 依赖真实 DOM，这里按小程序分支渲染（轮播逻辑两端共用）
  const NoticeBar = await loadComponent('reborn-notice-bar/RebornNoticeBar.vue', [], 'uniapp', 'MP-WEIXIN')
  const changes: number[] = []
  const props = reactive<Record<string, any>>({ text: ['一', '二', '三'], direction: 'vertical', interval: 30, onChange: (index: number) => changes.push(index) })
  const wrapper = await mount(NoticeBar, props)
  await new Promise(resolve => setTimeout(resolve, 75))
  assert.ok(changes.length >= 1, '计时器应推进轮播')
  const current = changes.at(-1)!
  props.disabled = true
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 60))
  assert.equal(changes.at(-1), current, '禁用后停止轮播')
  const before = changes.length
  props.disabled = false
  await nextTick()
  // 等到解禁后的第一次推进（轮询，避免机器繁忙时计时漂移导致误判）
  for (let i = 0; i < 50 && changes.length === before; i++) await new Promise(resolve => setTimeout(resolve, 10))
  assert.equal(changes[before], (current + 1) % 3, '解禁后从当前条目继续，而不是回到第一条')
  props.text = ['甲', '乙']
  await nextTick()
  wrapper.exposed?.pause?.()
  const probe = changes.length
  await new Promise(resolve => setTimeout(resolve, 40))
  assert.equal(changes.length, probe, '暂停后不再推进')
  wrapper.unmount()
})
