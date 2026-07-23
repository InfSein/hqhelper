<script setup lang="ts">
import { KeyboardArrowDownRound } from '@vicons/material'

const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

interface DropdownActionMenuProps {
  label: string
  disabled?: boolean
  placement?: import('vueuc/lib/binder/src/interface').Placement
}

withDefaults(defineProps<DropdownActionMenuProps>(), {
  disabled: false,
  placement: 'bottom'
})
</script>

<template>
  <n-popover
    :placement="placement"
    :trigger="isMobile ? 'click' : 'hover'"
    :show-arrow="false"
    class="select-none"
    style="--n-padding: 4px;"
  >
    <template #trigger>
      <n-button icon-placement="right" :disabled="disabled">
        <template #icon>
          <n-icon><KeyboardArrowDownRound /></n-icon>
        </template>
        {{ label }}
      </n-button>
    </template>
    <div class="flex flex-col gap-0.5">
      <slot />
    </div>
  </n-popover>
</template>

<style scoped>
</style>
