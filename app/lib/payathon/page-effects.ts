/**
 * 页面级的几段小脚本：区块入场、组件数滚动、提交日历的悬浮提示。
 * 原站写在活动页的同一个内联模块里，这里拆成三个函数，各自返回清理函数。
 */

/* ── 区块入场 ─────────────────────────────────────────────────────── */

/** 参与入场动画的元素：标题区、卡片、规则列表等，按出现顺序错开 55ms */
const REVEAL_SELECTOR = ".event-section-head,.benefit-grid > article,.track-family > div:first-child,.track-grid > article,.reward-summary,.steps-grid,.schedule-calendar,.criteria-grid > article,.rules-layout > div,.rules-layout > ol,.faq-list,.event-closing,.event-data-notes,.partner-benefits-access,.partner-benefits-grid > article:not([data-benefit-loop-copy]),.partner-wall-group,.partner-wall-note";

/**
 * 各区块元素滚进视口时从下方 24px 淡入；已经滚过的不再播放。
 * 奖励区的赛道小标题（.reward-summary）在视口内时标记 is-breathing，让旁边的色条呼吸发光。
 */
export function mountScrollReveal(page: HTMLElement): () => void {
  const sections = [...page.querySelectorAll<HTMLElement>(".event-section")];
  if (!sections.length) return () => {};
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const targets = [...new Set(sections.flatMap((section) => [...section.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)]))]
    .filter((el) => !el.parentElement?.closest(".event-closing"));
  const running = new Map<HTMLElement, Animation>();
  const summaries = targets.filter((el) => el.matches(".reward-summary"));
  const visibleSummaries = new Set<Element>();

  const syncBreathing = () => summaries.forEach((el) => {
    el.classList.toggle("is-breathing", visibleSummaries.has(el) && !document.hidden && !reducedMotion.matches);
  });
  const summaryObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? visibleSummaries.add(entry.target) : visibleSummaries.delete(entry.target)));
    syncBreathing();
  });
  summaries.forEach((el) => summaryObserver.observe(el));

  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (!entry.isIntersecting) {
        // 动画途中被滚出视口：直接落位，下次不再播放
        if (running.has(el)) settle(el);
        continue;
      }
      if (running.has(el)) continue;
      el.removeAttribute("data-scroll-reveal");
      if (reducedMotion.matches) {
        settle(el);
        continue;
      }
      const siblings = [...(el.parentElement?.children ?? [])].filter((child) => targets.includes(child as HTMLElement));
      const delay = Math.min(siblings.indexOf(el) * 55, 165);
      // 权益卡片自身用 transform 做倾斜，入场改用独立的 translate 属性，避免互相覆盖
      const keyframes = el.matches(".partner-benefit-card")
        ? [{ opacity: 0, translate: "0 24px" }, { opacity: 1, translate: "0 0" }]
        : [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }];
      const animation = el.animate(keyframes, { duration: 560, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
      running.set(el, animation);
      if (document.hidden) animation.pause();
      animation.finished.then(() => settle(el)).catch(() => {});
    }
  }, { rootMargin: "0px 0px -24px 0px", threshold: 0 });

  /** 结束入场：去掉标记、停止观察、取消进行中的动画 */
  function settle(el: HTMLElement) {
    el.removeAttribute("data-scroll-reveal");
    revealObserver.unobserve(el);
    running.get(el)?.cancel();
    running.delete(el);
  }

  const onMotionChange = () => {
    if (reducedMotion.matches) targets.forEach(settle);
    syncBreathing();
  };
  const onVisibility = () => {
    running.forEach((animation) => (document.hidden ? animation.pause() : animation.play()));
    syncBreathing();
  };
  // 键盘聚焦到还没入场的元素时立即落位，避免焦点落在透明元素上
  const onFocusIn = (event: FocusEvent) => {
    const el = (event.target as Element).closest<HTMLElement>("[data-scroll-reveal]");
    if (el) settle(el);
  };

  for (const el of targets) {
    if (reducedMotion.matches || el.getBoundingClientRect().bottom <= 0) continue;
    el.setAttribute("data-scroll-reveal", "");
    revealObserver.observe(el);
  }
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("visibilitychange", onVisibility);
  reducedMotion.addEventListener("change", onMotionChange);

  return () => {
    summaryObserver.disconnect();
    visibleSummaries.clear();
    summaries.forEach((el) => el.classList.remove("is-breathing"));
    revealObserver.disconnect();
    targets.forEach((el) => el.removeAttribute("data-scroll-reveal"));
    running.forEach((animation) => animation.cancel());
    running.clear();
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("visibilitychange", onVisibility);
    reducedMotion.removeEventListener("change", onMotionChange);
  };
}

/* ── 奖池数字 ─────────────────────────────────────────────────────── */

interface DigitWheel {
  strip: HTMLSpanElement;
  previous: HTMLSpanElement;
  current: HTMLSpanElement;
  next: HTMLSpanElement;
  /** 该位对应的数量级 */
  power: number;
  /** 高位比低位晚停 55ms，形成从右往左依次落定的效果 */
  delay: number;
  digit: number;
}

/**
 * 奖池「¥200,000」像机械计数器一样滚动：前 1.2 秒按缓出曲线滚到终值减 3，
 * 再用 200 / 400 / 1000ms 三段平滑步进逐个跳完最后三下，每一位的数字条按小数部分上下滑动。
 */
export function mountPrizeCounter(root: HTMLElement): () => void {
  const counter = root.querySelector<HTMLElement>("[data-prize-count]");
  if (!counter) return () => {};
  const total = Number(counter.dataset.prizeCount);
  // 数字前的符号：原站是奖金「¥」，首页统计组件数时传空串（data-prize-prefix=""）
  const prefix = counter.dataset.prizePrefix ?? "¥";
  const format = new Intl.NumberFormat("en-US");
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  let frame = 0;
  let lastNow: number | null = null;
  let elapsed = 0;
  let visible = false;
  let complete = counter.dataset.countComplete === "true";
  const wheels: DigitWheel[] = [];
  const digitCount = String(total).length;
  const duration = 2800 + (digitCount - 1) * 55;

  /** 把「¥200,000」这样的文本拆成符号与数字轮 */
  const buildWheels = () => {
    const fragment = document.createDocumentFragment();
    for (const char of `${prefix}${format.format(total)}`) {
      if (!/\d/.test(char)) {
        const symbol = document.createElement("span");
        symbol.className = "prize-symbol";
        symbol.textContent = char;
        fragment.append(symbol);
        continue;
      }
      const digit = document.createElement("span");
      digit.className = "prize-digit";
      const windowEl = document.createElement("span");
      windowEl.className = "prize-digit-window";
      const strip = document.createElement("span");
      strip.className = "prize-digit-strip";
      const previous = document.createElement("span");
      const current = document.createElement("span");
      const next = document.createElement("span");
      strip.append(previous, current, next);
      windowEl.append(strip);
      digit.append(windowEl);
      fragment.append(digit);
      wheels.push({ strip, previous, current, next, power: 10 ** (digitCount - wheels.length - 1), delay: (digitCount - wheels.length - 1) * 55, digit: -1 });
    }
    counter.replaceChildren(fragment);
    counter.classList.add("prize-wheels");
  };

  /** 时间 → 计数值：先缓出逼近终值减 3，再三段平滑步进 */
  const valueAt = (time: number): number => {
    if (time < 1200) return (total - 3) * (1 - (1 - time / 1200) ** 5);
    let rest = time - 1200;
    let value = total - 3;
    for (const span of [200, 400, 1000]) {
      if (rest < span) {
        const t = rest / span;
        return value + t * t * (3 - 2 * t);
      }
      rest -= span;
      value++;
    }
    return total;
  };

  const render = (value: number, time = 0) => {
    for (const wheel of wheels) {
      // 最后三步时每一位按自己的延迟取值，高位晚落定
      const own = time >= 1800 ? valueAt(Math.max(1800, time - wheel.delay)) : value;
      const whole = Math.floor(own / wheel.power);
      const digit = whole % 10;
      // 只有该位即将进位的最后一个单位内才滑动
      const slide = Math.max(0, Math.min(1, own - (whole * wheel.power + wheel.power - 1)));
      if (digit !== wheel.digit) {
        wheel.previous.textContent = String((digit + 9) % 10);
        wheel.current.textContent = String(digit);
        wheel.next.textContent = String((digit + 1) % 10);
        wheel.digit = digit;
      }
      wheel.strip.style.transform = `translateY(${-slide * 1.2}em)`;
      wheel.previous.style.opacity = "0";
      wheel.current.style.opacity = String((1 - slide) ** 0.65);
      wheel.next.style.opacity = String(slide ** 0.65);
    }
  };

  const finish = () => {
    complete = true;
    counter.dataset.countComplete = "true";
    if (wheels.length) render(total);
    else counter.textContent = `¥${format.format(total)}`;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const step = (now: number) => {
    frame = 0;
    // 每帧最多推进 64ms，切回页面时不会跳到结尾
    if (lastNow !== null) elapsed += Math.min(now - lastNow, 64);
    lastNow = now;
    render(valueAt(elapsed), elapsed);
    if (elapsed >= duration) {
      finish();
      return;
    }
    frame = requestAnimationFrame(step);
  };

  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastNow = null;
    if (reducedMotion.matches) {
      finish();
      return;
    }
    if (!complete && visible && !document.hidden) frame = requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    sync();
  }, { threshold: 0.6 });
  if (reducedMotion.matches || counter.getBoundingClientRect().bottom <= 0 || complete) {
    finish();
  }
  else {
    buildWheels();
    render(0);
    observer.observe(counter);
  }
  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener("change", sync);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", sync);
    reducedMotion.removeEventListener("change", sync);
    counter.textContent = `¥${format.format(total)}`;
    counter.classList.remove("prize-wheels");
  };
}

/* ── 日历 ─────────────────────────────────────────────────────── */

/**
 * 日历（首页的提交日历）：指针或焦点停在某一天上时，弹出写着日期、所属阶段与当天提交数的提示，
 * 同时高亮对应阶段的说明；方向键按周 / 按天移动焦点，Home / End 跳到首尾。
 */
export function mountSchedule(root: HTMLElement): () => void {
  const schedule = root.querySelector<HTMLElement>("[data-schedule]");
  const calendar = schedule?.querySelector<HTMLElement>("[data-schedule-calendar]");
  const tooltip = schedule?.querySelector<HTMLElement>(".schedule-tooltip");
  const scroller = schedule?.querySelector<HTMLElement>(".schedule-calendar-scroll");
  if (!schedule || !calendar || !tooltip || !scroller) return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  const days = [...schedule.querySelectorAll<HTMLButtonElement>("button.schedule-day")];
  let describedDay: HTMLElement | null = null;
  let settleTimer = 0;

  /** 格子的日期换算成天序号；没有 data-date 时为 NaN */
  const dayNumber = (el: HTMLElement | undefined) =>
    el?.dataset.date ? Date.parse(`${el.dataset.date}T00:00:00Z`) / 86_400_000 : Number.NaN;

  /**
   * 按日期移动焦点：可交互的格子不一定逐日连续（提交日历里只有当天有提交的格子是按钮），
   * 所以先算目标日期，再取该方向上离它最近的按钮；格子没有日期时退回按下标移动。
   */
  const stepByDate = (index: number, offset: number): number => {
    const current = dayNumber(days[index]);
    if (Number.isNaN(current)) return Math.max(0, Math.min(days.length - 1, index + offset));
    const target = current + offset;
    if (offset > 0) {
      const found = days.findIndex((el) => dayNumber(el) >= target);
      return found < 0 ? days.length - 1 : found;
    }
    for (let i = days.length - 1; i >= 0; i--) {
      if (dayNumber(days[i]) <= target) return i;
    }
    return 0;
  };

  const hideTooltip = () => {
    clearTimeout(settleTimer);
    tooltip.hidden = true;
    describedDay?.removeAttribute("aria-describedby");
    describedDay = null;
  };

  const showTooltip = (day: HTMLElement) => {
    if (describedDay === day && !tooltip.hidden) return;
    describedDay?.removeAttribute("aria-describedby");
    describedDay = day;
    const time = tooltip.querySelector("time");
    if (time) {
      time.textContent = (day.dataset.date ?? "").replaceAll("-", ".");
      time.dateTime = day.dataset.date ?? "";
    }
    const phases = (day.dataset.phases ?? "").split(" ").filter(Boolean).map((phase) => {
      const span = document.createElement("span");
      span.dataset.phase = phase;
      span.textContent = schedule.querySelector(`.schedule-caption[data-phase="${phase}"] h3`)?.textContent?.trim() ?? "";
      return span;
    });
    // 提交日历的格子带当天提交数，排在阶段名后面
    if (day.dataset.commits) {
      const count = document.createElement("span");
      count.dataset.commitCount = "";
      count.textContent = `${day.dataset.commits} 次提交`;
      phases.push(count);
    }
    tooltip.querySelector("[data-tooltip-phases]")?.replaceChildren(...phases);
    tooltip.hidden = false;
    // 默认在格子上方居中，上方放不下时翻到下方，左右不超出视口 12px
    const dayRect = day.getBoundingClientRect();
    const calendarRect = calendar.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const left = Math.max(12 - calendarRect.left, Math.min(dayRect.left + dayRect.width / 2 - calendarRect.left - width / 2, innerWidth - 12 - calendarRect.left - width));
    const below = dayRect.top < height + 16;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${(below ? dayRect.bottom + 10 : dayRect.top - height - 10) - calendarRect.top}px`;
    tooltip.dataset.side = below ? "below" : "above";
    tooltip.style.setProperty("--tip-x", `${dayRect.left + dayRect.width / 2 - calendarRect.left - left}px`);
    day.setAttribute("aria-describedby", tooltip.id);
  };

  const activate = (target: Element | null) => {
    clearTimeout(settleTimer);
    const day = target?.closest<HTMLElement>("button.schedule-day");
    const caption = target?.closest<HTMLElement>(".schedule-caption");
    const phases = day?.dataset.phases || caption?.dataset.phase;
    if (phases) schedule.dataset.activePhases = phases;
    else delete schedule.dataset.activePhases;
    if (day) showTooltip(day);
    else hideTooltip();
  };

  // 离开后稍等 220ms 再收起，键盘焦点还在日历里时保持显示
  const settleLater = () => {
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => activate(schedule.querySelector(":focus-visible")), 220);
  };
  const onEnter = (event: Event) => {
    const hit = (event.target as Element).closest("button.schedule-day,.schedule-caption");
    if (hit) activate(hit);
    else settleLater();
  };
  const onLeave = () => {
    const hit = schedule.querySelector(":focus-visible") || schedule.querySelector("button.schedule-day:hover,.schedule-caption:hover");
    if (hit) activate(hit);
    else settleLater();
  };

  schedule.addEventListener("pointerover", onEnter, { signal });
  schedule.addEventListener("focusin", onEnter, { signal });
  schedule.addEventListener("pointerleave", onLeave, { signal });
  schedule.addEventListener("focusout", () => queueMicrotask(onLeave), { signal });
  schedule.addEventListener("click", (event) => {
    const day = (event.target as Element).closest("button.schedule-day");
    if (day) days.forEach((el) => (el.tabIndex = el === day ? 0 : -1));
  }, { signal });
  schedule.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideTooltip();
      return;
    }
    const index = days.indexOf(event.target as HTMLButtonElement);
    if (index < 0) return;
    // 日历按列排周：左右跨一周（7 天），上下跨一天
    const offset = ({ ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 } as Record<string, number>)[event.key];
    if (offset === undefined && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? days.length - 1 : stepByDate(index, offset ?? 0);
    days[index]!.tabIndex = -1;
    days[next]!.tabIndex = 0;
    days[next]!.scrollIntoView({ block: "nearest", inline: "nearest" });
    days[next]!.focus({ preventScroll: true });
  }, { signal });
  scroller.addEventListener("scroll", hideTooltip, { signal, passive: true });
  // 窄屏横向滚动时，初始把第一天滚到可见位置
  if (scroller.scrollWidth > scroller.clientWidth && days[0]) scroller.scrollLeft = Math.max(0, days[0].offsetLeft - 16);
  window.addEventListener("resize", hideTooltip, { signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) activate(null);
  }, { signal });

  return () => {
    hideTooltip();
    controller.abort();
    delete schedule.dataset.activePhases;
  };
}
