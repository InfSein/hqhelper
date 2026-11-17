<script setup lang="ts">
import {
  OpenInNewFilled,
} from '@vicons/material'
import XivMap from './XivMap.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { getNearestAetheryte, type XivMapInfo } from '@/tools/game/map'

const { t } = useLocale()
const { itemLanguage } = useConfig()

interface XivMapDetailProps {
  /** 地图数据 */
  mapData: XivMapInfo
  /** 目标 X 坐标 */
  flagX: number
  /** 目标 Y 坐标 */
  flagY: number
  /** 地图尺寸(px)，默认 222 */
  mapSize?: number
  /** 是否在地图下方以小字展示坐标 */
  showCoordinates?: boolean
  /** 是否在区块左上角显示「地图」标签 */
  showMapTag?: boolean
}
const props = defineProps<XivMapDetailProps>()

const getMapName = () => {
  return props.mapData[`name_${itemLanguage.value}`]
}
const getMapSubName = () => {
  switch (itemLanguage.value) {
    case 'ja':
      return props.mapData.name_en
    case 'en':
      return props.mapData.name_ja
    case 'zh':
    default:
      return props.mapData.name_ja + ' / ' + props.mapData.name_en
  }
}

const handleOpenCafeMap = () => {
  window.open(`https://map.wakingsands.com/#f=mark&id=${props.mapData.map_id}&x=${props.flagX}&y=${props.flagY}`)
}
</script>

<template>
  <div class="map relative w-full">
    <span
      v-if="showMapTag"
      class="absolute top-px left-px z-1 inline-flex items-center px-1.5 py-0.5 rounded-xs text-app-2xs leading-none select-none pointer-events-none bg-primary/15 text-primary"
    >
      {{ t('common.map') }}
    </span>
    <div class="title">
      <div class="main" :class="{ 'px-11': showMapTag }">{{ getMapName() }}</div>
      <div class="subs text-sub mt-0.5">{{ getMapSubName() }}</div>
    </div>
    <XivMap
      :map-data="props.mapData"
      :map-size="mapSize ?? 222"
      :flag-x="props.flagX"
      :flag-y="props.flagY"
    />
    <div v-if="showCoordinates" class="w-full text-center text-app-xs text-sub leading-tight">
      {{ t('item.text.quoted_position', { x: flagX.toFixed(1), y: flagY.toFixed(1) }) }}
    </div>
    <div class="footer">
      <div v-if="props.mapData.aetherytes.length" class="recommended-aetheryte">
        <span>{{ t('common.recomm') }}</span>
        <span style="vertical-align: middle;">
          <XivFARImage
            :size="14"
            src="./ui/aetheryte.png"
          />
        </span>
        <span>
          {{ getNearestAetheryte(props.mapData, props.flagX, props.flagY)?.[`name_${itemLanguage}`] }}
        </span>
      </div>
      <div class="actions">
        <n-button size="small" @click="handleOpenCafeMap">
          <template #icon>
            <n-icon><OpenInNewFilled /></n-icon>
          </template>
          {{ t('map.text.open_in.ffcafe') }}
        </n-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;

  .title {
    line-height: 1.1;
    text-align: center;

    .main {
      font-size: var(--app-font-size-xl);
    }
    .subs {
      font-size: var(--app-font-size-xs);
    }
  }
  .footer {
    width: 100%;
    text-align: left;
  }
}
</style>
