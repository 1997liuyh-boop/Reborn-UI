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

  hooks: {
    "imports:extend": (imports) => {
      const index = imports.findIndex((i) => i.name === "defineProps");
      if (index !== -1) {
        imports.splice(index, 1);
      }
    },
    "modules:before": function () {
      const nuxt = useNuxt();
      const localConfigModule = resolve("./modules/config");

      for (const layer of nuxt.options._layers) {
        layer.config.modules = (layer.config.modules || []).map((mod) => {
          const entry = Array.isArray(mod) ? mod[0] : mod;
          return typeof entry === "string" && entry.includes("/docus/modules/config")
            ? localConfigModule
            : mod;
        });
      }
    },
  },

  modules: [
    "@nuxtjs/mdc", // Ensure MDC module is loaded for highlighting
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
    baseURL: process.env.NODE_ENV === "development" ? "/" : "/docs/",
  },
  nitro: {
    publicAssets: [
      {
        baseURL: "/uni-render",
        dir: resolve("../uniapp-project/dist/build/h5"),
        maxAge: 60 * 60 * 24 * 7,
      },
    ],
  },

  components: [
    {
      path: "~/components/",
      global: true,
      pathPrefix: false,
      ignore: ["**/index.ts", "**/shaders.ts", "**/types.ts"],
    },
  ],
  runtimeConfig: {
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

  content: {
    database: {
      bindingName: "DB",
      type: "d1",
    },
  },

  fonts: {
    processCSSVariables: true,
    families: [
      {
        name: "Geist",
        provider: "google",
        global: true,
      },
    ],
  },
});
