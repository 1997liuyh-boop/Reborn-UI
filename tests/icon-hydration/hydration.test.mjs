import assert from "node:assert/strict";
// eslint-disable-next-line test/no-import-node-test -- 使用 Node 原生测试器，避免新增 Vitest 依赖。
import { test } from "node:test";
import { createHarness } from "./harness.mjs";

const harness = await createHarness();

test("旧远程 provider 超时会复现服务端 16 与客户端缓存 24 的水合冲突", async () => {
  const runtime = await harness.server();
  const fixture = await runtime.render("iconify");
  assert.equal((fixture.html.match(/viewBox="0 0 16 16"/g) || []).length, 3);
  assert.ok(fixture.warnings.some(message => message.includes("timed out")));
  assert.ok(!fixture.payload.data["i-lucide:copy"]);
  // 从另一个成功请求获得真实图标，模拟浏览器已访问过其他带复制按钮的页面。
  const local = await (await harness.server()).render();
  fixture.copy = local.copy;
  const result = await harness.hydrate(fixture, true);
  assert.ok(result.warnings.some(message => message.includes("viewBox") && message.includes("0 0 16 16") && message.includes("0 0 24 24")));
});

test("当前 provider 用本地 collection 预取，冷/热缓存的多个复制按钮均可离线水合", async () => {
  const runtime = await harness.server();
  for (const serverCache of ["cold", "warm"]) {
    const fixture = await runtime.render();
    assert.equal((fixture.html.match(/viewBox="0 0 24 24"/g) || []).length, 3, serverCache);
    assert.equal(fixture.payload.data["i-lucide:copy"].width, 24);
    assert.ok(fixture.payload.data["i-lucide:copy"].body.includes("<rect"));
    assert.deepEqual(fixture.warnings, []);
    assert.ok(fixture.requests.every(url => url.startsWith("/api/_nuxt_icon/")));
    assert.equal(fixture.requests.length, serverCache === "cold" ? 1 : 0);
    for (const hotClient of [false, true]) {
      const result = await harness.hydrate(fixture, hotClient);
      assert.equal(result.warnings.length, 0);
      assert.equal(result.requests.length, 0);
      assert.deepEqual(Array.from(result.viewBoxes), ["0 0 24 24", "0 0 24 24", "0 0 24 24"]);
      assert.ok(result.pathCount >= 3);
    }
  }
});
