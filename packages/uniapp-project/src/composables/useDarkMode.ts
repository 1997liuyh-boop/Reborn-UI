export const useDarkMode = () => {
    const isDark = ref(false)

    const toggleDarkMode = () => {
        isDark.value = !isDark.value
        updateTheme()
    }

    const updateTheme = () => {
        const value = isDark.value
        uni.setStorageSync('darkMode', value)

        // #ifdef H5
        if (value) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        // #endif

    }

    const initTheme = () => {
        const saved = uni.getStorageSync('darkMode')
        if (saved !== '') {
            isDark.value = !!saved
        } else {
            isDark.value = false
        }
        updateTheme()
    }

    initTheme()

    return {
        isDark,
        toggleDarkMode
    }
}
