/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import theme from "../../app/components/reborn/ui/reborn-time-picker/reborn-time-panel.config";

it("滚动窗口为六行高，完整五项并在上下各显示半项", () => {
  assert.match(theme.slots.list, /h-\[174px\]/);
  assert.match(theme.slots.item, /h-\[29px\]/);
  assert.match(theme.slots.item, /text-base/);
  assert.match(theme.slots.item, /px-5 py-1/);
});

it("面板支持填充与上下描边，并通过 RebornScrollbar 滚动", () => {
  assert.ok("variant" in theme.variants);
  const source = readFileSync(
    "app/components/reborn/ui/reborn-time-picker/RebornTimePanel.vue",
    "utf8",
  );
  assert.match(source, /<RebornScrollbar/);
  assert.doesNotMatch(source.split("<template>")[1]!, /\bas\s+(TimeUnit|any|string)/);
});

it("六种时间格式严格校验，隐藏单位归零", async () => {
  const module =
    await import("../../app/components/reborn/ui/reborn-time-picker/time-picker.utils").catch(
      () => null,
    );
  assert.ok(module, "需要可测试的时间解析逻辑");
  for (const [format, value, expected] of [
    ["HH:mm:ss", "23:59:58", [23, 59, 58]],
    ["HH", "23", [23, 0, 0]],
    ["mm", "59", [0, 59, 0]],
    ["ss", "58", [0, 0, 58]],
    ["HH:mm", "09:08", [9, 8, 0]],
    ["mm:ss", "08:07", [0, 8, 7]],
  ] as const) {
    const state = module.parseTimeValue(value, format);
    assert.ok(state);
    assert.deepEqual([state.hour, state.minute, state.second], expected);
    assert.equal(module.formatTimeValue(state, format), value);
  }
  for (const value of ["", "24:00:00", "12:60:00", "12:00:60", "9:05:01", "abc"]) {
    assert.equal(module.parseTimeValue(value, "HH:mm:ss"), null);
  }
  assert.deepEqual(module.getTimeUnits("HH:mm:ss.SSS"), [
    "hour",
    "minute",
    "second",
    "millisecond",
  ]);
});

it("循环滚动的居中偏移可准确还原时分秒值", async () => {
  const module =
    await import("../../app/components/reborn/ui/reborn-time-picker/time-picker.utils").catch(
      () => null,
    );
  assert.ok(module, "需要可测试的滚动定位逻辑");
  for (const count of [24, 60, 1000]) {
    for (const value of [0, 1, count - 1]) {
      const top = module.getCenteredScrollTop(value, count, 29, 174);
      assert.equal(module.getScrollValue(top, count, 29, 174), value);
    }
  }
});


it("中心细线独立缩放且高于悬停背景，基础面板独立留白", () => {
  const indicator = theme.variants.variant.outlined.indicator;
  assert.doesNotMatch(indicator, /border-y-/);
  for (const side of ["before", "after"]) {
    assert.ok(indicator.includes(`${side  }:h-px`));
    assert.ok(indicator.includes(`${side  }:scale-y-50`));
    assert.ok(indicator.includes(`${side  }:bg-gray-6`));
  }
  assert.ok(indicator.includes("before:origin-top"));
  assert.ok(indicator.includes("after:origin-bottom"));
  assert.match(theme.variants.variant.outlined.indicator, /z-10/);
  assert.doesNotMatch(theme.slots.wrapper, /p[xy]-/);
  assert.equal(theme.slots.body, "px-1 py-2");
  assert.match(theme.slots.footer, /py-2/);
});


it("选中项保持常规字重，范围值居中，底部按钮等分且变体正确", async () => {
  const pickerTheme = (await import('../../app/components/reborn/ui/reborn-time-picker/reborn-time-picker.config')).default;
  assert.equal(theme.slots.itemActive, 'font-normal');
  assert.match(pickerTheme.slots.rangeText, /text-center/);
  assert.match(theme.slots.footer, /justify-center/);
  const source = readFileSync('app/components/reborn/ui/reborn-time-picker/RebornTimePanel.vue', 'utf8');
  const footer = source.slice(source.indexOf('name="footer"'));
  const buttons = [...footer.matchAll(/<RebornButton([\s\S]*?)<\/RebornButton>/g)].map(match => match[1]);
  assert.match(buttons[0]!, /variant="text"/);
  assert.match(buttons[1]!, /variant="filled"/);
  assert.match(footer, /grid w-full grid-cols-2 gap-2/);
  for (const button of buttons) assert.match(button!, /class="w-full min-w-0 justify-center"/);
});
