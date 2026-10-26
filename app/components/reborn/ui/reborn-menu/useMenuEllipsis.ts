import type { MaybeRefOrGetter, Ref } from "vue";
import { useMutationObserver, useResizeObserver } from "@vueuse/core";
import { nextTick, onMounted, onUpdated, shallowRef, toValue, watch } from "vue";

export interface MenuEllipsisOptions {
  /** 溢出折叠是否生效：仅水平、非折叠态且开启 ellipsis 时为真 */
  enabled: MaybeRefOrGetter<boolean>;
  /** 是否插槽模式：插槽条目增减、标题变宽不会改变 ul 自身尺寸，需要额外监听 DOM 变化 */
  slotMode: MaybeRefOrGetter<boolean>;
  /** 变化后需要重新测量的数据源（items 模式的条目、菜单模式等），按深层比较触发 */
  sources: () => unknown;
}

/**
 * 水平菜单的溢出折叠测量：持有切分下标、「更多」触发器宽度缓存与重入锁。
 * 切分下标为 -1 表示不折叠（全量展示），大于等于 0 时下标之后的条目移入「更多」子菜单。
 *
 * @param menuRef 菜单列表元素，溢出测量的基准容器
 */
export function useMenuEllipsis(menuRef: Readonly<Ref<HTMLElement | null>>, options: MenuEllipsisOptions) {
  /** 溢出切分下标 */
  const sliceIndex = shallowRef(-1);
  /** 缓存「更多」触发器的实测宽度，重置测量时它已从 DOM 移除，需用上次的值预留空间 */
  let ellipsisWidth = 56;
  /** 测量是否正在进行，用于阻断重入 */
  let measuring = false;
  /** 测量期间收到的新一轮请求，结束后补算一次 */
  let measurePending = false;

  /**
   * 重新计算溢出切分点。
   *
   * ⚠️ 根因：折叠后被隐藏的条目已从 DOM 移除，直接在折叠态下测量拿不到真实总宽，
   * 会导致窗口变宽后无法还原（折叠点单调不可逆）。
   * ✅ 修复：采用「重置 → 测量 → 应用」三拍，每次先全量渲染再量。
   *
   * 「重置」这一拍会改动 DOM，可能反过来惊动 ResizeObserver，
   * 因此用 measuring 阻断重入、用 measurePending 保证期间的请求不丢失。
   */
  async function calcEllipsis(): Promise<void> {
    if (measuring) {
      measurePending = true;
      return;
    }
    measuring = true;

    try {
      await runEllipsisMeasure();
    } finally {
      measuring = false;
    }

    if (measurePending) {
      measurePending = false;
      await calcEllipsis();
    }
  }

  /** 单轮「重置 → 测量 → 应用」，仅供 calcEllipsis 调用 */
  async function runEllipsisMeasure() {
    if (!toValue(options.enabled)) {
      sliceIndex.value = -1;
      return;
    }

    // 第一拍：重置为全量渲染
    if (sliceIndex.value !== -1) {
      sliceIndex.value = -1;
      await nextTick();
    }

    const menuEl = menuRef.value;
    if (!menuEl) return;

    // 第二拍：在全量状态下测量
    const children = Array.from(menuEl.children) as HTMLElement[];
    if (children.length === 0) return;

    const menuStyles = window.getComputedStyle(menuEl);
    const paddingRight = Number.parseFloat(menuStyles.paddingRight) || 0;
    // clientWidth 含内边距，减去右侧内边距得到内容区可用右边界
    const available = menuEl.clientWidth - paddingRight;

    // 未溢出则保持全量展示
    if (menuEl.scrollWidth <= menuEl.clientWidth) {
      sliceIndex.value = -1;
      return;
    }

    // 子元素与 ul 共享同一个 offsetParent（根容器为 relative），换算成相对 ul 的右边界
    const originLeft = menuEl.offsetLeft;
    const limit = available - ellipsisWidth;

    let nextSlice = -1;
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const right = child.offsetLeft + child.offsetWidth - originLeft;
      if (right > limit) {
        nextSlice = i;
        break;
      }
    }

    // 至少保留一项，避免容器极窄时整条菜单只剩「更多」
    sliceIndex.value = nextSlice === 0 ? 1 : nextSlice;

    // 第三拍：应用后回读「更多」触发器的真实宽度，供下次测量预留
    if (sliceIndex.value >= 0) {
      await nextTick();
      const last = menuEl.lastElementChild as HTMLElement | null;
      if (last?.dataset.rebornMenuEllipsis === "true") {
        ellipsisWidth = last.offsetWidth;
      }
    }
  }

  watch(
    () => [toValue(options.enabled), options.sources()] as const,
    () => {
      void calcEllipsis();
    },
    { deep: true },
  );

  // 容器宽度变化（窗口缩放、父级布局变化）
  useResizeObserver(menuRef, () => {
    void calcEllipsis();
  });

  /**
   * 插槽模式下条目增减或标题变宽：ul 是宽度跟随容器的块级 flex，内容变化只会撑大 scrollWidth，
   * 自身尺寸不变，ResizeObserver 不会回调，改由 DOM 变化触发测量。
   * 测量自身的「重置 / 应用」同样会改动 DOM，measuring 期间直接忽略（不走 measurePending），否则会无限回灌。
   */
  useMutationObserver(
    () => (toValue(options.enabled) && toValue(options.slotMode) ? menuRef.value : undefined),
    () => {
      if (!measuring) void calcEllipsis();
    },
    { childList: true, subtree: true, characterData: true },
  );

  /** 插槽模式下最近一次渲染出的顶层条目数，由菜单渲染时写入；普通变量，写入不会引发渲染 */
  let renderedSlotCount = -1;
  /** 上次据以补量的条目数 */
  let lastSlotCount = -1;

  /** 菜单渲染插槽时登记本轮的顶层条目数 */
  function recordSlotCount(count: number) {
    renderedSlotCount = count;
  }

  /**
   * 增删的条目恰好全落在「更多」里时，菜单栏 DOM 不变，MutationObserver 收不到，只能在组件更新后补量。
   * 只在条目数真的变了才补量：菜单的任何一次更新（选中项回写、插槽里读到的状态变化）都会走到这里，
   * 无条件测量会先把折叠重置为全量、卸掉「更多」子菜单再挂回，浮层与悬停计时随之重建。
   * 测量自身触发的更新不改变条目数，不会回灌；测量途中条目数变化则由 calcEllipsis 记为待补算。
   */
  onUpdated(() => {
    if (!toValue(options.enabled) || !toValue(options.slotMode)) return;
    if (renderedSlotCount === lastSlotCount) return;
    lastSlotCount = renderedSlotCount;
    void calcEllipsis();
  });

  onMounted(() => {
    lastSlotCount = renderedSlotCount;
    void calcEllipsis();
  });

  return { sliceIndex, calcEllipsis, recordSlotCount };
}
