export default {
    slots: {
        root: "w-64 space-y-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm",
        saturation: "relative w-full aspect-video rounded-lg cursor-crosshair overflow-hidden ring-1 ring-inset ring-black/5",
        saturationCursor: "absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-sm pointer-events-none",
        controls: "flex gap-3 items-center",
        preview: "size-10 rounded-lg shadow-inner ring-1 ring-inset ring-black/5 shrink-0",
        sliders: "flex-1 space-y-2",
        hueSlider: "relative h-3 w-full rounded-full cursor-pointer ring-1 ring-inset ring-black/5",
        hueCursor: "absolute h-4 w-4 -mt-0.5 -ml-2 bg-white rounded-full shadow-md border border-gray-100 pointer-events-none",
        alphaSlider: "relative h-3 w-full rounded-full cursor-pointer ring-1 ring-inset ring-black/5",
        alphaCursor: "absolute h-4 w-4 -mt-0.5 -ml-2 bg-white rounded-full shadow-md border border-gray-100 pointer-events-none",
        inputs: "space-y-2",
        formatToggles: "flex gap-1",
        input: "w-full text-xs font-mono",
        presets: "pt-3 border-t border-gray-100 dark:border-gray-800",
        presetTitle: "text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-tight",
        presetGrid: "grid grid-cols-10 gap-1.5",
        presetSwatch: "aspect-square ring-1 ring-black/5 hover:scale-110 transition-transform p-0!"
    }
}
