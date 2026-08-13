import { defineNuxtPlugin, useRouter } from "#imports";

const MAIN_HEADER_HEIGHT = 64;
const SUB_HEADER_HEIGHT = 64;
const ANCHOR_GAP = 8;

type WindowWithAnchorState = Window & {
  __REBORN_SKIP_NEXT_HASH_SCROLL__?: string;
};

function getAnchorScrollOffset(): number {
  const hasSubHeader = window.matchMedia("(min-width: 1024px)").matches;
  return MAIN_HEADER_HEIGHT + (hasSubHeader ? SUB_HEADER_HEIGHT : 0) + ANCHOR_GAP;
}

function getSamePageHashLink(event: MouseEvent): HTMLAnchorElement | null {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }

  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest<HTMLAnchorElement>("a[href]");
  if (!link || link.target && link.target !== "_self") {
    return null;
  }

  const rawHref = link.getAttribute("href");
  if (!rawHref) {
    return null;
  }

  const url = new URL(link.href, window.location.href);
  if (url.pathname !== window.location.pathname || url.search !== window.location.search || !url.hash) {
    return null;
  }

  return link;
}

function getHashTarget(hash: string): HTMLElement | null {
  const rawId = hash.slice(1);
  const decodedId = decodeURIComponent(rawId);
  const target =
    document.getElementById(decodedId) ??
    document.getElementById(rawId) ??
    document.querySelector<HTMLElement>(`#${CSS.escape(decodedId)}`);

  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return target;
}

function scrollToHash(hash: string) {
  const target = getHashTarget(hash);
  if (!target) {
    return;
  }

  const offset = getAnchorScrollOffset();
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  // 减弱动效环境下 smooth 会被静默丢弃（点击后完全不滚动），必须回退为即时滚动
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

export default defineNuxtPlugin(() => {
  const router = useRouter();

  document.addEventListener(
    "click",
    (event) => {
      const link = getSamePageHashLink(event);
      if (!link) {
        return;
      }

      const hash = new URL(link.href, window.location.href).hash;
      if (!getHashTarget(hash)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (window.location.hash !== hash) {
        (window as WindowWithAnchorState).__REBORN_SKIP_NEXT_HASH_SCROLL__ = hash;
        void router.push(hash);
      }

      scrollToHash(hash);
    },
    true,
  );
});
