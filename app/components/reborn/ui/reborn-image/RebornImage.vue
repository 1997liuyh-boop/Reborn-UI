<script lang="ts">
// 仅用作类型：viewerjs 本体在点击预览时才按需加载
import type Viewer from "viewerjs";
import { tv } from "@/lib/tv";
import theme, {
	defaultPreviewToolbar,
	imageMode,
	previewArrowIcons,
	previewToolbarMeta,
	previewToolbarTokens
} from "./reborn-image.config";

/**
 * 主题类名工厂：theme 为静态导入、tv 为纯函数，产物与组件实例无关。
 * 放在模块作用域只构建一次；若留在 <script setup> 内则每个实例都要重建一次，
 * 列表页/结算面板同屏数百张图时会被线性放大成可感知开销。
 */
const b = tv(theme);
</script>

<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import type { CSSProperties } from "vue";
import { useBreakpoints, useEventListener, useIntersectionObserver } from "@vueuse/core";
import { cn } from "@/lib/utils";

/** 预览菜单的按钮 token */
type PreviewToolbarToken = (typeof previewToolbarTokens)[number];

/**
 * viewerjs 1.x 实例上没写进类型声明的内部字段。
 * 菜单与箭头要挂进它的容器 / 底部区域；翻转要读当前缩放方向（与它自带工具栏的翻转写法一致）。
 * 升级 viewerjs 大版本时需复核这几个字段。
 */
interface ViewerInternals {
	viewer: HTMLElement; // 预览根容器
	canvas: HTMLElement; // 当前大图画布
	footer: HTMLElement; // 底部区域：标题 + 工具栏 + 缩略图条
	navbar: HTMLElement; // 缩略图条
	imageData: { scaleX?: number; scaleY?: number };
}

export interface ImageProps {
	customClass?: ClassValue;
	src: string; // 图片地址
	mode?: (typeof imageMode)[number]; // 图片裁剪、缩放的模式
	preview?: boolean; // 是否显示边框
	previewList?: string[];
	// 预览菜单的按钮与顺序：逗号分隔的 token，写法同 RebornPagination 的 layout，未知 token 忽略、传空字符串不显示菜单（仅 Web）
	previewToolbar?: string;
	// 多图预览时是否显示底部的缩略图列表，默认不显示；单图时始终不显示（仅 Web）
	previewNavbar?: boolean;
	height?: string | number;
	width?: string | number;
	showLoading?: boolean; // 是否显示加载状态
	lazyLoad?: boolean; // 是否懒加载
	fadeShow?: boolean; // 图片显示动画效果
	magnifier?: boolean; // 是否启用放大镜功能
	magnifierZoom?: number; // 放大倍率 (控制透镜部分的放大比例)
	magnifierSize?: number; // 放大镜尺寸 (控制原图上透镜的大小)
	magnifierWidth?: number | string; // 预览窗口宽度 (默认与原图一致)
	magnifierHeight?: number | string; // 预览窗口高度 (默认与原图一致)
	ui?: Partial<{
		root: ClassValue;
		error: ClassValue;
		errorIcon: ClassValue;
		loading: ClassValue;
		loadingIcon: ClassValue;
		inner: ClassValue;
		magnifierLens: ClassValue;
		magnifierView: ClassValue;
		magnifierViewImage: ClassValue;
		previewToolbar: ClassValue;
		previewAction: ClassValue;
		previewActionIcon: ClassValue;
		previewActionText: ClassValue;
		previewArrow: ClassValue;
		previewArrowIcon: ClassValue;
	}>;
}

const props = withDefaults(defineProps<ImageProps>(), {
	mode: "aspectFill", // 恢复默认值
	preview: false,
	previewToolbar: defaultPreviewToolbar,
	previewNavbar: false,
	height: 120,
	width: 120,
	showLoading: true,
	lazyLoad: false,
	magnifier: false,
	magnifierZoom: 2,
	magnifierSize: 100,
	magnifierWidth: "",
	magnifierHeight: ""
});

// 事件定义
const emit = defineEmits<{
	/** 图片加载成功时触发，回调为原生 load 事件 */
	load: [event: Event];
	/** 重试仍失败、进入错误态时触发，回调为原生 error 事件 */
	error: [event: Event];
}>();

// 宽屏判定：视口 ≥1024px 才启用放大镜（SSR 期为 false，挂载后按实际视口计算）
const breakpoints = useBreakpoints({ widescreen: 1024 });
const widescreenUp = breakpoints.greaterOrEqual("widescreen");
const isMagnifierActive = computed(() => props.magnifier && widescreenUp.value);

const uiOverrides = computed(() => props.ui || {});

// 根元素引用
const rootRef = useTemplateRef<HTMLElement>("rootRef");
const shouldLoad = shallowRef(!props.lazyLoad);

// 加载状态
const isLoading = shallowRef(true);
// 加载失败状态
const isError = shallowRef(false);
// 是否正在失败后重新请求（用于显示 common.load_reload 文案）
const isReloading = shallowRef(false);
// 失败后最多重新请求的次数
const maxRetries = 2;
// 已重新请求的次数
const retryCount = shallowRef(0);
// 重试令牌：递增以强制 <img> 重新挂载，对同一地址重新发起请求
const retryToken = shallowRef(0);

const ui = computed(() => {
	const styles = b();
	return {
		root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
		error: (opts?: { class?: any }) => styles.error({ class: cn(opts?.class, uiOverrides.value.error) }),
		errorIcon: (opts?: { class?: any }) => styles.errorIcon({ class: cn(opts?.class, uiOverrides.value.errorIcon) }),
		loading: (opts?: { class?: any }) => styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
		loadingIcon: (opts?: { class?: any }) => styles.loadingIcon({ class: cn(opts?.class, uiOverrides.value.loadingIcon) }),
		inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
		magnifierLens: (opts?: { class?: any }) => styles.magnifierLens({ class: cn(opts?.class, uiOverrides.value.magnifierLens) }),
		magnifierView: (opts?: { class?: any }) => styles.magnifierView({ class: cn(opts?.class, uiOverrides.value.magnifierView) }),
		magnifierViewImage: (opts?: { class?: any }) => styles.magnifierViewImage({ class: cn(opts?.class, uiOverrides.value.magnifierViewImage) }),
		previewToolbar: (opts?: { class?: any }) => styles.previewToolbar({ class: cn(opts?.class, uiOverrides.value.previewToolbar) }),
		previewAction: (opts?: { class?: any }) => styles.previewAction({ class: cn(opts?.class, uiOverrides.value.previewAction) }),
		previewActionIcon: (opts?: { class?: any }) => styles.previewActionIcon({ class: cn(opts?.class, uiOverrides.value.previewActionIcon) }),
		previewActionText: (opts?: { class?: any }) => styles.previewActionText({ class: cn(opts?.class, uiOverrides.value.previewActionText) }),
		// 左右箭头只有定位不同，按 arrowSide 变体取各自的类名
		previewArrow: (side: "prev" | "next", opts?: { class?: any }) =>
			b({ arrowSide: side }).previewArrow({ class: cn(opts?.class, uiOverrides.value.previewArrow) }),
		previewArrowIcon: (opts?: { class?: any }) => styles.previewArrowIcon({ class: cn(opts?.class, uiOverrides.value.previewArrowIcon) })
	};
});

const imgRef = useTemplateRef<HTMLImageElement>("imgRef");
/** 原图尺寸，放大镜按它换算背景；每次整体替换 */
const naturalDimensions = shallowRef({ width: 0, height: 0 });

onMounted(() => {
	// 如果图片在 JS 执行/挂载前就已经加载好了（比如浏览器缓存或者 SSR），手动触发结束 loading
	if (imgRef.value && imgRef.value.complete && imgRef.value.naturalWidth > 0) {
		isLoading.value = false;
		isError.value = false;
		// 此处刻意不读 getBoundingClientRect()：挂载期同步读取布局属性会强制回流，
		// 同屏数百张图时实测形成 50~170ms 的重算尖峰。
		// 放大镜真正依赖的 imgRect 在 onMouseEnter/onMouseMove 时才按需读取（不在挂载关键路径上）。
		// naturalWidth/naturalHeight 属于图片自身解码信息，不触发布局，可安全读取。
		naturalDimensions.value = { width: imgRef.value.naturalWidth, height: imgRef.value.naturalHeight };
	} else if (imgRef.value && imgRef.value.complete && imgRef.value.naturalWidth === 0) {
		// 加载失败也是 complete，但没有宽高：交给重试逻辑处理
		onError(new Event("error"));
	}
});

// VueUse 懒加载逻辑
if (props.lazyLoad) {
	const { stop } = useIntersectionObserver(
		rootRef,
		(entries) => {
			const isIntersecting = entries[0]?.isIntersecting;
			if (isIntersecting) {
				shouldLoad.value = true;
				stop();
			}
		},
		{ rootMargin: "200px" }
	);
}

const currentSrc = computed(() => {
	if (!props.lazyLoad) return props.src;
	return shouldLoad.value ? props.src : "";
});

// data-lazy 属性状态
const lazyStatus = computed(() => {
	if (isError.value) return "error";
	if (isLoading.value) return "loading";
	return "loaded";
});

const modeMap: Record<string, any> = {
	scaleToFill: "fill",
	aspectFit: "contain",
	aspectFill: "cover"
};

const imgStyle = computed(() => {
	const style: any = {};
	if (props.mode && modeMap[props.mode]) {
		style.objectFit = modeMap[props.mode];
	} else if (props.mode === "widthFix") {
		style.height = "auto";
		style.width = "100%";
	} else if (props.mode === "heightFix") {
		style.width = "auto";
		style.height = "100%";
	} else if (props.mode) {
		style.objectFit = "none";
		style.objectPosition = props.mode;
	}
	return style;
});

// 辅助函数
function getUnit(val: string | number | undefined | null): string | undefined {
	if (val == null || val === "") return undefined;

	if (typeof val === "string") {
		// 纯数值（含小数）才补 px；其余（含 rem/em/vmin/auto/calc/% 等任意单位或关键字）原样返回，
		// 避免旧白名单遗漏单位时拼出 "autopx"/"10rempx" 之类非法值
		return /^\d*\.?\d+$/.test(val.trim()) ? `${val.trim()}px` : val;
	}
	return `${val}px`;
}

function onLoad(e: any) {
	isLoading.value = false;
	isError.value = false;
	isReloading.value = false; // 加载成功，清除重试提示
	retryCount.value = 0; // 重置重试计数，供下次加载使用
	if (imgRef.value) {
		// naturalWidth / naturalHeight 是解码信息，不触发布局
		naturalDimensions.value = { width: imgRef.value.naturalWidth, height: imgRef.value.naturalHeight };
		// 只有放大镜启用时才读布局：相邻两次 load 之间 DOM 会更新，无条件读 rect 会逐张触发强制同步布局
		if (isMagnifierActive.value) measureMagnifierGeometry();
	}
	emit("load", e);
}

function onError(e: any) {
	// 空地址不视为加载失败（例如懒加载尚未触发时 src 为空）
	if (!currentSrc.value) return;

	// 加载失败后先尝试重新请求，最多 maxRetries 次，期间不显示错误插槽
	if (retryCount.value < maxRetries) {
		retryCount.value++;
		isReloading.value = true; // 显示 common.load_reload 文案
		isLoading.value = true; // 保持加载态，避免露出错误插槽
		isError.value = false;
		retryToken.value++; // 改变 key 强制 <img> 重新挂载，对同一地址重新发起请求
		return;
	}

	// 重试仍然失败，进入最终错误态
	isLoading.value = false;
	isReloading.value = false;
	isError.value = true;
	emit("error", e);
}

/** 解析后的预览菜单 token 列表（忽略未知项），解析规则与 RebornPagination 的 layout 一致 */
const previewToolbarList = computed(() =>
	props.previewToolbar
		.split(",")
		.map((token) => token.trim())
		.filter((token): token is PreviewToolbarToken => (previewToolbarTokens as readonly string[]).includes(token))
);

/** 菜单 token 对应的 viewerjs 操作，与它自带工具栏的点击行为逐一对应 */
const previewActions: Record<PreviewToolbarToken, (viewer: Viewer) => void> = {
	// viewerjs 的播放模式：请求浏览器全屏，多图时按间隔自动轮播，点击画面或按 Esc 退出
	fullscreen: (viewer) => viewer.play(true),
	zoomIn: (viewer) => viewer.zoom(0.1, true),
	zoomOut: (viewer) => viewer.zoom(-0.1, true),
	// 在 1:1 与切换前的缩放比之间来回切换
	oneToOne: (viewer) => viewer.toggle(),
	reset: (viewer) => viewer.reset(),
	// 首尾循环，与 viewerjs 默认的 loop: true 一致
	prev: (viewer) => viewer.prev(true),
	next: (viewer) => viewer.next(true),
	rotateLeft: (viewer) => viewer.rotate(-90),
	rotateRight: (viewer) => viewer.rotate(90),
	flipHorizontal: (viewer) => viewer.scaleX(-((viewer as unknown as ViewerInternals).imageData.scaleX ?? 1)),
	flipVertical: (viewer) => viewer.scaleY(-((viewer as unknown as ViewerInternals).imageData.scaleY ?? 1))
};

/**
 * 在 viewerjs 构建完 DOM 后（ready 事件）挂上自绘菜单与两侧箭头。
 *
 * 用原生节点而不是 Teleport：viewerjs 在 ready 之后就会量底部区域高度来决定大图的初始尺寸，
 * 菜单必须同步进入 DOM 才会被计入；Teleport 要等下一次渲染，大图会被算大一截、压到菜单上。
 * 这些节点随 viewerjs 的根容器一起在 destroy 时移除，不需要单独清理。
 */
function mountPreviewControls(viewer: Viewer, total: number) {
	const internals = viewer as unknown as ViewerInternals;
	const styles = ui.value;

	/**
	 * 点击必须截在按钮上，不能冒泡到 viewerjs 的根容器：它的 click 处理对不认识的元素走 default 分支，
	 * 播放中会直接 stop()——不截的话「全屏」刚进入播放就被同一次点击退出。
	 */
	const bindAction = (el: HTMLElement, token: PreviewToolbarToken) => {
		el.addEventListener("click", (event) => {
			event.stopPropagation();
			previewActions[token](viewer);
		});
	};

	if (previewToolbarList.value.length) {
		const toolbar = document.createElement("div");
		toolbar.className = styles.previewToolbar();
		toolbar.setAttribute("role", "toolbar");
		toolbar.setAttribute("aria-label", "图片操作");

		for (const token of previewToolbarList.value) {
			const meta = previewToolbarMeta[token];
			const button = document.createElement("button");
			button.type = "button";
			button.className = styles.previewAction();
			button.title = meta.label;
			button.setAttribute("aria-label", meta.label);

			const glyph = document.createElement("span");
			glyph.setAttribute("aria-hidden", "true");
			if (meta.icon) {
				glyph.className = styles.previewActionIcon({ class: meta.icon });
			} else {
				glyph.className = styles.previewActionText();
				glyph.textContent = meta.text ?? "";
			}
			button.appendChild(glyph);
			bindAction(button, token);
			toolbar.appendChild(button);
		}

		// 插在缩略图条之前，即 viewerjs 自带工具栏原来的位置
		internals.footer.insertBefore(toolbar, internals.navbar);
	}

	// 单图没有可切换的对象，不显示箭头
	if (total > 1) {
		for (const side of ["prev", "next"] as const) {
			const label = side === "prev" ? "上一张" : "下一张";
			const arrow = document.createElement("button");
			arrow.type = "button";
			arrow.className = styles.previewArrow(side);
			arrow.title = label;
			arrow.setAttribute("aria-label", label);

			const icon = document.createElement("span");
			icon.setAttribute("aria-hidden", "true");
			icon.className = styles.previewArrowIcon({ class: previewArrowIcons[side] });
			arrow.appendChild(icon);

			bindAction(arrow, side);
			// 挂在根容器而不是画布上：点画布会关闭预览
			internals.viewer.appendChild(arrow);
		}
	}
}

/**
 * 当前打开的预览实例与它的图片容器。组件持有引用，卸载时（如预览打开期间离开路由）一并销毁，
 * 遮罩不会残留在新页面上；已有实例或正在加载 viewerjs 时忽略重复点击，避免叠出两个预览
 */
let viewer: Viewer | null = null;
let viewerContainer: HTMLElement | null = null;
let viewerPending = false;
let disposed = false;

/** 销毁预览；先清空引用再 destroy，viewerjs 在 destroy 中派发 hidden 时再次进入这里会直接返回 */
function disposeViewer() {
	const current = viewer;
	const container = viewerContainer;
	viewer = null;
	viewerContainer = null;
	current?.destroy();
	container?.remove();
}

/** 监听每张预览图本身的加载结果，兼容上传组件直接打开和列表内其他图片失败。 */
function watchPreviewError(instance: Viewer, image: HTMLImageElement) {
	const { canvas } = instance as unknown as ViewerInternals;
	let failed = false;
	const showError = () => {
		// 快速切图或关闭后，旧图片迟到的错误不能覆盖当前画面。
		if (failed || disposed || viewer !== instance || !canvas.contains(image)) return;
		failed = true;
		image.classList.add("hidden!");
		canvas.classList.remove("viewer-loading");

		const placeholder = document.createElement("div");
		placeholder.className = ui.value.error({ class: "pointer-events-none inset-0 bg-transparent" });
		placeholder.setAttribute("role", "img");
		placeholder.setAttribute("aria-label", "图片加载失败");
		const icon = document.createElement("span");
		icon.className = ui.value.errorIcon();
		icon.setAttribute("aria-hidden", "true");
		placeholder.appendChild(icon);
		// 切图时 viewerjs 会清空画布，错误占位随上一张图片一并移除。
		canvas.appendChild(placeholder);
	};
	image.addEventListener("error", showError, { once: true });
	// view 回调发生在图片挂入画布之前，缓存中的失败结果需在挂入后补判。
	queueMicrotask(() => {
		if (image.complete && !image.naturalWidth) showError();
	});
}

function onPreview(force = false) {
	if (viewer || viewerPending) return;
	if (force || props.preview || (props.magnifier && !isMagnifierActive.value)) {
		let urls = [props.src];
		if (props.previewList && props.previewList.length > 0) {
			if (props.previewList.includes(props.src)) {
				urls = props.previewList;
			} else {
				urls = [props.src, ...props.previewList];
			}
		}
		viewerPending = true;
		Promise.all([import("viewerjs"), import("viewerjs/dist/viewer.css")])
			.then(([{ default: Viewer }]) => {
				viewerPending = false;
				// 加载期间组件已卸载：不再创建预览
				if (disposed) return;
				const container = document.createElement("div");
				container.style.display = "none";
				urls.forEach((url) => {
					const img = document.createElement("img");
					img.src = url;
					container.appendChild(img);
				});
				document.body.appendChild(container);
				viewerContainer = container;
				const instance = new Viewer(container, {
					// 自带工具栏是白色雪碧图，图标无法跟随主题色，换成 mountPreviewControls 里的自绘菜单
					toolbar: false,
					// 缩略图列表只在多图时有意义：单图时列表里只有它自己，开了也不显示
					navbar: props.previewNavbar && urls.length > 1,
					ready() {
						mountPreviewControls(instance, urls.length);
					},
					view(event) {
						watchPreviewError(instance, event.detail.image);
					},
					hidden() {
						disposeViewer();
					},
					initialViewIndex: urls.indexOf(props.src)
				});
				viewer = instance;
				instance.show();
			})
			.catch((err) => {
				viewerPending = false;
				console.error("Failed to load viewerjs:", err);
			});
	}
}

watch(
	() => props.src,
	() => {
		isLoading.value = true;
		isError.value = false;
		isReloading.value = false; // 切换图片，清除重试提示
		retryCount.value = 0; // 重置重试计数，新图片重新获得完整重试次数
	}
);

// 放大镜相关状态
const showMagnifier = shallowRef(false);

/**
 * 放大镜状态按更新频率拆成两层：
 *
 *   magnifierGeometry  几何基准 —— 只在 hover 开始 / 图片加载完成 / 滚动 / 视口变化时重算
 *   magnifierTracking  指针追踪 —— 每帧最多一次，只承载真正随鼠标变化的量
 *
 * 拆分的动因是 background-size 的稳定性：它只由布局与原图尺寸决定，
 * 原实现却放在 mousemove 里重算。aspectFit 的缩放比是浮点，容器又是百分比布局，
 * 算出的尺寸每次都带不同小数，浏览器无法复用位图缩放缓存，
 * 于是每个鼠标事件都要把原图（商品图常 1500~3000px）重新采样一遍。
 */
// 两层状态都是每次整体替换（指针追踪每帧一次），用 shallowRef 省掉深层代理
const magnifierGeometry = shallowRef({
	top: 0,
	left: 0,
	width: 0,
	height: 0,
	contentLeft: 0,
	contentTop: 0,
	contentWidth: 0,
	contentHeight: 0,
	visibleLeft: 0,
	visibleTop: 0,
	visibleWidth: 0,
	visibleHeight: 0,
	viewWidth: 0,
	viewHeight: 0,
	backgroundWidth: 0,
	backgroundHeight: 0
});

const magnifierTracking = shallowRef({ lensX: 0, lensY: 0, backgroundX: 0, backgroundY: 0 });

function clamp(value: number, min: number, max: number) {
	if (max < min) return min;
	return Math.min(Math.max(value, min), max);
}

function getNumericSize(val: string | number | undefined | null, fallback: number) {
	if (typeof val === "number" && Number.isFinite(val)) return val;

	if (typeof val === "string") {
		const trimmed = val.trim();
		if (!trimmed) return fallback;
		if (/^-?\d+(\.\d+)?(px)?$/.test(trimmed)) {
			return parseFloat(trimmed);
		}
	}

	return fallback;
}

function resolvePosition(mode?: string) {
	switch (mode) {
		case "top":
			return { x: 0.5, y: 0 };
		case "bottom":
			return { x: 0.5, y: 1 };
		case "left":
			return { x: 0, y: 0.5 };
		case "right":
			return { x: 1, y: 0.5 };
		case "top left":
			return { x: 0, y: 0 };
		case "top right":
			return { x: 1, y: 0 };
		case "bottom left":
			return { x: 0, y: 1 };
		case "bottom right":
			return { x: 1, y: 1 };
		case "center":
		default:
			return { x: 0.5, y: 0.5 };
	}
}

function getRenderedContentRect(containerWidth: number, containerHeight: number) {
	const naturalWidth = naturalDimensions.value.width || containerWidth;
	const naturalHeight = naturalDimensions.value.height || containerHeight;

	if (!naturalWidth || !naturalHeight) {
		return {
			left: 0,
			top: 0,
			width: containerWidth,
			height: containerHeight
		};
	}

	if (props.mode === "scaleToFill") {
		return {
			left: 0,
			top: 0,
			width: containerWidth,
			height: containerHeight
		};
	}

	if (props.mode === "aspectFit" || props.mode === "aspectFill") {
		const scale =
			props.mode === "aspectFit"
				? Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight)
				: Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
		const width = naturalWidth * scale;
		const height = naturalHeight * scale;

		return {
			left: (containerWidth - width) / 2,
			top: (containerHeight - height) / 2,
			width,
			height
		};
	}

	if (props.mode === "widthFix" || props.mode === "heightFix") {
		return {
			left: 0,
			top: 0,
			width: containerWidth,
			height: containerHeight
		};
	}

	const position = resolvePosition(props.mode);
	return {
		left: (containerWidth - naturalWidth) * position.x,
		top: (containerHeight - naturalHeight) * position.y,
		width: naturalWidth,
		height: naturalHeight
	};
}

function getVisibleContentRect(
	contentRect: { left: number; top: number; width: number; height: number },
	containerWidth: number,
	containerHeight: number
) {
	const left = Math.max(0, contentRect.left);
	const top = Math.max(0, contentRect.top);
	const right = Math.min(containerWidth, contentRect.left + contentRect.width);
	const bottom = Math.min(containerHeight, contentRect.top + contentRect.height);

	if (right <= left || bottom <= top) {
		return {
			left: 0,
			top: 0,
			width: containerWidth,
			height: containerHeight
		};
	}

	return {
		left,
		top,
		width: right - left,
		height: bottom - top
	};
}

const magnifierViewStyle = computed<CSSProperties>(() => {
	const geo = magnifierGeometry.value;
	return {
		position: "fixed",
		zIndex: 9999,
		width: `${geo.viewWidth || geo.width}px`,
		height: `${geo.viewHeight || geo.height}px`,
		left: `${geo.left + geo.width + 16}px`,
		top: `${geo.top}px`
	};
});

/**
 * 预览图层尺寸固定、background-size 固定为 100%，位移交给 translate3d。
 * 相比每帧改写 background-position：位图缩放结果可被浏览器复用，
 * 每帧只剩一次合成层平移，不再触发重绘与重采样。
 */
const magnifierPreviewStyle = computed<CSSProperties>(() => {
	const geo = magnifierGeometry.value;
	const { backgroundX, backgroundY } = magnifierTracking.value;
	return {
		position: "absolute",
		top: "0",
		left: "0",
		width: `${geo.backgroundWidth}px`,
		height: `${geo.backgroundHeight}px`,
		backgroundImage: `url("${props.src}")`,
		backgroundRepeat: "no-repeat",
		backgroundSize: "100% 100%",
		transform: `translate3d(${backgroundX}px, ${backgroundY}px, 0)`,
		willChange: "transform"
	};
});

/**
 * 重算几何基准。这里的 getBoundingClientRect 是放大镜唯一的布局读取点，
 * 绝不能放回 mousemove —— 那会与上一帧写入的浮层样式构成读写交替，每个事件强制一次同步布局。
 * 已有 rect 的调用方（如 onLoad）直接传入，避免二次读取。
 */
function measureMagnifierGeometry(rect?: DOMRect) {
	if (!imgRef.value) return;

	const box = rect ?? imgRef.value.getBoundingClientRect();
	const contentRect = getRenderedContentRect(box.width, box.height);
	const visibleContentRect = getVisibleContentRect(contentRect, box.width, box.height);

	magnifierGeometry.value = {
		top: box.top,
		left: box.left,
		width: box.width,
		height: box.height,
		contentLeft: contentRect.left,
		contentTop: contentRect.top,
		contentWidth: contentRect.width,
		contentHeight: contentRect.height,
		visibleLeft: visibleContentRect.left,
		visibleTop: visibleContentRect.top,
		visibleWidth: visibleContentRect.width,
		visibleHeight: visibleContentRect.height,
		viewWidth: Math.round(getNumericSize(props.magnifierWidth, box.width)),
		viewHeight: Math.round(getNumericSize(props.magnifierHeight, box.height)),
		// 取整是关键：小数尺寸会让浏览器每次都重新缩放原图，1px 以内的精度损失换取缩放缓存命中
		backgroundWidth: Math.round(contentRect.width * props.magnifierZoom),
		backgroundHeight: Math.round(contentRect.height * props.magnifierZoom)
	};
}

/** 由指针位置解算透镜与预览位移。只读缓存的几何基准，不碰 DOM */
function trackPointer(clientX: number, clientY: number) {
	const geo = magnifierGeometry.value;
	if (!geo.width || !geo.height) return;

	const x = clientX - geo.left;
	const y = clientY - geo.top;
	const zoom = props.magnifierZoom;
	const lensSize = props.magnifierSize;

	// 内容区窄于透镜时无从跟随，居中摆放
	const lensX =
		geo.visibleWidth <= lensSize
			? geo.visibleLeft + (geo.visibleWidth - lensSize) / 2
			: clamp(x - lensSize / 2, geo.visibleLeft, geo.visibleLeft + geo.visibleWidth - lensSize);

	const lensY =
		geo.visibleHeight <= lensSize
			? geo.visibleTop + (geo.visibleHeight - lensSize) / 2
			: clamp(y - lensSize / 2, geo.visibleTop, geo.visibleTop + geo.visibleHeight - lensSize);

	const imageX = clamp(x - geo.contentLeft, 0, geo.contentWidth);
	const imageY = clamp(y - geo.contentTop, 0, geo.contentHeight);

	// 放大后不足以铺满预览窗时同样居中，避免露出空白边
	const backgroundX =
		geo.backgroundWidth > geo.viewWidth
			? clamp(geo.viewWidth / 2 - imageX * zoom, geo.viewWidth - geo.backgroundWidth, 0)
			: (geo.viewWidth - geo.backgroundWidth) / 2;

	const backgroundY =
		geo.backgroundHeight > geo.viewHeight
			? clamp(geo.viewHeight / 2 - imageY * zoom, geo.viewHeight - geo.backgroundHeight, 0)
			: (geo.viewHeight - geo.backgroundHeight) / 2;

	magnifierTracking.value = { lensX, lensY, backgroundX, backgroundY };
}

let pointerX = 0;
let pointerY = 0;
let trackingFrame = 0;

function cancelTracking() {
	if (!trackingFrame) return;
	cancelAnimationFrame(trackingFrame);
	trackingFrame = 0;
}

/**
 * mousemove 的触发频率取决于鼠标采样率，高精度设备可达数百 Hz，远高于屏幕刷新率。
 * 这里只记录坐标，把解算与样式写入合并到每帧一次，超出部分直接丢弃。
 */
function onMouseMove(e: MouseEvent) {
	if (!showMagnifier.value) return;

	pointerX = e.clientX;
	pointerY = e.clientY;
	if (trackingFrame) return;

	trackingFrame = requestAnimationFrame(() => {
		trackingFrame = 0;
		trackPointer(pointerX, pointerY);
	});
}

// 浮层是 fixed 定位，悬停期间滚动或视口变化都会让基准失效。
// 监听只在放大镜可见时挂载：未启用放大镜的图片（列表页同屏数百张）不产生任何全局监听。
useEventListener(
	() => (showMagnifier.value ? window : null),
	["scroll", "resize"],
	() => measureMagnifierGeometry(),
	{ passive: true, capture: true }
);

onBeforeUnmount(() => {
	cancelTracking();
	disposed = true;
	disposeViewer();
});

/** 手动打开预览不依赖 preview 开关，开关只控制图片点击。 */
defineExpose({ showPreview: () => onPreview(true) });

function onMouseEnter(e: MouseEvent) {
	if (isMagnifierActive.value && !isLoading.value && !isError.value && imgRef.value) {
		// 进入时重新测量，避免沿用轮播切换 / 布局变化前的旧基准
		measureMagnifierGeometry();
		trackPointer(e.clientX, e.clientY);
		showMagnifier.value = true;
	}
}

function onMouseLeave() {
	cancelTracking();
	showMagnifier.value = false;
}
</script>
<template>
	<div ref="rootRef" :class="cn(ui.root({ class: props.customClass }), { 'overflow-visible!': isMagnifierActive })"
		:style="{
			width: getUnit(width),
			height: getUnit(height),
			maxWidth: '100%',
			maxHeight: '100%'
		}" @mousemove="onMouseMove" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
		<img ref="imgRef" :key="retryToken" :class="cn(
			'peer',
			ui.inner(),
			'data-[lazy=loading]:opacity-0 data-[lazy=loading]:transition-opacity data-[lazy=loading]:duration-300 data-[lazy=loaded]:opacity-100 data-[lazy=loaded]:transition-opacity data-[lazy=loaded]:duration-300 data-[lazy=error]:opacity-100'
		)
			" :src="currentSrc" :data-lazy="lazyStatus" :style="imgStyle" :mode="mode" @load="onLoad" @error="onError"
			@click="onPreview()" />

		<!-- 放大镜透镜 -->
		<div v-if="isMagnifierActive && showMagnifier && !isLoading && !isError" :class="ui.magnifierLens()" :style="{
			width: `${magnifierSize}px`,
			height: `${magnifierSize}px`,
			left: `${magnifierTracking.lensX}px`,
			top: `${magnifierTracking.lensY}px`
		}"></div>

		<!-- 放大镜视图窗口 (Teleport 挂载到 body 以避免被 overflow-hidden 裁剪)
         v-if 取"是否启用放大镜"而非"是否正在放大"：未启用放大镜的图片（列表页/结算面板等绝大多数场景）
         不再各自挂一组 ClientOnly + Teleport 的 body 锚点，数百张图时可省下同等数量的锚点与更新开销；
         启用放大镜的图片仍在挂载期就备好浮层，首次悬停无额外挂载延迟，交互行为不变。 -->
		<ClientOnly v-if="isMagnifierActive">
			<Teleport to="body">
				<div v-if="isMagnifierActive && showMagnifier && !isLoading && !isError" :class="ui.magnifierView()"
					:style="{
						...magnifierViewStyle
					}">
					<div :class="ui.magnifierViewImage()" :style="magnifierPreviewStyle" />
				</div>
			</Teleport>
		</ClientOnly>

		<div v-if="isLoading && showLoading" :class="ui.loading()">
			<slot name="loading">
				<div :class="ui.loadingIcon()"></div>
			</slot>
		</div>

		<div v-if="isError" :class="ui.error()" @click="onPreview()">
			<slot name="error">
				<div :class="ui.errorIcon()"></div>
			</slot>
		</div>

		<slot></slot>
	</div>
</template>
