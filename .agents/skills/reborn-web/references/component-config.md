# 配置文件规范 (Web)

## 1. 类型定义位置

**所有与组件外观相关的常量与类型必须定义在 `config.ts` 中**，包括：
- `color` 常量数组与类型。
- `size` 常量数组与类型。
- `variant` 常量数组与类型。
- `UI` Slots 类型定义。

## 2. 样式规范

- **模式**: 使用 `tailwind-variants` 定义样式映射（`tv` 从 `~/lib/tv` 引入）。
- **一致性**: 确保属性（如 `color`, `size`）及其预设值尽可能与 UniApp 端对齐。
- **状态进变体**: 组件状态（`open`、`active`、`disabled`、`animating` 等）必须作为**布尔变体**写进 `variants`，由组件把响应式状态传给 `b({...})`，禁止在模板中手写状态类拼接。参考 `reborn-menu.config.ts` 的 `active` 变体与 `reborn-collapse.config.ts` 的 `open`/`animating` 变体。
- **任意值类**: 设计令牌未覆盖的样式使用 Tailwind 任意值语法，如 `grid-rows-[0fr]`、`[transform:translateY(100%)]`、`[contain:layout_style]`。

## 3. 布尔变体与 compoundVariants

- 布尔变体使用 `true` / `false` 两个键，`false` 分支即使为空也要显式写出 `{}`。
- `compoundVariants` 中的字符串变体值必须加 `as const` 收口（如 `position: 'top' as const`），否则会被推断为 `string` 导致类型不匹配。
- `defaultVariants` 必须为每个变体补全默认值。

## 4. 配置内的根因注释

复杂的动画/布局方案必须直接注释在对应 slot 或 variant 上，说明「为什么这样写」，防止后续被误改。真实范例（`reborn-collapse.config.ts`）：

```typescript
export default {
    slots: {
        root: '',
        /** 外层：grid 0fr↔1fr 高度动画。contain:layout style 隔离栅格内部重排，消除抖动 */
        trigger: 'grid transition-[grid-template-rows] duration-300 ease-out',
        /**
         * 内层：overflow-hidden + min-h-0 确保内容随栅格轨道裁切。
         * position="top"：flex-col justify-end 将面板底部锚定在触发条边缘，收起时从顶部朝触发条裁切。
         */
        content: 'overflow-hidden min-h-0',
    },
    variants: {
        open: {
            true: { trigger: 'grid-rows-[1fr]' },
            false: { trigger: 'grid-rows-[0fr]' }
        },
        position: {
            top: { content: 'flex flex-col justify-end' },
            bottom: {}
        },
        animating: {
            true: { trigger: 'reborn-collapse__animating [contain:layout_style]' },
            false: {}
        }
    },
    compoundVariants: [
        {
            position: 'top' as const,
            absolute: true,
            class: { trigger: 'absolute bottom-full left-0 z-50 w-full' }
        }
    ],
    defaultVariants: {
        open: false,
        position: 'bottom' as const,
        animating: false
    }
}
```

## 5. 变体常量与类型导出示例

```typescript
// 1. 定义变体常量
export const [name]Colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const [name]Variants = ['solid', 'outline', 'ghost'] as const

// 2. 导出类型
export type [Name]Color = (typeof [name]Colors)[number]
export type [Name]Variant = (typeof [name]Variants)[number]
```

## 6. 常用动画方案速查

| 场景 | 方案 | 参考 |
|------|------|------|
| 高度展开/收起 | 外层 `grid` + `grid-rows-[0fr]↔[1fr]` 过渡，内层 `overflow-hidden min-h-0` | `reborn-collapse.config.ts` |
| 浮层（absolute）展开/收起 | 裁切窗口固定 + 内层 `transform: translateY` 平移（GPU 合成，锚定边不漂移） | `reborn-collapse.config.ts` 的 `absolute` 变体 |
| 动画期间隔离重排 | 附加标记类 + `[contain:layout_style]`，供外部组件（如 RebornSticky）检测并冻结判定 | `reborn-collapse.config.ts` 的 `animating` 变体 |
