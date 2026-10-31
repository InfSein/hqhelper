<script setup lang="ts">
import {
  type PopoverTrigger,
} from 'naive-ui'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import useConfig from '@/composables/useConfig'
import { useResponsive } from '@/composables/useResponsive'
import type { XivCraftAction } from '@/assets/data'
import { getImgCdnUrl } from '@/tools/game'

const { itemLanguage } = useConfig()
const { isMobile } = useResponsive()

interface CraftActionButtonProps {
  craftAction: XivCraftAction,
  btnSize?: number,
  popPlacement?: import("vueuc/lib/binder/src/interface").Placement,
  popTrigger?: PopoverTrigger,
}
const props = defineProps<CraftActionButtonProps>()
const emits = defineEmits(['click'])

const btnSize = computed(() => props.btnSize ?? 42)
const imgSize = computed(() => btnSize.value - 6)
const imgUrl = computed(() => getImgCdnUrl(props.craftAction.icon))
const popPlacement = computed(() => props.popPlacement ?? 'top')
const popTrigger = computed(() => props.popTrigger ?? (isMobile.value ? 'manual' : 'hover'))

const btnClass = computed(() => {
  return [
    'n-square-button'
  ].join(' ')
})
const btnStyle = computed(() => {
  return [
    `--n-height: ${btnSize.value}px`,
  ].join('; ')
})

const getSubName = () => {
  switch (itemLanguage.value) {
    case 'ja':
      return props.craftAction.name_en
    case 'en':
      return props.craftAction.name_ja
    case 'zh':
    default:
      return props.craftAction.name_ja + ' / ' + props.craftAction.name_en
  }
}

const handleButtonClick = () => {
  emits('click')
}
</script>

<template>
  <n-popover :trigger="popTrigger" :placement="popPlacement">
    <template #trigger>
      <n-button :class="btnClass" :style="btnStyle" @click="handleButtonClick">
        <XivFARImage
          :src="imgUrl"
          :size="imgSize"
        />
      </n-button>
    </template>
    <div class="select-text">
      <div class="flex items-start gap-1.25 mt-[2%]">
        <XivFARImage
          :src="imgUrl"
          :size="34"
        />
        <div class="item-names">
          <div class="main">
            <span>{{ craftAction[`name_${itemLanguage}`] }}</span>
          </div>
          <div class="sub text-sub">{{ getSubName() }}</div>
        </div>
      </div>
    </div>
  </n-popover>
</template>

<style scoped>
.item-names {
  .main span {
    line-height: 1;
    font-size: var(--app-font-size-xl);
  }
  .sub,
  .main span.extra-name {
    line-height: 1;
    font-size: var(--app-font-size-xs);
  }
}
</style>