<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, ref, watch } from "vue";
// import { useIntersectionObserver } from '@vueuse/nuxt' // Or standard import, Nuxt likely auto-imports
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
	ui?: Partial<{
		root: ClassValue;
		error: ClassValue;
		errorIcon: ClassValue;
		loading: ClassValue;
		loadingIcon: ClassValue;
		inner: ClassValue;
	}>;
}

const props = withDefaults(defineProps<ImageProps>(), {
	mode: "aspectFill", // 恢复默认值
	preview: false,
	height: 120,
	width: 120,
	showLoading: true,
	lazyLoad: false,
})

// 事件定义
const emit = defineEmits(["load", "error"]);

const b = tv(theme);

const uiOverrides = computed(() => props.ui || {});

// Root element ref
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
	};
})

// VueUse Lazy Load Logic
if (props.lazyLoad) {
	const { stop } = useIntersectionObserver(
		rootRef,
		([{ isIntersecting }]: IntersectionObserverEntry[]) => {
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

// Status for data-lazy attribute
const lazyStatus = computed(() => {
	if (isError.value) return 'error';
	if (isLoading.value) return 'loading';
	return 'loaded';
});

// Helper functions
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
	emit("load", e);
}

function onError(e: any) {
	isLoading.value = false; // Stop loading spinner
	isError.value = true;    // Show error
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
</script>
<template>
	<div ref="rootRef" :class="ui.root({ class: props.customClass })" :style="{
		width: getUnit(width),
		height: getUnit(height)
	}">
		<img ref="imgRef"
			:class="cn('peer', ui.inner(), 'data-[lazy=loading]:opacity-0 data-[lazy=loading]:transition-opacity data-[lazy=loading]:duration-300 data-[lazy=loaded]:opacity-100 data-[lazy=loaded]:transition-opacity data-[lazy=loaded]:duration-300 data-[lazy=error]:opacity-100')"
			:src="currentSrc" :data-lazy="lazyStatus" :mode="mode" @load="onLoad" @error="onError" @click="onPreview" />

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