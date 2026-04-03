import { defineNuxtPlugin, useGtag } from "#imports";
import type { Directive, DirectiveBinding } from "vue";

type GaEventParams = Record<string, unknown>;

interface GaEventOptions {
  event?: string;
  name?: string;
  category?: string;
  label?: string;
  value?: number;
  sendTo?: string;
  nonInteraction?: boolean;
  transportType?: string;
  params?: GaEventParams;
}

type GaEventContext = {
  el: HTMLElement;
  binding: DirectiveBinding<GaEventDirectiveValue>;
  event?: Event;
  entry?: IntersectionObserverEntry;
};

type GaEventResolver = (context: GaEventContext) => string | GaEventOptions | null | undefined;
type GaEventDirectiveValue = string | GaEventOptions | GaEventResolver;

interface GaEventResolvedPayload {
  eventName: string | null;
  params: GaEventParams;
}

interface GaEventState {
  binding?: DirectiveBinding<GaEventDirectiveValue>;
  cleanup?: () => void;
  eventType?: string;
  observer?: IntersectionObserver;
  onceTracked: boolean;
  wasVisible: boolean;
}

const STATE_KEY = Symbol("ga-event");
const VIEW_THRESHOLD = 0.15;

type GaEventElement = HTMLElement & {
  [STATE_KEY]?: GaEventState;
};

function getState(el: HTMLElement) {
  const gaEventEl = el as GaEventElement;
  if (!gaEventEl[STATE_KEY]) {
    gaEventEl[STATE_KEY] = {
      onceTracked: false,
      wasVisible: false,
    };
  }

  return gaEventEl[STATE_KEY]!;
}

function clearState(el: HTMLElement) {
  const state = getState(el);
  state.cleanup?.();
  state.cleanup = undefined;
  state.observer?.disconnect();
  state.observer = undefined;
  state.wasVisible = false;
}

function pruneUndefined(input: GaEventParams) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

function resolvePayload(
  el: HTMLElement,
  binding: DirectiveBinding<GaEventDirectiveValue>,
  context: Omit<GaEventContext, "binding" | "el">,
): GaEventResolvedPayload {
  const rawValue
    = typeof binding.value === "function"
      ? binding.value({ el, binding, ...context })
      : binding.value;

  if (typeof rawValue === "string") {
    return {
      eventName: rawValue,
      params: {},
    };
  }

  if (!rawValue || typeof rawValue !== "object") {
    return {
      eventName: null,
      params: {},
    };
  }

  const {
    event,
    name,
    category,
    label,
    value,
    sendTo,
    nonInteraction,
    transportType,
    params,
  } = rawValue;

  return {
    eventName: event ?? name ?? null,
    params: pruneUndefined({
      event_category: category,
      event_label: label,
      value,
      send_to: sendTo,
      non_interaction: nonInteraction,
      transport_type: transportType,
      ...params,
    }),
  };
}

function trackEvent(
  el: HTMLElement,
  gtag: ReturnType<typeof useGtag>["gtag"],
  context: Omit<GaEventContext, "binding" | "el">,
) {
  const state = getState(el);
  const binding = state.binding;

  if (!binding) {
    return;
  }

  if (binding.modifiers.once && state.onceTracked) {
    return;
  }

  const payload = resolvePayload(el, binding, context);
  if (!payload.eventName) {
    console.warn("[v-ga-event] Missing event name.", el);
    return;
  }

  if (Object.keys(payload.params).length > 0) {
    gtag("event", payload.eventName, payload.params);
  } else {
    gtag("event", payload.eventName);
  }

  // 为演示面板派发自定义事件，便于实时观察埋点触发情况
  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent('ga-event:track', {
      detail: {
        eventName: payload.eventName,
        params: payload.params,
        timestamp: Date.now()
      }
    }));
  }

  if (binding.modifiers.once) {
    state.onceTracked = true;
  }
}

function bindDomEvent(
  el: HTMLElement,
  gtag: ReturnType<typeof useGtag>["gtag"],
) {
  const state = getState(el);
  const eventName = state.eventType || "click";
  const handler = (event: Event) => {
    const binding = state.binding;
    if (!binding) {
      return;
    }

    if (binding.modifiers.prevent) {
      event.preventDefault();
    }

    trackEvent(el, gtag, { event });
  };

  el.addEventListener(eventName, handler);

  return () => {
    el.removeEventListener(eventName, handler);
  };
}

function bindViewEvent(
  el: HTMLElement,
  gtag: ReturnType<typeof useGtag>["gtag"],
) {
  const state = getState(el);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target !== el) {
          continue;
        }

        const isVisible = entry.isIntersecting && entry.intersectionRatio >= VIEW_THRESHOLD;

        if (isVisible && !state.wasVisible) {
          trackEvent(el, gtag, { entry });

          if (state.binding?.modifiers.once) {
            observer.disconnect();
            state.observer = undefined;
            state.wasVisible = true;
            return;
          }
        }

        state.wasVisible = isVisible;
      }
    },
    {
      threshold: VIEW_THRESHOLD,
    },
  );

  observer.observe(el);
  state.observer = observer;

  return () => {
    observer.disconnect();
    if (state.observer === observer) {
      state.observer = undefined;
    }
  };
}

function bindTracking(
  el: HTMLElement,
  binding: DirectiveBinding<GaEventDirectiveValue>,
  gtag: ReturnType<typeof useGtag>["gtag"],
) {
  const state = getState(el);
  clearState(el);
  state.binding = binding;
  state.eventType = binding.arg || "click";

  if (binding.arg === "view") {
    state.cleanup = bindViewEvent(el, gtag);
  } else {
    state.cleanup = bindDomEvent(el, gtag);
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const { gtag } = useGtag();

  const gaEventDirective: Directive<HTMLElement, GaEventDirectiveValue> = {
    mounted(el, binding) {
      bindTracking(el, binding, gtag);
    },
    updated(el, binding) {
      const state = getState(el);
      const nextEventType = binding.arg || "click";

      state.binding = binding;
      if (state.eventType !== nextEventType) {
        bindTracking(el, binding, gtag);
      }
    },
    beforeUnmount(el) {
      clearState(el);
      delete (el as GaEventElement)[STATE_KEY];
    },
  };

  nuxtApp.vueApp.directive("ga-event", gaEventDirective);
});
