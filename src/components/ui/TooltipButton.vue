<script setup lang="ts">
import { type Component } from 'vue'
import {
  NPopover, NTooltip, // 这些组件在函数中进行了引用，不能依赖自动引入
  type PopoverTrigger
} from 'naive-ui'
import type { Type } from 'naive-ui/es/button/src/interface'

const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

interface TooltipButtonProps {
  size?: "tiny" | "small" | "medium" | "large",
  type?: Type,
  tertiary?: boolean,
  quaternary?: boolean,
  square?: boolean,
  btnStyle?: string,
  icon?: Component,
  iconSize?: number,
  text?: string,
  tip?: string | string[],
  tipType?: "n-popover" | "n-tooltip",
  placement?: import("vueuc/lib/binder/src/interface").Placement,
  popTrigger?: PopoverTrigger,
  popStyle?: string,
}
const props = defineProps<TooltipButtonProps>()
const emits = defineEmits(['click'])

const btnClass = computed(() => {
  return [
    props.square ? 'n-square-button' : ''
  ].join(' ')
})
const tips = computed(() => {
  if (!props.tip) {
    return []
  } else if (Array.isArray(props.tip)) {
    return props.tip
  } else {
    return [props.tip]
  }
})
const tipComponent = computed(() => {
  if (props.tipType === 'n-tooltip') {
    return NTooltip
  }
  return NPopover
})
const popTrigger = computed(() => props.popTrigger ?? (isMobile.value ? 'manual' : 'hover'))

const handleButtonClick = () => {
  emits('click')
}
</script>

<template>
  <component :is="tipComponent" :trigger="popTrigger" :placement="placement" :style="popStyle">
    <template #trigger>
      <n-button
        :tertiary="tertiary" 
        :quaternary="quaternary" 
        :size="size" 
        :type="type"
        :class="btnClass" 
        :style="btnStyle" 
        @click="handleButtonClick"
      >
        <template #icon>
          <slot name="icon">
            <n-icon v-if="icon && !square" :size="iconSize" :component="icon" />
          </slot>
        </template>
        <slot>
          <n-icon v-if="square && icon" :size="iconSize" :component="icon" />
          {{ text }}
        </slot>
      </n-button>
    </template>
    <slot name="tooltip">
      <div class="tips">
        <div v-for="(tip, tipIndex) in tips" :key="'tip-' + tipIndex">{{ tip }}</div>
      </div>
    </slot>
  </component>
</template>

<style scoped>
</style>