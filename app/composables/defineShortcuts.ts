/* eslint-disable regexp/no-super-linear-backtracking */
/* eslint-disable regexp/no-useless-quantifier */
import { computed, ref, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useActiveElement, useDebounceFn, useEventListener } from '@vueuse/core'

/** 快捷键回调函数类型 */
type Handler = (event?: KeyboardEvent) => void

/**
 * 单个快捷键的配置项
 */
export interface ShortcutConfig {
  /** 按下快捷键时执行的回调 */
  handler: Handler
  /**
   * 当焦点在输入框内时是否仍然生效。
   * - `false`（默认）：输入框聚焦时禁用
   * - `true`：任何输入框聚焦时仍生效
   * - `string`：仅当聚焦的 input 的 `name` 属性匹配时才生效
   */
  usingInput?: string | boolean
}

/**
 * 快捷键配置映射表。
 *
 * 键名格式说明：
 * - **组合键**：使用 `_` 连接修饰符和按键，如 `'meta_k'`、`'ctrl_shift_f'`
 * - **链式键**：使用 `-` 连接两个按键，表示依次按下，如 `'g-h'`（先按 g 再按 h）
 * - 值为 `false | null | undefined` 时表示禁用该快捷键
 */
export interface ShortcutsConfig {
  [key: string]: ShortcutConfig | Handler | false | null | undefined
}

/**
 * `defineShortcuts` 的选项参数
 */
export interface ShortcutsOptions {
  /** 链式快捷键两次按键之间的最大间隔（毫秒），超时后重置。默认 800ms */
  chainDelay?: number
  /**
   * 是否启用布局无关模式。
   * 启用后使用 `event.code`（物理键位）而非 `event.key`（字符输出），
   * 避免非 QWERTY 键盘布局（如 AZERTY、Dvorak）导致快捷键失效。
   */
  layoutIndependent?: boolean
}

/** 经过解析后的内部快捷键结构 */
interface Shortcut {
  handler: Handler
  /** 当前是否启用（受 `usingInput` 和焦点状态影响） */
  enabled: boolean
  /** 是否为链式快捷键（如 `g-h`） */
  chained: boolean
  /** 匹配用的按键标识（`event.key` 或 `event.code`） */
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

/** 用于 `extractShortcuts` 的菜单项结构（兼容 ContextMenu / CommandPalette 等组件） */
interface ShortcutItem {
  kbds?: string[]
  onSelect?: Handler
  onClick?: Handler
  children?: ShortcutItem[] | ShortcutItem[][]
  items?: ShortcutItem[] | ShortcutItem[][]
}

// ─── 正则与常量 ───

/** 匹配链式快捷键格式：至少两段由 `-` 连接，如 `g-h` */
const chainedShortcutRegex = /^[^-]+.*-.*[^-]+$/
/** 匹配组合快捷键格式：至少两段由 `_` 连接，如 `meta_k` */
const combinedShortcutRegex = /^[^_]+.*_.*[^_]+$/
/** 需要单独匹配 Shift 状态的特殊键（这些键在按住 Shift 时仍应正确识别） */
const shiftableKeys = ['arrowleft', 'arrowright', 'arrowup', 'arrowright', 'tab', 'escape', 'enter', 'backspace']

// ─── 工具函数 ───

/**
 * 将人类可读的按键名转换为 `KeyboardEvent.code` 格式。
 * 用于 `layoutIndependent` 模式下的物理键位匹配。
 *
 * @example
 * convertKeyToCode('a')      // → 'KeyA'
 * convertKeyToCode('3')      // → 'Digit3'
 * convertKeyToCode('f5')     // → 'F5'
 * convertKeyToCode('enter')  // → 'Enter'
 */
function convertKeyToCode(key: string) {
  // 单个字母 → KeyX
  if (/^[a-z]$/i.test(key)) {
    return `Key${key.toUpperCase()}`
  }

  // 单个数字 → DigitX
  if (/^\d$/.test(key)) {
    return `Digit${key}`
  }

  // 功能键 → FX
  if (/^f\d+$/i.test(key)) {
    return key.toUpperCase()
  }

  // 特殊键查表
  const specialKeys: Record<string, string> = {
    space: 'Space',
    enter: 'Enter',
    escape: 'Escape',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
  }

  return specialKeys[key.toLowerCase()] || key
}

/**
 * 检测当前平台是否为 macOS / iOS。
 * 用于自动将 `meta` 修饰符映射为 `ctrl`（非 Mac 平台）。
 */
function isMacPlatform() {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}

/**
 * 从菜单项列表中自动提取快捷键映射。
 *
 * 遍历具有 `kbds` 属性的菜单项，将其快捷键描述与对应的
 * `onSelect` / `onClick` 回调组合为 `defineShortcuts` 可用的配置。
 *
 * @param items - 菜单项数组（支持嵌套和分组）
 * @param separator - 快捷键各段之间的连接符，默认 `_`（组合键）
 * @returns 可直接传入 `defineShortcuts` 的配置对象
 *
 * @example
 * ```ts
 * const shortcuts = extractShortcuts(contextMenuItems)
 * defineShortcuts(shortcuts)
 * ```
 */
export function extractShortcuts(items: ShortcutItem[] | ShortcutItem[][], separator: '_' | '-' = '_') {
  const shortcuts: Record<string, Handler> = {}

  function traverse(currentItems: ShortcutItem[]) {
    currentItems.forEach((item) => {
      // 如果菜单项同时拥有快捷键描述和点击回调，注册为快捷键
      if (item.kbds?.length && (item.onSelect || item.onClick)) {
        shortcuts[item.kbds.join(separator)] = item.onSelect || item.onClick as Handler
      }

      // 递归遍历嵌套子项
      if (item.children) {
        traverse(item.children.flat())
      }

      if (item.items) {
        traverse(item.items.flat())
      }
    })
  }

  traverse(items.flat())

  return shortcuts
}

/**
 * 定义全局键盘快捷键。
 *
 * 支持两种快捷键模式：
 * 1. **组合键**（`_` 分隔）：同时按下多个键，如 `'meta_k'`、`'ctrl_shift_f'`
 * 2. **链式键**（`-` 分隔）：依次按下两个键，如 `'g-h'`（类似 Vim 的前缀键）
 *
 * 特性：
 * - 自动处理 macOS/Windows 平台差异（`meta` ↔ `ctrl`）
 * - 输入框聚焦时默认禁用快捷键，可通过 `usingInput` 覆盖
 * - 支持 `layoutIndependent` 模式兼容非 QWERTY 键盘
 * - 链式键超时自动重置（默认 800ms）
 *
 * @param config - 快捷键配置（支持响应式，配置变化时自动更新）
 * @param options - 可选参数
 * @returns `useEventListener` 的清理函数
 *
 * @example
 * ```ts
 * defineShortcuts({
 *   // 组合键：Cmd/Ctrl + K 打开搜索
 *   meta_k: () => openSearch(),
 *   // 链式键：依次按 g → h 跳转首页
 *   'g-h': () => navigateTo('/'),
 *   // 带配置的快捷键：在输入框中也生效
 *   escape: { handler: () => closeDialog(), usingInput: true },
 * })
 * ```
 */
export function defineShortcuts(config: MaybeRefOrGetter<ShortcutsConfig>, options: ShortcutsOptions = {}) {
  /** 记录最近按下的键序列，用于匹配链式快捷键 */
  const chainedInputs = ref<string[]>([])
  /** 当前获得焦点的 DOM 元素 */
  const activeElement = useActiveElement()
  const layoutIndependent = options.layoutIndependent ?? false
  const macOS = computed(() => isMacPlatform())
  /** shiftableKeys 转换为 code 格式，用于 layoutIndependent 模式 */
  const shiftableCodes = shiftableKeys.map(key => convertKeyToCode(key))

  /** 清空链式键输入缓冲区 */
  const clearChainedInput = () => {
    chainedInputs.value.splice(0, chainedInputs.value.length)
  }

  /** 防抖版清空：超过 chainDelay 未输入下一个键时自动重置 */
  const debouncedClearChainedInput = useDebounceFn(clearChainedInput, options.chainDelay ?? 800)

  /**
   * 检测当前焦点是否在输入类元素上。
   * - 返回 `false`：焦点不在输入元素上
   * - 返回 `true`：焦点在匿名输入元素上（无 name 属性）
   * - 返回 `string`：焦点所在输入元素的 name 属性值
   */
  const usingInput = computed(() => {
    const tagName = activeElement.value?.tagName
    const contentEditable = activeElement.value?.contentEditable
    const isInputElement = tagName === 'INPUT' || tagName === 'TEXTAREA' || contentEditable === 'true' || contentEditable === 'plaintext-only'

    if (!isInputElement) {
      return false
    }

    // 有 name 属性则返回名称，否则返回 true
    return ((activeElement.value as HTMLInputElement | HTMLTextAreaElement | null)?.name as string) || true
  })

  /**
   * 将用户传入的配置解析为标准化的 Shortcut 数组。
   * 每次 config 或焦点状态变化时自动重新计算。
   */
  const shortcuts = computed<Shortcut[]>(() => {
    return Object.entries(toValue(config)).map(([key, shortcutConfig]) => {
      // 值为 falsy 时跳过
      if (!shortcutConfig) {
        return null
      }

      let shortcut: Partial<Shortcut>

      // ─── 格式校验 ───
      // 含 `-` 但不匹配链式格式的键名（如以 `-` 开头/结尾）
      if (key.includes('-') && key !== '-' && !key.includes('_') && !chainedShortcutRegex.test(key)) {
        console.trace(`[Shortcut] 无效的快捷键：${key}`)
      }

      // 含 `_` 但不匹配组合格式的键名
      if (key.includes('_') && key !== '_' && !combinedShortcutRegex.test(key)) {
        console.trace(`[Shortcut] 无效的快捷键：${key}`)
      }

      // ─── 判断类型：链式 or 组合 ───
      const chained = key.includes('-') && key !== '-' && !key.includes('_')

      if (chained) {
        // 链式快捷键：不需要修饰符，仅匹配按键序列
        shortcut = {
          key: layoutIndependent
            ? key.split('-').map(part => convertKeyToCode(part)).join('-')
            : key.toLowerCase(),
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
        }
      }
      else {
        // 组合快捷键：解析修饰符和基础按键
        const keySplit = key.toLowerCase().split('_')
        // 过滤掉所有修饰符标识，剩余部分为实际按键
        let baseKey = keySplit.filter(part => !['meta', 'command', 'ctrl', 'shift', 'alt', 'option'].includes(part)).join('_')

        if (layoutIndependent) {
          baseKey = convertKeyToCode(baseKey)
        }

        shortcut = {
          key: baseKey,
          metaKey: keySplit.includes('meta') || keySplit.includes('command'),
          ctrlKey: keySplit.includes('ctrl'),
          shiftKey: keySplit.includes('shift'),
          altKey: keySplit.includes('alt') || keySplit.includes('option'),
        }
      }

      shortcut.chained = chained

      // ─── 跨平台修饰符适配 ───
      // 非 macOS 平台：将 meta（⌘）自动映射为 ctrl
      if (!macOS.value && shortcut.metaKey && !shortcut.ctrlKey) {
        shortcut.metaKey = false
        shortcut.ctrlKey = true
      }

      // ─── 绑定 handler ───
      if (typeof shortcutConfig === 'function') {
        shortcut.handler = shortcutConfig
      }
      else {
        shortcut = {
          ...shortcut,
          handler: shortcutConfig.handler,
        }
      }

      if (!shortcut.handler) {
        console.trace('[Shortcut] 无效的处理函数')
        return null
      }

      // ─── 根据 usingInput 和焦点状态决定是否启用 ───
      let enabled = true

      if (!(shortcutConfig as ShortcutConfig).usingInput) {
        // 默认行为：焦点在输入框时禁用
        enabled = !usingInput.value
      }
      else if (typeof (shortcutConfig as ShortcutConfig).usingInput === 'string') {
        // 仅当焦点在指定 name 的输入框时才生效
        enabled = usingInput.value === (shortcutConfig as ShortcutConfig).usingInput
      }

      shortcut.enabled = enabled

      return shortcut as Shortcut
    }).filter(Boolean) as Shortcut[]
  })

  /**
   * 全局 keydown 事件处理器。
   *
   * 执行流程：
   * 1. 将按键追加到链式输入缓冲区
   * 2. 优先尝试匹配链式快捷键（检查最后两次按键）
   * 3. 若无链式匹配，再尝试匹配组合快捷键（检查修饰符 + 按键）
   * 4. 均无匹配时启动防抖清空计时器
   */
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.key) {
      return
    }

    // 判断当前按键类型，用于后续 Shift 状态的精确匹配
    const alphabetKey = layoutIndependent ? /^Key[A-Z]$/i.test(event.code) : /^[a-z]{1}$/i.test(event.key)
    const shiftableKey = layoutIndependent ? shiftableCodes.includes(event.code) : shiftableKeys.includes(event.key.toLowerCase())

    // 追加到链式输入缓冲区
    chainedInputs.value.push(layoutIndependent ? event.code : event.key)

    // ─── 1. 链式快捷键匹配 ───
    if (chainedInputs.value.length >= 2) {
      // 取最后两次按键拼接为链式键名
      const chainedKey = chainedInputs.value.slice(-2).join('-')

      for (const shortcut of shortcuts.value.filter(item => item.chained)) {
        if (shortcut.key !== chainedKey) {
          continue
        }

        if (shortcut.enabled) {
          event.preventDefault()
          shortcut.handler(event)
        }

        clearChainedInput()
        return
      }
    }

    // ─── 2. 组合快捷键匹配 ───
    for (const shortcut of shortcuts.value.filter(item => !item.chained)) {
      // 匹配按键标识
      if (layoutIndependent) {
        if (event.code !== shortcut.key) {
          continue
        }
      }
      else if (event.key.toLowerCase() !== shortcut.key) {
        continue
      }

      // 匹配修饰符状态
      if (event.metaKey !== shortcut.metaKey) {
        continue
      }

      if (event.ctrlKey !== shortcut.ctrlKey) {
        continue
      }

      if (event.altKey !== shortcut.altKey) {
        continue
      }

      // Shift 键的精确匹配逻辑：
      // 对于字母键、可 shift 键、或配置中明确要求 shift、或在 meta/ctrl 组合下按了 shift，
      // 必须严格匹配 shift 状态；其他情况下忽略 shift 差异
      if ((alphabetKey || shiftableKey || shortcut.shiftKey || (event.shiftKey && (event.metaKey || event.ctrlKey))) && event.shiftKey !== shortcut.shiftKey) {
        continue
      }

      if (shortcut.enabled) {
        event.preventDefault()
        shortcut.handler(event)
      }

      clearChainedInput()
      return
    }

    // 无匹配时启动防抖清空，避免残留的链式输入干扰后续匹配
    debouncedClearChainedInput()
  }

  // 注册全局 keydown 监听并返回清理函数
  return useEventListener('keydown', onKeyDown)
}
