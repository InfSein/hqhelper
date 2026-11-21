<script setup lang="ts">
import XivFARImage from '@/components/ui/XivFARImage.vue'
import XivMapDetail from '@/components/map/XivMapDetail.vue'
import { useResponsive } from '@/composables/useResponsive'
import { useItemLocale } from '@/composables/useItemLocale'
import { XivUnpackedNpcs } from '@/assets/data'
import { XivMaps } from '@/tools/game/map'

const { isMobile } = useResponsive()
const { getNpcName, getNpcSubName, getPlaceNameById } = useItemLocale()

interface TradeNpcButtonProps {
  /** 兑换 NPC 的 ID */
  npcId: number
  /** 按钮图标尺寸 */
  size?: number
  /** 手动指定悬浮窗的触发方式 */
  popTrigger?: 'hover' | 'click' | 'manual'
  popStyle?: string
}
const props = defineProps<TradeNpcButtonProps>()

const npc = computed(() => XivUnpackedNpcs[props.npcId])
const npcName = computed(() => (npc.value ? getNpcName(npc.value) : ''))
const npcSubName = computed(() => (npc.value ? getNpcSubName(npc.value) : ''))
const mapData = computed(() => (npc.value?.place ? XivMaps[npc.value.place] : undefined))
const hasMapLocation = computed(() => !!(npc.value?.coords && mapData.value))
const fallbackPlaceName = computed(() => {
  if (hasMapLocation.value || !npc.value?.place) return ''
  return getPlaceNameById(npc.value.place)
})
const buttonSize = computed(() => props.size ?? 14)
</script>

<template>
  <n-popover
    v-if="npc"
    :trigger="popTrigger || (isMobile ? 'click' : 'hover')"
    :width="hasMapLocation && isMobile ? 250 : undefined"
    :placement="isMobile ? 'bottom' : 'right-start'"
    :style="popStyle"
  >
    <template #trigger>
      <n-button
        text
        :aria-label="npcName"
        class="inline-flex items-center justify-center shrink-0 select-none transition-transform hover:scale-110 active:scale-95"
        :style="{ width: buttonSize + 'px', height: buttonSize + 'px' }"
      >
        <XivFARImage
          :size="buttonSize"
          src="./ui/bag.png"
          :lazy="false"
        />
      </n-button>
    </template>
    <div class="select-text" @mousedown.stop>
      <div
        class="relative max-w-55.5 min-w-44"
        :class="{ 'border-b border-border pb-2 mb-1.5': hasMapLocation }"
      >
        <span
          class="absolute top-px left-px z-1 inline-flex items-center px-1.5 py-0.5 rounded-xs text-app-2xs leading-none select-none pointer-events-none bg-info/15 text-info"
        >
          NPC
        </span>
        <div class="text-center leading-[1.1]">
          <div class="text-app-xl px-11">{{ npcName }}</div>
          <div class="text-app-xs text-sub mt-0.5">{{ npcSubName }}</div>
        </div>
        <div v-if="fallbackPlaceName" class="text-center text-app-xs leading-tight mt-1">
          {{ fallbackPlaceName }}
        </div>
      </div>
      <XivMapDetail
        v-if="hasMapLocation && mapData && npc.coords"
        :map-data="mapData"
        :flag-x="npc.coords.x"
        :flag-y="npc.coords.y"
        show-map-tag
        show-coordinates
      />
    </div>
  </n-popover>
</template>

<style scoped>
</style>
