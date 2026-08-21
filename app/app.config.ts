export default defineAppConfig({
  ui: {
    colors: {
      neutral: "zinc",
    },
    /**
     * 顶部头部（分类导航已并入主顶栏）：
     * Arco 气质——实心底 + 细底边，避免过重毛玻璃造成「悬浮感过强」。
     */
    header: {
      slots: {
        root: "bg-default/95 backdrop-blur-md border-b border-default/60",
      },
    },
    contentSearch: {
      slots: {
        modal: "bg-default/95 backdrop-blur-md",
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
        wrapper: "border-b border-default/40 pb-6 mb-2",
        title: "tracking-tight text-balance text-2xl sm:text-3xl font-semibold",
        description: "text-pretty text-muted mt-2 text-[15px] leading-relaxed",
      },
    },
    /**
     * 分类导航已并入主顶栏，文档页只剩单层 header；
     * TOC 吸顶只需补偿一层 --ui-header-height。
     */
    contentToc: {
      slots: {
        root: "sticky top-(--ui-header-height) z-9 bg-default/90 lg:bg-[initial] backdrop-blur -mx-4 px-4 sm:px-6 sm:-mx-6 lg:ms-0 overflow-y-auto max-h-[calc(100vh-var(--ui-header-height))]",
      },
    },
    /**
     * 左侧菜单：单层顶栏吸顶；
     * 2xl+ 细右分隔线，对齐 Arco 侧栏「1px #e5e6eb」式 hairline。
     */
    pageAside: {
      slots: {
        root: "lg:top-(--ui-header-height) lg:max-h-[calc(100vh-var(--ui-header-height))] 2xl:border-r 2xl:border-default/50 2xl:pr-5",
      },
    },
  },

  /**
   * Ask AI 助手:空态页的常见问题快捷按钮(点击即代入提问),
   * 按使用场景分组;问题措辞与知识库口径一致,便于模型命中文档
   */
  assistant: {
    faqQuestions: [
      {
        category: "快速上手",
        items: [
          "如何在项目中安装并接入 Reborn UI?",
          "Web 端和 UniApp 端的组件有什么区别?",
          "如何切换明暗主题?",
        ],
      },
      {
        category: "组件使用",
        items: [
          "reborn-button 支持哪些变体和尺寸?",
          "如何给按钮添加加载中状态?",
          "表单组件如何做双向绑定?",
        ],
      },
      {
        category: "疑难排查",
        items: [
          "组件样式不生效可能是什么原因?",
          "动效组件在移动端卡顿怎么优化?",
        ],
      },
    ],
  },

  header: {
    title: "Reborn UI",
    logo: {
      light: "/logo.svg",
      dark: "/logo-dark.svg",
      // 圆形徽章为正方形资源，略放大以免环绕细节在 24px 糊掉
      class: "h-8 w-8",
    },
  },

  toc: {
    title: "本页目录",
    bottom: {
      title: "社区",
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
