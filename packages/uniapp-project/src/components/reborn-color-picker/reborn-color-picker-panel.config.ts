const theme = {
    slots: {
        root: 'flex flex-col w-[260px] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 select-none',
        saturation: 'relative w-full h-40 rounded-lg overflow-hidden cursor-crosshair mb-4',
        saturationCursor: 'absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-2 -translate-y-2 pointer-events-none transition-all duration-75',
        controls: 'flex items-center gap-4 mb-4',
        preview: 'w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm shrink-0',
        sliders: 'flex-1 flex flex-col gap-2',
        hueSlider: 'relative h-3 rounded-full cursor-pointer',
        hueCursor: 'absolute w-4 h-4 rounded-full bg-white border border-gray-200 shadow-sm top-1/2 -translate-y-1/2 -translate-x-2 pointer-events-none',
        alphaSlider: 'relative h-3 rounded-full cursor-pointer',
        alphaCursor: 'absolute w-4 h-4 rounded-full bg-white border border-gray-200 shadow-sm top-1/2 -translate-y-1/2 -translate-x-2 pointer-events-none',
        inputs: 'flex flex-col gap-3',
        formatToggles: 'flex gap-1',
        input: 'flex-1',
        presets: 'mt-4 pt-4 border-t border-gray-100 dark:border-gray-800',
        presetTitle: 'text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2',
        presetGrid: 'grid grid-cols-8 gap-1.5',
        presetSwatch: 'w-full h-5 rounded-sm hover:scale-110 active:scale-95 transition-transform'
    }
} as const
export default theme
