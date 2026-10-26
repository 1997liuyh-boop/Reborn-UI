/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { loadAppModule } from './harness';

const { computed, reactive } = await import('vue');

/** 模拟 vue-router 的当前路由：path 不含 query 与 hash，fullPath 含 */
const route = reactive({ path: '/components', fullPath: '/components' });
Object.assign(globalThis, { computed, useRoute: () => route });

const { useIsRootPage } = await loadAppModule<typeof import('../../app/composables/useIsRootPage')>('app/composables/useIsRootPage.ts');

it('带 hash、query 或尾斜杠访问总览页仍判定为根页', () => {
  const isRoot = useIsRootPage();
  for (const [path, fullPath] of [
    ['/components', '/components#series-reborn'],
    ['/components', '/components?from=home'],
    ['/changelogs/', '/changelogs/'],
    ['/blocks', '/blocks'],
  ]) {
    route.path = path!;
    route.fullPath = fullPath!;
    assert.equal(isRoot.value, true, fullPath);
  }
});

it('普通文档页与首页不是根页', () => {
  const isRoot = useIsRootPage();
  for (const path of ['/components/button/reborn-button', '/', '/getting-started']) {
    route.path = path;
    route.fullPath = path;
    assert.equal(isRoot.value, false, path);
  }
});
