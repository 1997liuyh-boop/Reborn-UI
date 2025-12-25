import { useI18n } from "vue-i18n";

export default defineAppConfig({
  shadcnDocs: {
    site: {
      name: "Inspira UI",
      description: "Build beautiful websites using Vue & Nuxt.",
    },
    theme: {
      customizable: true,
      color: "zinc",
      radius: 0.5,
    },
    header: {
      title: "Reborn UI",
      showTitle: true,
      darkModeToggle: true,
      logo: {
        light: '/logo.svg',
        dark: '/logo-dark.svg',
      },
      nav: [
        {
          title: '文档',
          links: [
            {
              title: '快速开始',
              to: "/getting-started/introduction",
              description: '快速开始',
            },
            {
              title: '安装',
              to: "/getting-started/installation",
              description: '安装',
            },
            {
              title: '组件',
              to: "/components",
              description: '组件',
              target: "_self",
            },
          ],
        },
        {
          title: "Credits",
          links: [
            {
              title: "Aceternity UI",
              to: "https://ui.aceternity.com/",
              description:
                "For providing the inspiration and permission to adapt the original designs.",
              target: "_blank",
            },
            {
              title: "Magic UI",
              to: "https://magicui.design/",
              description: "For providing the inspiration for designs.",
              target: "_blank",
            },
            {
              title: "shadcn-vue",
              to: "https://www.shadcn-vue.com/",
              description: "For the Vue port of shadcn-ui and contributions to some components",
              target: "_blank",
            },
            {
              title: "shadcn-docs-nuxt",
              to: "https://github.com/ZTL-UwU/shadcn-docs-nuxt",
              description: "For the beautifully crafted Nuxt documentation site.",
              target: "_blank",
            },
          ],
        },
        {
          title: '社区',
          links: [
            {
              title: "GitHub",
              to: "https://github.com/",
              description: 'GitHub',
              target: "_blank",
            },
          ],
        },
      ],
      links: [
        {
          icon: "lucide:github",
          to: "https://github.com/unovue/inspira-ui",
          target: "_blank",
        },
        {
          icon: "prime:twitter",
          to: "https://x.com/rahulv_dev",
          target: "_blank",
        },
        {
          icon: "ri:discord-line",
          to: "https://discord.gg/Xbh5DwJRc9",
          target: "_blank",
        },
        {
          icon: "ri:bluesky-line",
          to: "http://bsky.app/profile/inspira-ui.com",
          target: "_blank",
        },
      ],
    },
    aside: {
      useLevel: true,
      collapse: false,
    },
    main: {
      breadCrumb: true,
      showTitle: true,
    },
    footer: {
      credits: "Copyright © 2024 - 2025",
      links: [
        {
          icon: "lucide:globe",
          to: "https://rahulv.dev",
          title: "Maintained by rahulv.dev",
          target: "_blank",
        },
        {
          icon: "lucide:github",
          title: "Github",
          to: "https://github.com/unovue/inspira-ui",
          target: "_blank",
        },
      ],
    },
    toc: {
      enable: true,
      title: '目录',
      enableInHomepage: false,
      carbonAds: {
        enable: true,
        code: "CW7DEK37",
        placement: "inspira-uicom",
      },
      links: [
        {
          title: 'GitHub 收藏',
          icon: "lucide:star",
          to: "https://github.com/unovue/inspira-ui",
          target: "_blank",
        },
        {
          title: '创建问题',
          icon: "lucide:circle-dot",
          to: "https://github.com/unovue/inspira-ui/issues",
          target: "_blank",
        },
      ],
    },
    search: {
      enable: true,
      inAside: false,
    },
  },
});
