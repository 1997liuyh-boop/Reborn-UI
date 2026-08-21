import { createResolver, useNuxt } from "@nuxt/kit";
import tailwindcss from "@tailwindcss/vite";

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
  nitro: {
    publicAssets: [
      {
        baseURL: "/uni-render/",
        dir: resolve("./packages/uniapp-project/dist/build/h5"),
        maxAge: 60 * 60 * 24 * 7,
      },
    ],
  },
});
