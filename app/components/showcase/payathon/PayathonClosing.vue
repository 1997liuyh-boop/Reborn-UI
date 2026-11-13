<script setup lang="ts">
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";

/**
 * 收尾：一句话加「马上开始」按钮，按钮进入入门指南。
 * data-astro-cid-* 是这套视觉模板样式的作用域属性，保留以命中对应规则。
 */
</script>

<template>
  <section class="event-section" aria-labelledby="join-title" data-astro-cid-45h6wvi2="">
    <div id="join" class="event-closing" aria-labelledby="join-title" data-astro-cid-45h6wvi2="">
      <div data-astro-cid-45h6wvi2="">
        <div data-astro-cid-45h6wvi2="">
          <div data-astro-cid-45h6wvi2="">
            <p class="event-english-title" data-astro-cid-45h6wvi2="">
              <PayathonWord text="YOUR NEXT BUILD" :size="3" />
            </p>
            <h3 id="join-title" data-astro-cid-45h6wvi2="">下一个界面，从这里开始。</h3>
          </div>
          <div data-astro-cid-45h6wvi2="">
            <!--
              首页复刻样式里有 all: revert，首页的工具类都要带 ! 才生效
              链接会被区块染成强调色，这里改回深色
            -->
            <NuxtLink class="payathon-button payathon-button--link text-[#10141b]! no-underline!" to="/getting-started" data-astro-cid-dmurru2v="">
              马上开始
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

