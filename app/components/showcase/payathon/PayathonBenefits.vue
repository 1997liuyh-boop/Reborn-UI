<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";
import { mountPartnerBenefits } from "~/lib/payathon/partner-benefits";

/**
 * DSH 插件：页面在这里由深转浅，DeepSeek Harness（dsh）桌面端的五个插件卡片随滚动在吸顶的舞台上横向滑过，
 * 卡片带 WebGL 光泽。每张卡片链到插件的 GitHub 仓库。
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
  /** GitHub 仓库名 */
  repo: string;
}

const GITHUB_OWNER = "https://github.com/1997liuyh-boop";

/** 简介依据各仓库 README（studio-library 为私有仓库，依据其公开的同名基础库说明） */
const PLUGINS: DshPlugin[] = [
  {
    id: "studio-library",
    name: "工作室插件",
    description: "工作室容器、共享运行时与 SDK，旅行、学习路线、短剧、健身、影音、直播、设计等工作室都跑在它上面。",
    repo: "dsh-studio-library-private",
  },
  {
    id: "studio-design",
    name: "设计工作室",
    description: "把 MasterGo 设计稿、Reborn UI 组件资料和 dsh 项目会话连在一起，按链接还原页面。",
    repo: "dsh-studio-design",
  },
  {
    id: "floating-ball",
    name: "悬浮球",
    description: "桌面悬浮助手，可对话、切换模型、管理权限。",
    repo: "dsh-floating-ball",
  },
  {
    id: "selection-toolbar",
    name: "划词工具栏",
    description: "选中文字后弹出工具栏，翻译、提问并展示助手结果。",
    repo: "dsh-selection-toolbar",
  },
  {
    id: "capture",
    name: "截图和录屏",
    description: "区域截图、标注与录屏控制；应用菜单里也有截图入口，不依赖悬浮球。",
    repo: "dsh-capture",
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
              <p>给 DeepSeek Harness（dsh）桌面端用的插件，源码托管在 GitHub。</p>
            </div>
          </header>
          <div class="partner-benefits-access">
            <p data-benefits-status role="status">
              悬浮球、划词工具栏、截图和录屏需要支持 Desktop 扩展 API 1 的 DSH Desktop 分支，在插件管理器里以 Git 仓库安装；两个工作室插件的安装方式见各自仓库。
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
                      :href="`${GITHUB_OWNER}/${card.plugin.repo}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      tabindex="-1"
                      :aria-label="`在 GitHub 查看${card.plugin.name}（在新标签页打开）`"
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
                    <p class="partner-benefit-repo">
                      {{ card.plugin.repo }}
                    </p>
                  </div>
                  <a
                    class="partner-benefit-claim"
                    :tabindex="card.copy ? -1 : undefined"
                    :data-benefit-claim="card.plugin.id"
                    :href="`${GITHUB_OWNER}/${card.plugin.repo}`"
                    target="_blank"
                    rel="noopener noreferrer"
                  >前往 GitHub<span class="partner-sr-only">（在新标签页打开）</span></a>
                </article>
              </div>
            </div>
          </div>
          <p class="partner-benefits-note">
            各插件的构建要求与兼容版本以仓库 README 为准。
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
/* 卡片里的仓库名：等宽小字，放在简介下面，方便对照 GitHub 地址 */
#payathon-page .partner-benefit-copy .partner-benefit-repo {
  margin-top: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--partner-muted, #626b78);
}
</style>
