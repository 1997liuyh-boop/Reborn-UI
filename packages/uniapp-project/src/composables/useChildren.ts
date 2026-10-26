import type {
    ComponentInternalInstance,
    ComponentPublicInstance,
    InjectionKey,
    VNode,
    VNodeNormalizedChildren
} from 'vue'
import {
    computed,
    getCurrentInstance,
    getCurrentScope,
    inject,
    onScopeDispose,
    onUpdated,
    provide,
    shallowReactive,
    shallowRef,
    watch
} from 'vue'

// 小程序端不支持从vue导出的isVNode方法，参考uni-mp-vue的实现
function isVNode(value: any): value is VNode {
    return value ? value.__v_isVNode === true : false
}

export function flattenVNodes(children: VNode) {
    const result: VNode[] = []

    const traverse = (children: VNode | VNodeNormalizedChildren) => {
        const vNode = Array.isArray(children) ? children : [children]
        vNode.forEach((child) => {
            if (Array.isArray(child)) {
                traverse(child)
            } else if (isVNode(child) && child.component?.subTree) {
                result.push(child)
                traverse(child.component.subTree)
            } else if (isVNode(child) && Array.isArray(child.children)) {
                traverse(child.children)
            } else if (isVNode(child)) {
                result.push(child)
            }
        })
    }

    traverse(children)

    return result
}

const findVNodeIndex = (vnodes: VNode[], vnode: VNode) => {
    const index = vnodes.indexOf(vnode)
    if (index === -1) {
        return vnodes.findIndex(
            (item) => vnode.key !== undefined && vnode.key !== null && item.type === vnode.type && item.key === vnode.key
        )
    }
    return index
}

// 显式 order 优先；缺省时 H5 按 VNode，小程序静态项保持登记顺序。
export function sortChildren(
    parent: ComponentInternalInstance,
    publicChildren: ComponentPublicInstance[],
    internalChildren: ComponentInternalInstance[]
) {
    const vnodes = parent && parent.subTree && parent.subTree.children ? flattenVNodes(parent.subTree) : []
    const explicit = internalChildren.every(child => typeof child.props.order === 'number' && Number.isFinite(child.props.order))
    if (explicit) internalChildren.sort((a, b) => Number(a.props.order) - Number(b.props.order))
    else if (vnodes.length) internalChildren.sort((a, b) => findVNodeIndex(vnodes, a.vnode) - findVNodeIndex(vnodes, b.vnode))

    const orderedPublicChildren = internalChildren.map((item) => item.proxy!)

    publicChildren.sort((a, b) => {
        const getIndex = (comp: ComponentPublicInstance) => {
            const uid = comp.$.uid
            return orderedPublicChildren.findIndex((i) => i.$.uid === uid)
        }
        return getIndex(a) - getIndex(b)
    })
}

/** 子组件登记 / 注销函数（useParent 与 useChildren 之间的约定） */
type ChildLinker = (child: ComponentInternalInstance) => void

export function useChildren<
    // eslint-disable-next-line ts/no-empty-object-type -- 与 vant 一致，默认子组件 props 为空对象
    Child extends ComponentPublicInstance = ComponentPublicInstance<{}, any>,
    ProvideValue = never
>(key: InjectionKey<ProvideValue>) {
    // 组件内部实例与公开代理都是不透明对象，只需要数组本身的增删、排序可被追踪，
    // 用 shallowReactive 避免读取元素时沿途为 vnode / subTree 创建深层代理
    const publicChildren: Child[] = shallowReactive([])
    const internalChildren: ComponentInternalInstance[] = shallowReactive([])
    const parent = getCurrentInstance()!

    watch(() => internalChildren.map(child => child.props.order), () => sortChildren(parent, publicChildren, internalChildren))
    // H5 父插槽换序时可能没有新增实例，仍需按当前 VNode 顺序更新索引。
    // #ifdef H5
    onUpdated(() => sortChildren(parent, publicChildren, internalChildren))
    // #endif

    const linkChildren = (value?: ProvideValue) => {
        const link = (child: ComponentInternalInstance) => {
            if (child.proxy) {
                internalChildren.push(child)
                publicChildren.push(child.proxy as Child)
                sortChildren(parent, publicChildren, internalChildren)
            }
        }

        const unlink = (child: ComponentInternalInstance) => {
            const index = internalChildren.indexOf(child)
            // 没登记过（link 时 proxy 尚不存在）或已注销过的子组件：splice(-1, 1) 会误删最后一个兄弟项
            if (index < 0) return
            publicChildren.splice(index, 1)
            internalChildren.splice(index, 1)
        }

        provide(
            key,
            Object.assign(
                {
                    link,
                    unlink,
                    children: publicChildren,
                    internalChildren
                },
                value
            )
        )
    }

    return {
        children: publicChildren,
        linkChildren
    }
}

export function useParent<T>(key: InjectionKey<T>) {
    const parent = inject(key, null) as (T & { link: ChildLinker; unlink: ChildLinker }) | null

    if (parent) {
        const instance = getCurrentInstance()!
        const index = computed(() => {
            const internalChildren = (parent as any).internalChildren as ComponentInternalInstance[]
            return internalChildren ? internalChildren.indexOf(instance) : -1
        })

        parent.link(instance)

        // 注销绑定到当前作用域：组件卸载与 effectScope 停止都会执行
        if (getCurrentScope()) {
            onScopeDispose(() => {
                parent.unlink(instance)
            })
        }

        return {
            parent,
            index
        }
    }

    return {
        parent: null,
        index: shallowRef(-1)
    }
}
