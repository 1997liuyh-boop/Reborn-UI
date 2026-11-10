import type { JellyfishController } from "./jellyfish";
import { observeActivity } from "./activity";
import { markIntroReady, PAYATHON_HEADER_SELECTOR, shouldSkipTitleIntro } from "./intro";

/**
 * 首屏的各段脚本：
 * - 标题开场：REBORN UI 逐字打出，两侧花括号闪烁收拢，副标题逐字亮起；
 * - 版面计算：标题、口号、倒计时的落点由首屏实际高度算出，写成 CSS 变量；
 * - 水母字符画：按调色板改写强调色，并让字符避开标题与口号；
 * - 顶栏就绪：标题与水母都就绪后顶栏才可交互，口号与倒计时随之入场；
 * - 「马上开始」按钮的打字效果、当前时间、命令行打字机。
 * 每个函数返回清理函数，由 PayathonHero 组件在卸载时调用。
 */

/* ── 版面 ─────────────────────────────────────────────────────────── */

/** 按首屏尺寸计算标题落点、口号区上下边界与倒计时位置，写进 CSS 变量 */
export function layoutHero(hero: HTMLElement): void {
  const titleFrame = hero.querySelector<HTMLElement>(".payathon-title-frame");
  const registration = hero.querySelector<HTMLElement>(".overview-registration");
  const header = document.querySelector<HTMLElement>(PAYATHON_HEADER_SELECTOR);
  if (!titleFrame || !registration) return;
  // 窄屏只需要标题中心，入场从视口中央落到这里
  if (hero.clientWidth <= 767) {
    const title = hero.querySelector<HTMLElement>("#payathon-title");
    if (title) hero.style.setProperty("--mobile-title-center", `${title.offsetTop + title.offsetHeight / 2}px`);
    return;
  }
  const height = hero.clientHeight;
  const headerHeight = header?.offsetHeight || 60;
  const inset = Math.max(32, (height - headerHeight) * 0.12);
  const titleHeight = titleFrame.getBoundingClientRect().height;
  const top = headerHeight + inset;
  const titleBottom = top + titleHeight;
  const footerReserve = hero.clientWidth <= 640 ? 68 : 0;
  const countdownBottom = height - inset - footerReserve;
  const countdownHeight = registration.getBoundingClientRect().height;
  const overviewTop = titleBottom + 32;
  const axis = (titleBottom + countdownBottom - countdownHeight) / 2;
  hero.style.setProperty("--title-rest-y", `${top + titleHeight / 2}px`);
  hero.style.setProperty("--overview-top", `${overviewTop}px`);
  hero.style.setProperty("--overview-bottom", `${inset}px`);
  hero.style.setProperty("--overview-axis", `${axis - overviewTop}px`);
  hero.style.setProperty("--countdown-x", `${hero.clientWidth / 2}px`);
  hero.style.setProperty("--countdown-y", `${countdownBottom - countdownHeight}px`);
}

/* ── 顶栏就绪与口号入场 ─────────────────────────────────────────────── */

/**
 * 顶栏 data-ready 与首屏状态联动：就绪后首屏标记 data-intro-complete，口号区解除 inert；
 * 5 秒内没就绪（比如水母加载失败）强制就绪，并广播 payathon:intro-timeout 让标题直接展示最终态。
 */
export function linkHeaderReady(hero: HTMLElement): () => void {
  const header = document.querySelector<HTMLElement>(PAYATHON_HEADER_SELECTOR);
  const overview = hero.querySelector<HTMLElement>("#overview");
  if (!header || !overview) return () => {};
  const timeout = window.setTimeout(() => {
    if (header.hasAttribute("data-ready")) return;
    document.dispatchEvent(new Event("payathon:intro-timeout"));
    header.dataset.ready = "true";
    header.inert = false;
    header.removeAttribute("aria-hidden");
  }, 5000);

  const sync = () => {
    const ready = header.hasAttribute("data-ready");
    if (ready) window.clearTimeout(timeout);
    hero.toggleAttribute("data-intro-complete", ready);
    if (!ready) hero.removeAttribute("data-text-entered");
    overview.inert = !ready;
    if (ready) overview.removeAttribute("aria-hidden");
    else overview.setAttribute("aria-hidden", "true");
  };
  // 倒计时那行的墨迹动画结束，说明口号整体入场完毕
  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName === "overview-ink" && event.target instanceof Element && event.target.closest(".overview-status")) {
      hero.setAttribute("data-text-entered", "");
    }
  };
  hero.addEventListener("animationend", onAnimationEnd);

  // 下拉菜单展开时 clip-path 过渡期间临时加 will-change，结束后撤掉
  const animating = new Set<HTMLElement>();
  const onTransitionRun = (event: TransitionEvent) => {
    const target = event.target;
    if (event.propertyName !== "clip-path" || !(target instanceof HTMLElement) || !target.matches(".siteMenuContent")) return;
    target.style.willChange = "clip-path, translate, opacity";
    animating.add(target);
  };
  const onTransitionDone = (event: TransitionEvent) => {
    if (event.propertyName !== "clip-path" || !(event.target instanceof HTMLElement)) return;
    if (animating.delete(event.target)) event.target.style.removeProperty("will-change");
  };
  header.addEventListener("transitionrun", onTransitionRun);
  header.addEventListener("transitionend", onTransitionDone);
  header.addEventListener("transitioncancel", onTransitionDone);

  const observer = new MutationObserver(sync);
  observer.observe(header, { attributes: true, attributeFilter: ["data-ready"] });
  sync();

  return () => {
    window.clearTimeout(timeout);
    observer.disconnect();
    hero.removeEventListener("animationend", onAnimationEnd);
    header.removeEventListener("transitionrun", onTransitionRun);
    header.removeEventListener("transitionend", onTransitionDone);
    header.removeEventListener("transitioncancel", onTransitionDone);
    animating.forEach((el) => el.style.removeProperty("will-change"));
    animating.clear();
  };
}

/**
 * 跳过开场时直接摆成最终态（从站内页面返回、浏览器前进后退时）
 * @returns 是否跳过了开场
 */
export function restoreSkippedIntro(page: HTMLElement, hero: HTMLElement): boolean {
  if (!page.hasAttribute("data-skip-title-intro")) return false;
  layoutHero(hero);
  hero.setAttribute("data-intro-complete", "");
  hero.setAttribute("data-text-entered", "");
  const header = document.querySelector<HTMLElement>(PAYATHON_HEADER_SELECTOR);
  if (header) {
    header.dataset.titleReady = header.dataset.sceneReady = header.dataset.ready = "true";
    header.inert = false;
    header.removeAttribute("aria-hidden");
  }
  const overview = hero.querySelector<HTMLElement>("#overview");
  if (overview) {
    overview.inert = false;
    overview.removeAttribute("aria-hidden");
  }
  page.setAttribute("data-return-layout-ready", "");
  return true;
}

/* ── 标题开场 ─────────────────────────────────────────────────────── */

/** 标题字形总宽的兜底值；实际取标题 svg 的 viewBox 宽 */
const TITLE_WIDTH_FALLBACK = 544;
/** 花括号闪烁一次的周期与总时长（ms），闪三下后开始打字 */
const BRACKET_BLINK = 160;
const BRACKET_PHASE = BRACKET_BLINK * 3;
/** 每个字的间隔（ms） */
const CHAR_STEP = 55;
/** 标题的逐字开场：花括号闪三下后逐字打出，已打出的部分始终居中，最后副标题与标志淡入 */
export function mountTitleIntro(page: HTMLElement, title: HTMLElement): () => void {
  const skip = shouldSkipTitleIntro();
  page.toggleAttribute("data-skip-title-intro", skip);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const glyphGroup = title.querySelector<SVGGElement>("[data-title-glyphs]");
  const glyphs = [...title.querySelectorAll<SVGGraphicsElement>(".payathon-name [data-title-char]")]
    .sort((a, b) => Number(a.dataset.titleChar) - Number(b.dataset.titleChar));
  const extras = [...title.querySelectorAll<HTMLElement>(".payathon-aipay-logo[data-title-char], .payathon-subtitle [data-title-char]")];
  const bracketLeft = title.querySelector<SVGGElement>(".payathon-bracket-left");
  const bracketRight = title.querySelector<SVGGElement>(".payathon-bracket-right");
  if (!glyphGroup || !bracketLeft || !bracketRight) return () => {};

  const TITLE_WIDTH = title.querySelector<SVGSVGElement>(".payathon-name")?.viewBox.baseVal.width || TITLE_WIDTH_FALLBACK;
  // 每打出一个字后标题的右边界，用来让已打出的部分始终居中；字形用 <use> 拼成，右边界写在 data-title-right 上
  const rightEdges = glyphs.map((glyph) => {
    const right = Number(glyph.dataset.titleRight);
    if (Number.isFinite(right) && right > 0) return right;
    const box = glyph.getBBox();
    return box.x + box.width;
  });
  const typingStart = BRACKET_PHASE;
  // 副标题按字计时长，标志图算一个字
  const extraSteps = extras.reduce((sum, el) => sum + (el.matches(".payathon-subtitle-label") ? Array.from(el.textContent ?? "").length : 1), 0);
  const fadeStart = typingStart + (glyphs.length + extraSteps) * CHAR_STEP + 200;
  const totalDuration = fadeStart + 300;

  let elapsed = 0;
  let lastNow: number | null = null;
  let frame = 0;
  let visible = false;
  let finished = false;

  const render = (time: number) => {
    const typed = Math.min(glyphs.length, Math.max(0, Math.floor((time - typingStart) / CHAR_STEP)));
    const shift = (TITLE_WIDTH - (typed ? rightEdges[typed - 1]! : 0)) / 2;
    glyphGroup.setAttribute("transform", `translate(${shift} 0)`);
    glyphs.forEach((glyph, index) => {
      glyph.style.opacity = index < typed ? "1" : "0";
    });
    // 一个字都没打出时两个花括号靠拢成「{}」
    const bracketGap = typed === 0 ? 18 : 0;
    bracketLeft.setAttribute("transform", `translate(${shift + bracketGap} 0)`);
    bracketRight.setAttribute("transform", `translate(${-shift - bracketGap} 0)`);
    const bracketOpacity = time < BRACKET_PHASE
      ? String(time % BRACKET_BLINK < 100 ? 1 : 0)
      : String(Math.max(0, 1 - Math.max(0, time - fadeStart) / 300));
    bracketLeft.style.opacity = bracketRight.style.opacity = bracketOpacity;

    const extraTyped = Math.max(0, Math.floor((time - typingStart) / CHAR_STEP) - glyphs.length);
    extras.forEach((el, index) => {
      if (!el.closest(".payathon-subtitle-label")) {
        el.style.opacity = index < extraTyped ? "1" : "0";
        return;
      }
      // 副标题：先弹出一块色块，闪烁两下后收起，文字随后淡入
      const local = time - (typingStart + (glyphs.length + index) * CHAR_STEP);
      const grow = Math.max(0, Math.min(1, local / 130));
      const shrink = Math.max(0, Math.min(1, (local - 190) / 130));
      const blockScale = (1 - (1 - grow) ** 3) * (1 - shrink);
      const flicker = local < 190 && local % 80 > 53 ? 0.18 : 1;
      el.style.opacity = local >= 0 ? "1" : "0";
      el.style.setProperty("--subtitle-block-scale", String(blockScale));
      el.style.setProperty("--subtitle-block-opacity", String(local >= 0 && local < 320 ? flicker : 0));
      el.style.setProperty("--subtitle-text-opacity", String(Math.max(0, Math.min(1, (local - 230) / 90))));
    });
  };

  const finish = (announce = true) => {
    finished = true;
    if (announce) markIntroReady("title");
    cancelAnimationFrame(frame);
    frame = 0;
    glyphGroup.removeAttribute("transform");
    glyphs.forEach((glyph) => {
      glyph.style.opacity = "1";
    });
    extras.forEach((el) => {
      el.style.opacity = "1";
      el.style.setProperty("--subtitle-block-scale", "0");
      el.style.setProperty("--subtitle-block-opacity", "0");
      el.style.setProperty("--subtitle-text-opacity", "1");
    });
    bracketLeft.style.opacity = bracketRight.style.opacity = "0";
  };

  const step = (now: number) => {
    frame = 0;
    // 每帧最多推进 50ms，切回标签页时不会一下跳到结尾
    if (lastNow !== null) elapsed += Math.min(50, now - lastNow);
    lastNow = now;
    if (elapsed >= totalDuration) {
      finish();
      return;
    }
    render(elapsed);
    frame = requestAnimationFrame(step);
  };

  const resume = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastNow = null;
    if (reducedMotion.matches) finish();
    if (!finished && visible && !document.hidden) frame = requestAnimationFrame(step);
  };

  if (skip) {
    finish();
    markIntroReady("scene");
  }
  else if (reducedMotion.matches) {
    finish();
  }
  else {
    render(0);
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    resume();
  });
  observer.observe(title);
  const onTimeout = () => finish();
  document.addEventListener("payathon:intro-timeout", onTimeout);
  document.addEventListener("visibilitychange", resume);
  reducedMotion.addEventListener("change", resume);

  return () => {
    finish(false);
    observer.disconnect();
    document.removeEventListener("payathon:intro-timeout", onTimeout);
    document.removeEventListener("visibilitychange", resume);
    reducedMotion.removeEventListener("change", resume);
  };
}

/* ── 水母场景 ─────────────────────────────────────────────────────── */

interface JellyfishPalette {
  bell: string;
  tentacle: string;
  accent: string;
}

/** 十六进制颜色的饱和度（HSL） */
function saturation(hex: string): number {
  const rgb = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  return max === min ? 0 : (max - min) / (1 - Math.abs(max + min - 1));
}

/** 取调色板里最鲜艳的一色作为整页强调色 */
function pickAccent(palette: JellyfishPalette): string {
  return [palette.bell, palette.tentacle, palette.accent].sort((a, b) => saturation(b) - saturation(a))[0]!;
}

/** 把颜色提亮、增饱和，用作字形色散的色层 */
function brightenForSplit(hex: string): string {
  const rgb = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const sat = max ? (max - min) / max : 0;
  const value = Math.min(1, max + 0.12);
  const boosted = Math.min(1, sat * 1.35 + 0.1);
  return `#${rgb.map((c) => {
    const next = sat ? value * (1 - ((1 - c / max) * boosted) / sat) : value;
    return Math.round(Math.max(0, next) * 255).toString(16).padStart(2, "0");
  }).join("")}`;
}

/**
 * 挂载水母字符画：水母代码按需加载，挂载后按调色板改写强调色与色散色，
 * 并在标题、口号移动（入场动画、过渡）期间逐帧刷新避让区域
 */
export function mountHeroScene(page: HTMLElement, hero: HTMLElement): () => void {
  const container = hero.querySelector<HTMLElement>("[data-payathon-ascii]");
  const title = hero.querySelector<HTMLElement>("#payathon-title");
  if (!container || !title) return () => {};
  let disposed = false;
  let teardown: (() => void) | undefined;

  import("./jellyfish").then(({ mountJellyfish }) => {
    if (disposed || !container.isConnected) return;
    const controller: JellyfishController = mountJellyfish(container, {
      paletteIndex: Number(page.dataset.payathonPalette),
      avoidElements: [title],
      onIntroComplete: () => markIntroReady("scene"),
      onPalette(palette: JellyfishPalette) {
        const accent = pickAccent(palette);
        hero.style.setProperty("--payathon-accent", accent);
        page.style.setProperty("--payathon-accent", accent);
        for (const [direction, color] of [["forward", palette.bell], ["backward", palette.tentacle]] as const) {
          const split = brightenForSplit(color);
          hero.style.setProperty(`--payathon-split-${direction}-text`, `${split}f2`);
          hero.style.setProperty(`--payathon-split-${direction}-svg`, `${split}e6`);
          page.style.setProperty(`--payathon-split-${direction}-svg`, `${split}e6`);
        }
      },
    });

    const registration = hero.querySelector<HTMLElement>(".overview-registration");
    const titleFrame = title.querySelector<HTMLElement>(".payathon-title-frame");
    const header = document.querySelector<HTMLElement>(PAYATHON_HEADER_SELECTOR);
    const resizeObserver = new ResizeObserver(() => layoutHero(hero));
    for (const el of [hero, titleFrame, registration, header]) if (el) resizeObserver.observe(el);
    layoutHero(hero);

    // 正在移动的元素：有它们时每帧刷新避让区域
    const moving = new Set<EventTarget>();
    let frame = 0;
    let running = false;
    const refresh = () => {
      frame = 0;
      controller.refreshAvoidance();
      if (moving.size && running && !document.hidden) frame = requestAnimationFrame(refresh);
    };
    const scheduleRefresh = () => {
      if (!frame && running && !document.hidden) frame = requestAnimationFrame(refresh);
    };
    const onTransitionRun = (event: TransitionEvent) => {
      if (event.propertyName !== "transform" || !(event.target as Element).matches("#payathon-title, .overview-registration, [data-overview-reveal]")) return;
      moving.add(event.target!);
      scheduleRefresh();
    };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") return;
      moving.delete(event.target!);
      scheduleRefresh();
    };
    const onAnimationStart = (event: AnimationEvent) => {
      if (event.animationName !== "overview-arrive") return;
      moving.add(event.target!);
      scheduleRefresh();
    };
    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.animationName !== "overview-arrive") return;
      moving.delete(event.target!);
      scheduleRefresh();
    };
    // 开场结束后口号也加入避让，字符不会压在文字上
    const syncAvoid = () => {
      const avoid = hero.hasAttribute("data-intro-complete")
        ? [title, ...hero.querySelectorAll<HTMLElement>("[data-overview-reveal]")]
        : [title];
      controller.setAvoidElements(avoid);
      scheduleRefresh();
    };
    const introObserver = new MutationObserver(syncAvoid);
    introObserver.observe(hero, { attributes: true, attributeFilter: ["data-intro-complete"] });
    hero.addEventListener("animationstart", onAnimationStart);
    hero.addEventListener("animationend", onAnimationEnd);
    hero.addEventListener("animationcancel", onAnimationEnd);
    hero.addEventListener("transitionrun", onTransitionRun);
    hero.addEventListener("transitionend", onTransitionEnd);
    hero.addEventListener("transitioncancel", onTransitionEnd);
    syncAvoid();
    controller.pause();
    container.dataset.state = "mounted";

    const stopActivity = observeActivity(hero, (active) => {
      running = active;
      if (active) {
        controller.resume();
        scheduleRefresh();
      }
      else {
        controller.pause();
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });

    teardown = () => {
      cancelAnimationFrame(frame);
      introObserver.disconnect();
      resizeObserver.disconnect();
      hero.removeEventListener("animationstart", onAnimationStart);
      hero.removeEventListener("animationend", onAnimationEnd);
      hero.removeEventListener("animationcancel", onAnimationEnd);
      hero.removeEventListener("transitionrun", onTransitionRun);
      hero.removeEventListener("transitionend", onTransitionEnd);
      hero.removeEventListener("transitioncancel", onTransitionEnd);
      stopActivity();
      controller.destroy();
      delete container.dataset.state;
      page.style.removeProperty("--payathon-accent");
    };
  }).catch((error) => {
    console.error("首屏水母场景加载失败", error);
    markIntroReady("scene");
  });

  return () => {
    disposed = true;
    teardown?.();
  };
}

/* ── 按钮打字 ─────────────────────────────────────────────────── */

/** 口号入场后，「马上开始」按钮的文字逐字打出，带一个闪烁光标 */
export function mountEntryTyping(hero: HTMLElement): () => void {
  const button = hero.querySelector<HTMLElement>(".blackhole-button");
  const label = button?.querySelector<HTMLElement>("span");
  if (!button || !label) return () => {};
  const typed = document.createElement("i");
  typed.className = "entry-typed";
  typed.setAttribute("aria-hidden", "true");
  button.append(typed);
  button.dataset.typingEntry = "";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let timer = 0;
  let count = 0;
  let done = false;
  let chars = Array.from(label.textContent ?? "");

  const canRun = () => !document.hidden && hero.hasAttribute("data-motion-running");
  const stop = () => {
    clearTimeout(timer);
    timer = 0;
  };
  const typeNext = () => {
    timer = 0;
    if (!canRun()) return;
    if (count < chars.length) {
      typed.textContent = chars.slice(0, ++count).join("");
      // 打完最后一个字多停一会儿再收起光标
      timer = window.setTimeout(typeNext, count === chars.length ? 480 : 16);
    }
    else {
      done = true;
      button.removeAttribute("data-entry-cursor");
    }
  };
  const sync = () => {
    stop();
    if (reducedMotion.matches && hero.hasAttribute("data-intro-complete")) {
      typed.textContent = chars.join("");
      count = chars.length;
      done = true;
      button.removeAttribute("data-entry-cursor");
      return;
    }
    if (!hero.hasAttribute("data-text-entered") || !canRun() || done) return;
    button.setAttribute("data-entry-cursor", "");
    typeNext();
  };
  // 文案被改写时重新打一遍
  const labelObserver = new MutationObserver(() => {
    const next = Array.from(label.textContent ?? "");
    if (next.join("") === chars.join("")) return;
    chars = next;
    if (done) {
      typed.textContent = chars.join("");
    }
    else {
      count = 0;
      typed.textContent = "";
      sync();
    }
  });
  labelObserver.observe(label, { childList: true, characterData: true, subtree: true });
  const heroObserver = new MutationObserver(sync);
  heroObserver.observe(hero, { attributes: true, attributeFilter: ["data-text-entered", "data-intro-complete", "data-motion-running"] });
  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener("change", sync);
  sync();

  return () => {
    stop();
    labelObserver.disconnect();
    heroObserver.disconnect();
    document.removeEventListener("visibilitychange", sync);
    reducedMotion.removeEventListener("change", sync);
    typed.remove();
    delete button.dataset.typingEntry;
    delete button.dataset.entryCursor;
  };
}

/* ── 当前时间 ───────────────────────────────────────────────────── */

/** 两位补零 */
const pad2 = (value: number): string => String(value).padStart(2, "0");

/** 首屏底部的当前时间：年月日时分秒共 14 位数字，每秒对齐整秒刷新，数字换成对应的 SVG 符号；按访客本地时区显示 */
export function mountClock(hero: HTMLElement): () => void {
  const clock = hero.querySelector<HTMLElement>("[data-clock]");
  if (!clock) return () => {};
  const digits = [...clock.querySelectorAll<HTMLElement>("[data-clock-digit]")]
    .sort((a, b) => Number(a.dataset.clockDigit) - Number(b.dataset.clockDigit));
  let timer = 0;
  let active = false;

  const update = () => {
    clearTimeout(timer);
    if (!active || document.hidden) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(pad2);
    const text = String(year).padStart(4, "0") + pad2(month) + pad2(day) + time.join("");
    digits.forEach((digit, index) => {
      const value = text[index] ?? "0";
      if (digit.dataset.value === value) return;
      digit.dataset.value = value;
      digit.querySelector("use")?.setAttribute("href", `#payathon-digit-${value}`);
    });
    clock.setAttribute("aria-label", `当前时间 ${year}年${month}月${day}日 ${time.join(":")}`);
    // 对齐到下一个整秒，多等 10ms 避免恰好落在边界前
    timer = window.setTimeout(update, 1000 - (Date.now() % 1000) + 10);
  };

  const stopActivity = observeActivity(hero, (running) => {
    active = running;
    update();
  });
  return () => {
    clearTimeout(timer);
    stopActivity();
  };
}

/* ── 命令行 ─────────────────────────────────────────────────────── */

export interface TerminalLine {
  text: string;
  /** 首尾两行用强调色 */
  accent?: boolean;
}

type TokenKind = "comment" | "string" | "keyword" | "command" | "property" | "plain";

interface Token {
  text: string;
  kind: TokenKind;
}

/** 命令行最多保留的行数，超出时最早的行滚出 */
const TERMINAL_MAX_LINES = 7;
/** 打字速度倍率：基础间隔除以它 */
const TERMINAL_SPEED = 3;

/** 把一行代码切成带高亮类型的片段 */
function tokenize(line: string): Token[] {
  if (/^\s*(?:\/\*|\*|\/\/)/.test(line)) return [{ text: line, kind: "comment" }];
  const pattern = /"[^"\n]*"|\bconst\b|\b[a-z_][\w-]*(?=\s*:)|\$|\bnpx\b|\bnpm\b|reborn-ui@latest|[^"$]+?(?="|\$|\bconst\b|\bnpx\b|\bnpm\b|reborn-ui@latest|\b[a-z_][\w-]*\s*:|$)/gi;
  return [...line.matchAll(pattern)].map((match) => {
    const text = match[0];
    const kind: TokenKind = text.startsWith("\"")
      ? "string"
      : text === "const"
        ? "keyword"
        : text === "$" || text === "npx" || text === "npm" || text === "reborn-ui@latest"
          ? "command"
          : /^[a-z_][\w-]*$/i.test(text)
            ? "property"
            : "plain";
    return { text, kind };
  });
}

/** 首屏左下角的命令行打字机：逐字打出代码，偶尔光标闪两下，打完停 4.2 秒后清屏重来 */
export function mountHeroTerminal(hero: HTMLElement, lines: TerminalLine[]): () => void {
  const terminal = hero.querySelector<HTMLElement>("[data-hero-terminal]");
  const output = terminal?.querySelector<HTMLElement>("[data-terminal-output]");
  if (!terminal || !output || !lines.length) return () => {};
  // 闭包里 TS 不保留上面的非空收窄，单独存一个确定非空的引用
  const screen: HTMLElement = output;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // 原站模板里的空行写成 &nbsp; 占位，打字时去掉不间断空格
  const tokens = lines.map((line) => tokenize(line.text.replace(/\u00A0/g, "")));
  const chars = tokens.map((row) => row.flatMap((token) => Array.from(token.text, (char) => ({ char, kind: token.kind }))));

  let active = false;
  let timer = 0;
  let lineIndex = 0;
  let charIndex = 0;
  let currentLine: HTMLElement | null = null;
  let currentText: Text | null = null;
  let currentKind = "";
  let blinks = 0;
  const cursor = document.createElement("span");
  cursor.className = "terminal-cursor";
  cursor.textContent = "█";
  cursor.setAttribute("aria-hidden", "true");
  screen.replaceChildren();

  const wait = (ms: number, exact = false) => {
    timer = window.setTimeout(typeNext, exact ? ms : ms / TERMINAL_SPEED);
  };
  /** 新起一行，超过行数上限时滚掉最早的一行 */
  const appendLine = () => {
    const line = document.createElement("div");
    line.className = "terminal-line";
    line.setAttribute("data-astro-cid-l7ur5rbf", "");
    screen.append(line);
    while (screen.children.length > TERMINAL_MAX_LINES) screen.firstElementChild?.remove();
    return line;
  };
  function typeNext() {
    timer = 0;
    if (!active || !hero.hasAttribute("data-intro-complete")) return;
    if (!currentLine) {
      if (lineIndex === lines.length) {
        lineIndex = 0;
        screen.replaceChildren();
      }
      currentLine = appendLine();
      currentLine.append(cursor);
      charIndex = 0;
      currentText = null;
      currentKind = "";
      blinks = 3;
    }
    // 新行开头和打字途中偶尔让光标闪几下，像在思考
    if (blinks > 0) {
      cursor.style.opacity = blinks % 2 ? "1" : "0";
      blinks--;
      wait(35 + Math.random() * 30);
      return;
    }
    cursor.style.opacity = "1";
    const next = chars[lineIndex]![charIndex];
    if (!next) {
      cursor.remove();
      if (!charIndex) currentLine.textContent = " ";
      currentLine = null;
      lineIndex++;
      wait(lineIndex === lines.length ? 4200 : lineIndex === 1 ? 850 : 160 + Math.random() * 260, lineIndex === lines.length);
      return;
    }
    if (!currentText || currentKind !== next.kind) {
      currentKind = next.kind;
      const span = document.createElement("span");
      span.className = `terminal-token-${currentKind}`;
      currentText = document.createTextNode("");
      span.append(currentText);
      currentLine.insertBefore(span, cursor);
    }
    currentText.appendData(next.char);
    charIndex++;
    if (charIndex % 7 === 0 && Math.random() > 0.35) blinks = 3;
    wait(/[,:;{}]/.test(next.char) ? 85 + Math.random() * 100 : 18 + Math.random() * 36);
  }

  const sync = () => {
    clearTimeout(timer);
    timer = 0;
    if (!active || !hero.hasAttribute("data-intro-complete")) return;
    if (reducedMotion.matches) {
      // 减弱动效：直接显示最后 7 行
      screen.replaceChildren();
      currentLine = null;
      lineIndex = 0;
      tokens.slice(-TERMINAL_MAX_LINES).forEach((row) => {
        const line = appendLine();
        for (const token of row) {
          const span = document.createElement("span");
          span.className = `terminal-token-${token.kind}`;
          span.textContent = token.text || " ";
          line.append(span);
        }
      });
      return;
    }
    wait(180);
  };

  const introObserver = new MutationObserver(sync);
  introObserver.observe(hero, { attributes: true, attributeFilter: ["data-intro-complete"] });
  const stopActivity = observeActivity(hero, (running) => {
    active = running;
    sync();
  });
  reducedMotion.addEventListener("change", sync);

  return () => {
    clearTimeout(timer);
    introObserver.disconnect();
    stopActivity();
    reducedMotion.removeEventListener("change", sync);
    screen.replaceChildren();
  };
}
