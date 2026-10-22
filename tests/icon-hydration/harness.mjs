import { mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, "../..");

export async function createHarness() {
  const output = join(root, "node_modules/.cache/icon-hydration");
  await mkdir(output, { recursive: true });
  const shared = {
    absWorkingDir: root,
    bundle: true,
    logLevel: "silent",
    banner: { js: "function defineAppConfig(value) { return value }" },
    alias: {
      "#imports": join(directory, "nuxt-imports.mjs"),
      "#build/nuxt-icon-client-bundle": join(root, ".nuxt/nuxt-icon-client-bundle.mjs"),
      "#nuxt-icon-server-bundle": join(root, ".nuxt/nuxt-icon-server-bundle.mjs"),
    },
    plugins: [{
      name: "nuxt-app-config-context",
      setup(builder) {
        builder.onResolve({ filter: /^#app\/config$/ }, () => ({ path: "app-config-context", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const _replaceAppConfig = () => {}" }));
      },
    }],
    define: {
      "$fetch": "globalThis.iconFixtureFetch",
      "import.meta.dev": "false",
      "import.meta.nitro": "false",
      "process.env.NODE_ENV": '"development"',
      "__VUE_OPTIONS_API__": "true",
      "__VUE_PROD_DEVTOOLS__": "false",
      "__VUE_PROD_HYDRATION_MISMATCH_DETAILS__": "true",
    },
  };
  const serverFile = join(output, "server.mjs");
  await build({
    ...shared,
    entryPoints: [join(directory, "server-entry.mjs")],
    outfile: serverFile,
    platform: "node",
    format: "esm",
    external: ["vue", "@vue/server-renderer", "pathe", "h3", "ohash", "consola", "defu"],
    define: { ...shared.define, "import.meta.server": "true", "import.meta.client": "false" },
  });
  const clientFile = join(output, "client.js");
  await build({
    ...shared,
    entryPoints: [join(directory, "fixture.mjs")],
    outfile: clientFile,
    platform: "browser",
    format: "iife",
    globalName: "iconFixture",
    define: { ...shared.define, "import.meta.server": "false", "import.meta.client": "true" },
  });
  const clientCode = await readFile(clientFile, "utf8");
  let instance = 0;
  return {
    clientCode,
    async server() {
      // 每个模块实例均有独立 Iconify 缓存，重复调用同一实例则验证服务端热缓存。
      return import(`${pathToFileURL(serverFile).href}?instance=${instance++}`);
    },
    async hydrate(fixture, hotClient) {
      const dom = new JSDOM(`<div id="app">${fixture.html}</div>`, {
        url: "http://localhost/",
        runScripts: "outside-only",
      });
      dom.window.console.error = () => {};
      try {
        dom.window.eval(clientCode);
        return await dom.window.iconFixture.hydrate(fixture, hotClient);
      } finally {
        dom.window.close();
      }
    },
  };
}
