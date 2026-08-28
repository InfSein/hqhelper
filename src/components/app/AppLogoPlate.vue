<script setup lang="ts">
interface AppLogoPlateProps {
  appName?: string
  patchText?: string
}
withDefaults(defineProps<AppLogoPlateProps>(), {
  appName: 'HqHelper',
  patchText: '- EVERCOLD -',
})
</script>

<template>
  <div class="logo">
    <div class="logo-content">
      <i class="xiv hq logo-about"></i>
      {{ appName }}
    </div>
    <div class="patch-text" v-if="patchText">{{ patchText }}</div>
  </div>
</template>

<style scoped>
.logo {
  position: relative;
  align-self: center;
  text-align: center;
  user-select: none;
  margin: 0.5em 0;
  padding-bottom: 0.6em;
  border-radius: 6px;
  box-shadow: rgba(6, 24, 44, 0.65) 0px 4px 6px -1px, rgba(255, 255, 255, 0.08) 0px 1px 0px inset;

  /* 文本流光特效 */
  background: linear-gradient(
    to right,
    #2B4458 0%,
    #364F7E 25%,
    #E2E1E1 50%,
    #AB9F8B 75%,
    #2B4458 100%
  );
  background-size: 200% auto;
  animation: text-stream-light 4s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;

  /* 边框流光特效 */
  &::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 8px;
    padding: 2px;
    background: conic-gradient(
      from var(--border-angle),
      #2B4458 0%,
      #364F7E 25%,
      #E2E1E1 50%,
      #AB9F8B 75%,
      #2B4458 100%
    );
    animation: logo-stream-light 4s linear infinite;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .logo-content {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4em 0.5em 0;
    line-height: 1;
    font-size: 32px;
    font-weight: 900;
  }
  .patch-text {
    line-height: 1.3;
    font-size: 12px;
    font-weight: normal;
    letter-spacing: 1px;
  }
}

@property --border-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes logo-stream-light {
  0% {
    --border-angle: 0deg;
  }
  100% {
    --border-angle: 360deg;
  }
}

@keyframes text-stream-light {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: -200% center;
  }
}
</style>
