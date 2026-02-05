<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, getCurrentInstance, nextTick, ref, watch, type PropType } from "vue";
import * as z from 'zod'
import { tv } from "@/lib/tv";
import { cn } from '@/lib/utils';
import theme, { formLabelPositions } from "./reborn-form.config";

// 表单校验错误信息
export type FormValidateError = {
	field: string; // 错误字段
	message: string; // 错误信息
};

export interface FormRule {
	required?: boolean;
	message?: string;
	validator: (value: any) => boolean | string;
	trigger?: string;
}

export interface FromProps {
	customClass?: ClassValue;
	modelValue: any;
	rules?: z.ZodObject<{ [key: string]: any }, any>;
	labelPosition?: typeof formLabelPositions[number]; // 标签位置
	labelWidth?: string | number; // 标签宽度
	hideRequiredAsterisk?: boolean; // 是否隐藏必填符号
	requireAsteriskPosition?: "left" | "right"; // 必填符号位置
	showMessage?: boolean; // 是否显示错误信息
	inlineMessage?: boolean; // 是否内联显示错误信息
	statusIcon?: boolean; // 是否在输入框中显示校验结果反馈图标
	validateOnRuleChange?: boolean; // 是否在规则改变时重新验证
	size?: "" | "sm" | "md" | "lg"; // 表单大小
	disabled?: boolean; // 是否禁用
	scrollToError?: boolean; // 是否滚动到错误信息
	trigger?: 'blur' | 'change'; // 触发验证
	ui?: Partial<{
		root: ClassValue;
	}>;
}

const props = withDefaults(defineProps<FromProps>(), {
	modelValue: () => ({}),
	labelPosition: "left",
	labelWidth: "140rpx",
	hideRequiredAsterisk: false,
	requireAsteriskPosition: "left",
	showMessage: true,
	inlineMessage: false,
	statusIcon: false,
	validateOnRuleChange: true,
	size: "",
	disabled: false,
	scrollToError: true,
	trigger: 'blur',
});

const b = tv(theme);

const { proxy } = getCurrentInstance()!;

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
	const styles = b();
	return {
		root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
	};
});
// 表单数据
const data = ref({} as any);

// 表单字段错误信息
const errors = ref(new Map<string, string>());

// 表单字段集合
const fields = ref(new Set<string>([]));

// 标签位置
const labelPosition = computed(() => props.labelPosition);

// 标签宽度
const labelWidth = computed(() => props.labelWidth);

// 是否显示必填星号
const showAsterisk = computed(() => props.hideRequiredAsterisk);

// 是否显示错误信息
const showMessage = computed(() => props.showMessage);

// 是否禁用整个表单
const disabled = computed(() => props.disabled);

// 错误信息锁定
const errorLock = ref(false);

// 设置字段错误信息
function setError(prop: string, error: string) {
	if (errorLock.value) {
		return;
	}

	if (prop != "") {
		errors.value.set(prop, error);
	}
}

// 移除字段错误信息
function removeError(prop: string) {
	if (prop != "") {
		errors.value.delete(prop);
	}
}

// 获取字段错误信息
function getError(prop: string): string {
	if (prop != "") {
		return errors.value.get(prop) ?? "";
	}

	return "";
}

// 获得错误信息，并滚动到第一个错误位置
async function getErrors(): Promise<FormValidateError[]> {
	return new Promise((resolve) => {
		// 错误信息
		const errs = [] as FormValidateError[];

		// 错误信息位置
		const tops = new Map<string, number>();

		// 完成回调，将错误信息添加到数组中
		function done() {
			tops.forEach((top, prop) => {
				errs.push({
					field: prop,
					message: getError(prop)
				});
			});

			// 滚动到第一个错误位置
			if (props.scrollToError && errs.length > 0) {
				uni.pageScrollTo({
					scrollTop: (tops.get(errs[0].field) ?? 0) + uni.getSystemInfoSync().windowTop,
					duration: 300
				});
			}

			resolve(errs);
		}

		// 如果错误信息为空，直接返回
		if (errors.value.size == 0) {
			done();
			return;
		}

		nextTick(() => {
			let component = proxy;

			// #ifdef MP
			let num = 0; // 记录已处理的表单项数量

			// 并查找其错误节点的位置
			const deep = (el: any, index: number) => {
				// 遍历当前节点的所有子节点
				el?.$children.map((e: any) => {
					// 限制递归深度，防止死循环
					if (index < 5) {
						// 判断是否为 re-form-item 组件且 prop 存在
						if (e.prop != null && e.$options.name == "re-form-item") {
							// 如果该字段已注册到 fields 中，则计数加一
							if (fields.value.has(e.prop)) {
								num += 1;
							}

							// 查询该 re-form-item 下是否有错误节点，并获取其位置信息
							uni.createSelectorQuery()
								.in(e)
								.select(".re-form-item--error")
								.boundingClientRect((res: any) => {
									// 如果未获取到节点信息，直接返回
									if (res == null) {
										return;
									}

									// 记录该字段的错误节点 top 值
									tops.set(e.prop, res?.top!);

									// 如果已处理的表单项数量达到总数，执行 done 回调
									if (num >= fields.value.size) {
										done();
									}
								})
								.exec();
						}

						// 递归查找子节点
						deep(e, index + 1);
					}
				});
			};

			deep(component, 0);
			// #endif

			// #ifndef MP
			uni.createSelectorQuery()
				.in(component)
				.selectAll(".re-form-item--error")
				.boundingClientRect((res: any) => {
					res?.map((e: any) => {
						tops.set((e.id ?? "").replace("re-form-item-", ""), e.top ?? 0);
					});

					done();
				})
				.exec();

			// #endif
		});
	});
}

// 清除所有错误信息
function clearErrors() {
	errors.value.clear();
}

// 获取字段值
// function getValue(prop: string): any | null {
// 	if (prop != "") {
// 		return get(data.value, prop, null);
// 	}

// 	return null;
// }

// // 获取字段规则
// function getRule(prop: string): z.ZodObject<any, any> {
// 	if (!props.rules || !(props.rules instanceof z.ZodObject)) {
// 		return {} as z.ZodObject;
// 	}
// 	const fieldName = prop;

// 	// 判断 baseSchema 的定义里是否有这个 key
// 	const hasField = fieldName in props.rules?.shape;

// 	if (!hasField) {
// 		return {} as z.ZodObject;
// 	}
// 	const schema = props.rules?.pick?.({ [prop]: true })
// 	return schema
// }


// 清除所有验证
function clearValidate() {
	errorLock.value = true;

	nextTick(() => {
		clearErrors();
		errorLock.value = false;
	});
}

// 验证单个字段
async function validateField(prop: string): Promise<string | null> {
	let error = null as string | null;

	if (prop != "") {
		// Zod check
		// const value = getValue(prop);
		const schema = props.rules?.pick({ [prop]: true });
		const result = await schema?.safeParseAsync(data.value);
		if (!result?.success) {
			const issue = result?.error.issues.find(i => i.path.length === 1 && i.path[0] === prop);
			if (issue) {
				error = issue.message;
			}
		}
		// If zod validation succeeds (or no error for THIS field), error remains null.
		// But wait, if safeParse fails on OTHER fields, result.success is false.
		// So we correctly search for OUR field error.

		// 移除错误信息
		removeError(prop);
	}

	if (error != null) {
		setError(prop, error!);
	}

	return error;
}

// 验证整个表单
async function validate(callback: (valid: boolean, errors: FormValidateError[]) => void) {
	// 验证所有字段
	fields.value.forEach((prop) => {
		validateField(prop);
	});

	// 获取所有错误信息，并滚动到第一个错误位置
	const errs = await getErrors();

	// 回调
	callback(errs.length == 0, errs);
}

/**
 * 将自定义类型数据转换为UTSJSONObject对象
 * @param data 要转换的数据
 * @returns 转换后的UTSJSONObject对象
 */
export function parseToObject<T>(data: T) {
	// #ifdef APP-ANDROID
	// @ts-ignore
	return JSON.parseObject(JSON.stringify(data ?? {})!)!;
	// #endif

	// #ifndef APP-ANDROID
	return JSON.parse(JSON.stringify(data || {}));
	// #endif
}

watch(
	computed(() => parseToObject(props.modelValue)),
	(val) => {
		data.value = val;
	},
	{
		immediate: true,
		deep: true
	}
);

defineExpose({
	validate, // 验证整个表单
	validateField, // 验证单个字段
	clearValidate // 清除所有验证
})
</script>
<template>
	<view :class="ui.root({ class: props.customClass })">
		<slot></slot>
	</view>
</template>