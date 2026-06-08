<script setup lang="ts">
import {
  WifiProtectedSetupFilled,
} from '@vicons/material'
import HqLogo from './HqLogo.vue'

const t = inject<(message: string, args?: any) => string>('t')!

const hq = defineModel<boolean>('hq', { required: true })

interface HqSwitcherProps {
  size?: number
  readonly?: boolean
}
const props = defineProps<HqSwitcherProps>()

const textSize = computed(() => props.size ?? 16)

const containerStyle = computed(() => {
  return [
    `line-height: ${textSize.value}px`,
    (props.readonly ? 'pointer-events: none' : ''),
  ].join('; ')
})
const containerTip = computed(() => {
  return [
    t('item.text.curr_show_hqornq', [(hq.value ? 'HQ' : 'NQ')]),
    props.readonly ? t('item.text.cannot_switch_hqornq', [(hq.value ? 'NQ' : 'HQ')]) : t('item.text.click_to_switch_hqornq'),
  ].join('\r\n')
})
</script>

<template>
  <div
    class="container"
    :class="{ 'hq': hq }"
    :style="containerStyle"
    :title="containerTip"
    @click="hq = !hq"
  >
    <HqLogo :nq="!hq" :size="textSize - 2" />
    <span class="text">{{ hq ? 'HQ' : 'NQ' }}</span>
    <n-icon :size="textSize" class="action">
      <WifiProtectedSetupFilled />
    </n-icon>
  </div>
</template>

<style scoped>
.container {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  transition: background-color 0.3s ease, transform 0.6s ease;

  .text, .action {
    color: transparent;
    transition: color 0.3s ease;
  }
}
.container:hover {
  background-color: var(--color-background-hover);
  .text, .action {
    color: var(--color-text);
  }
}
.container.hq {
  transform: rotateX(360deg);
}

/* Mobile */
.app-mobile {
  .container {
    .text, .action {
      color: var(--color-text);
    }
  }
}
</style>