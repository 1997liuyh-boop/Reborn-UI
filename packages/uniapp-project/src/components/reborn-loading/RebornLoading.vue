<template>
    <view :class="ui.root()" :style="rootStyle">
        <view :class="ui.body()">
            <template v-if="type === 'ring'">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z">
                        <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate"
                            values="0 12 12;360 12 12" />
                    </path>
                </svg>
            </template>
            <template v-else-if="type === 'outline'">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
                    <path fill="currentColor"
                        d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                        opacity="0.25" />
                    <path fill="currentColor"
                        d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
                        <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate"
                            values="0 12 12;360 12 12" />
                    </path>
                </svg>
            </template>
            <template v-else-if="type === 'spinner'">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
                    <g>
                        <rect width="2" height="5" x="11" y="1" fill="currentColor" opacity="0.14" />
                        <rect width="2" height="5" x="11" y="1" fill="currentColor" opacity="0.29"
                            transform="rotate(30 12 12)" />
                        <rect width="2" height="5" x="11" y="1" fill="currentColor" opacity="0.43"
                            transform="rotate(60 12 12)" />
                        <rect width="2" height="5" x="11" y="1" fill="currentColor" opacity="0.57"
                            transform="rotate(90 12 12)" />
                        <rect width="2" height="5" x="11" y="1" fill="currentColor" opacity="0.71"
                            transform="rotate(120 12 12)" />
                        <rect width="2" height="5" x="11" y="1" fill="currentColor" opacity="0.86"
                            transform="rotate(150 12 12)" />
                        <rect width="2" height="5" x="11" y="1" fill="currentColor" transform="rotate(180 12 12)" />
                        <animateTransform attributeName="transform" calcMode="discrete" dur="0.75s"
                            repeatCount="indefinite" type="rotate"
                            values="0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12;360 12 12" />
                    </g>
                </svg>
            </template>
            <template v-else-if="type === 'bars-scale'">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
                    <rect width="2.8" height="12" x="1" y="6" fill="currentColor">
                        <animate id="SVGLQdHQe4p" attributeName="y" begin="0;SVGg3vsIeGm.end-0.1s" calcMode="spline"
                            dur="0.6s" keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="6;1;6" />
                        <animate attributeName="height" begin="0;SVGg3vsIeGm.end-0.1s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="12;22;12" />
                    </rect>
                    <rect width="2.8" height="12" x="5.8" y="6" fill="currentColor">
                        <animate attributeName="y" begin="SVGLQdHQe4p.begin+0.1s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="6;1;6" />
                        <animate attributeName="height" begin="SVGLQdHQe4p.begin+0.1s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="12;22;12" />
                    </rect>
                    <rect width="2.8" height="12" x="10.6" y="6" fill="currentColor">
                        <animate attributeName="y" begin="SVGLQdHQe4p.begin+0.2s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="6;1;6" />
                        <animate attributeName="height" begin="SVGLQdHQe4p.begin+0.2s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="12;22;12" />
                    </rect>
                    <rect width="2.8" height="12" x="15.4" y="6" fill="currentColor">
                        <animate attributeName="y" begin="SVGLQdHQe4p.begin+0.3s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="6;1;6" />
                        <animate attributeName="height" begin="SVGLQdHQe4p.begin+0.3s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="12;22;12" />
                    </rect>
                    <rect width="2.8" height="12" x="20.2" y="6" fill="currentColor">
                        <animate id="SVGg3vsIeGm" attributeName="y" begin="SVGLQdHQe4p.begin+0.4s" calcMode="spline"
                            dur="0.6s" keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="6;1;6" />
                        <animate attributeName="height" begin="SVGLQdHQe4p.begin+0.4s" calcMode="spline" dur="0.6s"
                            keySplines=".36,.61,.3,.98;.36,.61,.3,.98" values="12;22;12" />
                    </rect>
                </svg>
            </template>
            <template v-else-if="type === 'blocks-shuffle'">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
                    <rect width="10" height="10" x="1" y="1" fill="currentColor" rx="1">
                        <animate id="SVG7WybndBt" fill="freeze" attributeName="x" begin="0;SVGo3aOUHlJ.end" dur="0.2s"
                            values="1;13" />
                        <animate id="SVGVoKldbWM" fill="freeze" attributeName="y" begin="SVGFpk9ncYc.end" dur="0.2s"
                            values="1;13" />
                        <animate id="SVGKsXgPbui" fill="freeze" attributeName="x" begin="SVGaI8owdNK.end" dur="0.2s"
                            values="13;1" />
                        <animate id="SVG7JzAfdGT" fill="freeze" attributeName="y" begin="SVG28A4To9L.end" dur="0.2s"
                            values="13;1" />
                    </rect>
                    <rect width="10" height="10" x="1" y="13" fill="currentColor" rx="1">
                        <animate id="SVGUiS2jeZq" fill="freeze" attributeName="y" begin="SVG7WybndBt.end" dur="0.2s"
                            values="13;1" />
                        <animate id="SVGU0vu2GEM" fill="freeze" attributeName="x" begin="SVGVoKldbWM.end" dur="0.2s"
                            values="1;13" />
                        <animate id="SVGOIboFeLf" fill="freeze" attributeName="y" begin="SVGKsXgPbui.end" dur="0.2s"
                            values="1;13" />
                        <animate id="SVG14lAaeuv" fill="freeze" attributeName="x" begin="SVG7JzAfdGT.end" dur="0.2s"
                            values="13;1" />
                    </rect>
                    <rect width="10" height="10" x="13" y="13" fill="currentColor" rx="1">
                        <animate id="SVGFpk9ncYc" fill="freeze" attributeName="x" begin="SVGUiS2jeZq.end" dur="0.2s"
                            values="13;1" />
                        <animate id="SVGaI8owdNK" fill="freeze" attributeName="y" begin="SVGU0vu2GEM.end" dur="0.2s"
                            values="13;1" />
                        <animate id="SVG28A4To9L" fill="freeze" attributeName="x" begin="SVGOIboFeLf.end" dur="0.2s"
                            values="1;13" />
                        <animate id="SVGo3aOUHlJ" fill="freeze" attributeName="y" begin="SVG14lAaeuv.end" dur="0.2s"
                            values="1;13" />
                    </rect>
                </svg>
            </template>
            <template v-else-if="type === 'blocks-wave'">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
                    <rect width="7.33" height="7.33" x="1" y="1" fill="currentColor">
                        <animate id="SVGzjrPLenI" attributeName="x" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s"
                            values="1;4;1" />
                        <animate attributeName="y" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s" values="1;4;1" />
                        <animate attributeName="width" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="8.33" y="1" fill="currentColor">
                        <animate attributeName="x" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="8.33;11.33;8.33" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="1;4;1" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="1" y="8.33" fill="currentColor">
                        <animate attributeName="x" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="1;4;1" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="8.33;11.33;8.33" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="15.66" y="1" fill="currentColor">
                        <animate attributeName="x" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="15.66;18.66;15.66" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="1;4;1" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="8.33" y="8.33" fill="currentColor">
                        <animate attributeName="x" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="8.33;11.33;8.33" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="8.33;11.33;8.33" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="1" y="15.66" fill="currentColor">
                        <animate attributeName="x" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="1;4;1" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="15.66;18.66;15.66" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="15.66" y="8.33" fill="currentColor">
                        <animate attributeName="x" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s"
                            values="15.66;18.66;15.66" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="8.33;11.33;8.33" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="8.33" y="15.66" fill="currentColor">
                        <animate attributeName="x" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="8.33;11.33;8.33" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s"
                            values="15.66;18.66;15.66" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                    <rect width="7.33" height="7.33" x="15.66" y="15.66" fill="currentColor">
                        <animate id="SVGXAURnSRI" attributeName="x" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s"
                            values="15.66;18.66;15.66" />
                        <animate attributeName="y" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s"
                            values="15.66;18.66;15.66" />
                        <animate attributeName="width" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                        <animate attributeName="height" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s"
                            values="7.33;1.33;7.33" />
                    </rect>
                </svg>
            </template>
            <template v-else-if="type === 'gooey-balls'">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24">
                    <defs>
                        <filter id="SVGg4wYRcsm">
                            <feGaussianBlur in="SourceGraphic" result="y" stdDeviation="1.5" />
                            <feColorMatrix in="y" result="z" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" />
                            <feBlend in="SourceGraphic" in2="z" />
                        </filter>
                    </defs>
                    <g fill="currentColor" filter="url(#SVGg4wYRcsm)">
                        <circle cx="4" cy="12" r="3">
                            <animate attributeName="cx" calcMode="spline" dur="0.75s"
                                keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite" values="4;9;4" />
                            <animate attributeName="r" calcMode="spline" dur="0.75s"
                                keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite" values="3;8;3" />
                        </circle>
                        <circle cx="15" cy="12" r="8">
                            <animate attributeName="cx" calcMode="spline" dur="0.75s"
                                keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite"
                                values="15;20;15" />
                            <animate attributeName="r" calcMode="spline" dur="0.75s"
                                keySplines=".56,.52,.17,.98;.56,.52,.17,.98" repeatCount="indefinite" values="8;3;8" />
                        </circle>
                    </g>
                </svg>
            </template>
        </view>
    </view>
</template>

<script lang="ts">
export default {
    name: 'reborn-loading',
    options: {
        virtualHost: true,
        addGlobalClass: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, watch, ref, type PropType } from 'vue'
import { addUnit, isDef, objToStyle } from '@/lib/util'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { type LoadingUI, LoadingColor, LoadingType } from './reborn-loading.config'

export type RebornLoadingProps = {
    ui?: LoadingUI
    type?: LoadingType
    color?: LoadingColor
    size?: string | number
    customClass?: string
}

const props = withDefaults(defineProps<RebornLoadingProps>(), {
    ui: () => ({}),
    type: 'ring',
    color: 'primary',
    size: '30px'
})

const iconSize = ref<string>('30px')

watch(
    () => props.size,
    (newVal) => {
        iconSize.value = addUnit(newVal)
    },
    { deep: true, immediate: true }
)

const rootStyle = computed(() => {
    const style: Record<string, any> = {}
    if (isDef(iconSize.value)) {
        style.width = iconSize.value
        style.height = iconSize.value
    }
    return objToStyle(style)
})

const b = tv({
    extend: tv(theme),
    slots: props.ui
})

const ui = computed(() => {
    const styles = b({ color: props.color })
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
        body: (opts?: { class?: any }) => styles.body({ class: cn(opts?.class, props.ui?.body) }),
    }
})

</script>
