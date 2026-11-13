<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { mountSiteMenu } from "~/lib/payathon/site-menu";
import { mountAgentBadgeMaterial, mountBubbleGuide, mountLogoTone, mountMegaHighlights, mountMegaLogoMotion } from "~/lib/payathon/topbar";

/**
 * 首页顶栏：左侧 Reborn UI 字标与「Agent 友好」徽章，右侧导航胶囊（dsh 插件下拉、入门、组件、Hook、安装、AI）与登录。
 *
 * 开场完成前顶栏是 inert 的（由首屏脚本解锁）；导航胶囊的展开与下拉由 site-menu 驱动，
 * 徽章材质、滚到浅色区时字标反色、子菜单的滑动高亮与图标交叉淡化由 topbar 驱动。
 * - 徽章：点击复制一段让 Agent 先读 /llms.txt 的指令；
 * - AI：站点开启了 AI 助手时打开助手抽屉，否则进在线演练场；
 * - 登录：走站点的飞书登录（本地开发没有飞书凭证时用模拟登录），登录后显示用户名与退出入口。
 * 徽章右侧停靠的网站助手气泡放在顶栏之外（顶栏开场时带位移，会把 fixed 定位带偏），只做停靠外观与眨眼。
 * data-astro-cid-* 是样式作用域属性，保留以命中对应规则。
 */

interface AuthUser {
  id: string;
  name: string;
  avatar?: string;
}

/** dsh 插件下拉里的一项：工作室与桌面助手是 DeepSeek Harness 桌面端插件（源码在 GitHub），另有一个内网在线演示 */
interface PluginLink {
  /** 图标文件名 */
  id: string;
  /** 大字标题：插件写仓库名 */
  title: string;
  label: string;
  desc: string;
  href: string;
}

const GITHUB_OWNER = "https://github.com/1997liuyh-boop";

const PLUGIN_COLUMNS: Array<{ label: string; items: PluginLink[] }> = [
  {
    label: "工作室",
    items: [
      { id: "studio-library", title: "dsh-studio-library", label: "工作室插件", desc: "工作室控制台与共享运行时", href: `${GITHUB_OWNER}/dsh-studio-library` },
      { id: "studio-design", title: "dsh-studio-design", label: "设计工作室", desc: "MasterGo 设计稿 + Reborn UI 组件", href: `${GITHUB_OWNER}/dsh-studio-design` },
    ],
  },
  {
    label: "桌面助手",
    items: [
      { id: "desktop-tools", title: "dsh-desktop-tools", label: "桌面助手", desc: "划词工具栏、悬浮助手、截图与录屏", href: `${GITHUB_OWNER}/dsh-desktop-tools` },
    ],
  },
  {
    label: "在线 DEMO",
    items: [
      // 内网地址：公司网络之外打不开，说明里写明
      { id: "online-demo", title: "重塑 Design", label: "滚动条演示", desc: "内网地址，需在公司网络内打开", href: "http://192.168.20.90:3333/scrollbar" },
    ],
  },
];

/** 胶囊里的普通链接；delay 是展开时逐个出现的延迟，沿用原模板从左到右递减的节奏 */
const NAV_LINKS = [
  { label: "入门", to: "/getting-started", delay: 640 },
  { label: "组件", to: "/components", delay: 570 },
  { label: "Hook", to: "/composables", delay: 500 },
  { label: "安装", to: "/getting-started/installation", delay: 430 },
];

const rootRef = useTemplateRef<HTMLElement>("root");
const guideRef = useTemplateRef<HTMLElement>("guide");
const cleanups: Array<() => void> = [];

/* ── AI ─────────────────────────────────────────────────────────── */

const { isEnabled: isAssistantEnabled, open: openAssistant } = useAssistant();

/** 开启了 AI 助手就打开抽屉；没开启时保留链接的默认跳转（在线演练场） */
function onAiClick(event: MouseEvent) {
  if (!isAssistantEnabled.value) return;
  event.preventDefault();
  openAssistant();
}

/* ── 登录 ───────────────────────────────────────────────────────── */

const authUser = shallowRef<AuthUser | null>(null);
const feishuEnabled = shallowRef(true);
/** 生产环境没配飞书凭证时站点不提供登录（与文档站的 AI 助手一致），登录按钮随之隐藏 */
const isDev = import.meta.dev;
const userMenuOpen = shallowRef(false);

async function fetchAuthUser() {
  try {
    const res = await $fetch<{ user: AuthUser | null; feishuEnabled: boolean }>("/api/auth/me");
    authUser.value = res.user;
    feishuEnabled.value = res.feishuEnabled;
  }
  catch {
    // 接口不可用时按未登录处理，登录按钮照常显示
  }
}

/** 没配飞书凭证时（本地开发）改走模拟登录；生产环境的 dev-login 返回 404，不会走到这里 */
async function onLoginClick(event: MouseEvent) {
  if (feishuEnabled.value || !isDev) return;
  event.preventDefault();
  try {
    await $fetch("/api/auth/dev-login", { method: "POST" });
    await fetchAuthUser();
  }
  catch {
    // 失败时登录按钮保持原样，可以再点一次
  }
}

async function logout() {
  userMenuOpen.value = false;
  try {
    await $fetch("/api/auth/logout", { method: "POST" });
  }
  finally {
    authUser.value = null;
  }
}

/** 点到用户菜单以外的地方时收起菜单 */
function onDocumentPointerDown(event: PointerEvent) {
  if (!userMenuOpen.value) return;
  const target = event.target as Element | null;
  if (!target?.closest(".navUser")) userMenuOpen.value = false;
}

/* ── Agent 友好徽章 ─────────────────────────────────────────────── */

const badgeCopied = shallowRef(false);
let badgeTimer = 0;

/** 复制一段阅读指令：让 Agent 先读站点的 llms.txt 再回答 */
async function copyAgentInstruction() {
  const text = `请先阅读 ${location.origin}/llms.txt 了解 Reborn UI 的组件与用法，再回答我的问题。`;
  try {
    await navigator.clipboard.writeText(text);
    badgeCopied.value = true;
    clearTimeout(badgeTimer);
    badgeTimer = window.setTimeout(() => (badgeCopied.value = false), 1800);
  }
  catch {
    // 剪贴板被拒绝时不提示，徽章保持原样
  }
}

onMounted(() => {
  const root = rootRef.value;
  if (!root) return;
  const nav = root.querySelector<HTMLElement>(".siteMenuNav");
  if (nav) cleanups.push(mountSiteMenu(nav));
  const badge = root.querySelector<HTMLElement>(".siteMenuAgentBadge");
  if (badge) cleanups.push(mountAgentBadgeMaterial(badge));
  cleanups.push(mountLogoTone(root), mountMegaHighlights(root), mountMegaLogoMotion(root));
  if (guideRef.value) cleanups.push(mountBubbleGuide(guideRef.value, root));
  void fetchAuthUser();
  document.addEventListener("pointerdown", onDocumentPointerDown);
  cleanups.push(() => document.removeEventListener("pointerdown", onDocumentPointerDown));
});

onBeforeUnmount(() => {
  clearTimeout(badgeTimer);
  cleanups.splice(0).reverse().forEach((fn) => fn());
});
</script>

<template>
  <!-- 滚到浅色区块时，topbar 给根节点写 data-logo-tone=light -->
  <div ref="root" class="payathon-site-header group/header" data-payathon-header inert aria-hidden="true" data-astro-cid-45h6wvi2="">
    <header class="topBar compactTopBar">
      <nav id="payathon-mobile-navigation" class="siteMenuNav siteFrame" aria-label="页面导航">
        <div class="siteMenuBrand">
          <a class="brand" href="/" aria-label="Reborn UI 首页">
            <!-- 字标，浅色区切换为深色 -->
            <svg
              class="brandLogo brandLogo--reborn h-[26px]! w-[136.5px]! text-[#f3f4f6]! filter-none! group-data-[logo-tone=light]/header:text-[#111]!"
              viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Reborn UI"
            >
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
          </a><button
            type="button"
            class="siteMenuAgentBadge"
            data-agent-read-entry
            :data-agent-speaking="badgeCopied ? '' : undefined"
            :aria-label="badgeCopied ? '已复制阅读指令' : '让 Agent 帮我读本站，复制阅读指令'"
            :title="badgeCopied ? '已复制，粘贴给你的 Agent' : '复制给 Agent 的阅读指令（先读 /llms.txt）'"
            @click="copyAgentInstruction"
          >
            <svg class="siteMenuAgentShape" aria-hidden="true"><path /></svg><span class="siteMenuAgentHoverLight" aria-hidden="true" /><span class="siteMenuAgentText" aria-hidden="true"><img
              class="siteMenuAgentWordmark"
              src="/showcase/payathon-assets/reborn/agent-friendly.svg"
              width="378"
              height="88"
              alt
            ></span><svg class="siteMenuAgentEyes" viewBox="10.28 1.93945 5.92 7.75" fill="currentColor" aria-hidden="true">
              <g class="siteMenuAgentEyeLength">
                <path d="M12.77 1.93945H11.39L10.28 9.68945H11.74L12.77 1.93945Z" />
                <path d="M16.2 1.93945H14.82L13.71 9.68945H15.17L16.2 1.93945Z" />
              </g>
            </svg>
          </button>
        </div>
        <div class="siteReadingControls">
          <div class="siteMenuCluster">
            <button
              class="siteMenuToggle"
              type="button"
              aria-expanded="false"
              aria-controls="payathon-mobile-navigation-panel"
              aria-label="展开导航菜单"
              data-site-menu-toggle
            >
              <svg
                class="siteMenuToggleIcon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M5 8h14M5 16h14" />
              </svg>
            </button>
            <div id="payathon-mobile-navigation-panel" class="siteMenuPanel">
              <div class="siteMenuLinks">
                <div class="siteMenuGroup" style="--nav-reveal-delay: 710ms">
                  <button
                    class="siteMenuGroupToggle"
                    type="button"
                    aria-expanded="false"
                    aria-label="展开 dsh 插件子菜单"
                    aria-controls="payathon-mobile-navigation-panel-products"
                    data-site-group-toggle
                  >
                    <span>dsh 插件</span><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <path
                        d="M4 6l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    id="payathon-mobile-navigation-panel-products"
                    class="siteMenuContent megaMenu--products"
                    data-menu-key="products"
                    hidden
                    aria-label="dsh 插件菜单"
                  >
                    <a class="siteMenuOverview" href="#benefits">dsh 插件与演示一览<span aria-hidden="true">↓</span></a>
                    <div class="megaInner megaInner--triple">
                      <div v-for="column in PLUGIN_COLUMNS" :key="column.label" class="megaCol">
                        <p class="megaLabel">{{ column.label }}</p>
                        <div class="megaResources">
                          <a
                            v-for="plugin in column.items"
                            :key="plugin.id"
                            class="megaResource"
                            :href="plugin.href"
                            target="_blank"
                            rel="noopener noreferrer"
                          ><span class="megaResourceLogo" data-product-logo="skill"><img
                            class="navProductSilhouette"
                            :src="`/showcase/payathon-assets/reborn/nav/${plugin.id}-silhouette.svg`"
                            alt
                            width="28"
                            height="28"
                          ><img
                            class="navProductDetail"
                            :src="`/showcase/payathon-assets/reborn/nav/${plugin.id}-detail.svg`"
                            alt
                            width="28"
                            height="28"
                          ></span><span class="megaResourceTitle">{{ plugin.title }}<svg
                            class="megaResourceExternalIcon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path d="M7 17 17 7M7 7h10v10" /></svg></span><span class="megaResourceChinese">{{ plugin.label }}</span><span class="megaResourceDesc">{{ plugin.desc }}</span></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <NuxtLink
                  v-for="link in NAV_LINKS"
                  :key="link.to"
                  :to="link.to"
                  :style="{ '--nav-reveal-delay': `${link.delay}ms` }"
                >
                  {{ link.label }}
                </NuxtLink><a style="--nav-reveal-delay: 360ms" href="/playground" data-nav-ai @click="onAiClick">AI</a>
              </div>
            </div>
          </div>
        </div>
        <div class="navActions" data-nav-auth :data-nav-logged-in="authUser ? '' : undefined">
          <a
            class="navButton navButtonDark"
            href="/api/auth/feishu/login"
            data-nav-login
            :hidden="!!authUser || (!feishuEnabled && !isDev)"
            @click="onLoginClick"
          ><span>登录</span></a>
          <!-- 用户菜单，data-menu-open 时展开 -->
          <div class="navUser group/user" data-nav-user :hidden="!authUser" :data-menu-open="userMenuOpen ? '' : undefined">
            <button
              class="navUserTrigger"
              type="button"
              aria-haspopup="menu"
              :aria-expanded="userMenuOpen"
              data-nav-user-trigger
              @click="userMenuOpen = !userMenuOpen"
            >
              <span class="navUserAvatar" aria-hidden="true"><img
                v-if="authUser?.avatar"
                class="navUserAvatarImage"
                :src="authUser.avatar"
                alt
              ></span><span class="navUserName" data-nav-user-name>{{ authUser?.name ?? "" }}</span><svg class="navUserArrow" viewBox="0 0 15 14" aria-hidden="true" focusable="false">
                <path
                  d="M4.25 5.25L7.5 8.5L10.75 5.25"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div
              class="navUserMenu group-data-[menu-open]/user:pointer-events-auto! group-data-[menu-open]/user:[transform:none]! group-data-[menu-open]/user:opacity-100!"
              role="menu" :aria-hidden="!userMenuOpen" data-nav-user-menu
            >
              <button class="navUserMenuItem" type="button" role="menuitem" data-nav-logout @click="logout">
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  </div>
  <!-- 网站助手气泡：路径与尺寸取自原站停靠状态下的实时 DOM（宽 56.25px，按徽章高度缩放） -->
  <div
    ref="guide"
    class="bubbleGuide"
    aria-hidden="true"
    data-agent-companion
    data-header-docked
    data-header-pending
    style="width: 56.25px; --guide-x: 0px; --guide-y: 0px; --dock-scale: 0.6111"
  >
    <div class="bubbleGuideBody">
      <svg class="bubbleGuideShape" aria-hidden="true" viewBox="0 0 16.551111111111112 15" style="height: 50.7519px; top: -1.69173px">
        <path
          id="bubble-guide-contour"
          d="M3.14003 0.5 C6.883723703703704 0.5 10.627417407407409 0.5 14.371111111111112 0.5 C15.381111111111114 0.5 16.171111111111113 1.39 16.031111111111112 2.4 C15.70777777777778 4.826666666666666 15.384444444444446 7.253333333333332 15.061111111111114 9.68 C14.951111111111114 10.51 14.241111111111113 11.14 13.401111111111113 11.14 H10.055555555555557 C8.895555555555555 12.2669667 7.735555555555556 13.3939333 6.575555555555556 14.5209 C6.365555555555556 14.7309 6.0055555555555555 14.5509 6.045555555555556 14.2509 C6.195555555555556 13.2139333 6.345555555555555 12.1769667 6.495555555555556 11.14 H2.18003 C1.17003 11.14 0.380029 10.25 0.520029 9.24 C0.5166956666666667 9.236666666666666 0.5133623333333333 9.233333333333334 0.510029 9.23 C0.8333626666666667 6.806666666666667 1.1566963333333333 4.383333333333334 1.48003 1.96 C1.59003 1.13 2.30003 0.5 3.14003 0.5 Z"
        />
        <defs>
          <clipPath id="bubble-guide-inset"><use href="#bubble-guide-contour" /></clipPath>
        </defs>
        <use class="bubbleGuideInsetOutline" href="#bubble-guide-contour" fill="none" stroke="white" stroke-width="0.9672727272727272" clip-path="url(#bubble-guide-inset)" />
      </svg>
      <span class="bubbleGuideFaceSpace" aria-hidden="true" />
      <span class="bubbleGuideFaceGuard" aria-hidden="true">
        <span class="bubbleGuideFace" style="--face-left: 6.875px; --face-length: 1; --face-y: 0px">
          <svg class="bubbleGuideEyes" viewBox="10.28 1.93945 5.92 7.75" fill="currentColor">
            <g class="bubbleGuideEyeLength">
              <path d="M12.77 1.93945H11.39L10.28 9.68945H11.74L12.77 1.93945Z" />
              <path d="M16.2 1.93945H14.82L13.71 9.68945H15.17L16.2 1.93945Z" />
            </g>
          </svg>
        </span>
      </span>
      <span class="bubbleGuideCopy" style="clip-path: inset(-5px 0px)" />
    </div>
  </div>
</template>

