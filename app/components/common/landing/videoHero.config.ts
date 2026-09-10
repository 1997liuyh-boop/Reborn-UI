// 首页入口与文档站顶栏保持一致。
export const landingNavigation = [
  { label: "入门指南", to: "/getting-started", description: "安装与配置，从这里开始" },
  { label: "Components", to: "/components", description: "浏览组件、示例与 API" },
  { label: "Changelogs", to: "/changelogs", description: "查看组件库的更新记录" },
  { label: "Composables", to: "/composables", description: "可复用的组合式函数" },
];

export const heroVideoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4";

// 使用同一条缓动曲线；减少动态效果时不位移、不等待。
export function createHeroEntrance(offset: number, duration: number, delay = 0, reduced = false) {
  return {
    // 初始样式保持服务端与客户端一致，减少动态效果通过零时长立即完成。
    initial: { opacity: 0, transform: `translateY(${offset}px)` },
    animate: { opacity: 1, transform: "translateY(0px)" },
    transition: {
      duration: reduced ? 0 : duration,
      delay: reduced ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  };
}
