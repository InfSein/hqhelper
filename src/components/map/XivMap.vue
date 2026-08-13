<script setup lang="ts">
import XivFARImage from '@/components/ui/XivFARImage.vue'
import useConfig from '@/composables/useConfig'
import { useResponsive } from '@/composables/useResponsive'
import { type XivMapAetheryteInfo, type XivMapInfo } from '@/tools/game/map'

const { isMobile } = useResponsive()
const { itemLanguage } = useConfig()

interface MapButtonProps {
  mapData: XivMapInfo,
  mapSize: number,
  flagX: number,
  flagY: number
}
const props = defineProps<MapButtonProps>()

const mapScale = computed(() => props.mapSize / 40)

const getPositionStyle = (x: number, y: number) => {
  return {
    left: `${(x - 1) * mapScale.value}px`,
    top: `${(y - 1) * mapScale.value}px`,
    width: '16px',
    height: '16px'
  }
}
const getAetheryteName = (aetheryte: XivMapAetheryteInfo) => {
  return aetheryte[`name_${itemLanguage.value}`]
}
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="relative" :style="{ width: mapSize + 'px', height: mapSize + 'px' }">
      <!-- 地图 -->
      <XivFARImage
        class="pointer-events-none"
        :size="mapSize"
        :src="mapData.map_src"
      />
      <div class="absolute inset-0 pointer-events-none">
        <!-- 目的地旗帜 -->
        <XivFARImage 
          class="absolute -translate-x-1/2 -translate-y-1/2 z-[1] pointer-events-auto"
          src="./ui/flag.png"
          :style="getPositionStyle(flagX, flagY)"
        />
        <!-- 以太之光 -->
        <template v-for="aetheryte in mapData.aetherytes" :key="aetheryte.x + '-' + aetheryte.y">
          <n-tooltip
            :trigger="isMobile ? 'click' : 'hover'"
            :show-arrow="false"
            :keep-alive-on-hover="false"
            style="padding: 4px 8px;"
            content-style="padding: 0;"
          >
            <template #trigger>
              <XivFARImage 
                class="absolute -translate-x-1/2 -translate-y-1/2 z-[1] pointer-events-auto"
                src="./ui/aetheryte.png"
                :style="getPositionStyle(aetheryte.x, aetheryte.y)"
              />
            </template>
            <div class="text-center text-xs">
              <p>{{ getAetheryteName(aetheryte) }}</p>
            </div>
          </n-tooltip>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>