<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";
import { mountPartnerBenefits } from "~/lib/payathon/partner-benefits";

/**
 * DSH 插件：页面在这里由深转浅，DeepSeek Harness（dsh）桌面端的插件卡片与一个在线演示随滚动在吸顶的舞台上横向滑过，
 * 卡片带 WebGL 光泽。插件卡片链到 GitHub 仓库，演示卡片链到内网的演示站。
 *
 * 首尾各放两张副本（data-benefit-loop-copy）给未吸顶时的横向无限循环用：
 * 开头是最后两张、结尾是前两张，副本对读屏隐藏、不可聚焦。
 * 卡片的图标块由 D:/tmp 下的生成脚本写到 public/showcase/payathon-assets/plugins/（lucide 图形）。
 * 交互在挂载后由 app/lib/payathon/partner-benefits.ts 驱动，卡片数量由它从 DOM 里读，不需要另外配置。
 */

interface DshPlugin {
  /** 图标文件名 */
  id: string;
  name: string;
  description: string;
  href: string;
  /** 简介下方的等宽小字：插件写仓库名，演示写地址 */
  meta: string;
  /** 按钮文案 */
  action: string;
}

const GITHUB_OWNER = "https://github.com/1997liuyh-boop";

/** 插件简介依据各仓库 README；演示站依据其页面标题与描述 */
const PLUGINS: DshPlugin[] = [
  {
    id: "studio-library",
    name: "工作室插件",
    description: "工作室控制台与共享运行时，管理工作室列表、项目、服务连接、会话和更新；业务工作室按需另装。",
    href: `${GITHUB_OWNER}/dsh-studio-library`,
    meta: "dsh-studio-library",
    action: "前往 GitHub",
  },
  {
    id: "studio-design",
    name: "设计工作室",
    description: "把 MasterGo 设计稿、Reborn UI 组件资料和 dsh 项目会话连在一起，按链接还原页面。",
    href: `${GITHUB_OWNER}/dsh-studio-design`,
    meta: "dsh-studio-design",
    action: "前往 GitHub",
  },
  {
    id: "desktop-tools",
    name: "桌面助手",
    description: "一个插件包含划词工具栏、悬浮助手、截图、长截图和录屏；截图上的文字识别需另装 dsh-vision-router。",
    href: `${GITHUB_OWNER}/dsh-desktop-tools`,
    meta: "dsh-desktop-tools",
    action: "前往 GitHub",
  },
  {
    id: "online-demo",
    name: "在线 DEMO",
    description: "「重塑 Design」企业设计规范与组件参考站，这里打开的是滚动条页面。地址在公司内网，外网打不开。",
    href: "http://192.168.20.90:3333/scrollbar",
    meta: "192.168.20.90:3333/scrollbar",
    action: "打开演示",
  },
];

interface PluginCard {
  key: string;
  plugin: DshPlugin;
  /** 是否为循环副本 */
  copy: boolean;
}

/** 卡片序列：最后两张副本 + 全部原卡 + 前两张副本 */
const cards: PluginCard[] = [
  ...PLUGINS.slice(-2).map((plugin) => ({ key: `head-${plugin.id}`, plugin, copy: true })),
  ...PLUGINS.map((plugin) => ({ key: plugin.id, plugin, copy: false })),
  ...PLUGINS.slice(0, 2).map((plugin) => ({ key: `tail-${plugin.id}`, plugin, copy: true })),
];

const rootRef = useTemplateRef<HTMLElement>("root");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const root = rootRef.value;
  if (!root) return;
  const runway = root.querySelector<HTMLElement>("[data-benefits-scroll]");
  if (runway) cleanups.push(mountPartnerBenefits(runway));
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});
</script>

<template>
  <section
    id="benefits"
    ref="root"
    class="partner-benefits event-section"
    data-partner-benefits
    data-benefits-placement="landing"
    aria-labelledby="benefits-title"
  >
    <div class="partner-benefits-layout">
      <div class="benefits-scroll-runway" data-benefits-scroll>
        <div class="benefits-scroll-stage">
          <header class="partner-benefits-heading event-section-head">
            <div>
              <p class="event-english-title">
                <PayathonWord text="DSH PLUGINS" :size="2" />
              </p>
              <h2 id="benefits-title">DSH 插件</h2>
              <p>DeepSeek Harness（dsh）桌面端的插件，源码在 GitHub；另附一个内网在线演示。</p>
            </div>
          </header>
          <div class="partner-benefits-access">
            <p data-benefits-status role="status">
              工作室插件与桌面助手需要 DSH Desktop 0.2.2-rc.1 起的版本，在插件管理器里按 Git 仓库安装；设计工作室装在工作室插件之上，步骤见各仓库 README。
            </p>
          </div>
          <div class="benefits-card-stage">
            <div class="benefits-scroll-viewport">
              <div class="partner-benefits-grid">
                <article
                  v-for="card in cards"
                  :key="card.key"
                  class="partner-benefit-card"
                  :data-benefit-loop-copy="card.copy ? '' : undefined"
                  :aria-hidden="card.copy ? 'true' : undefined"
                >
                  <div class="partner-benefit-brand">
                    <a
                      class="partner-benefit-logo"
                      :data-partner="card.plugin.id"
                      style="--partner-logo-scale: 1"
                      :href="card.plugin.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      tabindex="-1"
                      :aria-label="`${card.plugin.action}：${card.plugin.name}（在新标签页打开）`"
                    ><img
                      style="--partner-logo-scale: 1"
                      :src="`/showcase/payathon-assets/plugins/${card.plugin.id}.svg`"
                      alt
                      width="136"
                      height="48"
                      loading="lazy"
                      decoding="async"
                    ></a>
                  </div>
                  <div class="partner-benefit-copy">
                    <h4>{{ card.plugin.name }}</h4>
                    <p>{{ card.plugin.description }}</p>
                    <!-- 仓库名 -->
                    <p class="partner-benefit-repo mt-3! font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]! text-[12px]! leading-[1.6]! text-[var(--partner-muted,#626b78)]!">
                      {{ card.plugin.meta }}
                    </p>
                  </div>
                  <a
                    class="partner-benefit-claim"
                    :tabindex="card.copy ? -1 : undefined"
                    :data-benefit-claim="card.plugin.id"
                    :href="card.plugin.href"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ card.plugin.action }}<span class="partner-sr-only">（在新标签页打开）</span></a>
                </article>
              </div>
            </div>
          </div>
          <p class="partner-benefits-note">
            各插件的安装版本标签与兼容范围以仓库 README 为准。
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

