/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';

// 回归：TextReveal 曾在任何一次组件更新时还原拆分、重建容器并重播入场动画。
// 这里用记录调用的 SplitText / gsap 桩替代真实库：桩和真实 SplitText 一样会把容器子节点整体换掉，
// 能复现「Vue 持有的插槽节点脱离 DOM」的前提，从而验证改动后的文字确实落到了页面上。
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'Text', 'Comment', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
}
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { createApp, h, nextTick, reactive, shallowRef } = require('vue');

/** 桩记录：create 为新建拆分（从头播放），resplit 为就地重新拆分，resume 为接着原进度 */
const log = [];
globalThis.__textRevealLog = log;
const stubs = {
  'gsap': `
    const log = globalThis.__textRevealLog;
    export const gsap = {
      registerPlugin() {},
      set() {},
      from(targets, vars) {
        const tween = { vars, time: 0.3, totalTime(value) { if (value === undefined) return this.time; this.time = value; log.push(['resume', value]); return this; } };
        log.push(['from', vars.duration]);
        return tween;
      },
    };
  `,
  'gsap/SplitText': `
    const log = globalThis.__textRevealLog;
    export class SplitText {
      static create(el, vars) { log.push(['create', el.textContent.trim()]); return new SplitText(el, vars); }
      constructor(el, vars) { this.el = el; this.isSplit = false; this.split(vars); }
      split(vars) {
        let animTime;
        if (this.isSplit) { animTime = this.anim?.totalTime(); this.revert(true); log.push(['resplit']); }
        this.vars = vars;
        this.orig = this.el.innerHTML;
        // 与真实 SplitText 一样换掉全部子节点，Vue 持有的旧节点从此脱离 DOM
        this.el.innerHTML = '<div class="line-mask"><div class="line">' + this.orig + '</div></div>';
        this.lines = [...this.el.querySelectorAll('.line')];
        this.isSplit = true;
        const result = vars.onSplit?.(this);
        this.anim = animTime ? result.totalTime(animTime) : result;
        return this;
      }
      revert(internal) { if (!this.isSplit) return; this.el.innerHTML = this.orig; this.isSplit = false; if (!internal) log.push(['revert']); }
      kill() { log.push(['kill']); }
    }
  `,
};
const result = await build({
  entryPoints: [path.resolve('app/components/reborn/ui/text-reveal/TextReveal.vue')],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{ name: '文字揭示隔离编译', setup(builder) {
    builder.onResolve({ filter: /^gsap(?:\/SplitText)?$/ }, args => ({ path: args.path, namespace: 'stub' }));
    builder.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ contents: stubs[args.path], loader: 'js' }));
    builder.onLoad({ filter: /\.vue$/ }, args => {
      const { descriptor } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      return {
        contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content,
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  } }],
});
const compiled = { exports: {} };
runInThisContext(`(function(module, exports, require) {${result.outputFiles[0].text}\n})`)(compiled, compiled.exports, require);
const TextReveal = compiled.exports.default;

const cleanups = [];
after(() => { while (cleanups.length) cleanups.pop()(); dom.window.close(); });

function mount(component) {
  const warnings = [];
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(component);
  app.config.warnHandler = message => warnings.push(message);
  app.mount(container);
  const cleanup = () => { app.unmount(); container.remove(); };
  cleanups.push(cleanup);
  return { container, warnings, cleanup };
}
const count = type => log.filter(([name]) => name === type).length;

it('只有插槽渲染结果或动画参数真正变化才重新拆分；文字与参数变化重播，属性变化接着原进度', async () => {
  log.length = 0;
  const state = reactive({ tick: 0, extra: '', duration: 0.6, paragraphs: [{ id: 1, text: '第一段文字', cls: '' }] });
  const { container, warnings, cleanup } = mount({
    components: { TextReveal },
    // v-for 作用域变量进了插槽，编译成动态插槽：父组件每次重渲染都会强制 TextReveal 更新
    template: `
      <section :data-tick="state.tick">
        <TextReveal
          v-for="p in state.paragraphs" :key="p.id"
          :class="['text-lg', state.extra]" :container-class="['max-w-xl']" :duration="state.duration"
        ><span :class="p.cls">{{ p.text }}</span></TextReveal>
      </section>`,
    setup: () => ({ state }),
  });
  await nextTick();
  assert.equal(count('create'), 1);
  const firstContainer = container.querySelector('.text-lg');

  // 与文字无关的父组件重渲染 + 内联 class 数组换新引用：不还原、不重建、不重播
  state.tick++;
  await nextTick();
  state.tick++;
  await nextTick();
  assert.equal(count('create'), 1);
  assert.equal(count('revert'), 0);
  assert.equal(count('resplit'), 0);
  assert.equal(container.querySelector('.text-lg'), firstContainer);
  assert.ok(firstContainer.querySelector('.line'));

  // 文字变化：容器重建，新文字落到页面上，从头重播
  state.paragraphs[0].text = '第二段文字';
  await nextTick();
  assert.equal(count('create'), 2);
  assert.equal(count('resume'), 0);
  assert.match(container.textContent, /第二段文字/);
  assert.doesNotMatch(container.textContent, /第一段文字/);

  // 插槽里只有类名变化：容器重建以带上新类名，但接着原进度，不重播
  state.paragraphs[0].cls = 'is-active';
  await nextTick();
  assert.equal(count('create'), 3);
  assert.deepEqual(log.filter(([name]) => name === 'resume'), [['resume', 0.3]]);
  assert.ok(container.querySelector('.line span.is-active'));

  // 动画参数变化：插槽不变，就地还原后重新拆分并按新参数重播
  const before = container.querySelector('.text-lg');
  state.duration = 1.2;
  await nextTick();
  assert.equal(count('create'), 4);
  assert.deepEqual(log.at(-1), ['from', 1.2]);
  assert.equal(container.querySelector('.text-lg'), before);
  assert.equal(count('resume'), 1);

  // 文字容器的类名真正变化：就地按新排版重新拆分，沿用原进度，不新建拆分
  state.extra = 'text-xl';
  await nextTick();
  assert.equal(count('create'), 4);
  assert.equal(count('resplit'), 1);
  assert.ok(container.querySelector('.text-lg.text-xl .line'));

  assert.deepEqual(warnings, []);
  log.length = 0;
  cleanup();
  cleanups.pop();
  assert.deepEqual(log, [['revert'], ['kill']]);
});

it('渲染函数传入的插槽在更新时不报「插槽在渲染函数外调用」，内容不变时同样不重播', async () => {
  log.length = 0;
  const tick = shallowRef(0);
  const text = shallowRef('渲染函数文字');
  const { container, warnings } = mount({
    render: () => h('div', { 'data-tick': tick.value }, [h(TextReveal, null, { default: () => [h('p', text.value)] })]),
  });
  await nextTick();
  tick.value++;
  await nextTick();
  assert.equal(count('create'), 1);
  text.value = '换了文字';
  await nextTick();
  assert.equal(count('create'), 2);
  assert.match(container.textContent, /换了文字/);
  assert.deepEqual(warnings, []);
});
