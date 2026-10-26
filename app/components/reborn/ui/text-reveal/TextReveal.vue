<script lang="ts">
// 导入集中放在普通 script 块，<script setup> 可直接使用；插件注册是全局的，放在模块顶层只执行一次
import type { HTMLAttributes, VNodeArrayChildren, VNodeChild } from "vue";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { Comment as CommentVNode, Fragment, isVNode, normalizeClass, onBeforeUnmount, onMounted, onUpdated, Static as StaticVNode, Text as TextVNode, useSlots, useTemplateRef } from "vue";

gsap.registerPlugin(SplitText);

/** 组件类型的编号：匿名组件也能互相区分 */
const componentIds = new WeakMap<object, number>();
let nextComponentId = 0;
/** 无法序列化的属性每次给新编号，宁可多重建一次也不吞掉变化 */
let unserializableCount = 0;

function componentId(type: object): number {
  let id = componentIds.get(type);
  if (id === undefined) {
    id = ++nextComponentId;
    componentIds.set(type, id);
  }
  return id;
}

/** 属性签名：事件处理器等函数不影响渲染结果，key 另行计入，ref 与渲染结果无关 */
function propsSignature(props: Record<string, unknown> | null): string {
  if (!props) return "";
  const entries = Object.keys(props)
    .filter(name => name !== "key" && name !== "ref" && name !== "ref_for" && name !== "ref_key")
    .sort()
    .map(name => [name, props[name]]);
  try {
    return JSON.stringify(entries, (_name, value) => (typeof value === "function" || typeof value === "symbol" ? undefined : value)) ?? "";
  }
  catch {
    return `#${++unserializableCount}`;
  }
}

/**
 * 插槽渲染结果的签名：文字、元素标签、属性与 key 都计入，签名相同说明这次更新不会改动插槽 DOM。
 * 插槽里的组件只计类型与 props，不调用它们的插槽（作用域插槽缺少参数会出错）
 */
function slotSignature(node: VNodeChild | VNodeArrayChildren): string {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(slotSignature).join("");
  if (!isVNode(node)) return `t:${String(node)};`;

  const { type, props, children, key } = node;
  if (type === CommentVNode) return "";
  if (type === TextVNode || type === StaticVNode) return `t:${String(children)};`;
  const inner = typeof children === "string" ? `t:${children};` : Array.isArray(children) ? slotSignature(children) : "";
  if (type === Fragment) return `[${inner}]`;
  const head = `${String(key ?? "")}${propsSignature(props)}`;
  if (typeof type === "string") return `<${type}${head}>${inner}</>`;
  return `<#${componentId(type as object)}${head}/>`;
}
</script>

<script lang="ts" setup>
interface Props {
  class?: HTMLAttributes["class"];
  containerClass?: HTMLAttributes["class"];
  duration?: number;
  delay?: number;
  stagger?: number;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 0.6,
  delay: 0.2,
  stagger: 0.1,
});

const slots = useSlots();
const textContainer = useTemplateRef<HTMLElement>("textContainer");

/**
 * 文本容器的 key：插槽渲染结果的签名，在渲染期计算。
 * SplitText 会把插槽渲染出的节点替换成行 / 词元素，Vue 持有的旧节点已不在 DOM 里：
 * 插槽结果不变时 Vue 打补丁不会动 DOM，容器原样保留；结果变了就换 key 让容器整块重建，
 * 避免对脱离 DOM 的旧节点打补丁（改动不生效，insertBefore 还会抛错）。
 * 判断依据是渲染结果而不是「组件发生了更新」，动态插槽、内联 class 数组引起的重渲染不会重建容器
 */
function contentKey(): string {
  return slotSignature(slots.default?.());
}

let splitter: SplitText | undefined;
/** 当前拆分配置；类名变化就地重新拆分时原样传回 */
let splitVars: SplitText.Vars | undefined;
/** 当前入场动画；只有属性变化而重建容器时，据此接着原进度播放 */
let activeTween: gsap.core.Tween | undefined;
/** 上一次拆分时的输入，更新后与之比较，判断要不要重新拆分、要不要重播 */
let applied: { el: HTMLElement; text: string; params: string; layout: string } | undefined;

const paramsKey = () => `${props.duration}|${props.delay}|${props.stagger}`;
const layoutKey = () => `${normalizeClass(props.class)}|${normalizeClass(props.containerClass)}`;

/** 拆分并播放入场动画；传入 resumeAt 时从该进度接着播放，不从头重播 */
function createSplit(resumeAt?: number) {
  const el = textContainer.value;
  if (!el) return;

  // 记在拆分之前：此时容器里还是 Vue 刚渲染出的原始文字
  applied = { el, text: el.textContent ?? "", params: paramsKey(), layout: layoutKey() };
  gsap.set(el, { opacity: 1 });

  splitVars = {
    type: "words,lines",
    linesClass: "line",
    autoSplit: true,
    mask: "lines",
    // 把动画返回给 SplitText 管理：autoSplit 在窗口缩放后重新拆分时会先回收旧动画并沿用原进度，不会叠加或重播
    onSplit: (splitText) => {
      const tween = gsap.from(splitText.lines, {
        duration: props.duration,
        delay: props.delay,
        yPercent: 100,
        opacity: 0,
        stagger: props.stagger,
        ease: "expo.out",
      });
      // 只作用于本次创建时的首次拆分，之后 autoSplit 的重新拆分由 SplitText 自己续接进度
      if (resumeAt !== undefined) {
        tween.totalTime(resumeAt);
        resumeAt = undefined;
      }
      activeTween = tween;
      return tween;
    },
  };
  splitter = SplitText.create(el, splitVars);
}

/** 还原拆分并移除 autoSplit 的尺寸与字体加载监听，同时回收入场动画 */
function destroySplit() {
  splitter?.revert();
  splitter?.kill();
  splitter = undefined;
  splitVars = undefined;
  activeTween = undefined;
}

onMounted(() => createSplit());

// updated 会随任何原因的重渲染执行，这里只在真正影响拆分的输入变化时才动手
onUpdated(() => {
  const el = textContainer.value;
  if (!el || !applied) return;

  if (el !== applied.el) {
    // 插槽渲染结果变了，容器已整块重建：文字或动画参数变化时重播；只有属性（如类名）变化时接着原进度
    const replay = el.textContent !== applied.text || paramsKey() !== applied.params;
    const resumeAt = replay ? undefined : activeTween?.totalTime();
    destroySplit();
    createSplit(resumeAt);
  }
  else if (paramsKey() !== applied.params) {
    // 插槽没变、动画参数变了：就地还原后重新拆分并重播。插槽节点在首次拆分后就已脱离 Vue，就地还原不影响打补丁
    destroySplit();
    createSplit();
  }
  else if (layoutKey() !== applied.layout) {
    // 类名变化可能改变字号与宽度，按新排版就地重新拆分换行；SplitText 沿用原进度，不重播
    applied.layout = layoutKey();
    if (splitter && splitVars) splitter.split(splitVars);
  }
});

onBeforeUnmount(destroySplit);
</script>

<template>
  <div
    class="overflow-hidden"
    :class="[props.containerClass]"
  >
    <div
      :key="contentKey()"
      ref="textContainer"
      :class="[props.class]"
    >
      <slot />
    </div>
  </div>
</template>
