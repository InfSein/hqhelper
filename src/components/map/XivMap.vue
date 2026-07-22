<script setup lang="ts">
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { type XivMapAetheryteInfo, type XivMapInfo } from '@/tools/game/map.ts'
import UseConfig from '@/composables/useConfig.ts'

const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const {
  itemLanguage,
} = UseConfig()

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
  <div class="map-wrapper">
    <div class="map-content" :style="{ width: mapSize + 'px', height: mapSize + 'px' }">
      <!-- 地图 -->
      <XivFARImage
        class="map-image"
        :size="mapSize"
        :src="mapData.map_src"
      />
      <div class="markers-overlay">
        <!-- 目的地旗帜 -->
        <XivFARImage 
          class="marker flag"
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
                class="marker aetheryte"
                src="./ui/aetheryte.png"
                :style="getPositionStyle(aetheryte.x, aetheryte.y)"
              />
            </template>
            <div class="aetheryte-tooltip">
              <p>{{ getAetheryteName(aetheryte) }}</p>
            </div>
          </n-tooltip>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  
  .map-content {
    position: relative;
    
    .map-image {
      pointer-events: none;
    }
    .markers-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      
      .marker {
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 1;
        pointer-events: auto;
      }
    }
  }
}

.aetheryte-tooltip {
  text-align: center;
  font-size: 12px;
}
</style>