<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { mountFooterHabitat, mountFooterScrollShell } from "~/lib/payathon/footer";

/**
 * 首页页脚卡片：文档 / dsh 插件 / 资源三栏链接、版权与构建信息，底部是像素小人走过的「生态小屏」；
 * 宽屏下上一屏会吸附，卡片像纸一样盖上来。
 * 构建信息来自 nuxt.config.ts 在构建时从 git 读出的 runtimeConfig.public.homeBuild，读不到的项不显示。
 * data-astro-cid-* 是样式作用域属性，交互在挂载后由 app/lib/payathon/footer.ts 驱动。
 */

interface FooterLink {
  label: string;
  to: string;
  /** 站外链接：新标签页打开并带外链箭头 */
  external?: boolean;
}

const REPO_URL = "https://github.com/1997liuyh-boop/Reborn-UI";
const GITHUB_OWNER = "https://github.com/1997liuyh-boop";

const COLUMNS: Array<{ heading: FooterLink; items: FooterLink[] }> = [
  {
    heading: { label: "文档", to: "/getting-started" },
    items: [
      { label: "入门指南", to: "/getting-started" },
      { label: "安装", to: "/getting-started/installation" },
      { label: "组件", to: "/components" },
      { label: "Hook", to: "/composables" },
      { label: "更新日志", to: "/changelogs" },
    ],
  },
  {
    heading: { label: "dsh 插件", to: "#benefits" },
    items: [
      { label: "工作室插件", to: `${GITHUB_OWNER}/dsh-studio-library`, external: true },
      { label: "设计工作室", to: `${GITHUB_OWNER}/dsh-studio-design`, external: true },
      { label: "桌面助手", to: `${GITHUB_OWNER}/dsh-desktop-tools`, external: true },
      // 内网演示站，公司网络之外打不开
      { label: "在线 DEMO", to: "http://192.168.20.90:3333/scrollbar", external: true },
    ],
  },
];

/** 第三栏只有标题、没有子项（沿用原版「堆叠标题」的样式） */
const STACKED_LINKS: FooterLink[] = [
  { label: "GitHub", to: REPO_URL, external: true },
  { label: "在线演练场", to: "/playground" },
  { label: "动效规范", to: "/getting-started/motion" },
  { label: "示例编写规范", to: "/getting-started/demo-guidelines" },
];

const homeBuild = useRuntimeConfig().public.homeBuild as { version?: string; sha?: string; time?: string } | undefined;
const buildVersion = homeBuild?.version ?? "";
const buildSha = homeBuild?.sha ?? "";
const buildTime = homeBuild?.time ?? "";
/** 构建时间按北京时间显示到分钟；服务端与客户端算出的字符串一致，不会造成水合差异 */
const buildTimeText = buildTime
  ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(buildTime))
  : "";
const copyrightYear = (buildTime ? new Date(buildTime) : new Date()).getFullYear();

const rootRef = useTemplateRef<HTMLElement>("root");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const root = rootRef.value;
  if (!root) return;
  cleanups.push(mountFooterHabitat(root));
  cleanups.push(mountFooterScrollShell(root));
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});
</script>

<template>
  <div ref="root" class="footerScrollShell footerScrollShell--transparent" data-footer-scroll-shell>
    <div class="footerClosingCard">
      <footer class="siteFooter">
        <div class="siteFrame">
          <div class="siteFooterContent">
            <nav
              class="footerNavigation"
              aria-label="页脚导航"
              style="--footer-nav-columns: 3"
              data-astro-cid-5lqz5vuz=""
            >
              <div class="footerNavigationBrand" data-astro-cid-5lqz5vuz="">
                <a href="/" class="astro-5lqz5vuz" aria-label="Reborn UI 首页" data-astro-cid-5lqz5vuz="">
                  <!-- 与站点顶栏 AppHeaderLogo 同构的字标 -->
                  <svg class="footerNavigationLogo footerNavigationLogo--reborn" viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Reborn UI">
                    <text
                      x="0"
                      y="22"
                      fill="currentColor"
                      font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                      font-size="18"
                      font-weight="700"
                      letter-spacing="-0.4"
                    >Reborn</text>
                    <rect x="78" y="4" width="36" height="24" rx="6" stroke="currentColor" stroke-width="1.75" />
                    <text
                      x="96"
                      y="21"
                      text-anchor="middle"
                      fill="currentColor"
                      font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                      font-size="13"
                      font-weight="750"
                      letter-spacing="0.8"
                    >UI</text>
                    <g fill="currentColor">
                      <rect x="124" y="8" width="6" height="6" rx="1.2" />
                      <rect x="133" y="8" width="6" height="6" rx="1.2" opacity="0.45" />
                      <rect x="124" y="17" width="6" height="6" rx="1.2" opacity="0.45" />
                      <rect x="133" y="17" width="6" height="6" rx="1.2" />
                    </g>
                  </svg>
                </a>
                <p class="footerMeta" data-astro-cid-vsts6btf="">面向 Web 与 UniApp 的 Vue 组件库</p>
              </div>
              <div class="footerNavigationLinks" data-astro-cid-5lqz5vuz="">
                <div v-for="column in COLUMNS" :key="column.heading.label" class="footerNavigationColumn" data-astro-cid-5lqz5vuz="">
                  <div class="footerNavigationGroup" data-astro-cid-5lqz5vuz="">
                    <h2 class="footerNavigationHeading" data-astro-cid-5lqz5vuz="">
                      <a :href="column.heading.to" class="astro-5lqz5vuz" data-astro-cid-5lqz5vuz="">{{ column.heading.label }}</a>
                    </h2>
                    <ul class="footerNavigationItems" data-astro-cid-5lqz5vuz="">
                      <li v-for="item in column.items" :key="item.to" class="footerNavItem" data-astro-cid-hfa6to2p="">
                        <span class="footerNavItemLink" data-astro-cid-hfa6to2p="">
                          <a
                            :href="item.to"
                            class="astro-hfa6to2p"
                            :target="item.external ? '_blank' : undefined"
                            :rel="item.external ? 'noopener noreferrer' : undefined"
                            data-astro-cid-hfa6to2p=""
                          >
                            <span class="footerNavItemTitle" data-astro-cid-hfa6to2p="">
                              {{ item.label }}
                              <svg
                                v-if="item.external"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.75"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                                focusable="false"
                                data-astro-cid-hfa6to2p=""
                              >
                                <path d="M7 17 17 7M7 7h10v10" data-astro-cid-hfa6to2p="" />
                              </svg>
                            </span>
                          </a>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="footerNavigationColumn footerNavigationColumn--stacked" data-astro-cid-5lqz5vuz="">
                  <div v-for="link in STACKED_LINKS" :key="link.to" class="footerNavigationGroup" data-astro-cid-5lqz5vuz="">
                    <h2 class="footerNavigationHeading" data-astro-cid-5lqz5vuz="">
                      <a
                        :href="link.to"
                        class="astro-5lqz5vuz"
                        :target="link.external ? '_blank' : undefined"
                        :rel="link.external ? 'noopener noreferrer' : undefined"
                        data-astro-cid-5lqz5vuz=""
                      >{{ link.label }}</a>
                    </h2>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </footer>
      <footer class="siteLegalFooter" aria-label="版权信息" data-astro-cid-bd6yncul="">
        <div class="siteFrame" data-astro-cid-bd6yncul="">
          <div class="siteLegalFooterInner" data-astro-cid-bd6yncul="">
            <div class="siteLegalFooterContact" data-astro-cid-bd6yncul="">
              <p class="siteLegalFooterRow siteLegalFooterLinks" data-astro-cid-bd6yncul="">
                <a :href="REPO_URL" target="_blank" rel="noopener noreferrer" data-astro-cid-bd6yncul="">GitHub</a>
                ｜
                <a :href="`${REPO_URL}/issues`" target="_blank" rel="noopener noreferrer" data-astro-cid-bd6yncul="">问题反馈</a>
                ｜
                <a href="/changelogs" data-astro-cid-bd6yncul="">更新日志</a>
              </p>
            </div>
            <div class="siteLegalFooterBottom" data-astro-cid-bd6yncul="">
              <p class="siteLegalFooterRow" data-astro-cid-bd6yncul="">
                <span class="siteLegalFooterCopyright" data-astro-cid-bd6yncul="">© {{ copyrightYear }} Reborn UI. Be yourself.</span>
              </p>
              <a class="siteLegalFooterMachineLink" href="/llms.txt" data-astro-cid-bd6yncul="">llms.txt</a>
            </div>
          </div>
        </div>
      </footer>
      <section v-if="buildSha || buildVersion" class="footerBuildInfo" aria-label="站点构建信息" data-astro-cid-tnsctvpm>
        <p class="buildStatus" data-astro-cid-tnsctvpm>
          <span aria-hidden="true" data-astro-cid-tnsctvpm /><span class="buildCaption" data-astro-cid-tnsctvpm>Build in public</span>
        </p>
        <dl class="buildDetails" data-astro-cid-tnsctvpm>
          <div v-if="buildVersion" data-astro-cid-tnsctvpm>
            <dt data-astro-cid-tnsctvpm>版本</dt>
            <dd data-astro-cid-tnsctvpm>v{{ buildVersion.replace(/^v/, "") }}</dd>
          </div>
          <div v-if="buildSha" data-astro-cid-tnsctvpm>
            <dt data-astro-cid-tnsctvpm>提交号</dt>
            <dd :title="buildSha" data-astro-cid-tnsctvpm>
              <a :href="`${REPO_URL}/commit/${buildSha}`" target="_blank" rel="noopener noreferrer">{{ buildSha.slice(0, 8) }}</a>
            </dd>
          </div>
          <div v-if="buildTimeText" data-astro-cid-tnsctvpm>
            <dt data-astro-cid-tnsctvpm>构建于</dt>
            <dd data-astro-cid-tnsctvpm>
              <time :datetime="buildTime" data-astro-cid-tnsctvpm>{{ buildTimeText }}</time>
            </dd>
          </div>
        </dl>
      </section>
      <section class="ipHabitat" data-ip-habitat aria-label="Reborn UI 使用场景" data-astro-cid-jnihcvuw>
        <div class="habitatBezel" data-astro-cid-jnihcvuw>
          <div class="habitatScreen" data-habitat-viewport data-astro-cid-jnihcvuw>
            <div class="habitatMarquee" data-habitat-walker data-astro-cid-jnihcvuw>
              <div class="habitatMarqueeGroup" data-habitat-group data-astro-cid-jnihcvuw>
                <div class="habitatWalker" data-habitat-body data-astro-cid-jnihcvuw>
                  <svg
                    class="habitatWalkerSprite"
                    viewBox="4 2 20 13"
                    width="40"
                    height="26"
                    aria-hidden="true"
                    shape-rendering="crispEdges"
                    data-astro-cid-jnihcvuw
                  >
                    <path
                      fill="#26282b"
                      d="M10 5h2v2h-1v2h-1v2H8V9h1V7h1Zm7 0h2v2h-1v2h-1v2h-2V9h1V7h1Z"
                      data-astro-cid-jnihcvuw
                    />
                  </svg>
                  <div class="habitatWalkerSpeech" data-astro-cid-jnihcvuw>
                    <span data-habitat-product data-astro-cid-jnihcvuw>Web 项目</span>
                    <p data-habitat-message data-astro-cid-jnihcvuw>Vue 或 Nuxt 里，init 之后按需添加组件</p>
                  </div>
                </div>
              </div>
            </div>
            <canvas class="habitatGlass" data-habitat-glass aria-hidden="true" data-astro-cid-jnihcvuw />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
/* Reborn UI 字标：按 168×32 的比例放进原字标位，跟随页脚文字色 */
#payathon-page .footerNavigationLogo--reborn {
  display: block;
  width: 136.5px;
  height: 26px;
  color: #f3f4f6;
  filter: none;
}

/* 提交号做成跳到 GitHub 的链接，沿用所在行的字色 */
#payathon-page .buildDetails a {
  color: inherit;
  text-decoration: none;
}
</style>
