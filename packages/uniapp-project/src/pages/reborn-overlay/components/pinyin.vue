<script lang="ts" setup>
import { pinyin } from 'pinyin-pro'
import { computed, ref } from 'vue'

// ====== 文案（中文）======
const title = ref('《短歌行》')
const author = ref('曹操')
const preface = ref('东汉末年杰出的政治家、军事家、文学家、书法家，三国中曹魏政权的奠基人。')

const lines = ref([
  '对酒当歌，人生几何！',
  '譬如朝露，去日苦多。',
  '慨当以慷，忧思难忘。',
  '何以解忧？唯有杜康。',
  '青青子衿，悠悠我心。',
  '但为君故，沉吟至今。',
  '呦呦鹿鸣，食野之苹。',
  '我有嘉宾，鼓瑟吹笙。',
  '明明如月，何时可掇？',
  '忧从中来，不可断绝。',
  '越陌度阡，枉用相存。',
  '契阔谈讌，心念旧恩。',
  '月明星稀，乌鹊南飞。',
  '绕树三匝，何枝可依？',
  '山不厌高，海不厌深。',
  '周公吐哺，天下归心。',
])

// ====== 基础拼音逻辑（逐字）======
function isHan(ch: string) {
  return /[\u4E00-\u9FFF]/.test(ch)
}

function textToTokens(text: string) {
  return Array.from(text).map(ch => ({
    ch,
    py: isHan(ch)
      ? pinyin(ch, { toneType: 'symbol', type: 'string' }).replace(/\s+/g, '') // 去除多余空格
      : '',
  }))
}

const titleTokens = computed(() => textToTokens(title.value))
const authorTokens = computed(() => textToTokens(author.value))
// 序言也可以逐字，或者保持整段。为了统一风格，这里也用逐字但紧凑排列
const prefaceTokens = computed(() => textToTokens(preface.value))

const linesTokens = computed(() =>
  lines.value.map(line => textToTokens(line)),
)
</script>

<template>
  <view>
    <!-- 标题（居中，加大） -->
    <view class="flex flex-wrap justify-center gap-x-1">
      <view v-for="(t, j) in titleTokens" :key="j" class="
          flex flex-col items-center
        ">
        <view class="h-[18px] text-[12px] font-normal text-gray-400">
          {{ t.py }}
        </view>
        <view class="
            text-[22px] font-bold leading-none text-gray-800
            dark:text-gray-1
          ">
          {{ t.ch }}
        </view>
      </view>
    </view>

    <!-- 作者（居中，略小） -->
    <view class="mt-4 flex flex-wrap justify-center gap-x-1">
      <view v-for="(t, j) in authorTokens" :key="j" class="
          flex flex-col items-center
        ">
        <view class="
            h-[14px] text-[10px] text-gray-400
            dark:text-gray-1
          ">
          {{ t.py }}
        </view>
        <view class="
            text-[14px] font-medium leading-none text-gray-500
            dark:text-gray-1
          ">
          {{ t.ch }}
        </view>
      </view>
    </view>

    <!-- 序（左对齐，但带缩进风格） -->
    <view class="mt-4 flex flex-wrap gap-x-0.5 px-4">
      <view v-for="(t, j) in prefaceTokens" :key="j" class="
          flex flex-col items-center
        ">
        <view class="
            h-[14px] text-[10px] text-gray-400
            dark:text-gray-1
          ">
          {{ t.py }}
        </view>
        <view class="
            text-[12px] leading-tight text-gray-500
            dark:text-gray-1
          ">
          {{ t.ch }}
        </view>
      </view>
    </view>

    <!-- 正文（居中或左对齐，这里采用诗歌常见居中/Padding布局） -->
    <view class="mt-6 flex flex-col items-center gap-y-2">
      <view v-for="(lineTokens, i) in linesTokens" :key="i" class="
          flex flex-wrap justify-center gap-x-0.5
        ">
        <view v-for="(t, j) in lineTokens" :key="j" class="
            flex w-5 flex-col items-center
          ">
          <!-- 拼音 -->
          <view class="
              h-[16px] overflow-visible whitespace-nowrap text-[11px]
              text-gray-400
              dark:text-gray-3
            ">
            {{ t.py }}
          </view>
          <!-- 汉字 -->
          <view class="
              font-serif text-224 leading-none text-gray-700
              dark:text-gray-2
            ">
            {{ t.ch }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
