<script setup lang="ts">
import HelpButton from '@/components/ui/HelpButton.vue'

// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

defineProps({
  tiny: {
    type: Boolean,
    default: false
  },
  borderColor: {
    type: String,
    default: '#919191',
  },
  title: {
    type: String,
    default: ''
  },
  titleMaxWidth: {
    type: String,
    default: 'unset'
  },
  descriptions: {
    type: Array as () => string[],
    default: () => []
  },
  containerExtraStyle: {
    type: String,
    default: ''
  },
  contentStyle: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <fieldset class="group-box" :style="`border: 1px dashed ${borderColor}; ${tiny ? 'padding: 0 8px 4px 8px' : ''}; ${containerExtraStyle}`">
    <legend class="flex justify-center items-center text-sm w-fit text-text whitespace-nowrap overflow-hidden text-ellipsis" :style="{ maxWidth: titleMaxWidth, marginBottom: tiny ? '-7px' : undefined }">
      <slot name="title">
        <div>{{ title }}</div>
        <div v-if="descriptions?.length" style="margin-left: 1px;">
          <HelpButton icon="info" :size="18" :descriptions="descriptions" />
        </div>
      </slot>
    </legend>
    <div class="h-full" :style="contentStyle">
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.group-box {
  padding: 0 8px 8px;
  margin-top: -12px;
  border-radius: var(--n-border-radius);
}
</style>