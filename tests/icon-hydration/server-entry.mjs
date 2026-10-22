import { getIcon } from "@iconify/vue";
import api from "@nuxt/icon/runtime/server/api.js";
import { renderToString } from "@vue/server-renderer";
import { initialize, makeApp } from "./fixture.mjs";
import { state } from "./nuxt-imports.mjs";

export async function render(provider) {
  const requests = [];
  const warnings = [];
  const transport = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.startsWith("/api/_nuxt_icon/")) {
      const collection = url.split("/").at(-1).split("?")[0];
      const data = await api({ url, context: { params: { collection } } });
      return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
    }
    // 模拟旧 provider 的外网延迟：超过预取期限后才返回，确保确实走到超时分支。
    await new Promise(resolve => setTimeout(resolve, 75));
    return new Response("", { status: 503 });
  };
  transport.native = transport;
  initialize({ provider, transport });
  const originalWarn = console.warn;
  console.warn = message => warnings.push(String(message));
  let html;
  try {
    html = await renderToString(makeApp());
    // 等待模拟的慢请求结束，避免它的延迟告警串入下一轮测试。
    if (provider === "iconify") await new Promise(resolve => setTimeout(resolve, 100));
  } finally {
    console.warn = originalWarn;
  }
  return { html, payload: state.payload, copy: getIcon("lucide:copy"), requests, warnings };
}
