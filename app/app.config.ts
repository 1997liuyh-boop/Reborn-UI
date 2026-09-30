export default defineAppConfig({
  ui: {
    colors: {
      neutral: "zinc",
    },
    /**
     * 主题切换按钮（UColorModeButton）的图标：亮色下显示 light、暗色下显示 dark，
     * 换成 line-md 的动态线条图标（日出 / 日转月），与侧栏折叠按钮同一套图标集。
     */
    icons: {
      light: "line-md:sun-rising-loop",
      dark: "line-md:sunny-outline-to-moon-loop-transition",
    },
    /**
     * 顶部头部（分类导航已并入主顶栏）：
     * Arco 气质——实心底 + 细底边，避免过重毛玻璃造成「悬浮感过强」。
     */
    header: {
      slots: {
        root: "bg-white/40 backdrop-blur-md border-b border-default/60",
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
     * min-h 与 max-h 取同一个值，侧栏始终占满顶栏以下一屏：高度若由内容撑，
     * 菜单折叠成两枚图标或分区页面很少时侧栏会缩短，右侧分隔线跟着变短，折叠时能看到它跳一下。
     */
    pageAside: {
      slots: {
        root: "lg:top-(--ui-header-height) lg:min-h-[calc(100vh-var(--ui-header-height))] lg:max-h-[calc(100vh-var(--ui-header-height))] 2xl:border-r 2xl:border-default/50 2xl:pr-5",
      },
    },
  },

  /**
   * Ask AI 助手:空态页的常见问题快捷按钮(点击即代入提问),
   * 按使用场景分组;问题措辞与知识库口径一致,便于模型命中文档
   */
  assistant: {
    /** 顶栏 Ask AI 按钮的图标（Docus 助手读 assistant.icons.trigger，缺省是 lucide 的 sparkles） */
    icons: {
      trigger: "carbon:ai-business-impact-assessment",
    },
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
          label: "查看 Web 设计系统",
          icon: "lucide:palette",
          to: "http://110.42.242.107:3333/popover",
          target: "_blank",
        },
      ],
    },
  },
});
