<script setup lang="ts">
import { computed } from "vue";

interface Props {
  starsCount?: number;
}

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  twinkleDuration: number;
  driftDuration: number;
  driftDirection: number;
  opacityStart: number;
  opacityEnd: number;
}

const props = withDefaults(defineProps<Props>(), {
  starsCount: 130,
});

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomSize(): number {
  // Randomly return either 1 or 2
  return Math.random() < 0.5 ? 1 : 2;
}

const stars = computed(() =>
  Array.from(
    { length: props.starsCount },
    (_, i): Star => ({
      id: i,
      top: `${random(0, 100)}%`,
      left: `${random(0, 100)}%`,
      size: randomSize(),
      twinkleDuration: random(2, 4),
      driftDuration: random(5, 10),
      driftDirection: random(-50, 50),
      opacityStart: random(0.1, 0.3),
      opacityEnd: random(0.7, 1),
    }),
  ),
);
</script>

<template>
  <div class="absolute inset-0 overflow-hidden">
    <div v-for="star in stars" :key="star.id" :style="{
      top: star.top,
      left: star.left,
      width: `${star.size}px`,
      height: `${star.size}px`,
      '--reborn-twinkle-duration': `${star.twinkleDuration}s`,
      '--reborn-drift-duration': `${star.driftDuration}s`,
      '--reborn-drift-direction': `${star.driftDirection}px`,
      '--reborn-opacity-start': star.opacityStart,
      '--reborn-opacity-end': star.opacityEnd,
    }" class="star absolute rounded-full bg-white" />
  </div>
</template>

<style scoped>
.star {
  opacity: var(--reborn-opacity-start);
  animation:
    twinkle var(--reborn-twinkle-duration) ease-in-out infinite alternate,
    drift var(--reborn-drift-duration) linear infinite;
}

@keyframes twinkle {
  0% {
    opacity: var(--reborn-opacity-start);
  }

  100% {
    opacity: var(--reborn-opacity-end);
  }
}

@keyframes drift {
  0% {
    transform: translate(0, 0);
  }

  25% {
    transform: translate(var(--reborn-drift-direction), calc(var(--reborn-drift-direction) / 2));
  }

  50% {
    transform: translate(calc(var(--reborn-drift-direction) / 2), var(--reborn-drift-direction));
  }

  75% {
    transform: translate(calc(var(--reborn-drift-direction) * -1),
        calc(var(--reborn-drift-direction) / 2));
  }

  100% {
    transform: translate(0, 0);
  }
}
</style>
