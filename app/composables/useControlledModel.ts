import type { WritableComputedRef } from "vue";
import { computed, getCurrentInstance, shallowRef } from "vue";
import { useRawProp } from "./useRawProp";

export interface ControlledModelOptions<T> {
    /** 调用方未传该属性（非受控）时的内部初值 */
    initial: T;
    /** 受控时把父级传入的值映射为展示值，显式 undefined / null 在这里决定怎么显示；缺省原样返回 */
    resolve?: (value: unknown) => T;
}

/**
 * 受控 / 非受控统一的双向绑定读写。组件仍用 defineModel 声明模型（类型、update 事件与修饰符），
 * 本函数只决定读哪一份值：调用方显式传了该属性（含显式空值）就读父级值，否则读内部值；
 * 写入时非受控先更新内部值，再统一派发 update 事件，不写 useModel 的本地缓存，
 * 因而「非受控交互后再切到受控空值」不会回显旧值，父级拒收后同值的下一次更新也不会被去重吞掉。
 */
export function useControlledModel<T>(name: string, options: ControlledModelOptions<T>): WritableComputedRef<T> {
    const instance = getCurrentInstance()!;
    const { present: controlled, refresh } = useRawProp(name);
    const local = shallowRef(options.initial);
    const resolve = options.resolve ?? ((value: unknown) => value as T);
    return computed({
        get: () => (controlled.value ? resolve(instance.props[name]) : local.value) as T,
        set: (value: T) => {
            refresh();
            if (!controlled.value) {
                if (Object.is(local.value, value)) return;
                local.value = value;
            }
            instance.emit(`update:${name}`, value);
        },
    });
}

/** 布尔模型的简写：受控时按真值显示（显式 undefined / null 视为 false），与 UniApp 端 useBooleanModel 同义 */
export function useBooleanModel(name: string, initial = false) {
    return useControlledModel<boolean>(name, { initial, resolve: value => !!value });
}
