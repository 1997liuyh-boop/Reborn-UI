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
