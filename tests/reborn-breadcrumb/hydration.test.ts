/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { after, it } from 'node:test';
import { runInThisContext } from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { installDom } from '../composables/harness';

/**
 * 回归：Breadcrumb 服务端首屏与客户端水合的节点结构一致。
 *
 * 默认插槽由函数式组件 BreadcrumbTrail 在渲染期展开。它调用插槽时不带 _push，
 * 服务端走的是 SSR 编译产物里的 vnode 回退分支；而开发模式下客户端会把 v-if / v-else 分支前的模板注释
 * 编进分支（分支变成「注释 + 插槽」的片段），SSR 的回退分支却不保留这条注释。
 * 两边结构从第一个条目起就对不上，浏览器报 Hydration node mismatch。
 * 这里分别以 SSR 与客户端模式编译组件（开发模式、保留注释，与 Nuxt 开发服务器一致），服务端渲染后在 jsdom 里水合。
 */

const dom = installDom();
const { createSSRApp, h } = await import('vue');
const { renderToString } = await import('vue/server-renderer');
after(() => dom.window.close());

type BreadcrumbModule = typeof import('../../app/components/reborn/ui/reborn-breadcrumb');

/** 按指定模式编译整个 Breadcrumb 包；依赖包保持外部引用，与测试共享同一个 vue 实例 */
async function loadBreadcrumb(ssr: boolean): Promise<BreadcrumbModule> {
  const result = await build({
    entryPoints: [path.resolve('app/components/reborn/ui/reborn-breadcrumb/index.ts')],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    packages: 'external',
    alias: { '~': path.resolve('app'), '@': path.resolve('app') },
    plugins: [{
      name: 'vue-sfc',
      setup(builder) {
        builder.onLoad({ filter: /\.vue$/ }, (args) => {
          const { descriptor } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
          const compiled = compileScript(descriptor, {
            id: args.path,
            inlineTemplate: true,
            isProd: false,
            templateOptions: { ssr, ssrCssVars: [], compilerOptions: { comments: true } },
            fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
          });
          return { contents: compiled.content, loader: 'ts', resolveDir: path.dirname(args.path) };
        });
      },
    }],
  });
  const module = { exports: {} as BreadcrumbModule };
  runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0]!.text}\n})`)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
}

const server = await loadBreadcrumb(true);
const client = await loadBreadcrumb(false);

const routes = [
  { label: '工作台', path: '/overview' },
  { label: '设计规范', path: '/principles' },
  { label: '设计资源', path: '/visual' },
  { label: '组件详情' },
];

/** 同一份页面结构分别用服务端 / 客户端编译产物渲染 */
const scenarios: Record<string, (mod: BreadcrumbModule) => () => any> = {
  '默认插槽写法': ({ RebornBreadcrumb, RebornBreadcrumbItem }) => () => h(RebornBreadcrumb, { separator: '/' }, () => [
    h(RebornBreadcrumbItem, { to: '/overview', separatorIcon: 'lucide:chevron-right' }, () => '工作台'),
    h(RebornBreadcrumbItem, { to: '/visual' }, () => '设计资源'),
    h(RebornBreadcrumbItem, null, () => '组件详情'),
  ]),
  '默认插槽写法 + 折叠': ({ RebornBreadcrumb, RebornBreadcrumbItem }) => () => h(RebornBreadcrumb, { maxCount: 2 }, () =>
    routes.map(route => h(RebornBreadcrumbItem, { to: route.path }, () => route.label))),
  'routes 写法': ({ RebornBreadcrumb }) => () => h(RebornBreadcrumb, { routes }),
  'routes 写法 + 折叠': ({ RebornBreadcrumb }) => () => h(RebornBreadcrumb, { routes, maxCount: 3 }),
};

function registerStubs(app: ReturnType<typeof createSSRApp>) {
  app.component('Icon', { props: ['name'], render: () => h('i') });
  app.component('NuxtLink', { props: ['to'], setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.()) });
}

for (const [name, render] of Object.entries(scenarios)) {
  it(`${name}：服务端首屏可直接水合，没有节点不匹配`, async () => {
    const ssrApp = createSSRApp({ render: render(server) });
    registerStubs(ssrApp);
    const html = await renderToString(ssrApp);

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const warnings: string[] = [];
    const errors: string[] = [];
    const clientApp = createSSRApp({ render: render(client) });
    registerStubs(clientApp);
    clientApp.config.warnHandler = message => warnings.push(message);
    const originalError = console.error;
    console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));
    try {
      clientApp.mount(container);
    } finally {
      console.error = originalError;
      clientApp.unmount();
      container.remove();
    }
    assert.deepEqual(warnings.filter(message => /hydration/i.test(message)), [], `${name}：水合时出现节点不匹配`);
    assert.deepEqual(errors.filter(message => /hydration/i.test(message)), []);
  });
}
