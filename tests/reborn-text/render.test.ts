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

/** 在真实 Vue SSR 中验证文本组件，临时产物仅位于测试目录且结束时清理。 */
const directory = await mkdtemp(resolve('tests/reborn-text/.render-'));
const output = resolve(directory, 'component.mjs');
after(async () => { await unlink(output).catch(() => {}); await rmdir(directory); });
await build({
  entryPoints: [resolve('app/components/reborn/ui/reborn-text/RebornText.vue')],
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
        const script = compileScript(descriptor, { id: 'text-test', inlineTemplate: true, templateOptions: { ssr: true } });
        return { contents: script.content, loader: 'ts' };
      });
    },
  }],
});
const { default: RebornText } = await import(pathToFileURL(output).href);
const render = (props: Record<string, unknown>) => {
  const app = createSSRApp({ render: () => h(RebornText, props) });
  app.component('Icon', { render: () => h('i') });
  return renderToString(app);
};

it('未声明的属性落在文字节点上', async () => {
  const html = await render({ 'value': '文本', 'id': 'amount', 'data-role': 'price', 'aria-label': '价格', 'style': { color: 'red' } });
  assert.match(html, /<span id="amount"[^>]*class="[^"]*RebornText-base/);
  assert.match(html, /data-role="price"/);
  assert.match(html, /aria-label="价格"/);
  assert.match(html, /color:red/);
});
it('省略样式在服务端输出带前缀的有效属性名', async () => {
  const html = await render({ value: '很长的文本', ellipsis: true, lines: 2 });
  assert.match(html, /-webkit-line-clamp:2/);
  assert.match(html, /-webkit-box-orient:vertical/);
  assert.match(html, /line-clamp:2/);
  assert.match(html, /word-break:break-all/);
  assert.doesNotMatch(html, /[;"]webkit-/);
});
