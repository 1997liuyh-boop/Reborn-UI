/* eslint test/no-import-node-test: off -- 使用项目现有的 Node 内置测试运行器 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createHeroEntrance, landingNavigation } from "../../app/components/common/landing/videoHero.config.ts";

test("首页菜单保持四个项目文档路由", () => {
  assert.deepEqual(landingNavigation.map((item) => item.to), ["/getting-started", "/components", "/changelogs", "/composables"]);
});

test("入场动画保留约定的位移、延时和缓动", () => {
  const entrance = createHeroEntrance(20, 0.8, 0.8);
  assert.deepEqual(entrance.initial, { opacity: 0, transform: "translateY(20px)" });
  assert.deepEqual(entrance.animate, { opacity: 1, transform: "translateY(0px)" });
  assert.deepEqual(entrance.transition, { duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] });
});

test("减少动态效果保持水合一致并取消动画时长与延时", () => {
  const entrance = createHeroEntrance(-16, 0.8, 0.5, true);
  assert.deepEqual(entrance.initial, createHeroEntrance(-16, 0.8, 0.5).initial);
  assert.equal(entrance.transition.duration, 0);
  assert.equal(entrance.transition.delay, 0);
});
