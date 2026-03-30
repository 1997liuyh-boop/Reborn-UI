/** 液态玻璃效果容器的静态样式（动态属性 position / border-radius / --frost 由组件 baseStyle 覆盖注入） */
const effectStyles: Record<string, string> = {
  display: 'block',
  'border-radius': 'inherit',
  'backdrop-filter': 'url(#displacementFilter)',
  background: 'light-dark(hsl(0 0% 100% / var(--frost, 0)), hsl(0 0% 0% / var(--frost, 0)))',
  'box-shadow': [
    '0 0 2px 1px light-dark(color-mix(in oklch, canvasText, #0000 85%), color-mix(in oklch, canvasText, #0000 90%)) inset',
    '0 0 10px 4px light-dark(color-mix(in oklch, canvasText, #0000 90%), color-mix(in oklch, canvasText, #0000 95%)) inset',
    '0px 4px 16px rgba(17, 17, 26, 0.05)',
    '0px 8px 24px rgba(17, 17, 26, 0.05)',
    '0px 16px 56px rgba(17, 17, 26, 0.05)',
    '0px 4px 16px rgba(17, 17, 26, 0.05) inset',
    '0px 8px 24px rgba(17, 17, 26, 0.05) inset',
    '0px 16px 56px rgba(17, 17, 26, 0.05) inset',
  ].join(', '),
}

/** 内容区域插槽的静态样式 */
const slotContainerStyles: Record<string, string> = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  'border-radius': 'inherit',
}

/** SVG 滤镜层的静态样式 */
const filterStyles: Record<string, string> = {
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  'pointer-events': 'none',
}

export default {
  styles: {
    /** 外层效果容器（静态基础样式，动态注入属性由组件覆盖） */
    effect: effectStyles,
    /** 插槽内容区域 */
    slotContainer: slotContainerStyles,
    /** SVG 位移滤镜层 */
    filter: filterStyles,
  },
}
