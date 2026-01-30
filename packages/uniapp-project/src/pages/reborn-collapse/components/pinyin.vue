<script lang="ts" setup>
import { ref, computed } from "vue";
import { pinyin } from "pinyin-pro";

// ====== 文案（中文）======
const title = ref("《春江花月夜》");
const author = ref("【唐】张若虚");
const preface = ref("曾任兖州兵曹。与贺知章、张旭、包融并称“吴中四士”。");

const lines = ref([
    '春江潮水连海平，',
    '海上明月共潮生。',
    '滟滟随波千万里，',
    '何处春江无月明。',
    '江流宛转绕芳甸，',
    '月照花林皆似霰。',
    '空里流霜不觉飞，',
    '汀上白沙看不见。',
    '江天一色无纤尘，',
    '皎皎空中孤月轮。',
    '江畔何人初见月？',
    '江月何年初照人？',
    '人生代代无穷已，',
    '江月年年望相似。',
    '不知江月待何人，',
    '但见长江送流水。',
    '白云一片去悠悠，',
    '青枫浦上不胜愁。',
    '谁家今夜扁舟子？',
    '何处相思明月楼？',
    '可怜楼上月裴回，',
    '应照离人妆镜台。',
    '玉户帘中卷不去，',
    '捣衣砧上拂还来。',
    '此时相望不相闻，',
    '愿逐月华流照君。',
    '鸿雁长飞光不度，',
    '鱼龙潜跃水成文。',
    '昨夜闲潭梦落花，',
    '可怜春半不还家。',
    '江水流春去欲尽，',
    '江潭落月复西斜。',
    '斜月沉沉藏海雾，',
    '碣石潇湘无限路。',
    '不知乘月几人归，',
    '落月摇情满江树。',
]);

// ====== 基础拼音逻辑（逐字）======
function isHan(ch: string) {
    return /[\u4e00-\u9fff]/.test(ch);
}

function textToTokens(text: string) {
    return Array.from(text).map((ch) => ({
        ch,
        py: isHan(ch)
            ? pinyin(ch, { toneType: "symbol", type: "string" }).replace(/\s+/g, "") // 去除多余空格
            : "",
    }));
}

const titleTokens = computed(() => textToTokens(title.value));
const authorTokens = computed(() => textToTokens(author.value));
// 序言也可以逐字，或者保持整段。为了统一风格，这里也用逐字但紧凑排列
const prefaceTokens = computed(() => textToTokens(preface.value));

const linesTokens = computed(() =>
    lines.value.map((line) => textToTokens(line))
);

</script>

<template>
    <view>
        <!-- 标题（居中，加大） -->
        <view class="flex flex-wrap justify-center gap-x-1">
            <view v-for="(t, j) in titleTokens" :key="j" class="flex flex-col items-center">
                <view class="h-[18px] text-[12px] text-gray-400 font-normal">
                    {{ t.py }}
                </view>
                <view class="text-[22px] font-bold text-gray-800 dark:text-gray-1 leading-none">
                    {{ t.ch }}
                </view>
            </view>
        </view>

        <!-- 作者（居中，略小） -->
        <view class="mt-4 flex flex-wrap justify-center gap-x-1">
            <view v-for="(t, j) in authorTokens" :key="j" class="flex flex-col items-center">
                <view class="h-[14px] text-[10px] text-gray-400 dark:text-gray-1">
                    {{ t.py }}
                </view>
                <view class="text-[14px] font-medium text-gray-500 dark:text-gray-1 leading-none">
                    {{ t.ch }}
                </view>
            </view>
        </view>

        <!-- 序（左对齐，但带缩进风格） -->
        <view class="mt-4 flex flex-wrap gap-x-0.5 px-4">
            <view v-for="(t, j) in prefaceTokens" :key="j" class="flex flex-col items-center">
                <view class="h-[14px] text-[10px] text-gray-400 dark:text-gray-1">
                    {{ t.py }}
                </view>
                <view class="text-[13px] text-gray-500 dark:text-gray-1 leading-tight">
                    {{ t.ch }}
                </view>
            </view>
        </view>

        <!-- 正文（居中或左对齐，这里采用诗歌常见居中/Padding布局） -->
        <view class="mt-6 flex flex-col items-center gap-y-2">
            <view v-for="(lineTokens, i) in linesTokens" :key="i" class="flex flex-wrap justify-center gap-x-1">
                <view v-for="(t, j) in lineTokens" :key="j" class="flex flex-col items-center w-8">
                    <!-- 拼音 -->
                    <view
                        class="h-[16px] text-[11px] text-gray-400 dark:text-gray-3 whitespace-nowrap overflow-visible">
                        {{ t.py }}
                    </view>
                    <!-- 汉字 -->
                    <view class="text-base text-gray-700 dark:text-gray-2 leading-none font-serif">
                        {{ t.ch }}
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>