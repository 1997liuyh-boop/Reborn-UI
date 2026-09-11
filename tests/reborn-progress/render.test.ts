/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器，不引入额外依赖 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { renderToString } from '@vue/server-renderer';
import { build } from 'esbuild';
import { createSSRApp, h } from 'vue';

/** 在真实 Vue SSR 中验证组件，临时产物仅位于测试目录且结束时清理。 */
const directory = await mkdtemp(resolve('tests/reborn-progress/.render-'));
const output = resolve(directory, 'component.mjs');
after(async () => { await unlink(output).catch(() => {}); await rmdir(directory); });
await build({
  entryPoints: [resolve('app/components/reborn/ui/reborn-progress/RebornProgress.vue')],
  outfile: output,
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  alias: { '~': resolve('app') },
  plugins: [{
    name: 'vue-ssr',
    setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        const script = compileScript(descriptor, { id: 'progress-test', inlineTemplate: true, templateOptions: { ssr: true } });
        return { contents: script.content, loader: 'ts' };
      });
    },
  }],
});
const Progress = (await import(pathToFileURL(output).href)).default;
const render = (props: Record<string, unknown> = {}, slots = {}) => renderToString(createSSRApp({ render: () => h(Progress, props, slots) }));

it('六种形态渲染正确且具有进度语义', async () => {
  for (const type of ['line', 'circle', 'dashboard']) {
    for (const steps of [0, 5]) {
      const html = await render({ type, steps, percent: 60, ariaLabel: '上传进度' });
      assert.match(html, /role="progressbar"/);
      assert.match(html, /aria-valuenow="60"/);
      assert.match(html, /aria-label="上传进度"/);
      assert.equal((html.match(/data-progress-track/g) || []).length, steps || 1);
      assert.doesNotMatch(html, /NaN|Infinity/);
    }
  }
});

it('状态图标、格式化函数和插槽按约定覆盖默认内容', async () => {
  assert.match(await render({ status: 'error', type: 'circle' }), /data-progress-icon="error"/);
  assert.match(await render({ status: 'success', type: 'circle' }), /data-progress-icon="success"/);
  const formatted = await render({ percent: 60, status: 'success', format: (value: number) => `已完成 ${value} MB` });
  assert.match(formatted, /已完成 60 MB/);
  assert.doesNotMatch(formatted, /data-progress-icon/);
  const slotted = await render({ percent: 42 }, { default: ({ percent }: { percent: number }) => h('b', `任务 ${percent}`) });
  assert.match(slotted, /<b>任务 42<\/b>/);
  assert.doesNotMatch(await render({ showText: false }), /data-progress-text/);
});

it('0% 无着色圆弧、100% 完整显示、非有限数值安全回退', async () => {
  assert.doesNotMatch(await render({ type: 'circle', percent: 0 }), /data-progress-fill/);
  assert.match(await render({ type: 'circle', percent: 100 }), /data-progress-fill/);
  assert.match(await render({ percent: Infinity }), /aria-valuenow="0"/);
});

it('步骤数组逐节点着色，后续节点不提前填充', async () => {
  const html = await render({ type: 'circle', percent: 60, steps: 5, strokeColor: ['#108ee9', '#108ee9', '#ffccc7'] });
  assert.equal((html.match(/data-progress-fill/g) || []).length, 3);
  assert.match(html, /stroke="#ffccc7"/);
});

it('同页渐变实例使用不同标识，服务端重复渲染结果稳定', async () => {
  const strokeColor = { stops: [{ offset: 0, color: 'red' }, { offset: 100, color: 'blue' }] };
  const app = () => createSSRApp({ render: () => h('div', [h(Progress, { type: 'circle', percent: 60, strokeColor }), h(Progress, { type: 'dashboard', percent: 50, strokeColor })]) });
  const html = await renderToString(app());
  const ids = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.equal(html, await renderToString(app()));
});

it('分段颜色截断于当前进度，格式化输出作为文本转义', async () => {
  const html = await render({ type: 'dashboard', percent: 50, segments: [{ percentage: 30, color: 'red' }, { percentage: 70, color: 'green' }] });
  assert.match(html, /stroke="red"/);
  assert.match(html, /stroke="green"/);
  assert.equal((html.match(/data-progress-fill/g) || []).length, 2);
  assert.match(await render({ format: () => '<img src=x>' }), /&lt;img src=x&gt;/);
});

it('步骤渐变在完整轨道坐标系中保留角度与色标', async () => {
  for (const angle of [0, 90, 270, 45]) {
    const html = await render({ steps: 5, percent: 100, strokeColor: { angle, stops: [{ offset: 0, color: 'red' }, { offset: 100, color: 'blue' }] } });
    assert.match(html, new RegExp(`linear-gradient\\(${angle}deg, red 0%, blue 100%\\)`));
    assert.match(html, /background-size:168px 100%/);
    assert.match(html, /background-position:-34px 0/);
  }
});

it('步骤轨道可独立滚动，分段圆弧轨道与填充使用一致平端', async () => {
  assert.match(await render({ steps: 12 }), /overflow-x-auto/);
  const html = await render({ type: 'dashboard', percent: 100, segments: [{ percentage: 50, color: 'red' }, { percentage: 100, color: 'blue' }] });
  assert.match(html, /<g[^>]*stroke-linecap="butt"/);
});
it('步骤内嵌文字位于滚动轨道外，不受细轨道高度裁切', async () => {
  for (const size of ['sm', 'md']) {
    const html = await render({ size, steps: 5, textInside: true, percent: 60 });
    assert.match(html, /<\/div><span data-progress-text/);
  }
});

it('直线内部文字默认白色且垂直居中，支持三档尺寸与样式覆盖', async () => {
  for (const size of ['sm', 'md', 'lg']) {
    for (const steps of [0, 5]) {
      const html = await render({ size, steps, percent: 60, textInside: true, format: () => '已完成 60%' });
      const classes = html.match(/<span data-progress-text[^>]*class="([^"]+)"/)?.[1] || '';
      assert.match(classes, /\btext-white\b/);
      assert.match(classes, /\bitems-center\b/);
      assert.match(classes, /\binset-y-0\b/);
      assert.doesNotMatch(classes, /\btext-default\b/);
    }
  }
  const overridden = await render({ textInside: true, ui: { text: 'text-black' } });
  assert.match(overridden, /data-progress-text[^>]*class="[^"]*text-black/);
  assert.doesNotMatch(overridden, /data-progress-text[^>]*class="[^"]*text-white/);
  assert.match(await render({ textInside: false }), /data-progress-text[^>]*class="[^"]*text-default/);
});
