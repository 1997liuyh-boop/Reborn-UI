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

const durationOf = (type: 'enter' | 'leave') => (typeof props.duration === 'object'
  ? (props.duration[type] ?? 300)
  : (props.duration === false ? 0 : Number(props.duration)));

const style = computed(() => `${props.customStyle}`);

function getClassNames(name = props.name ?? "fade") {
  const names = Array.isArray(name) ? name : [name];
  const picked = names.map(n => transitionStyles[n]).filter((it): it is Record<string, string> => !!it);
  const join = (key: string) => picked.map(it => it[key]).join(' ');
  return {
    enterFrom: join('enter'),
    enterActive: join('enter-active'),
    enterTo: join('enter-to'),
    leaveFrom: join('leave'),
    leaveActive: join('leave-active'),
    leaveTo: join('leave-to'),
  };
}

const transitionClasses = computed(() => getClassNames());
const renderReady = ref(!props.lazyRender);

watch(() => props.show, (val) => {
  if (val && props.lazyRender) renderReady.value = true;
}, { immediate: true });
</script>

<template>
  <Transition :enter-from-class="transitionClasses.enterFrom" :enter-active-class="transitionClasses.enterActive"
    :enter-to-class="transitionClasses.enterTo" :leave-from-class="transitionClasses.leaveFrom"
    :leave-active-class="transitionClasses.leaveActive" :leave-to-class="transitionClasses.leaveTo"
    @before-enter="emit('beforeEnter')" @enter="emit('enter')" @after-enter="emit('afterEnter')"
    @before-leave="emit('beforeLeave')" @leave="emit('leave')" @after-leave="emit('afterLeave')">
    <div v-if="renderReady && (props.destroy ? props.show : true)" v-show="props.destroy ? true : props.show"
      :class="`rb-transition ease-in-out ${props.customClass}`"
      :style="`transition-duration: ${durationOf(props.show ? 'enter' : 'leave')}ms; ${style}`" @click="emit('click')">
      <slot />
    </div>
  </Transition>
</template>
