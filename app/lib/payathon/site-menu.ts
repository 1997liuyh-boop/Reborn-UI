/**
 * 顶栏导航「岛」：桌面端是一枚胶囊，展开子菜单时胶囊按目标宽度伸展、下拉面板贴着胶囊右缘落下；
 * 窄屏是汉堡按钮 + 展开面板。点击胶囊内的链接或按钮时胶囊会被「按下去」再弹回。
 *
 * 原站把这段脚本内联在顶栏里、对页面上所有 .siteMenuNav 生效；这里只作用于传入的一个导航。
 */

/** 子菜单列宽的测量用画布，全模块共用一个 */
let measureContext: CanvasRenderingContext2D | null = null;
function textMeasure(): CanvasRenderingContext2D | null {
  if (!measureContext) measureContext = document.createElement("canvas").getContext("2d");
  return measureContext;
}

/** 挂载顶栏导航交互 */
export function mountSiteMenu(nav: HTMLElement): () => void {
  const desktop = matchMedia("(min-width: 981px)");
  const wide = matchMedia("(min-width: 1601px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const pressAnimations = new Map<Element, Animation>();
  /** 收起状态下胶囊的宽度，收起子菜单时沿用，避免收起过程中重新测量导致跳动 */
  let restingWidth: number | undefined;

  const clearPressAnimations = () => {
    pressAnimations.forEach((animation) => animation.cancel());
    pressAnimations.clear();
  };

  /** 点击时胶囊（窄屏是汉堡按钮）下沉 6px 再弹回 */
  const pressIsland = (cluster: Element) => {
    const surface = cluster.querySelector<HTMLElement>(desktop.matches ? ".siteMenuPanel" : ".siteMenuToggle");
    if (!surface) return;
    const previous = pressAnimations.get(surface);
    const start = getComputedStyle(surface).translate;
    previous?.cancel();
    pressAnimations.delete(surface);
    if (reducedMotion.matches || document.hidden) return;
    const animation = surface.animate(
      [
        { translate: start === "none" ? "0 0" : start, offset: 0 },
        { translate: "0 6px", offset: 0.3, easing: "cubic-bezier(.22,1,.36,1)" },
        { translate: "0 0", offset: 1 },
      ],
      { duration: 340, easing: "ease-out" },
    );
    pressAnimations.set(surface, animation);
    animation.onfinish = () => {
      if (pressAnimations.get(surface) === animation) pressAnimations.delete(surface);
    };
  };

  /** 计算胶囊与下拉面板的尺寸、位置，写成 CSS 变量 */
  const sizeIsland = (closing = false) => {
    if (!desktop.matches) return;
    const cluster = nav.querySelector<HTMLElement>(".siteMenuCluster");
    const links = nav.querySelector<HTMLElement>(".siteMenuLinks");
    const panel = cluster?.querySelector<HTMLElement>(".siteMenuPanel");
    if (!cluster || !links || !panel) return;
    // 面板还没显示时测出来是 0，会把胶囊压扁到账号区下面，等能测时再来
    if (!links.getClientRects().length) return;
    const content = nav.querySelector<HTMLElement>(".siteMenuContent:not([hidden])");
    // 收起只改状态，沿用收起前测好的宽度
    if (closing && !content && restingWidth !== undefined) {
      cluster.style.setProperty("--island-width", `${restingWidth}px`);
      cluster.removeAttribute("data-island-expanded");
      return;
    }
    // 静止状态的测量属于布局初始化，不要让宽度过渡动起来
    const restingMeasure = !content && !cluster.hasAttribute("data-island-expanded");
    const suppressTransition = restingMeasure
      && !(nav.hasAttribute("data-reading-nav") && nav.hasAttribute("data-reading-interacted") && wide.matches);
    if (suppressTransition) panel.style.transition = "none";
    const restWidth = Math.ceil(links.getBoundingClientRect().width);
    restingWidth = restWidth;
    cluster.style.setProperty("--island-rest-width", `${restWidth}px`);
    // 展开时右侧标签不动，左上角给吉祥物留出 72px 的位置
    const openWidth = restWidth + 72;
    cluster.style.setProperty("--island-open-width", `${openWidth}px`);
    cluster.style.setProperty("--island-width", `${content ? openWidth : restWidth}px`);
    const reading = nav.hasAttribute("data-reading-nav");
    const upperHeight = reading ? Math.ceil(links.getBoundingClientRect().height) : 40;
    cluster.style.setProperty("--island-height", `${upperHeight}px`);
    cluster.style.setProperty("--dropdown-top", `${upperHeight}px`);

    if (content) {
      cluster.dataset.menuSurface = content.dataset.menuKey === "payathon" ? "activity" : "standard";
      const columns = [...content.querySelectorAll<HTMLElement>(".megaCol")];
      // 每列按最长的标题 / 描述实测宽度，限制在 200 到 320 之间
      const columnWidths = columns.map((column) => {
        let width = 200;
        column.querySelectorAll<HTMLElement>(".megaResourceTitle,.megaResourceDesc,.megaResourceChinese,.megaLabel").forEach((label) => {
          const style = getComputedStyle(label);
          const context = textMeasure();
          if (!context) return;
          context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const textWidth = context.measureText((label.textContent ?? "").trim()).width;
          const logoWidth = label.closest(".megaResource")?.querySelector(".megaResourceLogo") ? 38 : 0;
          width = Math.max(width, Math.min(320, textWidth + 40 + logoWidth));
        });
        return Math.ceil(width);
      });
      const compact = content.dataset.menuKey === "act-protocol";
      const activity = content.dataset.menuKey === "payathon";
      const clientWidth = document.documentElement.clientWidth;
      const width = Math.min(
        clientWidth - 48,
        activity
          ? 340
          : compact
            ? columnWidths.reduce((sum, value) => sum + value, 0) + Math.max(0, columns.length - 1) * 12 + 24
            : 900,
      );
      content.style.setProperty("--dropdown-columns", `repeat(${columns.length},minmax(0,1fr))`);
      cluster.style.setProperty("--dropdown-width", `${width}px`);
      const toggle = content.parentElement?.querySelector<HTMLElement>("[data-site-group-toggle]");
      const toggleRect = toggle?.getBoundingClientRect();
      const panelRight = cluster.getBoundingClientRect().right;
      // 用目标宽度定位，不取过渡途中的测量值
      const preferredLeft = activity
        ? panelRight - width
        : compact && toggleRect
          ? toggleRect.left + toggleRect.width / 2 - width / 2
          : panelRight - openWidth;
      const left = Math.max(24, Math.min(clientWidth - width - 24, preferredLeft));
      cluster.style.setProperty("--dropdown-right", `${panelRight - left - width}px`);
      cluster.style.setProperty("--dropdown-height", `${Math.ceil(content.getBoundingClientRect().height)}px`);
    }
    cluster.toggleAttribute("data-island-expanded", Boolean(content));
    if (suppressTransition) {
      void panel.offsetWidth;
      panel.style.removeProperty("transition");
    }
  };

  const closeGroups = (restoreFocus = false) => {
    const active = nav.querySelector<HTMLElement>("[data-site-group-toggle][aria-expanded=\"true\"]");
    nav.querySelectorAll(".siteMenuGroup").forEach((group) => {
      group.querySelector("[data-site-group-toggle]")?.setAttribute("aria-expanded", "false");
      const content = group.querySelector<HTMLElement>(".siteMenuContent");
      if (content) content.hidden = true;
    });
    if (restoreFocus && active) active.focus();
    sizeIsland(true);
  };

  const syncPanel = () => {
    const open = nav.classList.contains("is-menu-open");
    const panel = nav.querySelector<HTMLElement>(".siteMenuPanel");
    const toggle = nav.querySelector<HTMLElement>("[data-site-menu-toggle]");
    if (!panel || !toggle) return;
    const hidden = desktop.matches
      ? wide.matches && nav.hasAttribute("data-reading-nav") && !nav.hasAttribute("data-reading-nav-open")
      : !open;
    panel.inert = hidden;
    panel.setAttribute("aria-hidden", String(hidden));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "收起导航菜单" : "展开导航菜单");
    toggle.querySelector(".siteMenuToggleIcon path")?.setAttribute("d", open ? "M6 6l12 12M6 18L18 6" : "M5 8h14M5 16h14");
  };

  const closeMenu = (restoreFocus = false) => {
    const wasOpen = nav.classList.contains("is-menu-open");
    closeGroups(restoreFocus && desktop.matches);
    nav.classList.remove("is-menu-open");
    syncPanel();
    if (restoreFocus && wasOpen && !desktop.matches) nav.querySelector<HTMLElement>("[data-site-menu-toggle]")?.focus();
  };

  const openMenu = () => {
    nav.classList.add("is-menu-open");
    syncPanel();
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const cluster = target.closest(".siteMenuCluster");
    if (cluster && nav.contains(cluster) && target.closest("a, button")) pressIsland(cluster);

    const toggle = target.closest("[data-site-menu-toggle]");
    if (toggle && nav.contains(toggle)) {
      if (nav.classList.contains("is-menu-open")) closeMenu();
      else openMenu();
      return;
    }

    const groupToggle = target.closest<HTMLElement>("[data-site-group-toggle]");
    if (groupToggle && nav.contains(groupToggle)) {
      const group = groupToggle.closest(".siteMenuGroup");
      const panel = group?.closest(".siteMenuPanel");
      const island = group?.closest<HTMLElement>(".siteMenuCluster");
      if (!group || !panel || !island) return;
      const willOpen = groupToggle.getAttribute("aria-expanded") !== "true";
      // 从一个子菜单切到另一个时，先让前一个结束，否则它的退场会继承新菜单的宽度而抖动
      const switching = willOpen && Boolean(panel.querySelector(".siteMenuContent:not([hidden])"));
      if (switching) island.setAttribute("data-menu-reset", "");
      panel.querySelectorAll(".siteMenuGroup").forEach((other) => {
        other.querySelector("[data-site-group-toggle]")?.setAttribute("aria-expanded", "false");
        const content = other.querySelector<HTMLElement>(".siteMenuContent");
        if (content) content.hidden = true;
      });
      if (switching) {
        void (panel as HTMLElement).offsetHeight;
        island.removeAttribute("data-menu-reset");
      }
      groupToggle.setAttribute("aria-expanded", String(willOpen));
      const content = group.querySelector<HTMLElement>(".siteMenuContent");
      if (content) content.hidden = !willOpen;
      sizeIsland(!willOpen);
      return;
    }

    // 点到导航外、点了链接，或活动菜单开着时点到活动入口以外，都收起
    if (!nav.contains(target) || target.closest("a") || (nav.querySelector("[data-menu-key=\"payathon\"]:not([hidden])") && !target.closest(".activityEntry"))) {
      closeMenu();
    }
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeMenu(true);
  };
  const onFocusIn = (event: FocusEvent) => {
    if (!nav.contains(event.target as Node)) closeMenu();
  };
  const onVisibility = () => {
    if (document.hidden) clearPressAnimations();
  };
  const onDesktopChange = () => closeMenu();
  const onResize = () => sizeIsland();

  reducedMotion.addEventListener("change", clearPressAnimations);
  document.addEventListener("visibilitychange", onVisibility);
  desktop.addEventListener("change", onDesktopChange);
  window.addEventListener("resize", onResize);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("focusin", onFocusIn);
  let disposed = false;
  document.fonts.ready.then(() => {
    if (!disposed) sizeIsland();
  });
  closeMenu();

  return () => {
    disposed = true;
    clearPressAnimations();
    closeMenu();
    reducedMotion.removeEventListener("change", clearPressAnimations);
    document.removeEventListener("visibilitychange", onVisibility);
    desktop.removeEventListener("change", onDesktopChange);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("focusin", onFocusIn);
  };
}
