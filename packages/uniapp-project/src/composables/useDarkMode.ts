export const useDarkMode = () => {
    const isDark = ref(false)

    const toggleDarkMode = () => {
        isDark.value = !isDark.value
        updateTheme()
    }

    const updateTheme = () => {
        const value = isDark.value
        // Save to storage
        uni.setStorageSync('darkMode', value)

        // Update global state if possible using uniapp methods or root classes
        // For H5
        // #ifdef H5
        if (value) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        // #endif

        // For Mini Programs, we rely on page-bind class or page-meta
        // The component using this must bind the class to its root or use page-meta
        // We cannot easily inject class into other pages from here without a global store + page wrappers
    }

    const initTheme = () => {
        const saved = uni.getStorageSync('darkMode')
        if (saved !== '') {
            isDark.value = !!saved
        } else {
            // Default to system preference? Or false.
            // Let's verify system preference (optional)
            // const sysInfo = uni.getSystemInfoSync()
            // isDark.value = sysInfo.theme === 'dark'
            isDark.value = false
        }
        updateTheme()
    }

    // Initialize on creation (or can be called manually in onLaunch/onShow)
    initTheme()

    return {
        isDark,
        toggleDarkMode
    }
}
