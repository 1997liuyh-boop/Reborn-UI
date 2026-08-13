<script lang="ts">
import { tv } from "@/lib/tv";
import theme, { imageMode } from "./reborn-image.config";

/**
 * 主题类名工厂：theme 为静态导入、tv 为纯函数，产物与组件实例无关。
 * 放在模块作用域只构建一次；若留在 <script setup> 内则每个实例都要重建一次，
 * 列表页/结算面板同屏数百张图时会被线性放大成可感知开销。
 */
const b = tv(theme);
</script>

<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CSSProperties } from "vue";
import { useEventListener, useIntersectionObserver } from "@vueuse/core";
import { cn } from "@/lib/utils";
import { useAppBreakpoints } from "~/composables/useAppUtils";

export interface ImageProps {
	customClass?: ClassValue;
	src: string; // 图片地址
	mode?: (typeof imageMode)[number]; // 图片裁剪、缩放的模式
	preview?: boolean; // 是否显示边框
	previewList?: string[];
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
		errorLabel: ClassValue;
		loading: ClassValue;
		loadingIcon: ClassValue;
		inner: ClassValue;
		magnifier: ClassValue;
		magnifierLens: ClassValue;
		magnifierView: ClassValue;
		magnifierViewImage: ClassValue;
	}>;
}

const props = withDefaults(defineProps<ImageProps>(), {
	mode: "aspectFill", // 恢复默认值
	preview: false,
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
const emit = defineEmits(["load", "error"]);

const { widescreenUp } = useAppBreakpoints();
const isMagnifierActive = computed(() => props.magnifier && widescreenUp.value);

const uiOverrides = computed(() => props.ui || {});

// 根元素引用
const rootRef = ref<HTMLElement | null>(null);
const shouldLoad = ref(!props.lazyLoad);

// 加载状态
const isLoading = ref(true);
// 加载失败状态
const isError = ref(false);
// 是否正在失败后重新请求（用于显示 common.load_reload 文案）
const isReloading = ref(false);
// 失败后最多重新请求的次数
const maxRetries = 2;
// 已重新请求的次数
const retryCount = ref(0);
// 重试令牌：递增以强制 <img> 重新挂载，对同一地址重新发起请求
const retryToken = ref(0);

const ui = computed(() => {
	const styles = b();
	return {
		root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
		error: (opts?: { class?: any }) => styles.error({ class: cn(opts?.class, uiOverrides.value.error) }),
		errorLabel: (opts?: { class?: any }) => styles.errorLabel({ class: cn(opts?.class, uiOverrides.value.errorLabel) }),
		errorIcon: (opts?: { class?: any }) => styles.errorIcon({ class: cn(opts?.class, uiOverrides.value.errorIcon) }),
		loading: (opts?: { class?: any }) => styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
		loadingIcon: (opts?: { class?: any }) => styles.loadingIcon({ class: cn(opts?.class, uiOverrides.value.loadingIcon) }),
		inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
		magnifierLens: (opts?: { class?: any }) => styles.magnifierLens({ class: cn(opts?.class, uiOverrides.value.magnifierLens) }),
		magnifierView: (opts?: { class?: any }) => styles.magnifierView({ class: cn(opts?.class, uiOverrides.value.magnifierView) }),
		magnifierViewImage: (opts?: { class?: any }) => styles.magnifierViewImage({ class: cn(opts?.class, uiOverrides.value.magnifierViewImage) })
	};
});

const imgRef = ref<HTMLImageElement | null>(null);
const imgDimensions = ref({ width: 0, height: 0 });
const naturalDimensions = ref({ width: 0, height: 0 });

onMounted(() => {
	// 如果图片在 JS 执行/挂载前就已经加载好了（比如浏览器缓存或者 SSR），手动触发结束 loading
	if (imgRef.value && imgRef.value.complete && imgRef.value.naturalWidth > 0) {
		isLoading.value = false;
		isError.value = false;
		// 此处刻意不读 getBoundingClientRect()：挂载期同步读取布局属性会强制回流，
		// 同屏数百张图时实测形成 50~170ms 的重算尖峰。imgDimensions 无人消费，
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
		const rect = imgRef.value.getBoundingClientRect();
		imgDimensions.value = { width: rect.width, height: rect.height };
		naturalDimensions.value = { width: imgRef.value.naturalWidth, height: imgRef.value.naturalHeight };
		// 复用已读到的 rect 刷新放大镜基准，避免二次布局读取
		if (isMagnifierActive.value) measureMagnifierGeometry(rect);
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

function onPreview() {
	if (props.preview || (props.magnifier && !isMagnifierActive.value)) {
		let urls = [props.src];
		if (props.previewList && props.previewList.length > 0) {
			if (props.previewList.includes(props.src)) {
				urls = props.previewList;
			} else {
				urls = [props.src, ...props.previewList];
			}
		}
		Promise.all([import("viewerjs"), import("viewerjs/dist/viewer.css")])
			.then(([{ default: Viewer }]) => {
				const container = document.createElement("div");
				container.style.display = "none";
				urls.forEach((url) => {
					const img = document.createElement("img");
					img.src = url;
					container.appendChild(img);
				});
				document.body.appendChild(container);
				const viewer = new Viewer(container, {
					hidden() {
						viewer.destroy();
						document.body.removeChild(container);
					},
					initialViewIndex: urls.indexOf(props.src)
				});
				viewer.show();
			})
			.catch((err) => {
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
const showMagnifier = ref(false);

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
const magnifierGeometry = ref({
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

const magnifierTracking = ref({ lensX: 0, lensY: 0, backgroundX: 0, backgroundY: 0 });

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

onBeforeUnmount(cancelTracking);

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
			@click="onPreview" />

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

		<div v-if="isError" :class="ui.error()">
			<slot name="error">
				<div :class="ui.errorIcon()">
					<img src="~/assets/images/error.png" />
				</div>
			</slot>
		</div>

		<slot></slot>
	</div>
</template>
