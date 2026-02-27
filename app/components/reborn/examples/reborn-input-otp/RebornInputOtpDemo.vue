<script setup lang="ts">
import RebornInputOtp from "~/components/reborn/ui/reborn-input-otp/RebornInputOtp.vue";
import { inputOtpColors, inputOtpSizes } from "~/components/reborn/ui/reborn-input-otp/reborn-input-otp.config";

const size = ref<any>("md");
const color = ref<any>("primary");
const value1 = ref("");
const value2 = ref("");
const disabled = ref(false);
</script>

<template>
    <div class="flex w-full flex-col gap-10">
        <div
            class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
                <USelect v-model="size" :items="[...inputOtpSizes]" class="w-28" />
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
                <USelect v-model="color" :items="[...inputOtpColors]" class="w-28" />
            </div>
            <UCheckbox v-model="disabled" label="禁用" />
        </div>

        <div class="grid gap-8">
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">基础</h3>
                <RebornInputOtp v-model="value1" :size="size" :color="color" :disabled="disabled" />
                <p class="text-sm text-gray-500">当前值: {{ value1 || '空' }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">6位验证码</h3>
                <RebornInputOtp v-model="value2" :length="6" :size="size" :color="color" />
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">颜色</h3>
                <div class="flex flex-wrap gap-4">
                    <RebornInputOtp v-for="c in inputOtpColors" :key="c" :color="c" :size="size" :length="4" />
                </div>
            </div>
        </div>
    </div>
</template>
