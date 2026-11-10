<script setup lang="ts">
/**
 * 区块英文小标题（WHY REBORN、COMPONENTS……）：用 PayathonSprite 里的字母符号拼出任意单词。
 *
 * 字形是宽体几何字，没有对应的网页字体，所以每个字母都是 <symbol>，这里按字宽排版成每词一个 <svg>。
 * 字母间距 3、词间距交给样式的 gap；svg 宽度按「viewBox 宽 ÷ 字高 36.6」换算成 em，随 font-size 缩放。
 * data-astro-cid-wq7h7znm 是原样式的作用域属性，保留以命中尺寸与对齐规则。
 */
interface Props {
  /** 大写英文，空格分词；只支持 A–Z，其他字符会被忽略 */
  text: string;
  /** 尺寸档位：2 为区块主标题（大），3 为副标题（小） */
  size?: 2 | 3;
}

const props = withDefaults(defineProps<Props>(), { size: 3 });

/** 字母符号的 viewBox 宽度；未列出的都是 62 */
const LETTER_WIDTH: Partial<Record<string, number>> = { C: 61.95, G: 61.95, J: 61.5, P: 61.498, W: 95.45, Z: 62.5 };
/** 字形高度（所有字母一致） */
const GLYPH_HEIGHT = 36.6;
/** 同一单词内相邻字母的间距 */
const LETTER_GAP = 3;

interface WordLayout {
  key: string;
  width: number;
  letters: Array<{ char: string; x: number; width: number }>;
}

const words = computed<WordLayout[]>(() =>
  props.text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      let x = 0;
      const letters = [...word]
        .filter((char) => /[A-Z]/.test(char))
        .map((char) => {
          const width = LETTER_WIDTH[char] ?? 62;
          const letter = { char, x, width };
          x += width + LETTER_GAP;
          return letter;
        });
      return { key: `${index}-${word}`, width: Math.max(0, x - LETTER_GAP), letters };
    })
    .filter((word) => word.letters.length > 0),
);
</script>

<template>
  <span
    class="english-heading"
    :class="`english-heading--${size}`"
    role="img"
    :aria-label="text"
    data-astro-cid-wq7h7znm
  >
    <svg
      v-for="word in words"
      :key="word.key"
      aria-hidden="true"
      focusable="false"
      :viewBox="`0 0 ${word.width} ${GLYPH_HEIGHT}`"
      :style="{ width: `${word.width / GLYPH_HEIGHT}em` }"
      data-astro-cid-wq7h7znm
    >
      <use
        v-for="letter in word.letters"
        :key="letter.x"
        :href="`#payathon-letter-${letter.char}`"
        :x="letter.x"
        :width="letter.width"
        :height="GLYPH_HEIGHT"
        data-astro-cid-wq7h7znm
      />
    </svg>
  </span>
</template>
