<script lang="ts" setup>
import { useIntervalFn, useMounted } from "@vueuse/core";
import { AnimatePresence, Motion } from "motion-v";
import { computed, onMounted, shallowRef, watch } from "vue";

interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  image: string;
}
interface Props {
  testimonials?: Testimonial[];
  autoplay?: boolean;
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  testimonials: () => [],
  autoplay: false,
  duration: 5000,
});

const active = shallowRef(0);

// 当前展示的评价；列表为空或 active 越界时为 undefined，模板据此不渲染文案块
const current = computed<Testimonial | undefined>(() => props.testimonials[active.value]);

const activeTestimonialQuote = computed(() => current.value?.quote.split(" ") ?? []);

// 自动播放：定时器归组件作用域所有，卸载时自动清除；间隔读 getter，duration 变化后按新间隔重启
const { pause, resume } = useIntervalFn(handleNext, () => props.duration, { immediate: false });
const mounted = useMounted();

// 只在客户端挂载后才起定时器，autoplay 切换时随之启停
watch(
  () => props.autoplay && mounted.value,
  (on) => (on ? resume() : pause()),
  { immediate: true },
);

// 父组件把列表缩短到 active 以下时回到第一条
watch(
  () => props.testimonials.length,
  (length) => {
    if (active.value >= length) active.value = 0;
  },
);

function handleNext() {
  const length = props.testimonials.length;
  if (!length) return;
  active.value = (active.value + 1) % length;
}

function handlePrev() {
  const length = props.testimonials.length;
  if (!length) return;
  active.value = (active.value - 1 + length) % length;
}

function isActive(index: number) {
  return active.value === index;
}

// 未激活卡片的随机倾角：只在客户端生成，避免服务端与客户端各算一次导致水合不一致；
// 每次切换时重新随机一次，让堆叠的卡片产生错落感（刻意的效果，在这里显式表达）
const rotations = shallowRef<number[]>([]);

function randomRotateY() {
  return Math.floor(Math.random() * 21) - 10;
}

function shuffleRotations() {
  rotations.value = props.testimonials.map(() => randomRotateY());
}

function rotationOf(index: number) {
  return rotations.value[index] ?? 0;
}

onMounted(shuffleRotations);
watch([active, () => props.testimonials.length], shuffleRotations);
</script>

<template>
  <div class="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
    <div class="relative grid grid-cols-1 gap-20 md:grid-cols-2">
      <div>
        <div class="relative h-80 w-full">
          <AnimatePresence>
            <Motion
              v-for="(testimonial, index) in props.testimonials"
              :key="testimonial.image"
              as="div"
              :initial="{
                opacity: 0,
                scale: 0.9,
                z: -100,
                rotate: rotationOf(index),
              }"
              :animate="{
                opacity: isActive(index) ? 1 : 0.7,
                scale: isActive(index) ? 1 : 0.95,
                z: isActive(index) ? 0 : -100,
                rotate: isActive(index) ? 0 : rotationOf(index),
                zIndex: isActive(index) ? 40 : testimonials.length + 2 - index,
                y: isActive(index) ? [0, -80, 0] : 0,
              }"
              :exit="{
                opacity: 0,
                scale: 0.9,
                z: 100,
                rotate: rotationOf(index),
              }"
              :transition="{
                duration: 0.4,
                ease: 'easeInOut',
              }"
              class="absolute inset-0 origin-bottom"
            >
              <NuxtImg
                :src="testimonial.image"
                :alt="testimonial.name"
                width="500"
                height="500"
                :draggable="false"
                class="size-full rounded-3xl object-cover object-center"
              />
            </Motion>
          </AnimatePresence>
        </div>
      </div>
      <div class="flex flex-col justify-between py-4">
        <!-- 文案块按 active 切换，AnimatePresence 等旧文案离场后再进场新文案，exit 才会生效 -->
        <AnimatePresence mode="wait">
          <Motion
            v-if="current"
            :key="active"
            as="div"
            :initial="{
              y: 20,
              opacity: 0,
            }"
            :animate="{
              y: 0,
              opacity: 1,
            }"
            :exit="{
              y: -20,
              opacity: 0,
            }"
            :transition="{
              duration: 0.2,
              ease: 'easeInOut',
            }"
          >
            <h3 class="text-2xl font-bold text-black dark:text-white">
              {{ current.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-neutral-500">
              {{ current.designation }}
            </p>
            <Motion
              as="p"
              class="mt-8 text-lg text-gray-500 dark:text-neutral-300"
            >
              <Motion
                v-for="(word, index) in activeTestimonialQuote"
                :key="index"
                as="span"
                :initial="{
                  filter: 'blur(10px)',
                  opacity: 0,
                  y: 5,
                }"
                :animate="{
                  filter: 'blur(0px)',
                  opacity: 1,
                  y: 0,
                }"
                :transition="{
                  duration: 0.2,
                  ease: 'easeInOut',
                  delay: 0.02 * index,
                }"
                class="inline-block"
              >
                {{ word }}&nbsp;
              </Motion>
            </Motion>
          </Motion>
        </AnimatePresence>
        <div class="flex gap-4 pt-12 md:pt-0">
          <button
            class="group/button flex size-7 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
            @click="handlePrev"
          >
            <Icon
              name="lucide:arrow-left"
              class="size-5 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400"
            />
          </button>
          <button
            class="group/button flex size-7 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
            @click="handleNext"
          >
            <Icon
              name="lucide:arrow-right"
              class="size-5 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-neutral-400"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
