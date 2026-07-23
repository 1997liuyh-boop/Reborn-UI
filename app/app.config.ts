export default defineAppConfig({
  ui: {
    colors: {
      neutral: "zinc",
    },
    header: {
      slots: {
        root: "bg-default/15",
      },
    },
    contentSearch: {
      slots: {
        modal: "bg-default/25 backdrop-blur-xl",
      },
    },
    switch: {
      slots: {
        root: "justify-end",
      },
    },
    /**
     * 文档页有主顶栏 + AppHeaderNav 二级导航（lg 下 top-16），
     * 默认仅 offset 一层 header，会导致 On This Page 被遮住。
     */
    contentToc: {
      slots: {
        root: "sticky top-(--ui-header-height) z-9 bg-default/75 lg:bg-[initial] backdrop-blur -mx-4 px-4 sm:px-6 sm:-mx-6 lg:ms-0 overflow-y-auto max-h-[calc(100vh-var(--ui-header-height))] lg:top-[calc(var(--ui-header-height)*2)] lg:max-h-[calc(100vh-var(--ui-header-height)*2)]",
      },
    },
  },

  header: {
    title: "Reborn UI",
    logo: {
      light: "/logo.svg",
      dark: "/logo-dark.svg",
    },
  },

  toc: {
    title: "On This Page",
    bottom: {
      title: "Community",
      links: [
        {
          label: "Star on Github",
          icon: "lucide:star",
          to: "https://github.com/unovue/reborn-ui",
          target: "_blank",
        },
        {
          label: "Create Issue",
          icon: "lucide:circle-dot",
          to: "https://github.com/unovue/reborn-ui/issues",
          target: "_blank",
        },
        {
          label: "Join Discord",
          icon: "ri:discord-line",
          to: "https://discord.gg/Xbh5DwJRc9",
          target: "_blank",
        },
        {
          label: "Forum",
          icon: "lucide:newspaper",
          to: "https://github.com/unovue/reborn-ui/discussions",
          target: "_blank",
        },
        {
          label: "Follow on X",
          icon: "prime:twitter",
          to: "https://x.com/rahulv_dev",
          target: "_blank",
        },
        {
          label: "Follow On Bluesky",
          icon: "ri:bluesky-line",
          to: "http://bsky.app/profile/reborn-ui.com",
          target: "_blank",
        },
      ],
    },
  },
});
