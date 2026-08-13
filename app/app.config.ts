export default defineAppConfig({
  ui: {
    colors: {
      neutral: "zinc",
    },
    /**
     * 顶部头部（主顶栏与 AppHeaderNav 二级导航共用 UHeader）：
     * 半透明基底 + 毛玻璃，悬浮在点阵背景之上形成清晰的层次分界。
     */
    header: {
      slots: {
        root: "bg-default/70 backdrop-blur-xl",
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
    /** 文档页头：标题收紧字距并按语义断行，避免孤字悬行 */
    pageHeader: {
      slots: {
        title: "tracking-tight text-balance",
        description: "text-pretty",
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
    /**
     * 左侧菜单同理：双头吸顶补偿（lg+ 128px），
     * 与右侧移动端面板的顶线保持一致；
     * 2xl+ 管理台外壳下加右分隔线，与右侧 fixed 面板的左分隔线呼应。
     */
    pageAside: {
      slots: {
        root: "lg:top-[calc(var(--ui-header-height)*2)] lg:max-h-[calc(100vh-var(--ui-header-height)*2)] 2xl:border-r 2xl:border-default/60 2xl:pr-6",
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
