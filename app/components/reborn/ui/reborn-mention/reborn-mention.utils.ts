/**
 * 提及组件用到的纯计算：光标前的提及上下文、退格整体删除、插入选项后的新文本，以及光标的像素坐标。
 * 前三个只处理字符串，便于单测；最后一个借助镜像元素测量，只能在浏览器里调用。
 */

/** 光标所在的提及上下文：从光标往前找到的最近一个触发前缀及其后的检索词 */
export interface MentionContext {
  /** 检索词：前缀之后、第一个拆分符（或光标）之前的文本 */
  pattern: string;
  /** 检索词起点下标（前缀的下一位） */
  start: number;
  /** 检索词终点下标（不含）：有拆分符时是拆分符下标，否则是光标位置 */
  end: number;
  /** 命中的前缀字符 */
  prefix: string;
  /** 前缀字符的下标 */
  prefixIndex: number;
  /** 前缀之后第一个拆分符的下标，-1 表示前缀与光标之间没有拆分符（正在输入检索词） */
  splitIndex: number;
  /** 光标位置 */
  selectionEnd: number;
}

/**
 * 从光标往前扫描，找到最近的前缀字符。
 *
 * 换行与拆分符都算作「提及已结束」：扫描遇到它们时记下位置继续往前，
 * 最终 splitIndex 是离前缀最近的那个拆分符。splitIndex 为 -1 才说明光标还在检索词里，下拉框应当展开；
 * 不为 -1 时上下文仍然返回，供退格整体删除判断光标是否正好落在一个完整提及之后。
 */
export function getMentionContext(
  value: string,
  selectionEnd: number,
  prefixes: string[],
  split: string,
): MentionContext | undefined {
  let splitIndex = -1;
  for (let i = selectionEnd - 1; i >= 0; i--) {
    const char = value[i]!;
    if (char === split || char === "\n" || char === "\r") {
      splitIndex = i;
      continue;
    }
    if (prefixes.includes(char)) {
      const end = splitIndex === -1 ? selectionEnd : splitIndex;
      return {
        pattern: value.slice(i + 1, end),
        start: i + 1,
        end,
        prefix: char,
        prefixIndex: i,
        splitIndex,
        selectionEnd,
      };
    }
  }
  return undefined;
}

/**
 * 选中选项后的新文本与新光标位置：用选项值替换检索词，并补一个拆分符。
 * 检索词后面本来就紧跟拆分符时不再重复补，光标跳过那个已有的拆分符。
 */
export function insertMention(value: string, ctx: MentionContext, optionValue: string, split: string) {
  const tail = value.slice(ctx.end);
  const alreadySeparated = tail.startsWith(split);
  const middle = `${optionValue}${alreadySeparated ? "" : split}`;
  return {
    value: value.slice(0, ctx.start) + middle + tail,
    selection: ctx.start + middle.length + (alreadySeparated ? 1 : 0),
  };
}

/**
 * 退格整体删除：光标正好落在「前缀 + 检索词 + 拆分符」之后时，返回删掉整段后的文本与光标位置；
 * 其他位置返回 undefined，交给浏览器按字符删除。
 */
export function removeWholeMention(value: string, ctx: MentionContext) {
  if (ctx.splitIndex === -1 || ctx.splitIndex + 1 !== ctx.selectionEnd)
    return undefined;
  return {
    value: value.slice(0, ctx.prefixIndex) + value.slice(ctx.splitIndex + 1),
    selection: ctx.prefixIndex,
  };
}

/** 镜像元素需要照搬的排版属性：少一项，镜像里的换行与字宽就和输入框对不上 */
const MIRROR_PROPERTIES = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

/** 某个字符位置在输入框里的像素坐标，相对输入框边框盒左上角，未扣除滚动 */
export interface CaretCoordinates {
  top: number;
  left: number;
  /** 该行的行高 */
  height: number;
}

/**
 * 测量 position 处字符在输入框内的坐标。
 *
 * input / textarea 不提供字符级的几何信息，做法是在页面外造一个排版完全相同的 div，
 * 把 position 之前的文本放进去，再在末尾放一个 span，span 的偏移就是该字符的位置。
 * 单行 input 不折行，镜像用 white-space: pre，连续空格不会被折叠；textarea 用 pre-wrap 跟随宽度折行。
 */
export function getCaretCoordinates(el: HTMLInputElement | HTMLTextAreaElement, position: number): CaretCoordinates {
  const computed = window.getComputedStyle(el);
  const isInput = el.nodeName === "INPUT";
  const mirror = document.createElement("div");
  const style = mirror.style;

  style.position = "absolute";
  style.visibility = "hidden";
  style.top = "0";
  style.left = "-9999px";
  style.whiteSpace = isInput ? "pre" : "pre-wrap";
  if (!isInput) style.overflowWrap = "break-word";
  for (const prop of MIRROR_PROPERTIES)
    style[prop] = computed[prop];
  style.overflow = "hidden";

  mirror.textContent = el.value.slice(0, position);
  const marker = document.createElement("span");
  // span 不能是空的，空 span 没有盒子，偏移量会退回到行首
  marker.textContent = el.value.slice(position) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const lineHeight = Number.parseFloat(computed.lineHeight);
  const coordinates = {
    top: marker.offsetTop + Number.parseFloat(computed.borderTopWidth),
    left: marker.offsetLeft + Number.parseFloat(computed.borderLeftWidth),
    // line-height 为 normal 时 parseFloat 得到 NaN，按 1.5 倍字号估算
    height: Number.isNaN(lineHeight) ? Number.parseFloat(computed.fontSize) * 1.5 : lineHeight,
  };
  mirror.remove();
  return coordinates;
}
