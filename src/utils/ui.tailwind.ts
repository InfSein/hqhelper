import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ===========================================
 * USAGE SAMPLE
 * ===========================================

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/utils/ui.tailwind'

// 1. 禁用默认的属性继承
defineOptions({
  inheritAttrs: false
})

// 2. 获取透传的属性（包含 class）
const attrs = useAttrs()

// 3. 使用 computed 包裹 cn 函数，确保响应式和性能
const mergedClasses = computed(() => {
  return cn(
    // 基础样式
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none',
    // 变体样式（条件渲染）
    {
      'bg-blue-600 text-white hover:bg-blue-700': props.variant === 'primary',
      'bg-gray-200 text-gray-800 hover:bg-gray-300': props.variant === 'secondary',
    },
    // 尺寸样式
    {
      'text-xs px-2.5 py-1.5': props.size === 'sm',
      'text-sm px-4 py-2': props.size === 'md',
    },
    // 4. 最后合并父组件传进来的 class（覆盖前面的样式）
    attrs.class as string
  )
})
</script>

<template>
  <button 
    :class="mergedClasses" 
    v-bind="{ ...attrs, class: undefined }"
  >
    <slot />
  </button>
</template>
 */