<script setup lang="ts">
import { ref } from 'vue';
import RebornTooltip from '../../ui/reborn-tooltip/RebornTooltip.vue';
import RebornButton from '../../ui/reborn-button/RebornButton.vue';

const placements = [
    'top', 'top-start', 'top-end',
    'bottom', 'bottom-start', 'bottom-end',
    'left', 'left-start', 'left-end',
    'right', 'right-start', 'right-end'
] as const;

const effects = ['dark', 'light'] as const;
const type = ref('dark');
</script>

<template>
    <div class="flex flex-col gap-8 p-8">
        <section>
            <h3 class="text-lg font-bold mb-4" @click="type = type === 'dark' ? 'light' : 'dark'">基础用法 {{ type }}</h3>
            <div class="flex gap-4">
                <RebornTooltip content="这是一个文字提示">
                    <RebornButton>Dark (Default)</RebornButton>
                </RebornTooltip>

                <RebornTooltip content="这是一个浅色文字提示" effect="light">
                    <RebornButton variant="outline">Light</RebornButton>
                </RebornTooltip>
            </div>
        </section>

        <section>
            <h3 class="text-lg font-bold mb-4">不同位置</h3>
            <div class="grid grid-cols-3 gap-4 w-fit">
                <div class="col-start-2">
                    <RebornTooltip placement="top-start" :effect="type">
                        <template #content>
                            Top <br /> Start
                        </template>
                        <RebornButton size="sm" class="w-24">Top Start</RebornButton>
                    </RebornTooltip>
                </div>
                <div>
                    <RebornTooltip placement="top" :effect="type">
                        <template #content>
                            Top
                        </template>
                        <RebornButton size="sm" class="w-24">Top</RebornButton>
                    </RebornTooltip>
                </div>
                <div>
                    <RebornTooltip placement="top-end" :effect="type">
                        <template #content>
                            Top <br /> End
                        </template>
                        <RebornButton size="sm" class="w-24">Top End</RebornButton>
                    </RebornTooltip>
                </div>

                <div class="row-start-2">
                    <RebornTooltip placement="left-start" :effect="type">
                        <template #content>
                            Left <br /> Start
                        </template>
                        <RebornButton size="sm" class="w-24">Left Start</RebornButton>
                    </RebornTooltip>
                </div>
                <div class="col-start-3">
                    <RebornTooltip placement="right-start" :effect="type">
                        <template #content>
                            Right <br /> Start
                        </template>
                        <RebornButton size="sm" class="w-24">Right Start</RebornButton>
                    </RebornTooltip>
                </div>

                <div class="row-start-3">
                    <RebornTooltip content="Left" placement="left" :effect="type">
                        <RebornButton size="sm" class="w-24">Left</RebornButton>
                    </RebornTooltip>
                </div>
                <div class="col-start-3">
                    <RebornTooltip content="Right" placement="right" :effect="type">
                        <RebornButton size="sm" class="w-24">Right</RebornButton>
                    </RebornTooltip>
                </div>

                <div class="row-start-4">
                    <RebornTooltip placement="left-end" :effect="type">
                        <template #content>
                            Left <br /> End
                        </template>
                        <RebornButton size="sm" class="w-24">Left End</RebornButton>
                    </RebornTooltip>
                </div>
                <div class="col-start-3">
                    <RebornTooltip placement="right-end" :effect="type">
                        <template #content>
                            Right <br /> End
                        </template>
                        <RebornButton size="sm" class="w-24">Right End</RebornButton>
                    </RebornTooltip>
                </div>

                <div class="row-start-5 col-start-2">
                    <RebornTooltip placement="bottom-start" :effect="type">
                        <template #content>
                            Bottom <br /> Start
                        </template>
                        <RebornButton size="sm" class="w-24">Bottom Start</RebornButton>
                    </RebornTooltip>
                </div>
                <div>
                    <RebornTooltip placement="bottom" :effect="type">
                        <template #content>
                            Bottom
                        </template>
                        <RebornButton size="sm" class="w-24">Bottom</RebornButton>
                    </RebornTooltip>
                </div>
                <div>
                    <RebornTooltip placement="bottom-end" :effect="type">
                        <template #content>
                            Bottom <br /> End
                        </template>
                        <RebornButton size="sm" class="w-24">Bottom End</RebornButton>
                    </RebornTooltip>
                </div>
            </div>
        </section>

        <section>
            <h3 class="text-lg font-bold mb-4">更多配置</h3>
            <div class="flex gap-4">
                <RebornTooltip content="无箭头文字提示" :arrow="false">
                    <RebornButton variant="outline" color="secondary">No Arrow</RebornButton>
                </RebornTooltip>

                <RebornTooltip content="延时 500ms 显示" :open-delay="500">
                    <RebornButton variant="outline" color="secondary">Delay 500ms</RebornButton>
                </RebornTooltip>

                <RebornTooltip content="禁用提示" :disabled="true">
                    <RebornButton variant="outline" color="secondary">Disabled</RebornButton>
                </RebornTooltip>
            </div>
        </section>
    </div>
</template>
