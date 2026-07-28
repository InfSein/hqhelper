<!-- 
  FAR: Fixed Aspect Ratio
-->

<script setup lang="ts">
import type { ItemInfo } from '@/tools/item'
import useConfig from '@/tools/use-config'
import { type UserConfigModel } from '@/models/config-user'
import { type FuncConfigModel } from '@/models/config-func'

const userConfig = inject<Ref<UserConfigModel>>('userConfig')!
const funcConfig = inject<Ref<FuncConfigModel>>('funcConfig')!

const { itemLanguage } = useConfig(userConfig, funcConfig)

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
  <div v-else class="err-cell" :style="`--size: ${size}px; font-size: ${(size??14) / 2 + 1}px`">
    {{ imgData.alt }}
  </div>
</template>

<style scoped>
.err-cell {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  user-select: none;
  overflow: hidden;
  color: var(--color-base);
  background-color: var(--color-text-sub);
  border-radius: 4px;
  width: var(--size);
  height: var(--size);
}
</style>