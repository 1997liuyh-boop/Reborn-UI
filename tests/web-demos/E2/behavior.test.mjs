/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { afterEach, it } from "node:test";
import { pathToFileURL } from "node:url";
import { runInThisContext } from "node:vm";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<html><body></body></html>", { url: "http://localhost" });
for (const key of ["window", "document", "Element", "HTMLElement", "SVGElement", "Node"])
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
const { compileScript, parse } = require("@vue/compiler-sfc");
const { transformSync } = require("esbuild");
const vue = require("vue");
const { createApp, defineComponent, getCurrentInstance, h, nextTick } = vue;
const base = "app/components/reborn/examples/";
const cleanups = [];
let stubs = {};
let cache = new Map();
const passthrough = defineComponent({ setup: (_props, { slots }) => () => h("div", slots.default?.()) });

/** 编译真实演示的脚本、模板及私有子组件，仅用可观察契约替换公共 UI。 */
function load(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const source = readFileSync(absolute, "utf8");
  let script = source;
  if (file.endsWith(".vue")) {
    const { descriptor } = parse(source, { filename: absolute });
    script = compileScript(descriptor, {
      id: absolute,
      inlineTemplate: true,
      fs: { fileExists: existsSync, readFile: file => readFileSync(file, "utf8") },
    }).content;
  }
  const code = transformSync(script, { loader: "ts", format: "cjs" }).code;
  const module = { exports: {} };
  function localRequire(id) {
    if (id === "#components") return new Proxy({}, { get: (_target, key) => stubs[key] || passthrough });
    if (id === "#imports") return { useState: (_key, init) => vue.shallowRef(init()) };
    if (id.endsWith(".vue") && !id.includes("examples") && !id.startsWith("."))
      return stubs[path.basename(id, ".vue")] || passthrough;
    if (id.startsWith("~/") || id.startsWith(".")) {
      let target = id.startsWith("~/") ? path.resolve("app", id.slice(2)) : path.resolve(path.dirname(absolute), id);
      if (!existsSync(target) && existsSync(`${target}.ts`)) target += ".ts";
      if (target.endsWith(".vue") && target.includes(`${path.sep}ui${path.sep}`))
        return stubs[path.basename(target, ".vue")] || passthrough;
      return load(target);
    }
    return require(id);
  }
  runInThisContext(`(function(module, exports, require) { ${code}\n})`)(module, module.exports, localRequire);
  const result = file.endsWith(".vue") ? module.exports.default : module.exports;
  cache.set(absolute, result);
  return result;
}

/** 记录公开属性和事件入口，不读取或复制演示组件的内部实现。 */
function observed(name, props, records, options = {}) {
  const component = defineComponent({
    name,
    props,
    emits: ["update:modelValue", "update:open", "change"],
    setup(props, { attrs, emit, expose, slots }) {
      const record = { props, attrs, emit, instance: getCurrentInstance() };
      records.push(record);
      expose(options.expose?.(record) || {});
      return () => options.render?.({ props, attrs, emit, slots }) || h("div");
    },
  });
  stubs[name] = component;
  return component;
}

function setupPlayground(records) {
  observed("Playground", ["modelValue", "controls", "title"], records, {
    render: ({ slots }) => h("div", { "data-playground": "" }, [slots.tag?.(), slots.default?.()]),
  });
}

/** 取演练场预览区里当前挂载着的那个实例：预览区按 key 重建后，旧实例的记录仍留在数组里 */
function livePlaygroundRecord(records, root) {
  const area = root.querySelector("[data-playground]");
  return records.filter(record => !record.instance.isUnmounted && area.contains(record.instance.subTree.el)).at(-1);
}

function mount(file, props = {}) {
  stubs.RebornButton ||= defineComponent({
    props: ["disabled"],
    setup: (props, { attrs, slots }) => () => h("button", { ...attrs, disabled: props.disabled }, slots.default?.()),
  });
  const root = document.createElement("div");
  document.body.append(root);
  const app = createApp(load(base + file), props);
  const warnings = [];
  app.config.warnHandler = warning => warnings.push(warning);
  app.mount(root);
  let stopped = false;
  const stop = () => { if (!stopped) { app.unmount(); root.remove(); stopped = true; } };
  cleanups.push(stop);
  return { root, stop, warnings };
}

afterEach(() => {
  cleanups.splice(0).forEach(stop => stop());
  stubs = {};
  cache = new Map();
});
const flush = async () => { await Promise.resolve(); await nextTick(); await Promise.resolve(); };

it("级联演练场整体替换无关配置保留选中值，切换多选和路径模式才清空", async () => {
  const playgrounds = [];
  const pickers = [];
  setupPlayground(playgrounds);
  observed("RebornCascader", ["modelValue", "multiple", "pathMode", "loadMore"], pickers);
  mount("reborn-cascader/RebornCascaderDemo.vue");
  const playground = playgrounds[0];
  const picker = pickers[0];
  picker.emit("update:modelValue", "xihu"); await flush();
  playground.emit("update:modelValue", { ...playground.props.modelValue, size: "lg", color: "success" }); await flush();
  assert.equal(picker.props.modelValue, "xihu");
  playground.emit("update:modelValue", { ...playground.props.modelValue, multiple: true }); await flush();
  assert.deepEqual(picker.props.modelValue, []);
  picker.emit("update:modelValue", ["xihu"]); await flush();
  playground.emit("update:modelValue", { ...playground.props.modelValue, pathMode: true }); await flush();
  assert.deepEqual(picker.props.modelValue, []);
});

it("多个懒加载请求并发完成；卸载后所有待完成请求都取消", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const pickers = [];
  observed("RebornCascader", ["loadMore"], pickers);
  const view = mount("reborn-cascader/RebornCascaderDemo.vue");
  const loadMore = pickers.find(picker => picker.props.loadMore).props.loadMore;
  const completed = [];
  loadMore({ value: "zhejiang" }, children => completed.push(children));
  loadMore({ value: "jiangsu" }, children => completed.push(children));
  context.mock.timers.tick(600); await flush();
  assert.equal(completed.length, 2);
  assert.equal(completed[0][0].value, "hangzhou");
  loadMore({ value: "hangzhou", label: "杭州" }, children => completed.push(children));
  loadMore({ value: "ningbo", label: "宁波" }, children => completed.push(children));
  view.stop(); context.mock.timers.tick(600); await flush();
  assert.equal(completed.length, 2);
});

it("通知真假值互相独立，卡片只形成一层可点击 label", async () => {
  const boxes = [];
  observed("RebornCheckbox", ["modelValue", "label", "trueValue", "falseValue", "value"], boxes, {
    render: ({ props, slots }) => h("label", [props.label, slots.default?.()]),
  });
  const view = mount("reborn-checkbox/RebornCheckboxDemo.vue");
  const system = boxes.find(box => box.props.trueValue === "系统更新");
  const product = boxes.find(box => box.props.trueValue === "产品迭代");
  const activity = boxes.find(box => box.props.trueValue === "活动通知");
  product.emit("update:modelValue", "产品迭代"); await flush();
  assert.equal(system.props.modelValue, "系统更新");
  assert.equal(activity.props.modelValue, "活动不通知");
  product.emit("update:modelValue", "产品不迭代"); await flush();
  assert.equal(system.props.modelValue, "系统更新");
  assert.match(view.root.textContent, /产品不迭代/);
  assert.equal(view.root.querySelectorAll("label label").length, 0);
  assert.equal(view.root.querySelectorAll("label .text-highlighted").length, 3);
});

it("日历只挂一个共享菜单，右键日期切换目标和禁用态，工具栏关闭菜单", async () => {
  const menus = [];
  const dialogs = [];
  let calendar;
  observed("RebornContextMenu", ["items", "open"], menus, {
    render: ({ emit, slots }) => h("div", { onContextmenu: () => emit("update:open", true) }, slots.default?.()),
  });
  observed("RebornDialog", ["modelValue", "title"], dialogs);
  stubs.RebornCalendar = defineComponent({
    props: ["events", "modelValue"],
    setup(props, { slots }) {
      calendar = props;
      return () => h("div", [
        h("div", { "data-toolbar": "" }, "工具栏"),
        ...[props.modelValue, "2040-01-01"].map(day => slots["date-cell"]?.({
          data: { day, date: new Date(`${day}T00:00:00`), isSelected: day === props.modelValue, type: "current-month" },
          events: props.events.filter(event => event.date === day),
        })),
      ]);
    },
  });
  const view = mount("reborn-calendar/RebornCalendarEventsDemo.vue");
  assert.equal(menus.length, 1);
  const fire = selector => view.root.querySelector(selector).dispatchEvent(new window.MouseEvent("contextmenu", { bubbles: true }));
  fire(`[data-event-day="${calendar.modelValue}"] button`); await flush();
  assert.equal(menus[0].props.open, true);
  assert.equal(menus[0].props.items[1].disabled, false);
  menus[0].props.items[1].onSelect(); await flush();
  assert.match(dialogs[0].props.title, /删除/);
  fire('[data-event-day="2040-01-01"] button'); await flush();
  assert.equal(menus[0].props.items[1].disabled, true);
  menus[0].props.items[0].onSelect(); await flush();
  assert.match(dialogs[0].props.title, /2040年1月1日事项添加/);
  fire("[data-toolbar]"); await flush();
  assert.deepEqual(menus[0].props.items, []);
  assert.equal(menus[0].props.open, false);
});

it("徽标确认只在用户动作中调用，Promise 结果可拦截关闭且不留下延时", async context => {
  const badges = [];
  observed("RebornBadge", ["beforeClose"], badges);
  const confirm = context.mock.method(window, "confirm", () => false);
  const timer = context.mock.method(globalThis, "setTimeout");
  mount("reborn-badge/RebornBadgeDemo.vue");
  const previous = timer.mock.callCount();
  const check = badges.find(badge => badge.props.beforeClose).props.beforeClose;
  assert.equal(await check(), false);
  assert.equal(confirm.mock.callCount(), 1);
  assert.equal(timer.mock.callCount(), previous);
});

it("优惠券只绑定公开 props，背景与虚线控制值不会透传成 DOM 属性", () => {
  const coupons = [];
  observed("RebornCoupon", ["type", "size"], coupons);
  mount("reborn-coupon/RebornCouponDemo.vue");
  for (const field of ["background", "lineWidth", "lineHeight"])
    assert.equal(Object.hasOwn(coupons[0].attrs, field), false);
  assert.match(coupons[0].attrs.style.background, /linear-gradient/);
});

for (const [directory, component, emptyValue] of [
  ["reborn-date-picker", "RebornDatePicker", null],
  ["reborn-date-picker-panel", "RebornDatePickerPanel", ""],
]) {
  it(`${component} 演练场外壳在主文件：类型重置、默认重置和配色调整仍使用独立业务值`, async () => {
    const playgrounds = [];
    const pickers = [];
    setupPlayground(playgrounds);
    observed(component, ["modelValue", "type", "color", "size"], pickers);
    stubs.DemoNote = defineComponent({ setup: (_props, { slots }) => () => h("p", slots.default?.()) });
    const view = mount(`${directory}/${component}Demo.vue`);
    const playground = playgrounds[0];
    const picker = () => livePlaygroundRecord(pickers, view.root);
    assert.equal(playground.props.title, "交互演练场");
    assert.equal(picker().props.modelValue, "2024-04-03");
    playground.emit("update:modelValue", { ...playground.props.modelValue, color: "success", size: "lg" }); await flush();
    assert.equal(picker().props.modelValue, "2024-04-03");
    assert.equal(picker().props.color, "success");
    playground.emit("update:modelValue", { ...playground.props.modelValue, type: "weekrange" }); await flush();
    assert.deepEqual(picker().props.modelValue, []);
    assert.equal(picker().props.type, "weekrange");
    picker().emit("update:modelValue", ["2024-04-07", "2024-04-13"]); await flush();
    assert.deepEqual(playground.props.modelValue.pickerValue, ["2024-04-07", "2024-04-13"]);
    playground.emit("update:modelValue", { ...playground.props.modelValue, type: "year" }); await flush();
    assert.equal(picker().props.modelValue, emptyValue);
    view.root.querySelector("[data-playground] button").click(); await flush();
    assert.equal(picker().props.modelValue, "2024-04-03");
    assert.equal(picker().props.type, "date");
    if (component.endsWith("Panel")) {
      // 其余章节的面板跟随演练场的配色与尺寸，且只在主文件持有一份
      const sections = () => pickers.filter(record => !record.instance.isUnmounted && record !== picker() && record.props.color);
      playground.emit("update:modelValue", { ...playground.props.modelValue, color: "warning", size: "sm" }); await flush();
      assert.ok(sections().length > 0);
      assert.ok(sections().every(record => record.props.color === "warning" && record.props.size === "sm"));
      view.root.querySelector("[data-playground] button").click(); await flush();
      assert.ok(sections().every(record => record.props.color === "primary" && record.props.size === "md"));
    }
    assert.deepEqual(view.warnings.filter(warning => /not defined|Missing/.test(warning)), []);
  });
}

it("日期演练场预览区重建后事件日志清空，日志只保留最近 5 条", async () => {
  const playgrounds = [];
  const pickers = [];
  setupPlayground(playgrounds);
  observed("RebornDatePicker", ["modelValue"], pickers);
  const view = mount("reborn-date-picker/RebornDatePickerDemo.vue");
  const playground = playgrounds[0];
  const picker = () => livePlaygroundRecord(pickers, view.root);
  const logItems = () => [...view.root.querySelectorAll("[data-playground] ul li")].map(item => item.textContent.trim());
  for (let index = 0; index < 7; index++) picker().attrs.onVisibleChange(index % 2 === 0);
  await flush();
  assert.equal(logItems().length, 5);
  assert.match(logItems()[0], /^visible-change\s+true$/);
  playground.emit("update:modelValue", { ...playground.props.modelValue, type: "month" }); await flush();
  assert.equal(logItems().length, 1);
  assert.match(logItems()[0], /展开下拉/);
});

it("日期表单章节通过类型化实例校验和重置，字段更新后提交使用最新值", async () => {
  let form;
  let resetCount = 0;
  const pickers = [];
  observed("RebornDatePicker", ["modelValue"], pickers);
  observed("RebornForm", ["modelValue", "rules"], [], {
    expose: record => {
      form = record;
      return {
        validate: () => record.props.rules.safeParse(record.props.modelValue).success,
        resetFields: () => { resetCount++; },
      };
    },
    render: ({ slots }) => h("div", slots.default?.()),
  });
  const view = mount("reborn-date-picker/RebornDatePickerFormDemo.vue");
  view.root.querySelectorAll("button")[0].click(); await flush();
  assert.match(view.root.textContent, /校验未通过/);
  pickers[0].emit("update:modelValue", "2024-04-03");
  pickers[1].emit("update:modelValue", ["2024-04-03", "2024-04-05"]); await flush();
  view.root.querySelectorAll("button")[0].click(); await flush();
  assert.match(view.root.textContent, /校验通过/);
  assert.equal(form.props.modelValue.departDate, "2024-04-03");
  view.root.querySelectorAll("button")[1].click(); await flush();
  assert.equal(resetCount, 1);
  assert.doesNotMatch(view.root.textContent, /校验通过/);
});

it("日期工具按本地日期标注节假日，并保留两类演示各自的空值文案", () => {
  const utils = load(`${base}_shared/date-demo-utils.ts`);
  const date = new Date(2024, 3, 4);
  assert.equal(utils.toDateKey(date), "2024-04-04");
  assert.equal(utils.holidayMark(date), "休");
  assert.equal(utils.holidayMark(new Date(2024, 3, 7)), "班");
  assert.equal(utils.formatDisplay([]), "[]");
  assert.equal(utils.formatPanelDisplay([]), "空数组");
  assert.equal(utils.formatDisplay(null), "null");
  assert.equal(utils.formatPanelDisplay(null), "未选择");
  assert.equal(utils.rangeShortcuts[0].value().length, 2);
  assert.equal(utils.valueFormatOf("quarterrange"), "YYYY-[Q]Q");
  assert.equal(utils.valueFormatOf("datetime"), "YYYY-MM-DD HH:mm");
  assert.equal(utils.valueFormatOf("week"), "YYYY-MM-DD");
  // 两个日志实例各自计数，列表只保留最近 limit 条，且对外只读
  const first = utils.useEventLog(2);
  const second = utils.useEventLog(2);
  first.push("a", "1"); first.push("b", "2"); first.push("c", "3");
  second.push("x", "1");
  assert.deepEqual(first.logs.value.map(log => log.name), ["c", "b"]);
  assert.equal(second.logs.value[0].id, 1);
  first.clear();
  assert.equal(first.logs.value.length, 0);
});

it("章节标题全部写在主文件，展开子组件后章节顺序与组件实例数不变，子组件不跨组件目录引用", async () => {
  const baseline = JSON.parse(readFileSync(new URL("./content-baseline.json", import.meta.url), "utf8"));
  for (const [directory, component] of [["reborn-date-picker", "RebornDatePicker"], ["reborn-date-picker-panel", "RebornDatePickerPanel"]]) {
    const main = `${base}${directory}/${component}Demo.vue`;
    const sections = source => [...source.matchAll(/<DemoSection\b[^>]+\btitle="([^"]+)"/g)].map(match => match[1]);
    function expand(file) {
      let source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/import (\w+Demo) from "\.\/(\w+Demo\.vue)";/g)) {
        const child = expand(path.join(path.dirname(file), match[2]));
        source = source.replace(new RegExp(`<${match[1]}\\b[^>]*?/>`), child.slice(child.indexOf("<template>") + 10, child.lastIndexOf("</template>")));
      }
      return source;
    }
    // 文档站与知识库只读主文件：章节标题必须直接写在主文件里，不能藏在子组件中
    assert.deepEqual(sections(readFileSync(main, "utf8")), baseline[directory].chapters);
    const current = expand(main);
    assert.deepEqual(sections(current), baseline[directory].chapters);
    const count = source => [...source.slice(source.indexOf("<template>")).matchAll(new RegExp(`<${component}\\b`, "g"))].length;
    assert.equal(count(current), baseline[directory].instances);
    const sources = (await import(pathToFileURL(path.resolve("scripts/kb/sources.ts")).href)).findDemoFiles(directory);
    const names = sources.filter(source => source.platform === "web").map(source => source.relPath);
    assert.ok(names.some(name => name.endsWith(`${component}Demo.vue`)));
    for (const name of names) {
      // 子组件只放卡片内容：不再包 DemoSection / Playground，也不引用另一个组件的演示目录
      const source = readFileSync(name, "utf8");
      if (!name.endsWith(`/${component}Demo.vue`)) assert.doesNotMatch(source, /<(?:DemoSection|Playground)\b/, name);
      assert.doesNotMatch(source, /from "\.\.\/reborn-/, name);
    }
  }
});
