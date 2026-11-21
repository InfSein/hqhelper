<script setup lang="ts">
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

interface TooltipTextProps {
  text: string;
  tooltip: string;
  placement?: import("vueuc/lib/binder/src/interface").Placement;
}
defineProps<TooltipTextProps>();
</script>

<template>
  <n-tooltip :trigger="isMobile ? 'click' : 'hover'" :placement="placement">
    <template #trigger>
      <span class="underline decoration-dotted cursor-help">
        {{ text }}
      </span>
    </template>
    {{ tooltip }}
  </n-tooltip>
</template>

<style scoped>
</style>
