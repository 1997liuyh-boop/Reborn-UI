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
const directory = await mkdtemp(resolve('tests/reborn-timeline/.render-'));
const output = resolve(directory, 'component.mjs');
after(async () => { await unlink(output).catch(() => {}); await rmdir(directory); });
await build({
  entryPoints: [resolve('app/components/reborn/ui/reborn-timeline/index.ts')],
  outfile: output,
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  alias: { '~': resolve('app'), '@': resolve('app') },
  plugins: [{
    name: 'vue-ssr',
    setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        const script = compileScript(descriptor, { id: 'timeline-test', inlineTemplate: true, templateOptions: { ssr: true } });
        return { contents: script.content, loader: 'ts' };
      });
    },
  }],
});
const { RebornTimeline: Timeline, RebornTimelineItem: Item, TIMELINE_PRESET_COLORS: colors } = await import(pathToFileURL(output).href);
const presets = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'];
const render = (props: Record<string, unknown> = {}, items = false) => {
  const app = createSSRApp({ render: () => items ? h(Timeline, { items: [{ content: '节点', ...props }] }) : h(Timeline, {}, { default: () => h(Item, props, { default: () => '节点' }) }) });
  app.component('Icon', { render: () => h('i') });
  return renderToString(app);
};

it('预设严格对应七个语义色及主题背景类', () => {
  assert.deepEqual(Object.keys(colors), presets);
  for (const color of presets) assert.equal(colors[color], `bg-${color}`);
});
it('插槽与数据驱动模式默认使用 primary', async () => {
  for (const items of [false, true]) assert.match(await render({}, items), /class="[^"]*bg-primary/);
});
it('七个预设支持普通圆点、图标与加载状态', async () => {
  for (const color of presets) {
    for (const props of [{}, { icon: 'lucide:check' }, { loading: true }]) {
      for (const items of [false, true]) {
        const html = await render({ color, ...props }, items);
        assert.match(html, new RegExp(`class="[^"]*bg-${color}`));
        assert.doesNotMatch(html, /background-color:/);
      }
    }
  }
});
it('自定义 CSS 色值在两种模式中保留内联填充', async () => {
  for (const color of ['#f59e0b', 'rgb(12, 34, 56)', 'var(--brand-color)', 'blue']) {
    for (const items of [false, true]) assert.ok((await render({ color }, items)).includes(`background-color:${color}`));
  }
});
it('预设色允许节点配置覆盖，但自定义色值保留内联优先级', async () => {
  const html = await render({ color: 'success', ui: { dot: 'bg-secondary' } });
  assert.match(html, /class="[^"]*bg-secondary/);
  assert.doesNotMatch(html, /bg-success/);
  assert.match(await render({ color: '#123456', ui: { dot: 'bg-secondary' } }), /background-color:#123456/);
});
