<script setup lang="ts">

interface AppLogoProps {
  size?: number
  nq?: boolean
}
const props = defineProps<AppLogoProps>()

const size = computed(() => props.size ?? 14)
</script>

<template>
  <span
    :style="{
      fontSize: size + 'px',
    }"
  >
    <i class="xiv hq" :class="nq ? 'slash' : ''"></i>
  </span>
</template>

<style scoped>
i {
  color: var(--n-text-color);
}
i.slash {
  position: relative;
  display: inline-block;
}
i.slash::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120%;
  height: 1px;
  background: var(--color-text);
  transform: translateX(-50%) rotate(45deg);
  z-index: 2;
  box-shadow: 0 0 0 1px var(--color-background); 
}
</style>