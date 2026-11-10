<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";
import { mountCriteriaCreatures } from "~/lib/payathon/criteria-creature";

/**
 * 设计原则与使用约定：每条原则上方是一只由 0 / 1 / ▪ 等字符拼成、会走动的小生物（乌龟、螃蟹……）。
 * 四条原则各有仓库里的依据：platform 字段与两端 API 表、组件导出的 Props 接口、
 * content/1.getting-started 的主题变量与动效规范、.github/workflows/kb-check.yml 的 ui 键位检查。
 * data-astro-cid-* 是这套视觉模板样式的作用域属性，保留以命中对应规则；生物由 criteria-creature 模块驱动。
 */

const rootRef = useTemplateRef<HTMLElement>("root");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const root = rootRef.value;
  if (!root) return;
  cleanups.push(mountCriteriaCreatures(root));
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});
</script>

<template>
  <section id="selection" ref="root" class="event-section" aria-labelledby="selection-title" data-astro-cid-45h6wvi2="">
    <div data-astro-cid-45h6wvi2="">
      <header class="event-section-head" data-astro-cid-45h6wvi2="">
        <p class="event-english-title" data-astro-cid-45h6wvi2="">
          <PayathonWord text="PRINCIPLES" :size="2" />
        </p>
        <h2 id="selection-title" data-astro-cid-45h6wvi2="">这四条，写在每个组件里</h2>
        <p data-astro-cid-45h6wvi2="">每一条都能在组件源码、文档或 CI 检查里找到对应的约定。</p>
      </header>
      <div class="criteria-grid" data-astro-cid-45h6wvi2="">
        <article data-astro-cid-45h6wvi2="">
          <svg
            class="criteria-creature"
            data-species="turtle"
            viewBox="0 0 336 224"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g class="creature-body">
              <g class="creature-contour">
                <path class d="M145 53 C130 20 143 10 160 10 C179 10 189 27 175 53" />
                <path class="fin-left" d="M119 72 C89 46 69 51 54 77 C72 78 82 94 105 99" />
                <path class="fin-right" d="M201 72 C231 46 251 51 266 77 C248 78 238 94 215 99" />
                <path class="rear-left" d="M111 155 C79 157 75 181 79 195 C99 189 112 185 126 174" />
                <path class="rear-right" d="M209 155 C241 157 245 181 241 195 C221 189 208 185 194 174" />
                <path class="turtle-tail" d="M151 186 L160 208 L169 186" />
                <path
                  class
                  d="M160 48 C123 48 104 83 105 125 C106 164 127 188 160 188 C193 188 214 164 215 125 C216 83 197 48 160 48 Z"
                />
              </g>
              <g class="creature-detail">
                <path class d="M146 72 L174 72 L187 96 L173 121 L147 121 L133 96 Z" />
                <path class d="M147 121 L133 145 L147 168 L173 168 L187 145 L173 121" />
                <path class d="M133 96 L113 91 M187 96 L207 91 M133 145 L112 151 M187 145 L208 151" />
              </g>
              <g class="creature-code">
                <text class x="155" y="95">01</text>
                <text class x="157" y="148">10</text>
                <text class x="124" y="120">:</text>
                <text class x="193" y="121">:</text>
                <text class x="154" y="31">·</text>
                <text class x="168" y="31">·</text>
                <text class x="160" y="60">■</text>
              </g>
            </g>
          </svg>
          <h3 data-astro-cid-45h6wvi2="">跨端一致</h3>
          <p data-astro-cid-45h6wvi2="">双端组件同名同构，文档标明两端通用的参数。</p>
        </article>
        <article data-astro-cid-45h6wvi2="">
          <svg
            class="criteria-creature"
            data-species="crab"
            viewBox="0 0 336 224"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g class="creature-body">
              <g class="creature-contour">
                <path
                  class
                  d="M108 99 Q111 79 135 76 L149 80 L160 77 L172 80 L186 76 Q210 80 214 99 L207 125 Q185 143 160 143 Q134 143 112 125 Z"
                />
                <path class="crab-leg-0" d="M111 99 L77.44988231802992 85.02181687321419 L49 117" />
                <path class="crab-leg-1" d="M113 110 L71.00000000000001 113.99999999999999 L45 150" />
                <path class="crab-leg-2" d="M115 121 L65.27847882880032 121.87768583328058 L41 161" />
                <path class="crab-leg-3" d="M117 132 L62.99999999999999 153.99999999999997 L37 194" />
                <path class="crab-leg-4" d="M209 99 L245 94 L271 128" />
                <path class="crab-leg-5" d="M207 110 L248.64772277126696 103.25706384668437 L275 139" />
                <path class="crab-leg-6" d="M205 121 L253 133.99999999999997 L279 172" />
                <path class="crab-leg-7" d="M203 132 L260.6322878608567 140.86111708100913 L283 183" />
                <path
                  class="crab-claw-left"
                  d="M116 96 L92 79 L78 67 Q54 68 48 50 L45 29 Q62 29 72 46 L76 22 Q96 33 94 50 L87 64 L102 73 L121 85 Z"
                />
                <path
                  class="crab-claw-right"
                  d="M204 96 L228 79 L242 67 Q266 68 272 50 L275 29 Q258 29 248 46 L244 22 Q224 33 226 50 L233 64 L218 73 L199 85 Z"
                />
                <path class d="M140 79 L136 60 L142 59 L147 80" />
                <path class d="M174 80 L179 59 L185 60 L181 79" />
              </g>
              <g class="creature-detail">
                <path class d="M128 102 Q160 92 195 102" />
                <path class d="M140 122 Q160 129 180 122" />
              </g>
              <g class="creature-code">
                <text class x="138" y="56">·</text>
                <text class x="183" y="56">·</text>
                <text class x="148" y="108">0</text>
                <text class x="176" y="113">1</text>
                <text class x="160" y="86">■</text>
              </g>
            </g>
          </svg>
          <h3 data-astro-cid-45h6wvi2="">类型完备</h3>
          <p data-astro-cid-45h6wvi2="">Props 以 TypeScript 接口声明，并随组件导出。</p>
        </article>
        <article data-astro-cid-45h6wvi2="">
          <svg
            class="criteria-creature"
            data-species="pearl"
            viewBox="0 0 336 224"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g class="creature-body">
              <g class="creature-contour">
                <path
                  class="shell-lid"
                  d="M157 157 C110 153 68 119 62 77 C68 59 81 51 96 56 C108 31 128 31 141 43 C153 24 171 24 182 43 C200 31 216 39 225 57 C244 49 258 64 259 79 C252 124 212 154 165 157"
                />
                <path class d="M65 155 Q160 123 255 155 C239 192 203 210 160 210 C117 210 80 192 65 155 Z" />
                <path class d="M65 155 Q160 184 255 155" />
              </g>
              <g class="creature-detail">
                <path class="shell-lid" d="M92 75 Q106 111 137 141" />
                <path class="shell-lid" d="M121 60 Q128 99 149 133" />
                <path class="shell-lid" d="M160 54 L160 125" />
                <path class="shell-lid" d="M200 61 Q191 104 177 134" />
                <path class="shell-lid" d="M231 79 Q216 116 186 142" />
                <path class d="M92 174 Q160 211 228 174" />
              </g>
              <circle class="creature-contour pearl-float" cx="160" cy="148" r="24" />
              <g class="creature-code">
                <text class="shell-lid" x="118" y="89">1</text>
                <text class="shell-lid" x="207" y="100">0</text>
                <text class="shell-lid" x="91" y="107">:</text>
                <text class="shell-lid" x="222" y="122">+</text>
                <text class="pearl-float" x="147" y="146">0</text>
                <text class="pearl-float" x="161" y="144">1</text>
                <text class="pearl-float" x="169" y="155">0</text>
                <text class="pearl-float" x="155" y="158">■</text>
                <text class x="160" y="188">~</text>
              </g>
            </g>
          </svg>
          <h3 data-astro-cid-45h6wvi2="">变量驱动</h3>
          <p data-astro-cid-45h6wvi2="">颜色、圆角与动效取自主题变量，换主题只改变量。</p>
        </article>
        <article data-astro-cid-45h6wvi2="">
          <svg
            class="criteria-creature"
            data-species="dolphin"
            viewBox="0 0 336 224"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g class="creature-body">
              <g class="creature-contour">
                <path
                  class
                  d="M47 151 C73 109 106 84 145 77 C150 61 163 44 181 40 C177 53 178 64 185 77 C212 79 235 91 247 107 L276 114 Q281 120 273 124 L246 126 C224 147 199 153 178 150 C170 165 157 176 143 177 L151 147 C111 137 80 139 47 151 Z"
                />
                <path
                  class="dolphin-tail"
                  d="M47 151 C36 133 23 126 13 128 L26 151 L12 179 C31 177 40 165 47 151"
                />
              </g>
              <g class="creature-detail">
                <path class d="M77 133 Q149 100 211 112" />
                <path class d="M204 136 Q230 135 246 126" />
                <path class="echo-near" d="M280 86 Q297 111 287 139" />
                <path class="echo-far" d="M295 70 Q320 111 304 154" />
              </g>
              <g class="creature-code">
                <text class x="231" y="109">0</text>
                <text class x="132" y="112">01</text>
                <text class x="165" y="122">1</text>
                <text class x="104" y="121">+</text>
                <text class x="194" y="98">■</text>
                <text class x="70" y="141">~</text>
              </g>
            </g>
          </svg>
          <h3 data-astro-cid-45h6wvi2="">文档对齐源码</h3>
          <p data-astro-cid-45h6wvi2="">CI 对照源码检查文档里的 ui 键位，不一致就报错。</p>
        </article>
      </div>
    </div>
    <section id="rules" class="event-subsection" aria-labelledby="rules-title" data-astro-cid-45h6wvi2="">
      <div data-astro-cid-45h6wvi2="">
        <div class="rules-layout" data-astro-cid-45h6wvi2="">
          <div data-astro-cid-45h6wvi2="">
            <p class="event-english-title" data-astro-cid-45h6wvi2="">
              <PayathonWord text="BEFORE YOU START" :size="3" />
            </p>
            <h2 id="rules-title" data-astro-cid-45h6wvi2="">开始前，先确认这几点</h2>
          </div>
          <ol data-astro-cid-45h6wvi2="">
            <li data-astro-cid-45h6wvi2="">
              <strong data-astro-cid-45h6wvi2=""> 先装好 Tailwind CSS。 </strong>
              组件样式基于 Tailwind CSS，Web 与 UniApp 项目各有对应的接入指南。
            </li>
            <li data-astro-cid-45h6wvi2="">
              <strong data-astro-cid-45h6wvi2=""> 源码归你维护。 </strong>
              add 把源码拷进项目后就是你的代码；目标目录已存在时 CLI 默认不覆盖，要更新须显式传 --overwrite。
            </li>
            <li data-astro-cid-45h6wvi2="">
              <strong data-astro-cid-45h6wvi2=""> 按端挑组件。 </strong>
              每个组件页都标注适用端：仅 Web、仅 UniApp 或双端通用，文档站顶栏的平台开关可以按端筛选组件。
            </li>
            <li data-astro-cid-45h6wvi2="">
              <strong data-astro-cid-45h6wvi2=""> UniApp 尺寸用 rpx。 </strong>
              UniApp 端的主题变量以 rpx 为单位，在不同屏幕密度下保持一致的显示尺寸。
            </li>
            <li data-astro-cid-45h6wvi2="">
              <strong data-astro-cid-45h6wvi2=""> 图标按需安装。 </strong>
              不少组件和示例用到 Iconify 图标；安装是可选的，安装指南推荐装上。
            </li>
          </ol>
        </div>
        <p data-astro-cid-45h6wvi2="">
          完整步骤见<NuxtLink class="rules-document-link" to="/getting-started/installation" data-astro-cid-45h6wvi2="">《安装指南》</NuxtLink>。
        </p>
      </div>
    </section>
  </section>
</template>
