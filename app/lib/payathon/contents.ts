/**
 * 左侧页内目录：首屏滚过后出现，随滚动高亮当前章节，链接按与当前位置的距离做「程序坞」式放大。
 *
 * 宽屏（≥1440px）常驻展开，窄屏收成一个 details 下拉。页面进入浅色区（权益、合作伙伴）时，
 * 目录文字需要反色：原站把每个链接文字和 PAYATHON 字标各复制一份放进一个 mix-blend-mode 叠加层，
 * 每帧对齐到原文字的位置，靠混合模式自动在深浅背景之间反色。
 *
 * 原站把叠加层挂在 body 上；本页样式都收在 #payathon-page 里，所以叠加层挂到页面根节点上，
 * 顶栏高度变量也写在页面根节点上。
 */
export function mountContents(page: HTMLElement): () => void {
  const contents = page.querySelector<HTMLDetailsElement>("[data-event-contents]");
  const header = page.querySelector<HTMLElement>("[data-payathon-header]");
  const hero = page.querySelector<HTMLElement>(".payathon-hero");
  const nav = contents?.querySelector<HTMLElement>("nav");
  const linkList = contents?.querySelector<HTMLElement>(".contents-links");
  const current = contents?.querySelector<HTMLElement>("[data-contents-current]");
  if (!contents || !header || !hero || !nav || !linkList || !current) return () => {};

  const controller = new AbortController();
  const { signal } = controller;
  const wide = matchMedia("(min-width:1440px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const links = [...contents.querySelectorAll<HTMLAnchorElement>(".contents-links a")];
  const sections = links.map((link) => page.querySelector<HTMLElement>(`#${CSS.escape(link.hash.slice(1))}`));

  // 混合模式叠加层：链接文字与字标的白色部分各复制一份
  const blendLayer = document.createElement("div");
  blendLayer.className = "contents-blend-layer";
  blendLayer.setAttribute("aria-hidden", "true");
  blendLayer.hidden = true;
  const blendLabels = links.map((link) => {
    const span = document.createElement("span");
    span.textContent = link.textContent;
    blendLayer.append(span);
    return span;
  });
  const blendLogos = [...contents.querySelectorAll<SVGSVGElement>(".contents-brand svg")]
    .filter((svg) => svg.querySelector("path[fill=\"#FFFFFF\"]"))
    .map((svg) => {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.querySelectorAll("path:not([fill=\"#FFFFFF\"])").forEach((path) => path.remove());
      svg.querySelectorAll("path[fill=\"#FFFFFF\"]").forEach((path) => path.setAttribute("data-contents-invert", ""));
      const holder = document.createElement("span");
      holder.className = "contents-blend-logo";
      holder.append(clone);
      blendLayer.append(holder);
      return { source: svg, layer: holder };
    });
  page.append(blendLayer);
  contents.setAttribute("data-blend-ready", "");

  /** 叠加层逐项对齐到原文字，并裁到目录导航的可见范围内 */
  const syncBlendLayer = () => {
    blendLayer.hidden = !wide.matches || !contents.hasAttribute("data-visible");
    if (blendLayer.hidden) return;
    blendLogos.forEach(({ source, layer }) => {
      const rect = source.getBoundingClientRect();
      Object.assign(layer.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    });
    const navRect = nav.getBoundingClientRect();
    blendLayer.style.clipPath = `inset(${Math.max(0, navRect.top)}px 0 ${Math.max(0, innerHeight - navRect.bottom)}px 0)`;
    links.forEach((link, index) => {
      const label = blendLabels[index]!;
      // 当前项本身有高亮色，不需要反色副本
      label.hidden = link.hasAttribute("aria-current");
      if (label.hidden) return;
      const text = link.querySelector("span");
      if (!text) return;
      const rect = text.getBoundingClientRect();
      const style = getComputedStyle(text);
      // 链接被程序坞缩放过，按实际渲染高度反推字号
      const scale = rect.height / (Number.parseFloat(style.lineHeight) || 18);
      Object.assign(label.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: `${Number.parseFloat(style.fontSize) * scale}px`,
        lineHeight: `${rect.height}px`,
      });
    });
  };

  let frame = 0;
  let activeIndex = -1;
  let headerHeight = 60;
  let needsMeasure = true;
  let heroBottom = 0;
  let sectionTops: number[] = [];
  const scales = links.map(() => 0);
  let hoverIndex = -1;
  let focusIndex = -1;
  /** 缩放变化后再追 400ms 帧，让 CSS 过渡期间叠加层跟得上 */
  let followUntil = 0;

  const update = () => {
    frame = 0;
    if (needsMeasure) {
      sectionTops = sections.map((section) => (section ? section.getBoundingClientRect().top + scrollY : Infinity));
      heroBottom = hero.getBoundingClientRect().bottom + scrollY;
      needsMeasure = false;
    }
    const probe = scrollY + headerHeight + 100;
    contents.toggleAttribute("data-visible", heroBottom <= probe);
    let index = 0;
    sectionTops.forEach((top, i) => {
      if (top <= probe) index = i;
    });
    // 滚到底时最后一项算当前
    if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2) index = links.length - 1;
    // 当前项到下一节之间的进度，让放大中心在两项之间平滑过渡
    const progress = Math.max(0, 1 - ((sectionTops[index + 1] ?? Infinity) - probe) / 160);
    const center = hoverIndex >= 0 ? hoverIndex : focusIndex >= 0 ? focusIndex : index + (Number.isFinite(progress) ? progress : 0);
    links.forEach((link, i) => {
      const distance = Math.abs(i - center);
      const scale = reducedMotion.matches ? (i === index ? 1.18 : 1) : 1 + 0.18 * Math.exp((-distance * distance) / 1.1);
      const rounded = Math.round(scale * 1000) / 1000;
      if (scales[i] === rounded) return;
      scales[i] = rounded;
      link.style.setProperty("--dock-scale", String(rounded));
      if (wide.matches && !reducedMotion.matches) followUntil = performance.now() + 400;
    });
    if (index !== activeIndex) {
      activeIndex = index;
      links.forEach((link, i) => {
        if (i === index) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      current.textContent = (links[index]?.textContent ?? "").replace(/^\d+\s*/, "");
    }
    syncBlendLayer();
    if (wide.matches && performance.now() < followUntil) schedule();
  };

  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(update);
  }

  const resizeObserver = new ResizeObserver(() => {
    headerHeight = header.getBoundingClientRect().height;
    page.style.setProperty("--event-header-height", `${headerHeight}px`);
    needsMeasure = true;
    schedule();
  });
  resizeObserver.observe(header);
  resizeObserver.observe(hero);
  sections.forEach((section) => section && resizeObserver.observe(section));
  const headerObserver = new MutationObserver(schedule);
  headerObserver.observe(header, { attributes: true, attributeFilter: ["data-ready"] });
  nav.addEventListener("scroll", schedule, { passive: true, signal });

  linkList.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") return;
    const index = links.indexOf((event.target as Element).closest("a") as HTMLAnchorElement);
    if (index !== hoverIndex) {
      hoverIndex = index;
      schedule();
    }
  }, { signal });
  linkList.addEventListener("pointerleave", () => {
    hoverIndex = -1;
    schedule();
  }, { signal });
  linkList.addEventListener("focusin", (event) => {
    focusIndex = links.indexOf((event.target as Element).closest("a") as HTMLAnchorElement);
    schedule();
  }, { signal });
  linkList.addEventListener("focusout", () => {
    focusIndex = -1;
    schedule();
  }, { signal });

  const syncWide = () => {
    hoverIndex = -1;
    focusIndex = -1;
    contents.open = wide.matches;
    schedule();
  };
  wide.addEventListener("change", syncWide, { signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    else {
      needsMeasure = true;
      schedule();
    }
  }, { signal });
  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", () => {
    needsMeasure = true;
    schedule();
  }, { passive: true, signal });
  reducedMotion.addEventListener("change", schedule, { signal });

  // 点击目录：平滑滚到对应章节，扣掉顶栏高度再留 80px
  contents.addEventListener("click", (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>(".contents-links a");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = page.querySelector<HTMLElement>(`#${CSS.escape(link.hash.slice(1))}`);
    if (!section) return;
    event.preventDefault();
    if (!wide.matches) contents.open = false;
    const target = link.hash === "#overview" ? hero : section;
    history.pushState(history.state, "", link.hash);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    const top = target === hero ? 0 : scrollY + target.getBoundingClientRect().top - headerHeight - 80;
    window.scrollTo({ top, behavior: reducedMotion.matches ? "instant" : "smooth" });
  }, { signal });
  document.addEventListener("click", (event) => {
    if (!wide.matches && !contents.contains(event.target as Node)) contents.open = false;
  }, { signal });
  contents.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !wide.matches) {
      contents.open = false;
      contents.querySelector("summary")?.focus();
    }
  }, { signal });
  syncWide();

  return () => {
    blendLayer.remove();
    contents.querySelectorAll("[data-contents-invert]").forEach((el) => el.removeAttribute("data-contents-invert"));
    contents.removeAttribute("data-blend-ready");
    controller.abort();
    resizeObserver.disconnect();
    headerObserver.disconnect();
    cancelAnimationFrame(frame);
    page.style.removeProperty("--event-header-height");
  };
}
