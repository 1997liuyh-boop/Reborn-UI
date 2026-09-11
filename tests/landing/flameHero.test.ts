/* eslint test/no-import-node-test: off -- 使用项目现有的 Node 内置测试运行器 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { getScrubTime, installCommand } from "../../app/components/common/landing/flameHero.config.ts";
import { flameShader } from "../../app/components/common/landing/flameShader.ts";

test("横向移动按视频时长和灵敏度换算", () => {
  assert.equal(getScrubTime(1, 250, 1000, 5), 2);
  assert.equal(getScrubTime(2, -250, 1000, 5), 1);
});
test("视频进度不会超过开始和结束边界", () => {
  assert.equal(getScrubTime(1, -10000, 1000, 5), 0);
  assert.equal(getScrubTime(1, 10000, 1000, 5), 5);
});
test("未就绪的视频与零宽视口不产生无效 seek", () => {
  for (const duration of [0, Number.NaN, Infinity, -1]) assert.equal(getScrubTime(1, 50, 1000, duration), 1);
  assert.equal(getScrubTime(1, 50, 0, 5), 1);
  assert.equal(getScrubTime(1, Number.NaN, 1000, 5), 1);
});
test("使用项目真实安装命令与不依赖 HTML 纹理的火焰算法", () => {
  assert.equal(installCommand, "npx reborn-ui@latest init");
  assert.ok(flameShader.includes("void main()"));
  assert.ok(flameShader.includes("simplexNoise"));
  assert.ok(!flameShader.includes("iChannel0"));
  assert.ok(!flameShader.includes("iHasContent"));
});
