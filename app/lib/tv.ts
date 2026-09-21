import { createTV } from 'tailwind-variants';
import { getCurrentInstance } from 'vue';
import { twMergeConfig } from './utils';

const baseTv = createTV({ twMergeConfig });

/** 根据 slots 定义计算稳定指纹，服务端和客户端共用同一算法。 */
export function fingerprintThemeSlots(slots: Record<string, unknown>): string {
  const source = `${Object.keys(slots).sort().join('|')}::${JSON.stringify(slots)}`;
  // 使用 djb2 散列并转为短字符串，不依赖调用顺序。
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash + source.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/** 主题函数上的元信息，供文档站读取 slot 定义和主题指纹。 */
export interface TvSlotMeta {
  /** 标记类末尾的主题指纹。 */
  __rbThemeId: string;
  /** 各 slot 原始基础类名。 */
  __rbSlots: Record<string, unknown>;
}

/** 标记片段只使用安全字符，避免组件名称中的空格拆出额外类名。 */
function normalizeMarkerPart(value: string): string {
  return value.replace(/[^\w-]/g, '-');
}

/**
 * 模块级主题没有归属组件时使用的前缀。
 *
 * 不能在求值阶段回读 getCurrentInstance() 来补名字：组件普遍把 slot 类名包一层
 * computed（如 RebornTabs 的 paneClass），再 provide 给子组件渲染。服务端可能由
 * 子组件（RebornTabPane）先触发求值，客户端 hydration 时却由父组件（RebornTabs）
 * 先触发，computed 的缓存会把「首个求值者」的名字固化下来，两端类名不同就会报
 * Hydration class mismatch。何况模块级主题本就被多个组件共用，用任一使用者的名字
 * 命名也不准确。
 *
 * 退化成固定前缀不影响定位：getThemeSlotSelector 只按「-key-themeId」结尾匹配。
 */
const FALLBACK_MARKER_NAME = 'Component';

/** 优先使用显式组件名称，其次使用 Vue 单文件组件推导的名称。 */
function currentComponentName(): string | undefined {
  const component = getCurrentInstance()?.type;
  const name = component?.name || component?.__name;
  return name ? normalizeMarkerPart(name) : undefined;
}

/** 按完整类名的结尾定位，兼容同一主题在主体和子组件中使用。 */
export function getThemeSlotSelector(key: string, themeId: string): string {
  const suffix = `-${normalizeMarkerPart(key)}-${themeId}`;
  return `[class$="${suffix}"], [class*="${suffix} "]`;
}

/**
 * 保留原始 tv 的变体和合并规则，仅给 slot 追加「组件名称-key-themeId」标记。
 * 标记类不提供视觉样式，用于文档站的节点定位与悬停高亮。
 */
export const tv = ((options: any, config?: any) => {
  const themed = baseTv(options, config);
  const slots = options?.slots;
  if (!slots || typeof slots !== 'object') return themed;

  const themeId = fingerprintThemeSlots(slots);
  // setup 中创建的主题保存所属组件名，避免响应式重算时丢失上下文。
  const ownerName = currentComponentName();

  /** 名字只认创建主题时的组件，求值时机不再影响类名，保证服务端与客户端一致。 */
  const name = ownerName || FALLBACK_MARKER_NAME;

  const marked = (props?: any) => {
    const styles: unknown = themed(props);
    if (!styles || typeof styles !== 'object') return styles;

    const result: Record<string, unknown> = {};
    for (const [key, origin] of Object.entries(styles)) {
      if (typeof origin !== 'function') {
        result[key] = origin;
        continue;
      }
      result[key] = (...args: any[]) => {
        const marker = `${name}-${normalizeMarkerPart(key)}-${themeId}`;
        // slot 结果为空时 tailwind-variants 返回 undefined，不能直接进模板字符串
        const base = origin(...args);
        return base ? `${base} ${marker}` : marker;
      };
    }
    return result;
  };

  return Object.assign(marked, themed, {
    __rbThemeId: themeId,
    __rbSlots: { ...slots },
  });
}) as typeof baseTv;

export type { VariantProps } from 'tailwind-variants';
