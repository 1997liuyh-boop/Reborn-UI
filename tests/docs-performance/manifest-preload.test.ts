/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { removeDevManifestPreload } from '../../server/utils/devManifestPreload';

it('开发清单不抢占首屏预加载，其他资源保持原样', () => {
  const stylesheet = '<link rel="preload" as="style" href="/_nuxt/style.css">';
  const production = '<link rel="preload" as="fetch" href="/_nuxt/builds/meta/production-id.json">';
  const manifest = '<link rel="preload" as="fetch" crossorigin="anonymous" href="/_nuxt/builds/meta/dev.json">';
  assert.equal(removeDevManifestPreload(stylesheet + manifest + production), stylesheet + production);
});

it('兼容部署前缀和属性顺序，不删除普通链接或按需资源', () => {
  assert.equal(removeDevManifestPreload("<link href='/docs/_nuxt/builds/meta/dev.json?version=1' as='fetch' rel='preload'>"), '');
  for (const tag of [
    '<link rel="prefetch" href="/_nuxt/builds/meta/dev.json">',
    '<link rel="preload" href="/_nuxt/builds/meta/dev.json.backup">',
    '<a rel="preload" href="/_nuxt/builds/meta/dev.json">导航</a>',
  ]) assert.equal(removeDevManifestPreload(tag), tag);
});
