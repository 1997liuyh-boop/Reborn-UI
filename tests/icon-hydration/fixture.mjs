import { addIcon } from "@iconify/vue";
import { NuxtIconSvg } from "@nuxt/icon/runtime/components/svg.js";
import iconPlugin from "@nuxt/icon/runtime/plugin.js";
import { createSSRApp, h, nextTick } from "vue";
import appConfig from "../../.nuxt/app.config.mjs";
import { state } from "./nuxt-imports.mjs";

export function initialize({ payload = { data: {} }, provider, transport, copy, hotClient = false }) {
  state.options = { ...appConfig.icon, ...(provider ? { provider, fetchTimeout: 25 } : {}) };
  state.payload = payload;
  state.pending = {};
  globalThis.iconFixtureFetch = transport;
  iconPlugin.setup();
  if (hotClient) addIcon("lucide:copy", copy);
}

export function makeApp() {
  return createSSRApp({
    render: () => h("main", { class: "flex gap-4" }, [0, 1, 2].map(index =>
      h("button", { type: "button", "aria-label": `复制代码 ${index + 1}`, class: "size-8" }, [
        h(NuxtIconSvg, { name: "i-lucide-copy", class: "size-4" }),
      ]),
    )),
  });
}

export async function hydrate(fixture, hotClient = false) {
  const requests = [];
  const warnings = [];
  // 水合必须完全依赖服务端 payload；浏览器不能借联网补齐图标。
  const transport = async (url) => {
    requests.push(String(url));
    throw new Error("回归测试禁止客户端请求图标");
  };
  transport.native = transport;
  initialize({ payload: fixture.payload, transport, copy: fixture.copy, hotClient });
  const app = makeApp();
  app.config.warnHandler = message => warnings.push(message);
  app.mount(document.querySelector("#app"));
  await nextTick();
  const result = {
    warnings,
    requests,
    viewBoxes: Array.from(document.querySelectorAll("svg"), icon => icon.getAttribute("viewBox")),
    pathCount: document.querySelectorAll("svg path, svg rect").length,
  };
  app.unmount();
  return result;
}
