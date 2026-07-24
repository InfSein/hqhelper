<script setup lang="ts">
import {
  OpenInNewFilled,
} from '@vicons/material'
import XivMap from './XivMap.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useLocale } from '@/composables/useLocale'
import UseConfig from '@/composables/useConfig.ts'
import { useResponsive } from '@/composables/useResponsive'
import { getNearestAetheryte, type XivMapInfo } from '@/tools/game/map.ts'

const { t } = useLocale()
const { isMobile } = useResponsive()

const {
  itemLanguage,
} = UseConfig()

interface MapButtonProps {
  size: number,
  mapData: XivMapInfo,
  flagX: number,
  flagY: number,
  /** 手动指定悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'
  popStyle?: string
}
const props = defineProps<MapButtonProps>()

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
    <div class="map">
      <div class="title">
        <div class="main">{{ getMapName() }}</div>
        <div class="subs">{{ getMapSubName() }}</div>
      </div>
      <XivMap
        :map-data="props.mapData"
        :map-size="222"
        :flag-x="props.flagX"
        :flag-y="props.flagY"
      />
      <div class="footer">
        <div class="recommended-aetheryte">
          <span>{{ t('common.recomm') }}</span>
          <span style="vertical-align: middle;">
            <XivFARImage
              :size="14"
              src="./ui/aetheryte.png"
            />
          </span>
          <span>
            {{  getNearestAetheryte(props.mapData, props.flagX, props.flagY)?.[`name_${itemLanguage}`] }}
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
  </n-popover>
</template>

<style scoped>
.map {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;

  .title {
    line-height: 1;
    text-align: center;

    .main {
      font-size: calc(var(--n-font-size) + 2px);
    }
    .subs {
      font-size: calc(var(--n-font-size) - 2px);
      color: var(--color-text-sub);
    }
  }
  .footer {
    width: 100%;
    text-align: left;
  }
}
</style>