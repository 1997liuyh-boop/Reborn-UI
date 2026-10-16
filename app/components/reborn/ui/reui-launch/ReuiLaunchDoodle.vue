<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { launchDoodleLayout, launchScreenClasses } from "./reui-launch.config";

interface Props {
  /** 外侧文字：有空格时在首个空格处分组，否则按字素平分到电脑两侧。 */
  text?: string;
  /** 电脑屏幕文字，支持中文与英文。 */
  screenText?: string;
  /** 屏幕效果：CRT 扫描、文字闪烁、终端打字或静态显示。 */
  screenEffect?: "crt" | "blink" | "typewriter" | "none";
  /** 固定展示展开状态，供预览页核对细节。 */
  expanded?: boolean;
  /** 裁去上下留白，适合标题位置。 */
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), { text: "REUI", screenText: "RE", screenEffect: "crt", expanded: false, compact: false });
const stage = ref<HTMLButtonElement>();
const hovering = ref(false);
const pinned = ref(false);
const visible = ref(true);
const pageVisible = ref(true);
const isExpanded = computed(() => props.expanded || hovering.value || pinned.value);
const isAnimating = computed(() => isExpanded.value && visible.value && pageVisible.value);
// 屏幕在收起时也播放；离屏与后台只暂停时间线，返回时接着播放。
const screenPlaybackClass = computed(() => visible.value && pageVisible.value ? "" : "[animation-play-state:paused]!");
const screenId = `reui-screen-${useId()}`;
const scanId = `reui-scan-${useId()}`;
const targetId = `reui-target-${useId()}`;
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** 按完整字素计算字宽，避免中文、表情或组合字符被拆开。 */
function fitText(value: string, maxSize: number, maxWidth: number) {
  const glyphs = Array.from(segmenter.segment(value), ({ segment }) => segment);
  const units = glyphs.reduce((width, glyph) => width + (/^[\x20-\x7E]$/.test(glyph) ? 0.72 : 1), 0);
  const fontSize = Math.min(maxSize, maxWidth / Math.max(units, 1));
  return { value, fontSize, width: units * fontSize };
}

/** 有空格的品牌名按词分组，连续文字按字素居中拆分。 */
const wordmark = computed(() => {
  const words = props.text.trim().split(/\s+/u);
  const glyphs = Array.from(segmenter.segment(props.text.trim()), ({ segment }) => segment);
  const middle = Math.ceil(glyphs.length / 2);
  const sides = words.length > 1
    ? [words[0]!, words.slice(1).join(" ")]
    : [glyphs.slice(0, middle).join(""), glyphs.slice(middle).join("")];
  const fitted = sides.map(value => fitText(value, launchDoodleLayout.wordmarkFontSize, launchDoodleLayout.wordmarkWidth));
  // 两侧共用较小字号，长短词组合也保持字高一致。
  const fontSize = Math.min(...fitted.map(side => side.fontSize));
  return sides.map(value => fitText(value, fontSize, launchDoodleLayout.wordmarkWidth));
});
const screenLabel = computed(() => fitText(props.screenText, launchDoodleLayout.screenFontSize, launchDoodleLayout.screenWidth));

/** 每个字素保留完整字形与固定位置，打字时不会拆开中文、表情或让文字左右跳动。 */
const screenCharacters = computed(() => {
  const glyphs = Array.from(segmenter.segment(props.screenText), ({ segment }) => segment);
  const interval = Math.min(180, 1200 / Math.max(glyphs.length, 1));
  let x = 434 - screenLabel.value.width / 2;
  return glyphs.map((value, index) => {
    const width = fitText(value, screenLabel.value.fontSize, launchDoodleLayout.screenWidth).width;
    const character = { value, x, width, delay: `${index * interval}ms` };
    x += width;
    return character;
  });
});

// 用像素点绘制屏幕文字，缩到卡片尺寸后仍保留终端字形。
const letters = [
  ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
];
const pixels = letters.map((letter, letterIndex) =>
  letter.flatMap((row, y) =>
    [...row].flatMap((pixel, x) =>
      pixel === "1" ? [{ x: 399 + letterIndex * 34 + x * 5, y: 192 + y * 5 }] : [],
    ),
  ),
);
const codeLines = [26, 45, 17, 35, 20, 31, 12];
let observer: IntersectionObserver | undefined;

function enter(event: PointerEvent) {
  if (
    event.pointerType === "mouse" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    hovering.value = true;
  }
}

function reset() {
  pinned.value = false;
  hovering.value = false;
}

function syncVisibility() {
  pageVisible.value = document.visibilityState === "visible";
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible.value = !!entry?.isIntersecting;
  });
  if (stage.value) observer.observe(stage.value);
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  document.removeEventListener("visibilitychange", syncVisibility);
});
</script>

<template>
  <button
    ref="stage"
    type="button"
    :aria-label="`${text || '复古电脑'} 动画：点击固定或取消固定，移出后收起`"
    :aria-pressed="isExpanded"
    :data-expanded="isExpanded"
    :data-screen-effect="screenEffect"
    class="relative block w-full cursor-pointer overflow-hidden rounded-2xl bg-[#131412] text-left text-[#d9dccf] outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-4 focus-visible:ring-offset-[#181916]"
    :class="compact ? 'aspect-[164/57]' : 'aspect-[82/47]'"
    @pointerenter="enter"
    @pointerleave="hovering = false"
    @pointercancel="hovering = false"
    @click="pinned = !pinned"
    @keydown.esc="reset"
    @blur="reset"
  >
    <svg
      :viewBox="compact ? launchDoodleLayout.compactViewBox : launchDoodleLayout.viewBox"
      class="block size-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient :id="scanId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9cf6ef" stop-opacity="0" />
          <stop offset="0.65" stop-color="#9cf6ef" stop-opacity="0.16" />
          <stop offset="1" stop-color="#9cf6ef" stop-opacity="0" />
        </linearGradient>
        <clipPath :id="screenId">
          <rect
            x="386"
            y="165"
            width="96"
            height="80"
            rx="7"
          />
        </clipPath>
        <clipPath :id="targetId">
          <rect
            x="413"
            y="79"
            width="158"
            height="158"
            rx="10"
          />
        </clipPath>
      </defs>

      <!-- 默认字标保留矢量轮廓；自定义文字按可用宽度缩放，防止遮住电脑。 -->
      <g
        fill="currentColor"
        class="origin-[410px_255px] transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-opacity"
        :class="
          isExpanded ? 'translate-y-1 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100'
        "
      >
        <template v-if="text === 'REUI'">
          <path
            fill-rule="evenodd"
            d="M105 202h48c27 0 42 12 42 32 0 14-7 24-20 29l28 37h-33l-24-33h-12v33h-29Zm29 24v20h17c10 0 15-3 15-10s-5-10-15-10Z"
          />
          <path d="M216 202h73v25h-44v12h40v24h-40v12h45v25h-74Z" />
          <path
            d="M526 202h29v58c0 12 5 18 16 18s16-6 16-18v-58h29v59c0 28-17 41-45 41s-45-13-45-41Z"
          />
          <path d="M645 202h29v98h-29Z" />
        </template>
        <template v-else>
          <text
            v-for="(side, index) in wordmark"
            :key="index"
            :x="index === 0 ? 292 : 526"
            y="300"
            :text-anchor="index === 0 ? 'end' : 'start'"
            :font-size="side.fontSize"
            :textLength="side.width || undefined"
            lengthAdjust="spacingAndGlyphs"
            class="font-['Arial_Black',Arial,sans-serif] font-black"
          >{{ side.value }}</text>
        </template>
      </g>

      <!-- 投影光束随内容展开，起点与缩小后的电脑屏幕对齐。 -->
      <g
        class="origin-[165px_246px] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-opacity"
        :class="isExpanded ? 'scale-100 opacity-100 delay-100' : 'scale-95 opacity-0 delay-0'"
      >
        <path
          d="m165 246 251-168 153 2v185Z"
          fill="#bc8412"
        />
        <path
          d="m165 246 403-83 135 2v101H570Z"
          fill="#cd5932"
        />
        <path
          d="m165 246 221-56 157 3v111H389Z"
          fill="#409a8c"
        />
        <path
          d="m165 246 107-123 168 2v107Z"
          fill="#557ed2"
        />
      </g>

      <!-- 复古 CRT：机箱、屏幕、主机和右侧键盘保持原卡片的低细节比例。 -->
      <g
        class="origin-top-left transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
        :class="
          isExpanded
            ? '[transform:translate(-13px,155px)_scale(0.43)]'
            : '[transform:translate(0px,0px)_scale(1)]'
        "
      >
        <rect
          x="312"
          y="179"
          width="44"
          height="75"
          rx="12"
          fill="#77776d"
        />
        <path
          d="M346 150h130v116H346c-8 0-13-5-13-13v-90c0-8 5-13 13-13Z"
          fill="#99978c"
        />
        <rect
          x="366"
          y="150"
          width="132"
          height="116"
          rx="8"
          fill="#c6c6b8"
        />
        <rect
          x="379"
          y="160"
          width="106"
          height="89"
          rx="8"
          fill="#8b8f80"
        />
        <rect
          x="386"
          y="165"
          width="96"
          height="80"
          rx="7"
          fill="#071713"
        />
        <g :clip-path="`url(#${screenId})`">
          <path
            d="M388 167h92v2h-92Z"
            fill="#020a08"
          />
          <g
            fill="#00bfd3"
            opacity="0.72"
          >
            <rect
              v-for="(width, index) in codeLines"
              :key="index"
              x="396"
              :y="174 + index * 2"
              :width="width"
              height="0.8"
            />
            <rect
              x="397"
              y="233"
              width="36"
              height="1"
            />
            <rect
              x="397"
              y="237"
              width="21"
              height="1"
            />
            <rect
              x="444"
              y="231"
              width="25"
              height="1"
            />
            <rect
              x="451"
              y="235"
              width="18"
              height="1"
            />
          </g>
          <!-- 字素各占固定位置；系统减少动态效果时自动显示完整静态文字。 -->
          <g
            :key="`${screenEffect}:${screenText}`"
            fill="#22d3df"
            :class="[launchScreenClasses[screenEffect], screenPlaybackClass]"
          >
            <template v-if="screenText === 'RE'">
              <g
                v-for="(letter, index) in pixels"
                :key="index"
                :class="[screenEffect === 'typewriter' ? launchScreenClasses.character : '', screenPlaybackClass]"
                :style="{ '--reui-char-delay': screenCharacters[index]?.delay }"
              >
                <rect
                  v-for="(pixel, pixelIndex) in letter"
                  :key="pixelIndex"
                  :x="pixel.x"
                  :y="pixel.y"
                  width="4"
                  height="3.3"
                />
              </g>
            </template>
            <template v-else>
              <text
                v-for="(character, index) in screenCharacters"
                :key="index"
                :x="character.x"
                y="211"
                dominant-baseline="central"
                :font-size="screenLabel.fontSize"
                :textLength="character.width || undefined"
                lengthAdjust="spacingAndGlyphs"
                class="font-mono font-bold"
                :class="[screenEffect === 'typewriter' ? launchScreenClasses.character : '', screenPlaybackClass]"
                :style="{ '--reui-char-delay': character.delay }"
              >{{ character.value }}</text>
            </template>
          </g>
          <rect
            v-if="screenEffect !== 'none' && screenText"
            x="421"
            y="236"
            width="5"
            height="2"
            fill="#22d3df"
            :class="[launchScreenClasses.cursor, screenPlaybackClass]"
          />
          <path
            v-for="line in 26"
            :key="line"
            :d="`M386 ${165 + line * 3}h96`"
            stroke="#061a15"
            stroke-width="0.7"
            opacity="0.45"
          />
          <path
            d="M391 169h31l-31 30Z"
            fill="#aaf2ed"
            opacity="0.04"
          />
          <rect
            v-if="screenEffect === 'crt'"
            x="386"
            y="165"
            width="96"
            height="14"
            :fill="`url(#${scanId})`"
            :class="[launchScreenClasses.scan, screenPlaybackClass]"
          />
        </g>
        <rect
          x="465"
          y="254"
          width="5"
          height="3"
          rx="1"
          fill="#888e7c"
        />
        <circle
          cx="478"
          cy="255.5"
          r="2"
          fill="#00afbe"
        />
        <rect
          x="370"
          y="266"
          width="112"
          height="5"
          fill="#77796c"
        />
        <rect
          x="302"
          y="270"
          width="211"
          height="38"
          rx="3"
          fill="#aaa99b"
        />
        <path
          d="M302 294h211v14H302Z"
          fill="#98998c"
        />
        <path
          d="M302 270h68v38h-68Z"
          fill="#828478"
        />
        <path
          d="M312 277h31m-31 5h31m-31 5h31"
          stroke="#61665b"
          stroke-width="2"
        />
        <path
          d="M385 283h41"
          stroke="#40483f"
          stroke-width="4"
        />
        <path
          d="M386 301h39v7h-39Z"
          fill="#5f6559"
        />
        <rect
          x="425"
          y="298"
          width="111"
          height="10"
          rx="1"
          fill="#d2d1c2"
        />
        <path
          d="M536 298h11v10h-11Zm20-2h17v12h-17Z"
          fill="#aaa99c"
        />
        <path
          d="M547 300h9v8h-9Z"
          fill="#71776a"
        />
      </g>

      <!-- 靶心、图表、手柄与时钟按层次展开，收起时回到光束起点。 -->
      <g
        class="origin-[165px_246px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity"
        :class="isExpanded ? 'scale-100 opacity-100 delay-75' : 'scale-75 opacity-0 delay-0'"
      >
        <rect
          x="413"
          y="79"
          width="158"
          height="158"
          rx="10"
          fill="#ffb31b"
        />
        <path
          d="M413 183h158v44a10 10 0 0 1-10 10H423a10 10 0 0 1-10-10Z"
          fill="#ff9c12"
        />
        <g :clip-path="`url(#${targetId})`">
          <circle
            cx="520"
            cy="119"
            r="70"
            fill="#fff0b4"
          />
          <circle
            cx="520"
            cy="119"
            r="56"
            fill="#ffb21a"
          />
          <circle
            cx="520"
            cy="119"
            r="43"
            fill="#fff0b4"
          />
          <circle
            cx="520"
            cy="119"
            r="30"
            fill="#00a399"
          />
          <circle
            cx="520"
            cy="119"
            r="19"
            fill="#ff9d12"
          />
          <circle
            cx="520"
            cy="119"
            r="7"
            fill="#008b88"
          />
        </g>
        <path
          d="m428 79 92 40"
          stroke="#cc590b"
          stroke-width="6"
          stroke-linecap="round"
        />
        <path
          d="m429 79-6-13 20 9 5 12-16-2-12-8Z"
          fill="#ed6b00"
        />
        <path
          d="m515 113 9 7-11 1"
          fill="none"
          stroke="#cc590b"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <g
        class="origin-[165px_246px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity"
        :class="isExpanded ? 'scale-100 opacity-100 delay-150' : 'scale-75 opacity-0 delay-0'"
      >
        <rect
          x="563"
          y="149"
          width="143"
          height="116"
          rx="9"
          fill="#ec6937"
        />
        <path
          d="m562 211 91-14 15 68h-94Z"
          fill="#0e9d9e"
        />
        <rect
          x="582"
          y="184"
          width="95"
          height="72"
          rx="4"
          fill="#ff970e"
          transform="rotate(-9 582 184)"
        />
        <rect
          x="599"
          y="162"
          width="95"
          height="72"
          rx="4"
          fill="#fff0b9"
        />
        <path
          d="M641 181a19 19 0 1 0 12 17h-19v-19Z"
          fill="#f48409"
        />
        <path
          d="M636 176v19h19a19 19 0 0 0-19-19Z"
          fill="#0da7a4"
        />
        <rect
          x="658"
          y="181"
          width="26"
          height="7"
          rx="2"
          fill="#ffb528"
        />
        <rect
          x="658"
          y="193"
          width="26"
          height="7"
          rx="2"
          fill="#ffb528"
        />
        <path
          d="m671 209 17 10-8 2-4 8Z"
          fill="#10a4a1"
        />
      </g>

      <g
        class="origin-[165px_246px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity"
        :class="isExpanded ? 'scale-100 opacity-100 delay-100' : 'scale-75 opacity-0 delay-0'"
      >
        <rect
          x="271"
          y="119"
          width="169"
          height="116"
          rx="13"
          fill="#739be3"
        />
        <path
          d="m315 157-21 66c-7 26 4 35 21 20l23-23h54l17 15c18 17 30 9 25-12l-15-67Z"
          fill="#4168bd"
        />
        <path
          d="M335 147h54c26 0 47 14 48 36s-16 39-38 39h-64c-23 0-39-15-39-36s16-39 39-39Z"
          fill="#b2d1f4"
        />
        <path
          d="M341 148c0-6-8-8-16-5l-11 5m93 0c0-6 8-8 16-5l5 5"
          fill="none"
          stroke="#456bc2"
          stroke-width="7"
          stroke-linecap="round"
        />
        <circle
          cx="325"
          cy="177"
          r="18"
          fill="#e1e9da"
        />
        <path
          d="M325 166v22m-11-11h22"
          stroke="#7295dc"
          stroke-width="8"
          stroke-linecap="round"
        />
        <circle
          cx="355"
          cy="207"
          r="12"
          fill="#4067ba"
        />
        <circle
          cx="393"
          cy="207"
          r="12"
          fill="#729ae3"
        />
        <circle
          cx="420"
          cy="178"
          r="18"
          fill="#e7eddb"
        />
        <circle
          cx="420"
          cy="167"
          r="5"
          fill="#75a0df"
        />
        <circle
          cx="430"
          cy="178"
          r="5"
          fill="#f5bd38"
        />
        <circle
          cx="420"
          cy="188"
          r="5"
          fill="#7c9ed8"
        />
        <circle
          cx="410"
          cy="178"
          r="5"
          fill="#7ba8df"
        />
        <rect
          x="365"
          y="183"
          width="18"
          height="7"
          rx="3.5"
          fill="#f1f0ce"
        />
      </g>

      <g
        class="origin-[165px_246px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity"
        :class="isExpanded ? 'scale-100 opacity-100 delay-200' : 'scale-75 opacity-0 delay-0'"
      >
        <rect
          x="386"
          y="190"
          width="158"
          height="115"
          rx="10"
          fill="#6cc6c5"
        />
        <path
          d="m421 213 16-14c9-6 20-1 19 8l-25 22Z"
          fill="#009bb1"
        />
        <path
          d="m498 204 16-9c10-4 19 3 19 13l-12 17Z"
          fill="#009bb1"
        />
        <path
          d="m438 293-7 11m67-11 8 11"
          stroke="#0093aa"
          stroke-width="7"
          stroke-linecap="round"
        />
        <path
          d="M472 191h14m-7 0v15"
          stroke="#008aa3"
          stroke-width="7"
          stroke-linecap="round"
        />
        <circle
          cx="479"
          cy="257"
          r="49"
          fill="#009bb0"
        />
        <circle
          cx="479"
          cy="257"
          r="37"
          fill="#f5edb4"
        />
        <path
          d="M479 224v5m-33 28h5m28 28v5m28-33h5"
          stroke="#e2d78f"
          stroke-width="2"
        />
        <g
          class="origin-[479px_257px] motion-safe:animate-[spin_12s_linear_infinite]"
          :class="isAnimating ? '' : '[animation-play-state:paused]!'"
        >
          <path
            d="M479 257v-28"
            stroke="#0a8e96"
            stroke-width="3"
            stroke-linecap="round"
          />
        </g>
        <path
          d="m479 257-16 20"
          stroke="#ff9718"
          stroke-width="6"
          stroke-linecap="round"
        />
        <circle
          cx="479"
          cy="257"
          r="4"
          fill="#008f9d"
        />
      </g>
    </svg>
  </button>
</template>

<style>
/* 仅声明关键帧；样式与动效开关由 config 中的 Tailwind 工具类负责。 */
@keyframes reui-launch-flicker {
  0%, 36%, 44%, 100% { opacity: 1; }
  38%, 42% { opacity: 0.78; }
  40% { opacity: 0.9; }
  72% { opacity: 0.92; }
}

@keyframes reui-launch-blink {
  0%, 64%, 100% { opacity: 1; }
  65%, 85% { opacity: 0.24; }
}

@keyframes reui-launch-type {
  0%, 61%, 100% { opacity: 0; }
  1%, 60% { opacity: 1; }
}

@keyframes reui-launch-cursor {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes reui-launch-scan {
  from { transform: translateY(-14px); }
  to { transform: translateY(80px); }
}
</style>
