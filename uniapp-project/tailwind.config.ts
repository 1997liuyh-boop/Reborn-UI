import type { Config } from 'tailwindcss'
import { getIconCollections, iconsPlugin } from '@egoist/tailwindcss-icons'
import cssMacro from 'weapp-tailwindcss/css-macro'
import { isMp } from './platform'

export default <Config>{
  content: ['./index.html', './src/**/*.{html,js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        error: {
          DEFAULT: "var(--error)",
          foreground: "var(--error-foreground)",
        },
        neutral: {
          DEFAULT: "var(--neutral)",
          foreground: "var(--neutral-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
    iconsPlugin({
      // 在这里可以选择你要使用的 icon, 更多详见:
      // https://icon-sets.iconify.design/
      collections: getIconCollections(['svg-spinners', 'mdi']),
    }),
  ],
  corePlugins: {
    // 小程序去使用 h5 的 preflight 和响应式 container 没有意义
    preflight: !isMp,
    container: !isMp,
  },
}
