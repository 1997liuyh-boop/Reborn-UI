import type { Config } from 'tailwindcss'
import cssMacro from 'weapp-tailwindcss/css-macro'
import { isMp } from './platform'
// 以下部分可以不需要引入，除非你使用了这些功能
import { getIconCollections, iconsPlugin } from '@egoist/tailwindcss-icons'

export default <Config>{
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{html,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        red: {
          1: '#ffebee',
          2: '#ffe0e4',
          3: '#ffb1bc',
          4: '#ff8b9b',
          5: '#ff6675',
          6: '#ff3d58',
          7: '#d92946',
          8: '#b31938',
          9: '#8c0d2a',
          10: '#660821',
        },
        orange: {
          1: '#fff7df',
          2: '#ffe9c9',
          3: '#ffd5a0',
          4: '#ffc370',
          5: '#ffb03b',
          6: '#ff9711',
          7: '#bf7c2a',
          8: '#995c1a',
          9: '#733d0e',
          10: '#522601',
        },
        green: {
          1: '#f1faf8',
          2: '#e7f6f3',
          3: '#a2dfcf',
          4: '#5fcfad',
          5: '#3ac29e',
          6: '#16ae88',
          7: '#0b876c',
          8: '#036150',
          9: '#003b32',
          10: '#001412',
        },
        blue: {
          1: '#ecf9ff',
          2: '#dff4ff',
          3: '#9ed6f5',
          4: '#61ccff',
          5: '#35b6f2',
          6: '#0d99e5',
          7: '#0277bf',
          8: '#005999',
          9: '#003f73',
          10: '#00284d',
        },
        gray: {
          1: '#ffffff',
          2: '#f5f5f5',
          3: '#eeeeee',
          4: '#cccccc',
          5: '#aaaaaa',
          6: '#999999',
          7: '#666666',
          8: '#333333',
        },
        border: '#cccccc', // gray-4
        input: '#cccccc', // gray-4
        ring: '#ff3d58', // red-6
        background: '#f5f5f5', // gray-2
        foreground: '#333333', // gray-8
        primary: {
          DEFAULT: '#ff3d58', // red-6
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#333333', // gray-8
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ff3d58', // red-6
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#eeeeee', // gray-3
          foreground: '#999999', // gray-6
        },
        accent: {
          DEFAULT: '#cccccc', // gray-4
          foreground: '#333333', // gray-8
        },
        popover: {
          DEFAULT: '#ffffff', // gray-1
          foreground: '#333333', // gray-8
        },
        card: {
          DEFAULT: '#ffffff', // gray-1
          foreground: '#333333', // gray-8
        },
        success: {
          DEFAULT: '#16ae88', // green-6
          foreground: '#ffffff',
        },
        info: {
          DEFAULT: '#0d99e5', // blue-6
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#ff9711', // orange-6
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#ff3d58', // red-6
          foreground: '#ffffff',
        },
        neutral: {
          DEFAULT: '#999999', // gray-6
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: "var(--radius-ui-lg)",
        md: "var(--radius-ui-md)",
        sm: "var(--radius-ui-sm)",
        "ui-2xs": "var(--radius-ui-2xs)",
        "ui-xs": "var(--radius-ui-xs)",
        "ui-sm": "var(--radius-ui-sm)",
        "ui-md": "var(--radius-ui-md)",
        "ui-base": "var(--radius-ui-base)",
        "ui-lg": "var(--radius-ui-lg)",
      },
      fontSize: {
        20: "var(--text-size-20)",
        22: "var(--text-size-22)",
        24: "var(--text-size-24)",
        26: "var(--text-size-26)",
        28: "var(--text-size-28)",
        30: "var(--text-size-30)",
        32: "var(--text-size-32)",
        36: "var(--text-size-36)",
        40: "var(--text-size-40)",
        48: "var(--text-size-48)",
        52: "var(--text-size-52)",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      height: {
        "button-2xl": "var(--button-2xl-height)",
        "button-xl": "var(--button-xl-height)",
        "button-lg": "var(--button-lg-height)",
        "button-md": "var(--button-md-height)",
        "button-sm": "var(--button-sm-height)",
        "button-xs": "var(--button-xs-height)",
        "input-lg": "var(--input-lg-height)",
        "input-md": "var(--input-md-height)",
        "input-sm": "var(--input-sm-height)",
      },
      keyframes: {
        shake: {
          '0%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  // https://tw.icebreaker.top/docs/quick-start/uni-app-css-macro
  plugins: [
    cssMacro({
      variantsMap: {
        'wx': 'MP-WEIXIN',
        '-wx': {
          value: 'MP-WEIXIN',
          negative: true,
        },
        // 定义多个条件判断
        // mv: {
        //   value: 'H5 || MP-WEIXIN'
        // },
        // '-mv': {
        //   value: 'H5 || MP-WEIXIN',
        //   negative: true
        // }
      },
    }),
    // 以下部分可以不需要引入，除非你使用了这些功能
    iconsPlugin({
      // 在这里可以选择你要使用的 icon, 更多详见:
      // https://icon-sets.iconify.design/
      collections: getIconCollections(['svg-spinners', 'mdi', 'lucide', 'meteocons']),
    }),
  ],
  corePlugins: {
    // 小程序去使用 h5 的 preflight 和响应式 container 没有意义
    preflight: !isMp,
    container: !isMp,
  },
}
