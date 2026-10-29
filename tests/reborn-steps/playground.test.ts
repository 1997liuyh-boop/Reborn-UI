/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { installDom } from '../composables/harness';

const dom = installDom();
const { createApp, nextTick } = await import('vue');
after(() => dom.window.close());

/** 使用真实演练场、字段绑定与步骤组件，仅替换无关控件的外观和浮层。 */
const result = await build({
  entryPoints: ['app/components/reborn/examples/reborn-steps/RebornStepsDemo.vue'],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  alias: { '~': resolve('app') },
  plugins: [{ name: 'steps-playground', setup(builder) {
    builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'components', namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
      contents: `import {h} from 'vue';export {default as Playground} from '~/components/common/play-ground/Playground.vue';export const Icon=()=>h('span');export const DemoNote={render(){return h('p',this.$slots.default?.())}};export const DemoBlock=DemoNote,DemoSection=DemoNote;`,
      loader: 'js', resolveDir: resolve('.'),
    }));
    builder.onLoad({ filter: /\.vue$/ }, ({ path }) => {
      if (/reborn-(?:checkbox|input-number|select)[\\/]/.test(path)) {
        return { contents: `import {h} from 'vue';export default {props:['modelValue','label','options','size','ui'],emits:['update:modelValue'],render(){
          if(this.options)return h('select',{value:this.modelValue,onChange:e=>this.$emit('update:modelValue',this.options[e.target.selectedIndex].value)},this.options.map(o=>h('option',{value:o.value},o.label)));
          const checkbox=${path.includes('checkbox')};return h('input',{type:checkbox?'checkbox':'number','aria-label':this.label,checked:checkbox?this.modelValue:undefined,value:this.modelValue,onChange:e=>this.$emit('update:modelValue',checkbox?e.target.checked:Number(e.target.value))});
        }};`, loader: 'js' };
      }
      if (/reborn-(?:popover|collapse)[\\/]/.test(path)) {
        return { contents: `import {h} from 'vue';export default {render(){return h('div',[this.$slots.default?.(),this.$slots.content?.()])}};`, loader: 'js' };
      }
      if (path.includes('/reborn/ui/') || path.includes('\\reborn\\ui\\')) {
        if (!/reborn-steps[\\/]/.test(path)) {
          return { contents: `import {h} from 'vue';export default {render(){return h('button',this.$slots.default?.())}};`, loader: 'js' };
        }
      }
      let source = readFileSync(path, 'utf8');
      if (path.endsWith('RebornStepsDemo.vue')) {
        const { descriptor } = parse(source, { filename: path });
        const template = descriptor.template!.content;
        const start = template.indexOf('<Playground');
        const end = template.indexOf('</Playground>') + '</Playground>'.length;
        source = `<script setup lang="ts">${descriptor.scriptSetup!.content}</script><template>${template.slice(start, end)}</template>`;
      }
      const { descriptor } = parse(source, { filename: path });
      return { contents: compileScript(descriptor, {
        id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
      }).content, loader: 'ts' };
    });
  } }],
});
const module = { exports: {} as { default: import('vue').Component } };
runInThisContext(`(function(module,exports,require){${result.outputFiles[0]!.text}\n})`)(module, module.exports, createRequire(import.meta.url));

function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(module.exports.default);
  app.component('Icon', { render: () => null });
  app.mount(root);
  return { root, stop: () => { app.unmount(); root.remove(); } };
}

/** 按用户可见文案操作开关，不读取演示内部状态。 */
async function toggle(root: HTMLElement, label: string) {
  const input = root.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
  assert.ok(input, `缺少开关：${label}`);
  input.click();
  await nextTick();
}

async function clickButton(root: HTMLElement, label: string) {
  const button = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.trim() === label);
  assert.ok(button, `缺少按钮：${label}`);
  button.click();
  await nextTick();
}

function progress(root: HTMLElement) {
  const ring = root.querySelector('[role="progressbar"]');
  return ring ? {
    index: Number(ring.closest('li')?.getAttribute('data-step-index')),
    value: Number(ring.getAttribute('aria-valuenow')),
  } : undefined;
}

function field(root: HTMLElement, label: string) {
  return Array.from(root.querySelectorAll('label')).find(element => element.textContent?.trim() === label)?.parentElement?.querySelector('input');
}

it('演练场的单步进度随当前步骤前进、回退，改值同时更新圆环和代码', async () => {
  const view = mount();
  try {
    await toggle(view.root, '设置单步进度');
    assert.deepEqual(progress(view.root), { index: 1, value: 45 });
    await clickButton(view.root, '下一步');
    assert.deepEqual(progress(view.root), { index: 2, value: 45 });
    const input = field(view.root, '当前步骤进度（%）');
    assert.ok(input);
    input.value = '75';
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await nextTick();
    assert.deepEqual(progress(view.root), { index: 2, value: 75 });
    assert.match(view.root.querySelector('pre')!.textContent!, /title="确认信息"[^\n]*:progress="75"/);
    await clickButton(view.root, '上一步');
    assert.deepEqual(progress(view.root), { index: 1, value: 75 });
  } finally { view.stop(); }
});

it('两种进度模式互斥，只展示有效输入，整体进度覆盖下标并可重置', async () => {
  const view = mount();
  try {
    assert.equal(field(view.root, '整体进度（%）'), undefined);
    await toggle(view.root, '设置单步进度');
    await toggle(view.root, '使用整体进度（自动折算步骤）');
    assert.equal(view.root.querySelector<HTMLInputElement>('input[aria-label="设置单步进度"]')!.checked, false);
    assert.equal(field(view.root, '当前步骤进度（%）'), undefined);
    assert.deepEqual(progress(view.root), { index: 2, value: 0 });
    const input = field(view.root, '整体进度（%）');
    assert.ok(input);
    input.value = '60';
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await nextTick();
    assert.equal(progress(view.root)?.index, 2);
    assert.ok(Math.abs(progress(view.root)!.value - 40) < 0.000001);
    assert.match(view.root.querySelector('pre')!.textContent!, /:overall-progress="60"/);
    await toggle(view.root, '设置单步进度');
    assert.equal(view.root.querySelector<HTMLInputElement>('input[aria-label="使用整体进度（自动折算步骤）"]')!.checked, false);
    assert.deepEqual(progress(view.root), { index: 1, value: 45 });
    assert.doesNotMatch(view.root.querySelector('pre')!.textContent!, /:overall-progress=/);
    await clickButton(view.root, '重置配置');
    assert.equal(progress(view.root), undefined);
    assert.equal(field(view.root, '当前步骤进度（%）'), undefined);
    assert.equal(field(view.root, '整体进度（%）'), undefined);
  } finally { view.stop(); }
});
