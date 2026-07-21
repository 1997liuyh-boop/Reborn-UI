# 配置文件规范 (UniApp)

## 1. 类型定义位置

**所有与组件外观相关的常量与类型必须定义在 `config.ts` 中**，包括：
- `color` 常量数组与类型。
- `size` 常量数组与类型。
- `variant` 常量数组与类型。
- `UI` Slots 类型定义。

## 2. 样式规范 (rpx)

- **单位**: 涉及高度、宽度、间距的样式值必须优先使用 `rpx` (例如 `h-[88rpx]`, `px-[32rpx]`)。
- **模式**: 必须采用 `tailwind-variants` (`tv`) 的 `slots` 模式。
- **溢出保护**: 承载文本的 Slot（如 `base`、`label`）必须附带 `max-w-full min-w-0`，配合 `truncate` 防止长文本撑破容器（Web 端 Badge 已落地此规范）。
- **图标尺寸**: 图标随 `size` 变体使用宽高类控制（UniApp 中如 `w-[32rpx] h-[32rpx]`），**不要**用字号类（`text-*`）间接控制图标大小；文本字号则应尽量由外层继承，避免在每个 size 变体里重复声明。

## 3. 状态变体与 compoundVariants

组件的运行时状态（如 `open`、`active`、`disabled`、`animating`、`position`）也应建模为 `variants`，由组件在 `computed` 中传入布尔值/枚举值驱动，而不是在模板里手写条件类名：

- **布尔状态变体**: 如 `open: { true: {...}, false: {...} }`，Web 端 Collapse 用 `grid-rows-[1fr]` / `grid-rows-[0fr]` 实现展开收起即是此模式。
- **组合场景用 `compoundVariants`**: 多个变体叠加才成立的样式（如「浮层模式 + 收起 + 面板在上方」）统一写进 `compoundVariants`，避免在 `.vue` 中拼接条件字符串。
- **动画状态类名约定**: 组件处于过渡动画中时，应输出 `reborn-[name]__animating` 状态类（配合 `animating` 变体）。该类名是跨组件协作信号——例如 Web 端 Sticky 通过探测子节点上的 `reborn-collapse__animating` 类名，在 Collapse 动画期间冻结吸顶判定。UniApp 端实现同类联动时必须沿用相同类名。

## 4. 代码示例

## 3. 代码示例

```typescript
// 1. 定义常量数组
export const [name]Colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const [name]Sizes = ['sm', 'md', 'lg'] as const

// 2. 导出类型
export type [Name]Color = (typeof [name]Colors)[number]
export type [Name]Size = (typeof [name]Sizes)[number]
export type [Name]UI = {
    root?: string
    text?: string
}

// 3. 配置主体
const config = {
    slots: {
        root: 'w-full h-[88rpx] flex items-center justify-center', // 强制使用 rpx
        text: 'text-[28rpx]',
    },
    variants: {
        color: {
            primary: { root: 'bg-primary', text: 'text-white' },
        },
        size: {
            sm: { root: 'h-[64rpx]', text: 'text-[24rpx]' },
        }
    },
    defaultVariants: {
        color: 'neutral',
        size: 'md',
    },
} as const

export default config
```

## 5. 状态变体示例（参考 Web 端 Collapse）

```typescript
const config = {
    slots: {
        root: '',
        /** 外层：grid 0fr↔1fr 高度动画 */
        trigger: 'grid transition-[grid-template-rows] duration-300 ease-out',
        /** 内层：overflow-hidden + min-h-0 确保内容随栅格轨道裁切 */
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
            /** 动画状态类名，供 Sticky 等组件探测并冻结布局判定 */
            true: { trigger: 'reborn-collapse__animating' },
            false: {}
        }
    },
    compoundVariants: [
        // 浮层模式 + 面板在触发条上方：面板锚定在触发条边缘
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
} as const
```

> 注意：小程序端对 `grid-template-rows` 过渡的支持不稳定，UniApp 端可改用「测量高度 + height 过渡」实现同等动画，但 **变体命名（open/position/animating）与状态类名必须与 Web 端保持一致**。

