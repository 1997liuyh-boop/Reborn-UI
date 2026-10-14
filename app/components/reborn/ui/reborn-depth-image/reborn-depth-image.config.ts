import { tv } from "~/lib/tv";

export const depthImageTheme = tv({
  slots: {
    // 根容器只负责定位与裁切，尺寸交给使用方（class 或 ui.root）
    root: "reborn-depth-image relative overflow-hidden",
    // 静态图：首屏、不支持 WebGL、开启「减少动态效果」时显示；画布接管后改为透明但保留在无障碍树里
    image: "absolute inset-0 size-full select-none object-contain",
    // 画布：位置与尺寸由脚本按图片在容器内的实际显示区域写入，不拦截指针
    canvas: "pointer-events-none absolute",
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface DepthImageUI {
  /** 根容器 */
  root?: string;
  /** 静态图（首屏与回退显示） */
  image?: string;
  /** WebGL 画布 */
  canvas?: string;
}

export default depthImageTheme;
