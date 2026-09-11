/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from "node:assert/strict";
import { it } from "node:test";
import { getSpotlightPosition } from "../../app/utils/lithosSpotlight";

it("指针坐标相对主视觉定位", () => {
  assert.deepEqual(getSpotlightPosition(350, 240, { left: 50, top: 40, width: 800, height: 600 }), {
    x: 300,
    y: 200,
  });
});
it("显影中心不会超出主视觉边界", () => {
  assert.deepEqual(getSpotlightPosition(-20, 900, { left: 0, top: 0, width: 400, height: 600 }), {
    x: 0,
    y: 600,
  });
});
it("容器尺寸变化后使用新的边界", () => {
  assert.deepEqual(getSpotlightPosition(380, 700, { left: 0, top: 0, width: 375, height: 667 }), {
    x: 375,
    y: 667,
  });
});
