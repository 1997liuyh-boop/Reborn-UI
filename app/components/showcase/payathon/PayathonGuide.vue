<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";
import { mountSchedule } from "~/lib/payathon/page-effects";
import { buildCalendarCells, buildCalendarMonths, RELEASE_PHASES } from "~/lib/payathon/release-calendar";

/**
 * 快速开始：四步接入、提交日历（近 20 周每天的提交，按所属版本着色，悬浮显示日期、版本与提交数）
 * 与 GitHub 仓库入口。
 * 步骤取自 content/1.getting-started/2.installation.md；日历数据取自 git 标签与提交记录，见 release-calendar.ts。
 * data-astro-cid-* 是这套视觉模板样式的作用域属性，保留以命中对应规则。
 */

const cells = buildCalendarCells();
const months = buildCalendarMonths();
/** 方向键漫游的起点：第一个有提交的日子可被 Tab 聚焦，其余格子 tabindex=-1 */
const firstActiveDate = cells.find((cell) => cell.commits)?.date;

/** 仓库地址：优先取站点配置（Docus 从 git 远端推导），取不到时用主仓库 */
const appConfig = useAppConfig();
const repoUrl = computed(() => appConfig.github?.url || "https://github.com/1997liuyh-boop/Reborn-UI");
const repoName = computed(() => repoUrl.value.replace(/^https?:\/\/github\.com\//, ""));

const rootRef = useTemplateRef<HTMLElement>("root");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const root = rootRef.value;
  if (!root) return;
  cleanups.push(mountSchedule(root));
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});

/** 步骤里的命令样式 */
const GUIDE_CODE = "rounded-[4px]! bg-[#202834]! px-1.5! py-px! font-[ui-monospace,monospace]! text-[13px]! leading-[1.6]! font-medium! text-[#e5e8ed]! box-decoration-clone!";
</script>

<template>
  <section id="guide" ref="root" class="event-section" aria-labelledby="guide-title" data-astro-cid-45h6wvi2="">
    <div data-astro-cid-45h6wvi2="">
      <header class="event-section-head" data-astro-cid-45h6wvi2="">
        <p class="event-english-title" data-astro-cid-45h6wvi2="">
          <PayathonWord text="HOW TO START" :size="2" />
        </p>
        <h2 id="guide-title" data-astro-cid-45h6wvi2="">四步用上 Reborn UI</h2>
        <p data-astro-cid-45h6wvi2="">
          Vue 3 与 Nuxt 项目按下面四步接入；UniApp 项目见
          <!-- 内联链接：强调色，悬停显示下划线 -->
          <NuxtLink class="guide-inline-link text-[var(--payathon-accent,#86eaff)]! no-underline! hover:underline!" to="/getting-started/tailwind3">Tailwind v3</NuxtLink>
          与
          <NuxtLink class="guide-inline-link text-[var(--payathon-accent,#86eaff)]! no-underline! hover:underline!" to="/getting-started/tailwind4">Tailwind v4</NuxtLink>
          两篇安装指南。
        </p>
      </header>
      <div class="steps-grid" role="list" data-astro-cid-45h6wvi2="">
        <article role="listitem" data-astro-cid-45h6wvi2="">
          <span data-astro-cid-45h6wvi2=""> 01 </span>
          <div data-astro-cid-45h6wvi2="">
            <h3 data-astro-cid-45h6wvi2="">准备 Tailwind CSS</h3>
            <p data-astro-cid-45h6wvi2="">组件样式基于 Tailwind CSS，先按官方指南把它装进项目。</p>
          </div>
        </article>
        <article role="listitem" data-astro-cid-45h6wvi2="">
          <span data-astro-cid-45h6wvi2=""> 02 </span>
          <div data-astro-cid-45h6wvi2="">
            <h3 data-astro-cid-45h6wvi2="">初始化配置</h3>
            <p data-astro-cid-45h6wvi2="">
              运行 <code class="guide-code" :class="GUIDE_CODE">npx reborn-ui@latest init</code>，生成脚手架配置。
            </p>
          </div>
        </article>
        <article role="listitem" data-astro-cid-45h6wvi2="">
          <span data-astro-cid-45h6wvi2=""> 03 </span>
          <div data-astro-cid-45h6wvi2="">
            <h3 data-astro-cid-45h6wvi2="">安装依赖</h3>
            <p data-astro-cid-45h6wvi2="">装好 <span class="guide-nowrap whitespace-nowrap!">motion-v</span> 等七个辅助库，再按配置页更新 main.css。</p>
          </div>
        </article>
        <article role="listitem" data-astro-cid-45h6wvi2="">
          <span data-astro-cid-45h6wvi2=""> 04 </span>
          <div data-astro-cid-45h6wvi2="">
            <h3 data-astro-cid-45h6wvi2="">添加组件</h3>
            <p data-astro-cid-45h6wvi2="">
              运行 <code class="guide-code" :class="GUIDE_CODE">npx reborn-ui@latest add reborn-button</code>，组件源码拷进你的项目。
            </p>
          </div>
        </article>
      </div>
    </div>
    <section
      id="schedule"
      class="event-subsection"
      data-schedule
      aria-labelledby="schedule-title"
      data-astro-cid-45h6wvi2=""
    >
      <div data-astro-cid-45h6wvi2="">
        <header class="event-section-head" data-astro-cid-45h6wvi2="">
          <p class="event-english-title" data-astro-cid-45h6wvi2="">
            <PayathonWord text="BUILD IN PUBLIC" :size="3" />
          </p>
          <h2 id="schedule-title" data-astro-cid-45h6wvi2="">近 20 周的提交与发版</h2>
        </header>
        <div class="schedule-calendar" data-schedule-calendar data-astro-cid-45h6wvi2="">
          <div class="schedule-calendar-head" data-astro-cid-45h6wvi2="">
            <h3 data-astro-cid-45h6wvi2="">提交日历</h3>
            <span class="schedule-calendar-year" role="img" aria-label="2026" data-astro-cid-45h6wvi2=""><svg width="119" height="37" viewBox="0 0 119 37" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 35.6L0.75 31.4C4.75 28.7667 8.33333 26.25 11.5 23.85C14.7 21.45 17.2167 19.1333 19.05 16.9C20.8833 14.6667 21.8 12.4833 21.8 10.35C21.8 8.61667 21.3167 7.26667 20.35 6.3C19.3833 5.3 18.05 4.8 16.35 4.8C14.4167 4.8 12.85 5.41666 11.65 6.65C10.4833 7.88333 9.76667 9.43333 9.5 11.3H4.35C4.91667 7.7 6.23333 4.91667 8.3 2.95C10.3667 0.983333 13.2667 0 17 0C20.3 0 22.8333 0.916667 24.6 2.75C26.4 4.55 27.3 6.9 27.3 9.8C27.3 12.0667 26.7667 14.2 25.7 16.2C24.6667 18.1667 23.2667 20.0167 21.5 21.75C19.7333 23.45 17.7833 25.0833 15.65 26.65C13.5167 28.1833 11.3667 29.65 9.2 31.05H24.45L23.65 35.6H0Z"
                fill="currentColor"
              />
              <path
                d="M41.7305 36.2C38.2305 36.2 35.5138 34.9167 33.5805 32.35C31.6805 29.7833 30.7305 26.2333 30.7305 21.7C30.7305 19.0333 31.0971 16.4167 31.8305 13.85C32.5638 11.25 33.6305 8.91667 35.0305 6.85C36.4638 4.75 38.2138 3.08333 40.2805 1.85C42.3805 0.616667 44.7638 0 47.4305 0C50.9305 0 53.6305 1.28333 55.5305 3.85C57.4638 6.41667 58.4305 9.96667 58.4305 14.5C58.4305 17.2 58.0638 19.8333 57.3305 22.4C56.5971 24.9667 55.5138 27.3 54.0805 29.4C52.6805 31.4667 50.9305 33.1167 48.8305 34.35C46.7638 35.5833 44.3971 36.2 41.7305 36.2ZM36.2305 21.15C36.2305 23.3167 36.4971 25.1833 37.0305 26.75L49.2805 5.55C48.5805 5.15 47.7971 4.95 46.9305 4.95C45.3305 4.95 43.8638 5.43333 42.5305 6.4C41.2305 7.36667 40.0971 8.65 39.1305 10.25C38.1971 11.8167 37.4805 13.5667 36.9805 15.5C36.4805 17.4 36.2305 19.2833 36.2305 21.15ZM42.2305 31.3C43.8305 31.3 45.2805 30.8167 46.5805 29.85C47.9138 28.8833 49.0471 27.6 49.9805 26C50.9471 24.4 51.6805 22.65 52.1805 20.75C52.6805 18.8167 52.9305 16.9167 52.9305 15.05C52.9305 12.8833 52.6638 11.0167 52.1305 9.45L39.8305 30.7C40.5638 31.1 41.3638 31.3 42.2305 31.3Z"
                fill="currentColor"
              />
              <path
                d="M59.9609 35.6L60.7109 31.4C64.7109 28.7667 68.2943 26.25 71.4609 23.85C74.6609 21.45 77.1776 19.1333 79.0109 16.9C80.8443 14.6667 81.7609 12.4833 81.7609 10.35C81.7609 8.61667 81.2776 7.26667 80.3109 6.3C79.3443 5.3 78.0109 4.8 76.3109 4.8C74.3776 4.8 72.8109 5.41666 71.6109 6.65C70.4443 7.88333 69.7276 9.43333 69.4609 11.3H64.3109C64.8776 7.7 66.1943 4.91667 68.2609 2.95C70.3276 0.983333 73.2276 0 76.9609 0C80.2609 0 82.7943 0.916667 84.5609 2.75C86.3609 4.55 87.2609 6.9 87.2609 9.8C87.2609 12.0667 86.7276 14.2 85.6609 16.2C84.6276 18.1667 83.2276 20.0167 81.4609 21.75C79.6943 23.45 77.7443 25.0833 75.6109 26.65C73.4776 28.1833 71.3276 29.65 69.1609 31.05H84.4109L83.6109 35.6H59.9609Z"
                fill="currentColor"
              />
              <path
                d="M103.141 36.2C100.341 36.2 98.0581 35.6 96.2914 34.4C94.5247 33.2 93.2247 31.55 92.3914 29.45C91.5914 27.3167 91.1914 24.9 91.1914 22.2C91.1914 19.4333 91.5747 16.7333 92.3414 14.1C93.1414 11.4667 94.2747 9.08333 95.7414 6.95C97.2414 4.81667 99.0414 3.13333 101.141 1.9C103.275 0.633333 105.675 0 108.341 0C111.641 0 114.125 0.899999 115.791 2.7C117.491 4.5 118.358 6.88333 118.391 9.85H113.441C113.341 8.28333 112.758 7.05 111.691 6.15C110.625 5.25 109.258 4.8 107.591 4.8C105.991 4.8 104.458 5.3 102.991 6.3C101.525 7.3 100.225 8.76666 99.0914 10.7C97.9914 12.6 97.1581 14.9333 96.5914 17.7H96.9414C97.7747 16.4333 98.9581 15.35 100.491 14.45C102.025 13.55 103.908 13.1 106.141 13.1C107.975 13.1 109.641 13.5333 111.141 14.4C112.641 15.2333 113.825 16.4167 114.691 17.95C115.591 19.45 116.041 21.2167 116.041 23.25C116.041 25.75 115.458 27.9833 114.291 29.95C113.158 31.8833 111.608 33.4167 109.641 34.55C107.708 35.65 105.541 36.2 103.141 36.2ZM102.841 31.4C104.375 31.4 105.725 31.0667 106.891 30.4C108.058 29.7333 108.975 28.8167 109.641 27.65C110.341 26.4833 110.691 25.1833 110.691 23.75C110.691 22.0167 110.141 20.6 109.041 19.5C107.975 18.4 106.525 17.85 104.691 17.85C102.358 17.85 100.475 18.5667 99.0414 20C97.6414 21.4333 96.9414 23.2 96.9414 25.3C96.9414 27.0333 97.4914 28.4833 98.5914 29.65C99.6914 30.8167 101.108 31.4 102.841 31.4Z"
                fill="currentColor"
              />
            </svg>
            </span>
          </div>
          <div
            class="schedule-calendar-scroll"
            tabindex="0"
            role="region"
            aria-label="2026 年提交日历，可横向滚动"
            data-astro-cid-45h6wvi2=""
          >
            <div
              class="schedule-days"
              role="group"
              aria-label="每日提交日历，使用方向键浏览日期"
              data-astro-cid-45h6wvi2=""
            >
              <template v-for="cell in cells" :key="cell.date">
                <button
                  v-if="cell.commits"
                  type="button"
                  class="schedule-day"
                  :data-phases="cell.phases"
                  :data-date="cell.date"
                  :data-commits="cell.commits"
                  :tabindex="cell.date === firstActiveDate ? 0 : -1"
                  :aria-label="`${cell.date}，${cell.commits} 次提交`"
                  :style="{ gridColumn: cell.column, gridRow: cell.row }"
                  data-astro-cid-45h6wvi2=""
                />
                <span
                  v-else
                  class="schedule-day schedule-day--inactive"
                  aria-hidden="true"
                  :style="{ gridColumn: cell.column, gridRow: cell.row }"
                  data-astro-cid-45h6wvi2=""
                />
              </template>
            </div>
            <div class="schedule-months" aria-hidden="true" data-astro-cid-45h6wvi2="">
              <span
                v-for="month in months"
                :key="month.label"
                :style="{ gridColumn: month.column }"
                data-astro-cid-45h6wvi2=""
              >{{ month.label }}</span>
            </div>
          </div>
          <div id="schedule-day-tooltip" class="schedule-tooltip" role="tooltip" hidden data-astro-cid-45h6wvi2="">
            <time data-astro-cid-45h6wvi2="" />
            <div data-tooltip-phases data-astro-cid-45h6wvi2="" />
          </div>
        </div>
        <div class="schedule-notes" data-astro-cid-45h6wvi2="">
          <div
            v-for="note in RELEASE_PHASES"
            :id="`schedule-note-${note.phase}`"
            :key="note.phase"
            class="schedule-caption"
            tabindex="0"
            :data-phase="note.phase"
            data-astro-cid-45h6wvi2=""
          >
            <h3 data-astro-cid-45h6wvi2="">
              {{ note.title }}
            </h3>
            <time data-astro-cid-45h6wvi2="">{{ note.range }}</time>
            <p data-astro-cid-45h6wvi2="">
              {{ note.lines[0] }}<br data-astro-cid-45h6wvi2="">{{ note.lines[1] }}
            </p>
          </div>
        </div>
        <figure class="event-data-notes guide-wechat guide-repo" data-astro-cid-45h6wvi2="">
          <figcaption data-astro-cid-45h6wvi2="">源码与完整提交记录</figcaption>
          <div class="guide-wechat-content" data-astro-cid-45h6wvi2="">
            <!-- 仓库卡片 -->
            <a
              class="guide-repo-card inline-grid! grid-cols-[auto_auto]! items-center! gap-x-3! gap-y-1! rounded-xl! border! border-solid! border-[#3a4452]! bg-[#1a2029]! px-5! py-4! text-left! no-underline!
                [transition:border-color_0.18s_ease]! hover:border-[var(--payathon-accent,#86eaff)]! focus-visible:border-[var(--payathon-accent,#86eaff)]!"
              :href="repoUrl" target="_blank" rel="noopener noreferrer"
            >
              <svg class="guide-repo-mark row-span-2! block! size-8!" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                />
              </svg>
              <span class="guide-repo-name font-[ui-monospace,monospace]! text-[15px]! leading-[1.4]! font-medium!">{{ repoName }}</span>
              <span class="guide-repo-hint text-[13px]! leading-[1.4]! text-[#a4adbc]!">在 GitHub 上查看<span class="partner-sr-only">（在新标签页打开）</span> ↗</span>
            </a>
          </div>
        </figure>
      </div>
    </section>
  </section>
</template>

<style>
/* 日历提示里的提交数：由脚本生成，无法挂类名，保留在样式里 */
#payathon-page [data-tooltip-phases] > span[data-commit-count] {
  color: #a4adbc;
}
</style>
