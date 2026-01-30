<script setup lang="ts">
import { computed, nextTick, ref, watch, type PropType } from "vue";
import { tv } from "@/lib/tv";
import { cn } from "@/lib/utils";

import { useFieldGroup } from "@/composables/useFieldGroup";
import theme, { textareaSizes, textareaColors } from "./reborn-textarea.config";

defineOptions({
	name: "cl-textarea",
});

// 组件属性定义
const props = defineProps({
	// 颜色
	color: {
		type: String as PropType<typeof textareaColors[number]>,
		default: "primary",
	},
	// 自定义样式类
	customClass: {
		type: [String, Object, Array] as PropType<any>,
		default: "",
	},
	// UI 覆盖
	ui: {
		type: Object as PropType<Record<string, any>>,
		default: () => ({}),
	},
	// 绑定值
	modelValue: {
		type: String,
		default: "",
	},
	// 尺寸
	size: {
		type: String as PropType<typeof textareaSizes[number]>,
		default: "md",
	},
	// 是否显示边框
	border: {
		type: Boolean,
		default: true,
	},
	// 是否禁用
	disabled: {
		type: Boolean,
		default: false,
	},
	// 是否只读
	readonly: {
		type: Boolean,
		default: null,
	},
	// 是否显示字数统计
	showWordLimit: {
		type: Boolean,
		default: true,
	},
	// 名称
	name: {
		type: String,
		default: "",
	},
	// 占位符
	placeholder: {
		type: String,
		default: () => "请输入",
	},
	// 占位符样式类
	placeholderClass: {
		type: String,
		default: "",
	},
	// 占位符样式
	placeholderStyle: {
		type: String,
		default: "",
	},
	// 最大输入长度
	maxlength: {
		type: Number,
		default: 100,
	},
	// 是否自动聚焦
	autofocus: {
		type: Boolean,
		default: false,
	},
	// 设置键盘右下角按钮的文字
	confirmType: {
		type: String as PropType<"done" | "go" | "next" | "search" | "send">,
		default: "done",
	},
	// 指定focus时的光标位置
	cursor: {
		type: Number,
		default: 0,
	},
	// 点击键盘确认按钮时是否保持键盘不收起
	confirmHold: {
		type: Boolean,
		default: false,
	},
	// 高度
	height: {
		type: [Number, String],
		default: 140,
	},
	// 是否自动增高
	autoHeight: {
		type: Boolean,
		default: false,
	},
	// 如果 textarea 是在一个 position:fixed 的区域，需要显示指定属性 fixed 为 true
	fixed: {
		type: Boolean,
		default: false,
	},
	// 光标与键盘的距离
	cursorSpacing: {
		type: Number,
		default: 5,
	},
	// 指定光标颜色
	cursorColor: {
		type: String,
		default: "",
	},
	// 是否显示键盘上方带有”完成“按钮那一栏
	showConfirmBar: {
		type: Boolean,
		default: true,
	},
	// 光标起始位置
	selectionStart: {
		type: Number,
		default: -1,
	},
	// 光标结束位置
	selectionEnd: {
		type: Number,
		default: -1,
	},
	// 盘弹起时，是否自动上推页面
	adjustPosition: {
		type: Boolean,
		default: true,
	},
	// 它提供了用户在编辑元素或其内容时可能输入的数据类型的提示。
	inputmode: {
		type: String as PropType<
			"none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url"
		>,
		default: "text",
	},
	// focus时，点击页面的时候不收起键盘
	holdKeyboard: {
		type: Boolean,
		default: false,
	},
	// 是否禁用默认内边距
	disableDefaultPadding: {
		type: Boolean,
		default: true,
	},
	// 键盘对齐位置
	adjustKeyboardTo: {
		type: String as PropType<"cursor" | "bottom">,
		default: "cursor",
	},
});

// 事件定义
const emit = defineEmits([
	"update:modelValue",
	"input",
	"change",
	"focus",
	"blur",
	"confirm",
	"linechange",
	"keyboardheightchange",
]);

const { disabled, isError } = useFieldGroup();

// 是否禁用
const isDisabled = computed(() => {
	return disabled.value || props.disabled;
});

// 绑定值
const value = ref(props.modelValue);

// 是否聚焦（样式作用）
const isFocus = ref<boolean>(props.autofocus);

// 是否聚焦（输入框作用）
const isFocusing = ref<boolean>(props.autofocus);

const b = tv(theme);

const ui = computed(() =>
	b({
		size: props.size,
		border: props.border,
		focused: isFocus.value,
		disabled: isDisabled.value,
		error: isError.value,
		hasCount: props.showWordLimit,
		color: props.color,
	})
);

// 文本框样式
const textareaStyle = computed(() => {
	const style = {
		height: typeof props.height === 'number' ? `${props.height}rpx` : props.height,
	};

	return style;
});

const placeholderStyle = computed(() => {
	return `${props.placeholderStyle}`;
});

// 点击事件
function onTap() {
	isFocus.value = true;
}

// 获取焦点事件
function onFocus(e: any) {
	isFocus.value = true;
	emit("focus", e);
}

// 失去焦点事件
function onBlur(e: any) {
	emit("blur", e);

	setTimeout(() => {
		isFocus.value = false;
	}, 0);
}

// 输入事件
function onInput(e: any) {
	const v1 = e.detail.value;
	const v2 = value.value;

	value.value = v1;

	emit("update:modelValue", v1);
	emit("input", e);

	if (v1 != v2) {
		emit("change", v1);
	}
}

// 点击确认按钮事件
function onConfirm(e: any) {
	emit("confirm", e);
}

// 键盘高度变化事件
function onKeyboardheightchange(e: any) {
	emit("keyboardheightchange", e);
}

// 行数变化事件
function onLineChange(e: any) {
	emit("linechange", e);
}

// 聚焦方法
function focus() {
	setTimeout(() => {
		isFocusing.value = false;

		nextTick(() => {
			isFocusing.value = true;
		});
	}, 0);
}

watch(
	computed(() => props.modelValue),
	(val: string) => {
		value.value = val;
	}
);

defineExpose({
	isFocus,
	focus,
});
</script>

<template>
	<view :class="ui.root({ class: cn(props.customClass, props.ui?.root) })" @tap="onTap">
		<textarea :class="ui.inner({ class: props.ui?.inner })" :style="textareaStyle" :value="value" :name="name"
			:disabled="readonly ?? isDisabled" :placeholder="placeholder"
			:placeholder-class="`text-surface-400 ${placeholderClass}`" :placeholder-style="placeholderStyle"
			:maxlength="maxlength" :focus="isFocusing" :cursor="cursor" :cursor-spacing="cursorSpacing"
			:cursor-color="cursorColor" :show-confirm-bar="showConfirmBar" :confirm-hold="confirmHold"
			:auto-height="autoHeight" :fixed="fixed" :adjust-position="adjustPosition" :hold-keyboard="holdKeyboard"
			:inputmode="inputmode" :disable-default-padding="disableDefaultPadding"
			:adjust-keyboard-to="adjustKeyboardTo" @confirm="onConfirm" @input="onInput" @linechange="onLineChange"
			@blur="onBlur" @focus="onFocus" @keyboardheightchange="onKeyboardheightchange" />

		<slot v-if="showWordLimit" name="limit" :length="value.length" :max="maxlength">
			<text :size="12" :class="ui.text({ class: props.ui?.text })">{{
				value.length }} / {{ maxlength }}</text>
		</slot>
	</view>
</template>



<style scoped>
:deep(.uni-textarea-compute) {
	opacity: 0;
}
</style>
