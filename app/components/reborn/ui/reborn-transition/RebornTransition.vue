<script setup lang="ts">
import type { TransitionName } from './reborn-transition.config';
import { computed, ref, watch } from 'vue';
import { transitionStyles } from './reborn-transition.config';

const props = withDefaults(defineProps<{
  show?: boolean;
  duration?: number | { enter?: number; leave?: number } | boolean;
  lazyRender?: boolean;
  name?: TransitionName | TransitionName[];
  destroy?: boolean;
  customClass?: string;
  customStyle?: string;
  disableTouchMove?: boolean;
}>(), {
  show: false,
  duration: 300,
  lazyRender: false,
  destroy: true,
  customClass: '',
  customStyle: '',
  disableTouchMove: false,
});

const emit = defineEmits(['click', 'beforeEnter', 'enter', 'beforeLeave', 'afterLeave', 'leave', 'afterEnter']);
const inited = ref(props.show);
const display = ref(props.show);
const classes = ref('');

const durationOf = (type: 'enter' | 'leave') => (typeof props.duration === 'object'
  ? (props.duration[type] ?? 300)
  : (props.duration === false ? 0 : Number(props.duration)));

const style = computed(() => `transition-duration:${durationOf(display.value ? 'enter' : 'leave')}ms;${display.value || !props.destroy ? '' : 'display:none;'}${props.customStyle}`);
const rootClass = computed(() => `rb-transition ease-in-out ${props.customClass} ${classes.value}`);
const isShow = computed(() => !props.lazyRender || inited.value);

function getClassNames(name = props.name ?? "fade") {
  const names = Array.isArray(name) ? name : [name];
  const picked = names.map(n => transitionStyles[n]).filter(Boolean);
  const join = (key: string) => picked.map(it => it[key]).join(' ');
  return {
    enter: `${join('enter')} ${join('enter-active')}`.trim(),
    enterTo: `${join('enter-to')} ${join('enter-active')}`.trim(),
    leave: `${join('leave')} ${join('leave-active')}`.trim(),
    leaveTo: `${join('leave-to')} ${join('leave-active')}`.trim(),
  };
}

function enter() {
  const c = getClassNames();
  emit('beforeEnter');
  inited.value = true;
  display.value = true;
  classes.value = c.enter;
  requestAnimationFrame(() => {
    emit('enter');
    classes.value = c.enterTo;
    setTimeout(() => emit('afterEnter'), durationOf('enter'));
  });
}

function leave() {
  const c = getClassNames();
  emit('beforeLeave');
  classes.value = c.leave;
  requestAnimationFrame(() => {
    emit('leave');
    classes.value = c.leaveTo;
    setTimeout(() => {
      display.value = false;
      emit('afterLeave');
    }, durationOf('leave'));
  });
}

watch(() => props.show, v => (v ? enter() : leave()), { immediate: true });
</script>

<template>
  <div v-if="isShow" :class="rootClass" :style="style" @click="emit('click')">
    <slot />
  </div>
</template>
