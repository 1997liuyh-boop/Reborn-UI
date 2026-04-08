<script lang="ts">
export const selectAnimations = {
  enterActiveClass: "transition-[height,opacity] duration-300 ease-out overflow-hidden",
  enterFromClass: "opacity-0",
  enterToClass: "opacity-100",
  leaveActiveClass: "transition-[height,opacity] duration-200 ease-in overflow-hidden",
  leaveFromClass: "opacity-100",
  leaveToClass: "opacity-0",
};
</script>

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
  appear?: boolean;
  customClass?: string;
  customStyle?: any;
  disableTouchMove?: boolean;
  collapse?: boolean;
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
}>(), {
  show: false,
  duration: 300,
  lazyRender: false,
  destroy: true,
  appear: false,
  customClass: '',
  customStyle: '',
  disableTouchMove: false,
  collapse: undefined,
});

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'beforeEnter', el: Element): void;
  (e: 'enter', el: Element, done: () => void): void;
  (e: 'afterEnter', el: Element): void;
  (e: 'beforeLeave', el: Element): void;
  (e: 'leave', el: Element, done: () => void): void;
  (e: 'afterLeave', el: Element): void;
}>();

const isCollapse = computed(() => {
  if (props.collapse !== undefined) return props.collapse;
  const name = props.name ?? 'fade';
  const names = Array.isArray(name) ? name : [name];
  return names.includes('select-collapse' as TransitionName);
});

const onBeforeEnterInternal = (el: Element) => {
  if (isCollapse.value) {
    const htmlEl = el as HTMLElement;
    htmlEl.style.height = '0';
    htmlEl.style.opacity = '0';
    htmlEl.style.overflow = 'hidden';
  }
  emit('beforeEnter', el);
};

const onEnterInternal = (el: Element, done: () => void) => {
  if (isCollapse.value) {
    const htmlEl = el as HTMLElement;
    // Force reflow
    htmlEl.offsetHeight;
    htmlEl.style.height = `${htmlEl.scrollHeight}px`;
    htmlEl.style.opacity = '1';
    htmlEl.addEventListener('transitionend', done, { once: true });
  } else {
    done();
  }
  emit('enter', el, done);
};

const onAfterEnterInternal = (el: Element) => {
  if (isCollapse.value) {
    const htmlEl = el as HTMLElement;
    htmlEl.style.height = 'auto';
    htmlEl.style.overflow = '';
  }
  emit('afterEnter', el);
};

const onBeforeLeaveInternal = (el: Element) => {
  if (isCollapse.value) {
    const htmlEl = el as HTMLElement;
    htmlEl.style.height = `${htmlEl.scrollHeight}px`;
    htmlEl.style.opacity = '1';
    htmlEl.style.overflow = 'hidden';
  }
  emit('beforeLeave', el);
};

const onLeaveInternal = (el: Element, done: () => void) => {
  if (isCollapse.value) {
    const htmlEl = el as HTMLElement;
    // Force reflow
    htmlEl.offsetHeight;
    htmlEl.style.height = '0';
    htmlEl.style.opacity = '0';
    htmlEl.addEventListener('transitionend', done, { once: true });
  } else {
    done();
  }
  emit('leave', el, done);
};

const onAfterLeaveInternal = (el: Element) => {
  if (isCollapse.value) {
    const htmlEl = el as HTMLElement;
    htmlEl.style.height = '';
    htmlEl.style.opacity = '';
    htmlEl.style.overflow = '';
  }
  emit('afterLeave', el);
};

const durationOf = (type: 'enter' | 'leave') => (typeof props.duration === 'object'
  ? (props.duration[type] ?? 300)
  : (props.duration === false ? 0 : Number(props.duration)));

const transitionClasses = computed(() => {
  if (props.enterActiveClass || props.enterFromClass || props.leaveActiveClass || props.leaveFromClass) {
    return {
      enterFrom: props.enterFromClass || '',
      enterActive: props.enterActiveClass || '',
      enterTo: props.enterToClass || '',
      leaveFrom: props.leaveFromClass || '',
      leaveActive: props.leaveActiveClass || '',
      leaveTo: props.leaveToClass || '',
    };
  }

  const name = props.name ?? 'fade';
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
});

const renderReady = ref(!props.lazyRender);
const elRef = ref<HTMLElement | null>(null);

watch(() => props.show, (val) => {
  if (val && props.lazyRender) renderReady.value = true;
}, { immediate: true });

defineExpose({
  el: elRef,
});
</script>

<template>
  <Transition :appear="appear" :enter-from-class="transitionClasses.enterFrom"
    :enter-active-class="transitionClasses.enterActive" :enter-to-class="transitionClasses.enterTo"
    :leave-from-class="transitionClasses.leaveFrom" :leave-active-class="transitionClasses.leaveActive"
    :leave-to-class="transitionClasses.leaveTo" :appear-from-class="appear ? transitionClasses.enterFrom : undefined"
    :appear-active-class="appear ? transitionClasses.enterActive : undefined"
    :appear-to-class="appear ? transitionClasses.enterTo : undefined" @before-enter="onBeforeEnterInternal"
    @enter="onEnterInternal" @after-enter="onAfterEnterInternal" @before-leave="onBeforeLeaveInternal"
    @leave="onLeaveInternal" @after-leave="onAfterLeaveInternal">
    <div v-if="renderReady && (destroy ? show : true)" v-show="destroy ? true : show" ref="elRef"
      :class="['rb-transition transform-gpu will-change-[opacity,transform]', customClass]"
      :style="[{ transitionDuration: `${durationOf(show ? 'enter' : 'leave')}ms` }, customStyle]"
      @click="emit('click')">
      <slot />
    </div>
  </Transition>
</template>
