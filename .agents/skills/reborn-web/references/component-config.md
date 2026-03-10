# 配置文件规范 (Web)

## 1. 类型定义位置

**所有与组件外观相关的常量与类型必须定义在 `config.ts` 中**，包括：
- `color` 常量数组与类型。
- `size` 常量数组与类型。
- `variant` 常量数组与类型。
- `UI` Slots 类型定义。

## 2. 样式规范

- **模式**: 使用 `tailwind-variants` 定义样式映射。
- **一致性**: 确保属性（如 `color`, `size`）及其预设值尽可能与 UniApp 端对齐。

## 3. 代码示例

```typescript
// 1. 定义变体常量
export const [name]Colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const [name]Variants = ['solid', 'outline', 'ghost'] as const

// 2. 导出类型
export type [Name]Color = (typeof [name]Colors)[number]
export type [Name]Variant = (typeof [name]Variants)[number]

const config = {
    slots: {
        base: 'relative flex items-center justify-center transition-all duration-200',
        // 其他 slots...
    },
    variants: {
        color: {
            primary: { base: 'bg-primary text-white' },
        },
        variant: {
             solid: { base: 'border-none' },
             outline: { base: 'border border-current bg-transparent' },
        },
    },
    defaultVariants: {
        color: 'primary',
        variant: 'solid',
    },
} as const

export default config
```
