<!-- 
  FAR: Fixed Aspect Ratio
-->

<script setup lang="ts">
import useConfig from '@/composables/useConfig'
import type { ItemInfo } from '@/tools/item'

const { itemLanguage } = useConfig()

interface XivFARImageProps {
  src: string | ItemInfo
  alt?: string
  size?: number
}
const props = defineProps<XivFARImageProps>()

const loadFailed = ref(false)

const imgData = computed(() => {
  if (typeof props.src === 'string') {
    return {
      src: props.src,
      alt: props.alt || '-',
    }
  } else {
    return {
      src: props.src.iconUrl,
      alt: props.alt || (props.src[`name_${itemLanguage.value}`] || '-')[0],
    }
  }
})

const onImageLoadError = () => {
  loadFailed.value = true
}
</script>

<template>
  <img
    v-if="!loadFailed"
    alt="never"
    :draggable="false"
    :src="imgData.src"
    :width="size"
    :height="size"
    class="select-none"
    @error="onImageLoadError"
  />
  <div v-else class="inline-flex shrink-0 items-center justify-center select-none overflow-hidden text-base bg-sub rounded w-[var(--size)] h-[var(--size)]" :style="`--size: ${size}px; font-size: ${(size??14) / 2 + 1}px`">
    {{ imgData.alt }}
  </div>
</template>

<style scoped>
</style>