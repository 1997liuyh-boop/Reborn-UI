<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, ref, watch } from "vue";
import { useIntersectionObserver } from '@vueuse/core';
import type { PropType } from "vue";
import { tv } from '@/lib/tv';
import { cn } from '@/lib/utils';
import theme, { imageMode } from './reborn-image.config'

export interface ImageProps {
	customClass?: ClassValue;
	src: string; // 图片地址
	mode?: typeof imageMode[number]; // 图片裁剪、缩放的模式
	preview?: boolean;  // 是否显示边框
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
	magnifierHeight: "",
})

// 事件定义
const emit = defineEmits(["load", "error"]);

const b = tv(theme);

const uiOverrides = computed(() => props.ui || {});

// 根元素引用
const rootRef = ref<HTMLElement | null>(null);
const shouldLoad = ref(!props.lazyLoad);

// 加载状态
const isLoading = ref(true);
// 加载失败状态
const isError = ref(false);

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
	};
})

const imgRef = ref<HTMLImageElement | null>(null);
const imgDimensions = ref({ width: 0, height: 0 });
const naturalDimensions = ref({ width: 0, height: 0 });

import { onMounted } from 'vue';
onMounted(() => {
	// 如果图片在 JS 执行/挂载前就已经加载好了（比如浏览器缓存或者 SSR），手动触发结束 loading
	if (imgRef.value && imgRef.value.complete && imgRef.value.naturalWidth > 0) {
		isLoading.value = false;
		isError.value = false;
		const rect = imgRef.value.getBoundingClientRect();
		imgDimensions.value = { width: rect.width, height: rect.height };
		naturalDimensions.value = { width: imgRef.value.naturalWidth, height: imgRef.value.naturalHeight };
	} else if (imgRef.value && imgRef.value.complete && imgRef.value.naturalWidth === 0) {
		// 加载失败也是 complete，但没有宽高
		isLoading.value = false;
		isError.value = true;
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
		{ rootMargin: '200px' }
	);
}

const currentSrc = computed(() => {
	if (!props.lazyLoad) return props.src;
	return shouldLoad.value ? props.src : '';
});

// data-lazy 属性状态
const lazyStatus = computed(() => {
	if (isError.value) return 'error';
	if (isLoading.value) return 'loading';
	return 'loaded';
});

const modeMap: Record<string, any> = {
	scaleToFill: 'fill',
	aspectFit: 'contain',
	aspectFill: 'cover',
};

const imgStyle = computed(() => {
	const style: any = {};
	if (props.mode && modeMap[props.mode]) {
		style.objectFit = modeMap[props.mode];
	} else if (props.mode === 'widthFix') {
		style.height = 'auto';
		style.width = '100%';
	} else if (props.mode === 'heightFix') {
		style.width = 'auto';
		style.height = '100%';
	} else if (props.mode) {
		style.objectFit = 'none';
		style.objectPosition = props.mode;
	}
	return style;
});

// 辅助函数
function getUnit(val: string | number | undefined | null): string | undefined {
	if (val == null || val === "") return undefined;

	if (typeof val === "string") {
		const hasUnit = /px|rpx|%|vw|vh$/.test(val);
		return hasUnit ? val : `${val}px`;
	}
	return `${val}px`;
}

function onLoad(e: any) {
	isLoading.value = false;
	isError.value = false;
	if (imgRef.value) {
		const rect = imgRef.value.getBoundingClientRect();
		imgDimensions.value = { width: rect.width, height: rect.height };
		naturalDimensions.value = { width: imgRef.value.naturalWidth, height: imgRef.value.naturalHeight };
		// 立即更新 imgRect，确保放大镜使用最新的尺寸
		imgRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
	}
	emit("load", e);
}

function onError(e: any) {
	isLoading.value = false; // 停止加载动画
	isError.value = true;    // 显示错误
	emit("error", e);
}

function onPreview() {
	if (props.preview) {
		const urls = (props.previewList && props.previewList.length > 0)
			? [props.src, ...props.previewList]
			: [props.src];
		Promise.all([
			import('viewerjs'),
			import('viewerjs/dist/viewer.css')
		]).then(([{ default: Viewer }]) => {
			const container = document.createElement('div');
			container.style.display = 'none';
			urls.forEach(url => {
				const img = document.createElement('img');
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
		}).catch(err => {
			console.error('Failed to load viewerjs:', err);
		});
	}
}

watch(() => props.src, () => {
	isLoading.value = true;
	isError.value = false;
});

// 放大镜相关状态
const showMagnifier = ref(false);
const lensPosition = ref({ x: 0, y: 0 });
const imgRect = ref({ top: 0, left: 0, width: 0, height: 0 });
const previewState = ref({
	width: 0,
	height: 0,
	backgroundWidth: 0,
	backgroundHeight: 0,
	backgroundX: 0,
	backgroundY: 0,
});

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
			height: containerHeight,
		};
	}

	if (props.mode === "scaleToFill") {
		return {
			left: 0,
			top: 0,
			width: containerWidth,
			height: containerHeight,
		};
	}

	if (props.mode === "aspectFit" || props.mode === "aspectFill") {
		const scale = props.mode === "aspectFit"
			? Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight)
			: Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight);
		const width = naturalWidth * scale;
		const height = naturalHeight * scale;

		return {
			left: (containerWidth - width) / 2,
			top: (containerHeight - height) / 2,
			width,
			height,
		};
	}

	if (props.mode === "widthFix" || props.mode === "heightFix") {
		return {
			left: 0,
			top: 0,
			width: containerWidth,
			height: containerHeight,
		};
	}

	const position = resolvePosition(props.mode);
	return {
		left: (containerWidth - naturalWidth) * position.x,
		top: (containerHeight - naturalHeight) * position.y,
		width: naturalWidth,
		height: naturalHeight,
	};
}

function getVisibleContentRect(contentRect: { left: number; top: number; width: number; height: number }, containerWidth: number, containerHeight: number) {
	const left = Math.max(0, contentRect.left);
	const top = Math.max(0, contentRect.top);
	const right = Math.min(containerWidth, contentRect.left + contentRect.width);
	const bottom = Math.min(containerHeight, contentRect.top + contentRect.height);

	if (right <= left || bottom <= top) {
		return {
			left: 0,
			top: 0,
			width: containerWidth,
			height: containerHeight,
		};
	}

	return {
		left,
		top,
		width: right - left,
		height: bottom - top,
	};
}

const magnifierViewStyle = computed(() => ({
	position: "fixed",
	zIndex: 9999,
	width: `${previewState.value.width || imgRect.value.width}px`,
	height: `${previewState.value.height || imgRect.value.height}px`,
	left: `${imgRect.value.left + imgRect.value.width + 16}px`,
	top: `${imgRect.value.top}px`,
}));

const magnifierPreviewStyle = computed(() => ({
	position: "absolute",
	inset: "0",
	backgroundImage: `url("${props.src}")`,
	backgroundRepeat: "no-repeat",
	backgroundSize: `${previewState.value.backgroundWidth}px ${previewState.value.backgroundHeight}px`,
	backgroundPosition: `${previewState.value.backgroundX}px ${previewState.value.backgroundY}px`,
}));

// 放大镜鼠标移动处理
function onMouseMove(e: MouseEvent) {
	if (!props.magnifier || !imgRef.value || isLoading.value || isError.value) return;

	const rect = imgRef.value.getBoundingClientRect();
	// 实时更新 imgRect，确保放大镜预览窗口的位置和尺寸始终正确
	imgRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	const contentRect = getRenderedContentRect(rect.width, rect.height);
	const visibleContentRect = getVisibleContentRect(contentRect, rect.width, rect.height);

	const zoom = props.magnifierZoom;
	const lensWidth = props.magnifierSize;
	const lensHeight = props.magnifierSize;

	// 计算透镜位置（跟随鼠标中心）
	let lensX: number;
	let lensY: number;

	if (visibleContentRect.width <= lensWidth) {
		lensX = visibleContentRect.left + (visibleContentRect.width - lensWidth) / 2;
	} else {
		lensX = clamp(
			x - lensWidth / 2,
			visibleContentRect.left,
			visibleContentRect.left + visibleContentRect.width - lensWidth
		);
	}

	if (visibleContentRect.height <= lensHeight) {
		lensY = visibleContentRect.top + (visibleContentRect.height - lensHeight) / 2;
	} else {
		lensY = clamp(
			y - lensHeight / 2,
			visibleContentRect.top,
			visibleContentRect.top + visibleContentRect.height - lensHeight
		);
	}

	lensPosition.value = { x: lensX, y: lensY };

	const viewWidth = getNumericSize(props.magnifierWidth, rect.width);
	const viewHeight = getNumericSize(props.magnifierHeight, rect.height);
	const imageX = clamp(x - contentRect.left, 0, contentRect.width);
	const imageY = clamp(y - contentRect.top, 0, contentRect.height);
	const backgroundWidth = contentRect.width * zoom;
	const backgroundHeight = contentRect.height * zoom;

	let bgX = viewWidth / 2 - imageX * zoom;
	let bgY = viewHeight / 2 - imageY * zoom;

	if (backgroundWidth > viewWidth) {
		bgX = clamp(bgX, viewWidth - backgroundWidth, 0);
	} else {
		bgX = (viewWidth - backgroundWidth) / 2;
	}

	if (backgroundHeight > viewHeight) {
		bgY = clamp(bgY, viewHeight - backgroundHeight, 0);
	} else {
		bgY = (viewHeight - backgroundHeight) / 2;
	}

	previewState.value = {
		width: viewWidth,
		height: viewHeight,
		backgroundWidth,
		backgroundHeight,
		backgroundX: bgX,
		backgroundY: bgY,
	};
}

function onMouseEnter() {
	if (props.magnifier && !isLoading.value && !isError.value && imgRef.value) {
		// 强制重新获取尺寸，避免使用缓存的旧尺寸
		const rect = imgRef.value.getBoundingClientRect();
		imgRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
		showMagnifier.value = true;
	}
}

function onMouseLeave() {
	showMagnifier.value = false;
}
</script>
<template>
	<div ref="rootRef" :class="cn(ui.root({ class: props.customClass }), { 'overflow-visible!': magnifier })" :style="{
		width: getUnit(width),
		height: getUnit(height),
		maxWidth: '100%',
		maxHeight: '100%'
	}" @mousemove="onMouseMove" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
		<img ref="imgRef"
			:class="cn('peer', ui.inner(), 'data-[lazy=loading]:opacity-0 data-[lazy=loading]:transition-opacity data-[lazy=loading]:duration-300 data-[lazy=loaded]:opacity-100 data-[lazy=loaded]:transition-opacity data-[lazy=loaded]:duration-300 data-[lazy=error]:opacity-100')"
			:src="currentSrc" :data-lazy="lazyStatus" :style="imgStyle" :mode="mode" @load="onLoad" @error="onError"
			@click="onPreview" />

		<!-- 放大镜透镜 -->
		<div v-if="magnifier && showMagnifier && !isLoading && !isError" :class="ui.magnifierLens()" :style="{
			width: `${magnifierSize}px`,
			height: `${magnifierSize}px`,
			left: `${lensPosition.x}px`,
			top: `${lensPosition.y}px`,
		}">
		</div>

		<!-- 放大镜视图窗口 (Teleport 挂载到 body 以避免被 overflow-hidden 裁剪) -->
		<ClientOnly>
			<Teleport to="body">
				<div v-if="magnifier && showMagnifier && !isLoading && !isError" :class="ui.magnifierView()" :style="{
					...magnifierViewStyle
				}">
					<div :class="ui.magnifierViewImage()" :style="magnifierPreviewStyle" />
				</div>
			</Teleport>
		</ClientOnly>

		<div
			:class="cn(ui.loading(), 'hidden', { 'flex': !lazyLoad && isLoading && showLoading, 'peer-data-[lazy=loading]:flex': lazyLoad && showLoading })">
			<slot name="loading">
				<div :class="ui.loadingIcon()">
				</div>
			</slot>
		</div>

		<div
			:class="cn(ui.error(), 'hidden', { 'flex': !lazyLoad && isError, 'peer-data-[lazy=error]:flex': lazyLoad })">
			<slot name="error">
				<div :class="ui.errorIcon()"></div>
			</slot>
		</div>

		<slot></slot>
	</div>
</template>
