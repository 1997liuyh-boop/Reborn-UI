<script setup lang="ts">
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";
import { EMPTY_HOME_CATALOG, HOME_CATALOG_KEY } from "~/lib/payathon/home-catalog";

/**
 * 为什么用 Reborn UI：三条理由，各自对应仓库里能找到的依据——
 * CLI 拷贝源码（packages/cli 的 add 命令）、双端同名同构（组件页 frontmatter 的 platform: both）、
 * 主题变量（content/1.getting-started 的配置页与动效规范）。
 * 双端组件数从首页注入的组件目录实时取，不写死。
 */

const catalog = inject(HOME_CATALOG_KEY, computed(() => EMPTY_HOME_CATALOG));
const bothCount = computed(() => catalog.value.platforms.both);
</script>

<template>
  <section id="value" class="event-section" aria-labelledby="value-title" data-astro-cid-45h6wvi2="">
    <div class="intro-layout" data-astro-cid-45h6wvi2="">
      <header class="event-section-head" data-astro-cid-45h6wvi2="">
        <p class="event-english-title" data-astro-cid-45h6wvi2="">
          <PayathonWord text="WHY REBORN" :size="2" />
        </p>
        <h2 id="value-title" data-astro-cid-45h6wvi2="">为什么用 Reborn UI？</h2>
      </header>
      <div class="benefit-grid" data-astro-cid-45h6wvi2="">
        <article data-astro-cid-45h6wvi2="">
          <h3 data-astro-cid-45h6wvi2="">源码进你的项目</h3>
          <p data-astro-cid-45h6wvi2="">CLI 把组件源码拷进项目，结构和样式直接改，不用等上游发版。</p>
        </article>
        <article data-astro-cid-45h6wvi2="">
          <h3 data-astro-cid-45h6wvi2="">一套写法，两端运行</h3>
          <p data-astro-cid-45h6wvi2="">
            {{ bothCount }} 个组件 Web 与 UniApp 双端通用、同名同构，换端不用换一套组件库。
          </p>
        </article>
        <article data-astro-cid-45h6wvi2="">
          <h3 data-astro-cid-45h6wvi2="">变量决定外观</h3>
          <p data-astro-cid-45h6wvi2="">颜色、字号、圆角与动效时长都是 CSS 主题变量，改变量就能换风格。</p>
        </article>
      </div>
    </div>
  </section>
</template>
