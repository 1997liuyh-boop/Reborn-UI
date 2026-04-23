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

import { onMounted } from 'vue';
onMounted(() => {
	// 如果图片在 JS 执行/挂载前就已经加载好了（比如浏览器缓存或者 SSR），手动触发结束 loading
	if (imgRef.value && imgRef.value.complete && imgRef.value.naturalWidth > 0) {
		isLoading.value = false;
		isError.value = false;
		const rect = imgRef.value.getBoundingClientRect();
		imgDimensions.value = { width: rect.width, height: rect.height };
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
const magnifierPosition = ref({ x: 0, y: 0 });
const lensPosition = ref({ x: 0, y: 0 });
const imgRect = ref({ top: 0, left: 0, width: 0, height: 0 });
const currentZoom = ref(props.magnifierZoom);

// 放大镜鼠标移动处理
function onMouseMove(e: MouseEvent) {
	if (!props.magnifier || !imgRef.value || isLoading.value || isError.value) return;

	const rect = imgRef.value.getBoundingClientRect();
	// 实时更新 imgRect，确保放大镜预览窗口的位置和尺寸始终正确
	imgRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	// magnifierSize 直接控制透镜（遮罩层）大小
	const lensWidth = props.magnifierSize;
	const lensHeight = props.magnifierSize;

	// 计算透镜位置（跟随鼠标中心）
	let lensX = x - lensWidth / 2;
	let lensY = y - lensHeight / 2;

	// 边界限制
	lensX = Math.max(0, Math.min(lensX, rect.width - lensWidth));
	lensY = Math.max(0, Math.min(lensY, rect.height - lensHeight));

	lensPosition.value = { x: lensX, y: lensY };

	// magnifierZoom 直接控制倍率
	const zoom = props.magnifierZoom;
	currentZoom.value = zoom;

	// 获取预览窗口的实际尺寸（用于对齐计算）
	const vw = parseFloat(String(props.magnifierWidth)) || rect.width;
	const vh = parseFloat(String(props.magnifierHeight)) || rect.height;

	// 计算视野偏移：目标是让鼠标指向的点 (x, y) 尽量处于预览窗口中心
	// 预览中心点在缩放后的坐标 = x * zoom, y * zoom
	// 我们希望这个点位于窗口的 (vw/2, vh/2)
	let bgX = vw / 2 - x * zoom;
	let bgY = vh / 2 - y * zoom;

	// 边界检查：确保预览窗口被图片填满（不露白）
	const zw = rect.width * zoom;
	const zh = rect.height * zoom;

	// 限制 bgX 范围 [vw - zw, 0]
	if (zw > vw) {
		bgX = Math.min(0, Math.max(bgX, vw - zw));
	} else {
		// 如果缩放后的图片比窗口还小，则居中展示
		bgX = (vw - zw) / 2;
	}

	// 限制 bgY 范围 [vh - zh, 0]
	if (zh > vh) {
		bgY = Math.min(0, Math.max(bgY, vh - zh));
	} else {
		bgY = (vh - zh) / 2;
	}

	magnifierPosition.value = { x: bgX, y: bgY };
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
					position: 'fixed',
					zIndex: 9999,
					width: getUnit(magnifierWidth) || `${imgRect.width}px`,
					height: getUnit(magnifierHeight) || `${imgRect.height}px`,
					left: `${imgRect.left + imgRect.width + 16}px`,
					top: `${imgRect.top}px`,
				}">
					<img :class="ui.magnifierViewImage()" :src="src" :style="{
						width: `${imgRect.width * currentZoom}px`,
						height: `${imgRect.height * currentZoom}px`,
						left: `${magnifierPosition.x}px`,
						top: `${magnifierPosition.y}px`
					}" />
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
