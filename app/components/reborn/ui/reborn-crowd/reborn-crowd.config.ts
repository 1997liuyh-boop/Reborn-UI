import { tv } from "~/lib/tv";

export const crowdTheme = tv({
  slots: {
    // 根容器只负责定位，尺寸交给使用方（class 或 ui.root）；纯装饰，不拦截指针、不可选中
    root: "reborn-crowd pointer-events-none relative select-none",
    // 画布铺满根容器，绘制分辨率由脚本按容器尺寸与像素密度写入
    canvas: "absolute inset-0 size-full",
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface CrowdUI {
  /** 根容器 */
  root?: string;
  /** 2D 画布 */
  canvas?: string;
}

export default crowdTheme;
