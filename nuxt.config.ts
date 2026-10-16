import { readFile } from "node:fs/promises";
import { addTemplate, addVitePlugin, createResolver, updateTemplates, useNuxt } from "@nuxt/kit";
import tailwindcss from "@tailwindcss/vite";
import * as vueCompiler from "vue/compiler-sfc";
import { extractDemoSections } from "./app/utils/extractDemoSections";

const { resolve } = createResolver(import.meta.url);

export default defineNuxtConfig({
  extends: ["docus"],

  site: {
    name: "Reborn UI",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  vue: {
    // 启用 Vue 运行时模板编译器:Playground(/playground)需要在浏览器中
    // 把用户输入的 template 字符串实时编译为渲染函数
    runtimeCompiler: true,
  },

  // Ensure we use the local config module instead of the one bundled in the Docus layer.
  hooks: {
    "vite:extendConfig": function (config) {
      if (!useNuxt().options.dev) return;
      // Vue 的 500 条引用缓存淘汰后，SSR 修改过的共享 AST 会丢失模板导入；开发时重新解析模板。
      config.vue ??= {};
      config.vue.compiler = {
        ...vueCompiler,
        compileTemplate(options) {
          return vueCompiler.compileTemplate({ ...options, ast: undefined });
        },
      };
    },

    "builder:watch": async function (_event, path) {
      if (path.replaceAll("\\", "/").includes("/reborn/examples/") && path.endsWith(".vue")) {
        await updateTemplates({ filter: template => template.filename === "demo-heading-meta.ts" });
      }
    },

    "components:extend": function (components) {
      // Loading 已被多个基础组件静态引用，同步全局注册可保留演练场解析并避免重复异步入口。
      const loading = components.find(component => component.pascalName === "RebornLoading");
      if (loading) loading.global = "sync";

      // 演示和配置面板只在客户端使用，避免把整套示例编入服务端。
      for (const component of components) {
        if (/\/reborn\/(?:examples|configs)\//.test(component.filePath.replaceAll("\\", "/"))) {
          component.mode = "client";
        }
      }
    },

    /**
     * 让本仓库 app/composables 下的同名 composable 稳定胜过 @nuxt/ui 的实现。
     *
     * 根因：@nuxt/ui 与本仓库都提供了 useFieldGroup / useOverlay / defineShortcuts /
     * extractShortcuts。unimport 去重时按 `(other.priority || 1) - (i.priority || 1)` 比较，
     * 两边都是默认优先级 1 时 diff 为 0，只能由数组先后顺序决定胜负（启动日志里那几条
     * "Duplicated imports ... has been ignored" 就是 diff 为 0 时打出来的），结果不稳定。
     * 一旦 @nuxt/ui 胜出，RebornForm 里 `useFieldGroup()` 拿到的是它那个只返回
     * orientation / size 的版本，解构出的 addField / removeField / getError 全是 undefined，
     * RebornFormItem 挂载时执行 `form.addField(...)` 会直接抛 "addField is not a function"。
     * 方案：给本地这批 composable 显式抬高优先级。diff 不再为 0，无论先后顺序本地都胜出，
     * 那 4 条重名告警也随之消失。@nuxt/ui 自身组件是走相对路径显式 import 这些 composable 的，
     * 不依赖自动导入，因此不受影响。
     *
     * 注意：imports:extend 收到的是扫描得来的动态导入列表（即各层的 composables 目录），
     * @nuxt/ui 通过 addImports 注册的静态条目不在其中，所以这里只能调优先级、不能直接剔除。
     */
    "imports:extend": function (imports) {
      /** 本仓库 composables 目录，统一成正斜杠后再比对，避免 Windows 反斜杠对不上 */
      const localComposablesDir = resolve("./app/composables").replace(/\\/g, "/");

      for (const item of imports) {
        const source = String(item.from || "").replace(/\\/g, "/");
        if (source.startsWith(localComposablesDir)) {
          item.priority = 10;
        }
      }
    },

    "modules:before": function () {
      const nuxt = useNuxt();
      const localConfigModule = resolve("./modules/config");

      for (const layer of nuxt.options._layers) {
        layer.config.modules = (layer.config.modules || [])?.map((mod) => {
          const entry = Array.isArray(mod) ? mod[0] : mod;
          return typeof entry === "string" && entry.includes("/docus/modules/config")
            ? localConfigModule
            : mod;
        });
      }
    },

    /**
     * 把 AI 助手面板的请求指向本仓库自己的 server/api/assistant.post.ts。
     *
     * Docus 的 assistant 模块在 setup 里直接赋值 runtimeConfig.public.assistant,
     * 并把自己的处理器注册在 apiPath(默认 /__docus__/assistant)上。若改模块选项 apiPath,
     * 它只会把自己的处理器挪到新路径、与本仓库的路由冲突;因此保留其默认路径不动,
     * 只在所有模块 setup 完成后改写客户端读取的 public.assistant.apiPath。
     *
     * 上游那个处理器随之闲置,并由 server/middleware/ai-guard.ts 直接封禁,
     * 避免出现一个不鉴权、不限流的 token 消耗入口。
     */
    "modules:done": function () {
      const nuxt = useNuxt();
      // 预览路由仅需要名字白名单，模板在扫描组件后读取最终名单，不导入演示模块。
      addTemplate({
        filename: "preview-component-names.ts",
        write: true,
        getContents: ({ app }) => {
          const names = app.components
            .filter(component => /\/reborn\/(?:examples|configs)\//.test(component.filePath.replaceAll("\\", "/")))
            .map(component => component.pascalName);
          return `export const previewComponentNames: string[] = ${JSON.stringify(names)};`;
        },
      });
      // 文档首屏裁剪和目录只需要示例标题，在构建时提取，避免服务端加载整份示例源码。
      addTemplate({
        filename: "demo-heading-meta.ts",
        write: true,
        async getContents({ app }) {
          const entries = await Promise.all(app.components.flatMap((component) => {
            const filePath = component.filePath.replaceAll("\\", "/");
            const key = filePath.split("/reborn/examples/")[1];
            if (!key || !key.endsWith(".vue")) return [];
            return [readFile(component.filePath, "utf8").then(raw => [key, {
              titles: Object.keys(extractDemoSections(raw)),
              playgroundTitle: raw.match(/<Playground\s[^>]*?\stitle="([^"]*)"/)?.[1] ?? "",
            }] as const)];
          }));
          return `export interface DemoHeadingMeta { titles: string[]; playgroundTitle: string }\nexport const demoHeadingMeta: Record<string, DemoHeadingMeta> = ${JSON.stringify(Object.fromEntries(entries))};`;
        },
      });
      const publicAssistant = nuxt.options.runtimeConfig.public.assistant as
        | { enabled?: boolean; apiPath?: string }
        | undefined;

      if (publicAssistant?.apiPath) {
        publicAssistant.apiPath = "/api/assistant";
      }

      // 关掉 SSR 那个 Vite 实例自带的 WebSocket 服务，否则与其他 Nuxt 项目同时开发时会报
      // "WebSocket server error: Port 24678 is already in use"。
      // Nuxt 给 SSR 实例配的是 hmr: false，但 Vite 7 里 hmr: false 不阻止建 ws，只有 server.ws: false 才会，
      // 于是它照样去绑默认的 24678；而这个 ws 没有任何客户端连接——浏览器热更新由 Nuxt CLI 通过
      // hmr.server 挂在 dev server 自身端口上。vite.$server 的类型不含 server 字段，所以走 kit 的仅服务端插件。
      addVitePlugin({ name: "reborn:ssr-no-ws", config: () => ({ server: { ws: false } }) }, { client: false });
    },
  },

  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "@vueuse/nuxt",
    "nuxt-gtag",
  ],

  plugins: [
    { src: "./plugins/clarity.js", mode: "client" },
    { src: "./plugins/track.client.ts", mode: "client" },
    { src: "./plugins/anchor-scroll.client.ts", mode: "client" },
    { src: "./plugins/prettier.ts", mode: "client" },
  ],

  ui: {
    content: true,
    mdc: true,
  },

  colorMode: {
    preference: "dark",
    fallback: "dark",
  },
  /**
   * 图标改为内联 SVG 渲染。
   * 默认的 css 模式在图标首次出现时往 head 最前面插一个 style，浏览器要整页重算样式：
   * 文档页有六千多个节点、上百枚图标，任何让新图标挂载的交互（折叠侧栏、切 Tab、滚到懒加载区块）
   * 都会连吃几次一两百毫秒的重算，表现为明显卡顿。svg 模式没有样式注入，代价只是 SSR 的 HTML 大一些。
   */
  icon: {
    mode: "svg",
  },

  css: ["~/assets/css/reborn-ui.css"],

  app: {
    head: {
      meta: [
        {
          name: "google-adsense-account",
          content: process.env.NUXT_ADSENSE_ACCOUNT,
        },
      ],
    },
    baseURL: "/",
  },

  components: [
    {
      path: "~/components/",
      global: true,
      pathPrefix: false,
      ignore: ["**/index.ts", "**/shaders.ts", "**/types.ts", "**/*.config.ts"],
    },
  ],
  // Docus AI 助手配置:模型 ID 经 server/plugins/ai-provider.ts 注册的
  // OpenAI 兼容提供商解析(端点由 NUXT_AI_PROVIDER_* 环境变量指定),不依赖 Vercel AI Gateway
  assistant: {
    model: "deepseek-v4-pro",
  },

  runtimeConfig: {
    // 服务端专用:AI 模型服务接入配置,值来自环境变量 NUXT_AI_PROVIDER_*(密钥不落库)
    aiProvider: {
      apiKey: "",
      baseUrl: "",
    },
    // 飞书登录(NUXT_FEISHU_APP_ID / NUXT_FEISHU_APP_SECRET);未配置时登录入口自动隐藏
    feishu: {
      appId: "",
      appSecret: "",
    },
    // 加密 session cookie 的密钥(NUXT_SESSION_PASSWORD,≥32 字符)
    sessionPassword: "",
    public: {
      NUXT_CLARITY_ID: process.env.NUXT_CLARITY_ID,
      NUXT_ADSENSE_ACCOUNT: process.env.NUXT_ADSENSE_ACCOUNT,
      // Public site URL used by modules (e.g. i18n) for canonical/hreflang links.
      SITE_URL: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL,
    },
  },
  llms: {
    domain: "https://reborn-ui.com/",
    title: "Reborn UI",
    description:
      "Reborn UI is a free and open-source Vue.js component library that provides a collection of beautiful and customizable components for building modern web applications.",
    full: {
      title: "Reborn UI Documentation",
      description: "The complete Reborn UI documentation.",
    },
  },

  // content: {
  // database: {
  //   bindingName: "DB",
  //   type: "d1",
  // },
  // navigation: {
  //   fields: ['tags', 'badges']  // Include tags and badges fields in navigation
  // }
  // },

  fonts: {
    processCSSVariables: true,
    providers: {
      adobe: false,
      bunny: false,
      fontshare: false,
      fontsource: false,
      googleicons: false,
    },
    families: [
      {
        name: "Geist",
        provider: "google",
        global: true,
      },
    ],
  },
  robots: {
    // 明确禁用 robots.txt 的生成
    robotsTxt: false,
  },
  // 首页角色模型体积大且极少变动：给一周强缓存，回访不再重新下载；换模型时改文件名即可绕开旧缓存
  routeRules: {
    "/models/**": { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } },
  },
  nitro: {
    // Reka 内部文件未对外导出，直接内联，避免 Nitro 逐文件反复猜测无法访问的包子路径。
    externals: {
      inline: ["reka-ui"],
    },
    // 文档站模块较多，限制并行文件操作，避免 Windows 构建触及文件句柄上限。
    rollupConfig: {
      maxParallelFileOps: 256,
    },
    publicAssets: [
      {
        baseURL: "/uni-render/",
        dir: resolve("./packages/uniapp-project/dist/build/h5"),
        maxAge: 60 * 60 * 24 * 7,
      },
    ],
  },
});
