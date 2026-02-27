<template>
	<RebornSelectTrigger v-if="showTrigger" :placeholder="placeholder" :disabled="isDisabled" :focus="popupRef?.isOpen"
		:text="text" :clearable="clearable" :color="color" :size="size" @open="open()" @clear="clear" :ui="triggerUi">
		<template #default>
			<slot name="tag" :selectItem="selectItem" />
		</template>
	</RebornSelectTrigger>
	<reborn-popup ref="popupRef" v-model="visible" :title="title" :ui="popupUi">
		<view @touchmove.stop>
			<slot name="prepend"></slot>

			<view>
				<view v-if="noOptions" class="flex items-center justify-center h-[300px]">
					<text class="text-sm text-gray-4">暂无数据</text>
				</view>

				<RebornPickerView :color="color" :value="indexes" :columns="columns" :ui="pickerUi"
					@change-index="onChange" v-else>
					<template #default="{ item, index }">
						<slot name="option" :item="item" :index="index" />
					</template>
				</RebornPickerView>
			</view>

			<slot name="append"></slot>

			<view class="flex flex-row items-center justify-center p-3 gap-2">
				<RebornButton v-if="showCancel" :size="size" variant="outline" :color="color" class="flex-1"
					@tap="close">{{
						cancelText }}</RebornButton>
				<RebornButton v-if="showConfirm && !noOptions" :size="size" variant="solid" :color="color"
					class="flex-1" @tap="confirm">{{ confirmText }}</RebornButton>
			</view>
		</view>
	</reborn-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { ClassValue } from "clsx";

import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornPickerView from "../reborn-picker-view/RebornPickerView.vue";
import RebornPopup from "../reborn-popup/RebornPopup.vue";
import type { SelectOption } from "../reborn-picker-view/RebornPickerView.vue";
import { isEmpty, isNull } from "lodash";
import { useFormInject } from "@/composables/useFieldGroup";
import { selectColors, selectSizes } from "./reborn-select.config";

defineOptions({
	name: "reborn-select",
});

defineSlots<{
	tag(): any;
	prepend(): any;
	append(): any;
	option(): any;
}>();

export type SelectValue = string | number | (string | number)[] | null;

export interface SelectProps {
	/** 选择器的值 */
	modelValue?: SelectValue;
	/** 标题 */
	title?: string;
	/** 占位符 */
	placeholder?: string;
	/** 选项数据 */
	options?: SelectOption[];
	/** 是否显示触发器 */
	showTrigger?: boolean;
	/** 是否禁用 */
	disabled?: boolean;
	/** 列数 */
	columnCount?: number;
	/** 分隔符 */
	splitor?: string;
	/** 确认按钮文本 */
	confirmText?: string;
	/** 是否显示确认按钮 */
	showConfirm?: boolean;
	/** 取消按钮文本 */
	cancelText?: string;
	/** 是否显示取消按钮 */
	showCancel?: boolean;
	/** 是否显示清空按钮 */
	clearable?: boolean;
	/** 颜色 */
	color?: typeof selectColors[number];
	/** 尺寸 */
	size?: typeof selectSizes[number];
	/** 样式覆盖 */
	triggerUi?: Partial<{
		wrapper: ClassValue;
		content: ClassValue;
		text: ClassValue;
		placeholder: ClassValue;
		iconWrapper: ClassValue;
		clearIcon: ClassValue;
		arrowIcon: ClassValue;
	}>;
	popupUi?: Partial<{
		wrapper: ClassValue;
		mask: ClassValue;
		popup: ClassValue;
		inner: ClassValue;
		draw: ClassValue;
		header: ClassValue;
		title: ClassValue;
		container: ClassValue;
	}>;
	pickerUi?: Partial<{
		wrapper: ClassValue;
		header: ClassValue;
		headerText: ClassValue;
		pickerContainer: ClassValue;
		item: ClassValue;
		itemText: ClassValue;
		indicator: ClassValue;
	}>;
}

const props = withDefaults(defineProps<SelectProps>(), {
	modelValue: null,
	title: "请选择",
	placeholder: "请选择",
	options: () => [],
	showTrigger: true,
	disabled: false,
	columnCount: 1,
	splitor: " - ",
	confirmText: "确定",
	showConfirm: true,
	cancelText: "取消",
	showCancel: true,
	clearable: true,
	color: "primary",
	size: "md",
});

const emit = defineEmits<{
	(e: "update:modelValue", value: SelectValue): void;
	(e: "change", value: SelectValue, select: any): void;
	(e: "changing", value: SelectValue): void;
}>();

// reborn-form 上下文
const { disabled, validate } = useFormInject(props);
const isDisabled = computed(() => disabled.value || props.disabled);

// 弹出层引用
const popupRef = ref<any>(null);

// 是否为空选项
const noOptions = computed(() => isEmpty(props.options));

// 当前选中的值
const value = ref<any[]>([]);

// 当前选中项的索引
const indexes = ref<number[]>([]);

const selectItem = ref<any[]>([])

// 计算选择器列表数据
const columns = computed<SelectOption[][]>(() => {
	let options = props.options || [];
	let cols: SelectOption[][] = [];

	for (let i = 0; i < props.columnCount; i++) {
		const column = [...options];
		const val = i >= value.value.length ? null : value.value[i];

		let item = options?.find((item) => item.value == val);
		if (item == null && !isEmpty(options)) {
			item = options[0];
		}

		if (item?.children != null) {
			options = item.children;
		}

		cols.push(column);
	}

	return cols;
});

// 显示文本
const text = ref("");

function updateText() {
	const val = props.modelValue;
	if (val == null || val == undefined) {
		text.value = "";
	} else {
		let arr: any[];
		if (props.columnCount == 1) {
			arr = [val];
		} else {
			arr = val as any[];
		}

		text.value = arr
			.map((e, i) => columns.value[i]?.find((a) => a.value == e)?.label ?? "")
			.join(props.splitor);
	}
}

function getValue() {
	return props.columnCount == 1 ? value.value[0] : value.value;
}

function getSelectItem(a: number[]): any[] {
	return columns.value.map((c, i) => {
		return isNull(c[a[i]]) ? 0 : c[a[i]];
	});
}

function setValue(val: SelectValue) {
	let _value: any[];

	if (val == null) {
		_value = [];
	} else if (Array.isArray(val)) {
		_value = [...val];
	} else {
		_value = [val];
	}

	let _indexes: number[] = [];

	for (let i = 0; i < props.columnCount; i++) {
		const column = columns.value[i];

		if (i >= _value.length) {
			_indexes.push(0);
			if (!isNull(column) && column.length > 0 && !isNull(column[0])) {
				_value.push(column[0].value);
			}
		} else {
			let index = column.findIndex((e) => e.value == _value[i]);
			if (index < 0) index = 0;
			_indexes.push(index);
		}
	}

	value.value = _value;
	indexes.value = _indexes;
	updateText();
}

function onChange(a: number[]) {
	const b = [...indexes.value];
	let changed = false;

	for (let i = 0; i < a.length; i++) {
		if (changed) {
			b[i] = 0;
		} else if (b[i] != a[i]) {
			b[i] = a[i];
			changed = true;
		}
	}

	indexes.value = b;
	value.value = b.map((e, i) => (isNull(columns.value[i][e]) ? 0 : columns.value[i][e].value));
	emit("changing", getValue());
}

const visible = ref(false);
let callback: ((value: SelectValue) => void) | null = null;

function open(cb: ((value: SelectValue) => void) | null = null) {
	visible.value = true;
	setValue(props.modelValue);
	callback = cb;
}

function close() {
	visible.value = false;
}

function clear() {
	text.value = "";
	if (props.columnCount == 1) {
		emit("update:modelValue", null);
		emit("change", null, null);
	} else {
		emit("update:modelValue", []);
		emit("change", [], []);
	}
	if (validate) validate('change');
}

function confirm() {
	onChange(indexes.value);
	const val = getValue();

	selectItem.value = getSelectItem(indexes.value)

	emit("update:modelValue", val);
	emit("change", val, selectItem.value);
	if (validate) validate('change');
	if (callback != null) {
		callback(val);
	}
	close();
}

onMounted(() => {
	watch(
		() => props.modelValue,
		(val) => {
			setValue(val);
		},
		{ immediate: true }
	);

	watch(
		() => props.options,
		() => {
			updateText();
		}
	);
});

defineExpose({
	open,
	close,
});
</script>
