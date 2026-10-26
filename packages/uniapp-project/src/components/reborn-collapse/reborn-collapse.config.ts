export default {
  slots: {
    root: '',
    trigger: 'relative overflow-hidden transition-[height] duration-300 ease-in-out',
    // 内容必须留在文档流里：展开结束后外壳放开为 height: auto，绝对定位的内容撑不起高度会塌成 0。
    // flow-root 让内容自成 BFC，子元素外边距不穿出，测得的高度与 auto 结果一致。
    content: 'w-full flow-root',
  },
}
