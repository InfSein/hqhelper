<script setup lang="ts">
import XivMapDetail from './XivMapDetail.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useResponsive } from '@/composables/useResponsive'
import type { XivMapInfo } from '@/tools/game/map'

const { isMobile } = useResponsive()

interface MapButtonProps {
  size: number,
  mapData: XivMapInfo,
  flagX: number,
  flagY: number,
  /** 手动指定悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'
  popStyle?: string
}
defineProps<MapButtonProps>()
</script>

<template>
  <n-popover
    :trigger="popTrigger || (isMobile ? 'click' : 'hover')"
    :width="isMobile ? 250 : undefined"
    :placement="isMobile ? 'bottom' : 'right-start'"
    :style="popStyle"
  >
    <template #trigger>
      <XivFARImage
        :size="size"
        src="./ui/map.png"
      />
    </template>
    <XivMapDetail
      :map-data="mapData"
      :flag-x="flagX"
      :flag-y="flagY"
    />
  </n-popover>
</template>

<style scoped>
</style>
