/* ═══════════════════════════════════════════════════════════════════════
   把站内的 Vue 组件挂进同源 iframe 里的某个元素。

   iframe 里的页面有一整套自己的样式，站点的 Tailwind（含 preflight）不能直接
   进入它的文档，否则会改写页面原有的排版。所以挂载点放在一个 shadow root 里，
   把站点的样式表复制进去：组件拿到完整的工具类，页面本身不受影响。

   Tailwind v4 的 @property 声明只在文档级生效，shadow root 内的副本不会注册，
   transform 一类依赖初始值的工具类会失效，因此单独把它们注入 iframe 的 head。
   这些声明只登记 --tw-* 自定义属性的初始值，不影响页面原有规则。
   ═══════════════════════════════════════════════════════════════════════ */

const PROPERTY_STYLE_ID = "reborn-frame-slot-properties";

/** 递归收集样式表里的 @property 规则；跨域样式表不可读，直接跳过 */
function collectPropertyRules(rules: CSSRuleList, out: string[]) {
  for (const rule of rules) {
    if (rule instanceof CSSPropertyRule) out.push(rule.cssText);
    else if ("cssRules" in rule) collectPropertyRules((rule as CSSGroupingRule).cssRules, out);
  }
}

function registerPropertyRules(frameDocument: Document) {
  if (frameDocument.getElementById(PROPERTY_STYLE_ID)) return;
  const rules: string[] = [];
  for (const sheet of document.styleSheets) {
    try {
      collectPropertyRules(sheet.cssRules, rules);
    }
    catch {
      // 跨域样式表（如 Google Fonts）不允许读取规则
    }
  }
  const style = frameDocument.createElement("style");
  style.id = PROPERTY_STYLE_ID;
  style.textContent = rules.join("\n");
  frameDocument.head.append(style);
}

/**
 * 在 iframe 中按选择器找到宿主元素，建立（或复用）shadow root，复制站点样式并返回挂载点。
 * 宿主不存在时返回 null。样式只在挂载时复制一次，开发环境下样式热更新不会同步进来。
 */
export function createFrameSlot(frame: HTMLIFrameElement, selector: string) {
  const frameDocument = frame.contentDocument;
  const host = frameDocument?.querySelector<HTMLElement>(selector);
  if (!frameDocument || !host) return null;

  registerPropertyRules(frameDocument);

  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const styles = [...document.querySelectorAll("link[rel=\"stylesheet\"], style")].map(node => node.cloneNode(true));
  const mount = document.createElement("div");
  mount.style.cssText = "display:block;width:100%;height:100%";
  root.replaceChildren(...styles, mount);
  return mount;
}
