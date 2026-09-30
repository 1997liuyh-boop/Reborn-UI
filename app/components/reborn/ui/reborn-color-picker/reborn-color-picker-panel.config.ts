export default {
    slots: {
        root: "w-64 space-y-4 p-3 bg-gray-1 rounded-xl border border-gray-2 shadow-sm",
        saturation: "relative w-full aspect-video rounded-lg cursor-crosshair overflow-hidden ring-1 ring-inset ring-black/5",
        saturationCursor: "absolute size-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-sm pointer-events-none",
        controls: "flex gap-3 items-center",
        preview: "size-10 rounded-lg shadow-inner ring-1 ring-inset ring-black/5 shrink-0",
        sliders: "flex-1 space-y-2",
        hueSlider: "relative h-3 w-full rounded-full cursor-pointer ring-1 ring-inset ring-black/5",
        hueCursor: "absolute size-4 -mt-0.5 -ml-2 bg-white rounded-full shadow-md border border-gray-2 pointer-events-none",
        alphaSlider: "relative h-3 w-full rounded-full cursor-pointer ring-1 ring-inset ring-black/5",
        alphaCursor: "absolute size-4 -mt-0.5 -ml-2 bg-white rounded-full shadow-md border border-gray-2 pointer-events-none",
        inputs: "space-y-2",
        formatToggles: "flex gap-1",
        input: "w-full text-sm font-mono",
        presets: "pt-3 border-t border-gray-2",
        // 预设分组标题：10px 低于 7 级字号令牌的下限（--text-sm 12px），无对应档位，只能写字面量。
        presetTitle: "text-[10px] text-gray-5 font-bold mb-2 uppercase tracking-tight",
        presetGrid: "grid grid-cols-10 gap-1.5",
        presetSwatch: "aspect-square ring-1 ring-black/5 hover:scale-110 transition-transform p-0!"
    }
}
