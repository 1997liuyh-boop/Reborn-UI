import { getCurrentInstance, onBeforeUpdate, shallowRef } from "vue";

const hasOwn = (target: object, key: string) => Object.prototype.hasOwnProperty.call(target, key);

/**
 * 读取调用方是否显式传入某个属性（包括显式传 undefined），组件默认值不参与判断。
 * 与 UniApp 端 composables/useRawProp 同名同义；Web 端 vnode.props 随父级更新，
 * 在 onBeforeUpdate 里刷新即可，结果只在变化时写入，避免无谓的依赖触发。
 */
export function useRawProp(name: string) {
    const instance = getCurrentInstance();
    const hyphenated = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const read = () => {
        const raw = instance?.vnode.props ?? {};
        return hasOwn(raw, name) || hasOwn(raw, hyphenated);
    };
    const present = shallowRef(read());
    function refresh() {
        const next = read();
        if (next !== present.value) present.value = next;
    }
    if (instance) onBeforeUpdate(refresh);
    return { present, refresh };
}
