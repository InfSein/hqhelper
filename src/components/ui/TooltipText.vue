<script setup lang="ts">
import { inject, ref, type Ref } from "vue";

const isMobile = inject<Ref<boolean>>("isMobile") ?? ref(false);

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
      <span class="tooltip-text-trigger">
        {{ text }}
      </span>
    </template>
    {{ tooltip }}
  </n-tooltip>
</template>

<style scoped>
.tooltip-text-trigger {
  text-decoration: underline;
  text-decoration-style: dotted;
  cursor: help;
}
</style>
