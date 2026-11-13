<script setup lang="ts">
import type { TerminalLine } from "~/lib/payathon/hero";
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import {
  layoutHero,
  linkHeaderReady,
  mountClock,
  mountEntryTyping,
  mountHeroScene,
  mountHeroTerminal,
  mountTitleIntro,
  restoreSkippedIntro,
} from "~/lib/payathon/hero";
import { mountInteractiveGlyphs } from "~/lib/payathon/interactive-glyphs";

/**
 * 首屏：REBORN UI 标题开场、水母字符画、左右口号、「马上开始」按钮、安装命令行与当前时间。
 *
 * 交互全部在挂载后由 app/lib/payathon/hero.ts 驱动：标题开场与水母都就绪后顶栏解锁，
 * 口号、时间随 data-intro-complete 入场。data-astro-cid-* 是样式作用域属性，保留以命中对应规则。
 */

/** 命令行逐行打出的安装步骤；内容取自 /getting-started/installation */
const terminalLines: TerminalLine[] = [
  { text: "$ npx reborn-ui@latest init", accent: true },
  { text: "/**" },
  { text: " * Reborn UI 跨端 Vue 组件库" },
  { text: " * 组件源码拷进你的项目，Web 与 UniApp 都能用" },
  { text: " */" },
  { text: " " },
  { text: "$ npm install @vueuse/core motion-v tw-animate-css \\" },
  { text: "    @iconify/tailwind4 tailwind-variants \\" },
  { text: "    tailwind-merge clsx" },
  { text: " " },
  { text: "$ npx reborn-ui@latest add reborn-button" },
  { text: " " },
  { text: "// ▶ Ready. Set. Build.", accent: true },
];

/**
 * 标题字形：用 PayathonSprite 里的字母符号排出「REBORN」与「UI」。
 * 字宽 62、字距 4；right 是该字右边界的横坐标，开场时让已打出的部分保持居中。
 */
const TITLE_GLYPHS = [
  { char: "R", x: 0, accent: true },
  { char: "E", x: 66, accent: true },
  { char: "B", x: 132, accent: false },
  { char: "O", x: 198, accent: false },
  { char: "R", x: 264, accent: false },
  { char: "N", x: 330, accent: false },
  { char: "U", x: 416, accent: true },
  { char: "I", x: 482, accent: true },
].map((glyph) => ({ ...glyph, right: glyph.x + 62 }));
/** 标题总宽，对应 svg 的 viewBox 宽度 */
const TITLE_WIDTH = 544;

/** 当前时间的 14 位数字：年 4 位、月日各 2 位、时分秒各 2 位；挂载前先显示 0，入场前本就不可见 */
const CLOCK_GROUPS = [
  { digits: [0, 1, 2, 3], unit: "年" },
  { digits: [4, 5], unit: "月" },
  { digits: [6, 7], unit: "日" },
] as const;

const heroRef = useTemplateRef<HTMLElement>("hero");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const hero = heroRef.value;
  const page = hero?.closest<HTMLElement>("#payathon-page");
  const title = hero?.querySelector<HTMLElement>("#payathon-title");
  if (!hero || !page || !title) return;
  // 从站内页面返回时直接摆成最终态；否则先算一次版面，开场从这里起步
  if (!restoreSkippedIntro(page, hero)) layoutHero(hero);
  cleanups.push(
    linkHeaderReady(hero),
    mountTitleIntro(page, title),
    mountHeroScene(page, hero),
    mountEntryTyping(hero),
    mountClock(hero),
    mountHeroTerminal(hero, terminalLines),
    mountInteractiveGlyphs(hero),
  );
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});
</script>

<template>
  <section ref="hero" class="payathon-hero" aria-labelledby="payathon-title" data-astro-cid-45h6wvi2="">
    <div class="payathon-ascii" data-payathon-ascii aria-hidden="true" data-astro-cid-45h6wvi2="" />
    <h1 id="payathon-title" data-astro-cid-45h6wvi2="">
      <span class="payathon-title-frame" data-astro-cid-45h6wvi2="">
        <img
          class="payathon-aipay-logo"
          src="/showcase/payathon-assets/reborn/reborn-mark.svg"
          width="120"
          height="72"
          alt
          aria-hidden="true"
          data-title-char="8"
          style="opacity: 0"
          data-astro-cid-45h6wvi2=""
        >
        <svg
          class="payathon-name"
          :viewBox="`0 0 ${TITLE_WIDTH} 37`"
          role="img"
          aria-label="Reborn UI"
          xmlns="http://www.w3.org/2000/svg"
          data-astro-cid-45h6wvi2=""
        >
          <g class="payathon-bracket-left" :transform="`translate(${TITLE_WIDTH / 2 + 18} 0)`" aria-hidden="true" data-astro-cid-45h6wvi2="">
            <svg x="-40" y="-3.5" width="19" height="44" viewBox="0 0 19 44" data-astro-cid-45h6wvi2="">
              <path
                d="M13.3 43.5C8.8 43.5 5.71667 42.7333 4.05 41.2C2.41667 39.7 1.91667 37.1333 2.55 33.5L3.35 28.9C3.61667 27.3333 3.45 26.2833 2.85 25.75C2.25 25.1833 1.3 24.9 0 24.9V18.6C1.3 18.6 2.25 18.3333 2.85 17.8C3.45 17.2333 3.61667 16.1667 3.35 14.6L2.55 10C1.91667 6.36667 2.41667 3.8 4.05 2.3C5.71667 0.766667 8.8 0 13.3 0H18.05V7.8H15.05C13.65 7.8 13.05 8.36667 13.25 9.5L14.35 16.1C14.6833 18.0333 14.3833 19.4167 13.45 20.25C12.55 21.05 11.2333 21.55 9.5 21.75C11.2333 21.95 12.55 22.45 13.45 23.25C14.3833 24.05 14.6833 25.4333 14.35 27.4L13.25 34C13.05 35.1333 13.65 35.7 15.05 35.7H18.05V43.5H13.3Z"
                fill="white"
                data-astro-cid-45h6wvi2=""
              />
            </svg>
          </g>
          <g class="payathon-bracket-right" :transform="`translate(${-(TITLE_WIDTH / 2 + 18)} 0)`" aria-hidden="true" data-astro-cid-45h6wvi2="">
            <svg :x="TITLE_WIDTH + 21" y="-3.5" width="19" height="44" viewBox="0 0 19 44" data-astro-cid-45h6wvi2="">
              <path
                d="M4.75 43.5H0V35.7H3C4.4 35.7 5 35.1333 4.8 34L3.7 27.4C3.36667 25.4333 3.65 24.05 4.55 23.25C5.48333 22.45 6.81667 21.95 8.55 21.75C6.81667 21.55 5.48333 21.05 4.55 20.25C3.65 19.4167 3.36667 18.0333 3.7 16.1L4.8 9.5C5 8.36667 4.4 7.8 3 7.8H0V0H4.75C9.25 0 12.3167 0.766667 13.95 2.3C15.6167 3.8 16.1333 6.36667 15.5 10L14.7 14.6C14.4333 16.1667 14.6 17.2333 15.2 17.8C15.8 18.3333 16.75 18.6 18.05 18.6V24.9C16.75 24.9 15.8 25.1833 15.2 25.75C14.6 26.2833 14.4333 27.3333 14.7 28.9L15.5 33.5C16.1333 37.1333 15.6167 39.7 13.95 41.2C12.3167 42.7333 9.25 43.5 4.75 43.5Z"
                fill="white"
                data-astro-cid-45h6wvi2=""
              />
            </svg>
          </g>
          <g data-title-glyphs data-astro-cid-45h6wvi2="">
            <use
              v-for="(glyph, index) in TITLE_GLYPHS"
              :key="index"
              :href="`#payathon-letter-${glyph.char}`"
              :x="glyph.x"
              y="0.2"
              width="62"
              height="36.6"
              :data-title-char="index"
              :data-title-right="glyph.right"
              :style="{ opacity: 0, color: glyph.accent ? 'var(--payathon-accent, #1677FF)' : '#FFFFFF' }"
              aria-hidden="true"
              data-astro-cid-45h6wvi2=""
            />
          </g>
        </svg>
        <span class="payathon-subtitle" aria-label="跨端组件库" data-astro-cid-45h6wvi2="">
          <span
            class="payathon-subtitle-label"
            aria-hidden="true"
            data-title-char="9"
            style="opacity: 0"
            data-astro-cid-45h6wvi2=""
          >跨端组件库</span>
        </span></span>
    </h1>
    <section
      id="overview"
      class="payathon-overview"
      aria-labelledby="overview-title"
      inert
      aria-hidden="true"
      data-astro-cid-45h6wvi2=""
    >
      <div class="overview-grid" data-astro-cid-45h6wvi2="">
        <h2 id="overview-title" data-astro-cid-45h6wvi2="">
          <span
            class="overview-slogan overview-slogan-start"
            data-overview-reveal
            data-direction="left"
            style="--reveal-delay: 260ms"
            data-astro-cid-45h6wvi2=""
          ><span class="reveal-ink" data-astro-cid-45h6wvi2="">让我的组件</span></span>
          <span
            class="overview-slogan overview-slogan-end"
            data-overview-reveal
            data-direction="right"
            style="--reveal-delay: 380ms"
            data-astro-cid-45h6wvi2=""
          ><span class="reveal-ink" data-astro-cid-45h6wvi2="">走向自定义</span></span>
        </h2>
        <div class="overview-blackhole" data-astro-cid-45h6wvi2="">
          <!-- 去掉链接下划线 -->
          <a
            href="/getting-started"
            class="blackhole-button no-underline!"
            aria-label="马上开始"
            data-astro-cid-45h6wvi2=""
          >
            <span data-astro-cid-45h6wvi2="">马上开始</span>
          </a>
        </div>
        <div
          class="hero-terminal"
          data-hero-terminal
          aria-label="Reborn UI 安装命令"
          role="region"
          data-astro-cid-l7ur5rbf=""
        >
          <div class="terminal-output" data-terminal-output aria-live="off" data-astro-cid-l7ur5rbf="" />
          <!-- 命令行的内容在脚本里（terminalLines），由 mountHeroTerminal 逐字打出 -->
        </div>
        <p
          class="overview-description overview-description-end"
          data-overview-reveal
          data-direction="right"
          style="--reveal-delay: 560ms"
          data-astro-cid-45h6wvi2=""
        >
          <span class="reveal-ink" data-astro-cid-45h6wvi2="">Web 与 UniApp<br data-astro-cid-45h6wvi2="">TypeScript 与 Tailwind CSS</span>
        </p>
      </div>
    </section>
    <div class="overview-registration" data-astro-cid-45h6wvi2="">
      <p
        class="overview-status"
        data-overview-reveal
        data-direction="left"
        style="--reveal-delay: 640ms"
        data-astro-cid-45h6wvi2=""
      >
        <!-- 窄屏下时间缩小字号并允许换行 -->
        <span class="reveal-ink" data-astro-cid-45h6wvi2=""><span class="registration-deadline max-[641px]:flex-wrap! max-[641px]:gap-y-1.5!" data-astro-cid-45h6wvi2=""><span
          class="countdown max-[641px]:gap-2! max-[641px]:text-[22px]!"
          data-clock
          role="timer"
          aria-live="off"
          aria-label="当前时间"
          data-astro-cid-45h6wvi2=""
        >
          <span
            v-for="group in CLOCK_GROUPS"
            :key="group.unit"
            class="countdown-part"
            data-astro-cid-45h6wvi2=""
          ><span
            v-for="digit in group.digits"
            :key="digit"
            class="countdown-digit interactive-glyph"
            :data-clock-digit="digit"
            aria-hidden="true"
            data-astro-cid-45h6wvi2=""
          ><svg viewBox="0 0 30 38" focusable="false" data-astro-cid-45h6wvi2="">
            <use href="#payathon-digit-0" data-astro-cid-45h6wvi2="" /></svg></span><span class="countdown-unit" data-astro-cid-45h6wvi2="">{{ group.unit }}</span></span>
          <span class="countdown-part" data-astro-cid-45h6wvi2=""><template v-for="digit in [8, 9, 10, 11, 12, 13]" :key="digit"><span
            v-if="digit === 10 || digit === 12"
            class="countdown-separator"
            data-astro-cid-45h6wvi2=""
          >:</span><span
            class="countdown-digit interactive-glyph"
            :data-clock-digit="digit"
            aria-hidden="true"
            data-astro-cid-45h6wvi2=""
          ><svg viewBox="0 0 30 38" focusable="false" data-astro-cid-45h6wvi2="">
            <use href="#payathon-digit-0" data-astro-cid-45h6wvi2="" /></svg></span></template></span>
        </span><span class="deadline-meta" data-astro-cid-45h6wvi2=""><span class="registration-state" data-astro-cid-45h6wvi2="">实时</span><span class="deadline-label" data-astro-cid-45h6wvi2="">当前时间</span></span></span></span>
      </p>
    </div>
  </section>
</template>

