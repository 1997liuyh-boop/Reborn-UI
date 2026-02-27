<script setup lang="ts">
onLaunch(() => {
  // #ifdef H5
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'theme-change') {
      const isDark = event.data.theme === 'dark'
      if (isDark) {
        document.documentElement.classList.add('dark')
      }
      else {
        document.documentElement.classList.remove('dark')
      }
    }
  })
  // #endif
})
</script>

<style lang="scss">
@use 'tailwindcss/base';
@use 'tailwindcss/components';
@use 'tailwindcss/utilities';
@use './styles/theme.css';

/*  #ifdef  H5  */
svg {
  display: initial;
}

/*  #endif  */

@layer components {
  .raw-btn {
    // 注意 after: 后面不能加任何空格，有些格式化工具可能会在这里自动加一个空格
    @apply after:border-none inline-flex items-center gap-2 rounded text-sm font-semibold transition-all;
  }

  .btn {
    // 使用上面定义的 raw-btn
    @apply raw-btn bg-gradient-to-r from-[#9e58e9] to-blue-500 px-2 py-1 text-white;
  }
}

/* Hide scrollbar for Chrome, Safari and Opera */
::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
html,
body {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
  font-family:
    Open Sans,
    -apple-system,
    BlinkMacSystemFont,
    Helvetica Neue,
    Helvetica,
    Segoe UI,
    Arial,
    Roboto,
    PingFang SC,
    miui,
    Hiragino Sans GB,
    Microsoft Yahei,
    sans-serif;
}

page {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  font-family:
    Open Sans,
    -apple-system,
    BlinkMacSystemFont,
    Helvetica Neue,
    Helvetica,
    Segoe UI,
    Arial,
    Roboto,
    PingFang SC,
    miui,
    Hiragino Sans GB,
    Microsoft Yahei,
    sans-serif;
  height: auto;
}
</style>
