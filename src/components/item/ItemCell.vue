<script setup lang="ts">
import ItemSpan from './ItemSpan.vue'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { XivJobs, type XivJob } from '@/assets/data'
import { getItemInfo, type ItemInfo } from '@/tools/item'

const store = useStore()
const { t } = useLocale()

interface ItemCellProps {
  itemInfo: ItemInfo
  amount: number
  showItemDetails: boolean
  hidePopIcon?: boolean
  itemSpanMaxWidth?: string
  containerId?: string
}
defineProps<ItemCellProps>()

const getJobName = (jobInfo: XivJob) => {
  switch (store.userConfig.language_ui) {
    case 'ja':
      return (jobInfo?.job_name_ja || t('common.unknown')).substring(0, 2)
    case 'en':
      return jobInfo?.short_name || t('common.unknown')
    default:
      return (jobInfo?.job_name_zh || t('common.unknown')).substring(0, 2)
  }
}
const getTradeCost = (itemInfo: ItemInfo, amount: number) => {
  if (!itemInfo.tradeInfo) return undefined
  const cost = itemInfo.tradeInfo
  const receive = itemInfo.tradeInfo.receiveCount || 1
  const totalCost = amount * cost.costCount / receive
  return {
    costItem: cost.costId,
    costCount: (totalCost < 0) ? 0 : totalCost
  }
}
</script>

<template>
  <div v-if="showItemDetails" class="flex gap-1.25 leading-[1.2]">
    <div class="flex items-center">
      <XivFARImage
        :size="26"
        :src="itemInfo"
      />
    </div>
    <div>
      <div>
        <ItemSpan hide-icon :hide-pop-icon="hidePopIcon" :item-info="itemInfo" :span-max-width="itemSpanMaxWidth" :container-id="containerId" />
      </div>
      <div class="text-app-xs flex gap-x-0.75">
        <div v-if="itemInfo.craftInfo?.jobId" class="flex items-center gap-0.5 crafter">
          <XivFARImage
            :src="XivJobs[itemInfo.craftInfo.jobId].job_icon_url"
            :size="12"
          />
          <span>
            {{ getJobName(XivJobs[itemInfo.craftInfo.jobId]) + ' ' + t('common.val_level', itemInfo.craftInfo.craftLevel) + '★'.repeat(itemInfo.craftInfo?.starCount || 0) }}
          </span>
        </div>
        <div v-else-if="itemInfo.gatherInfo?.jobId" class="flex items-center gap-0.5 gatherer">
          <XivFARImage
            :src="XivJobs[itemInfo.gatherInfo.jobId].job_icon_url"
            :size="12"
          />
          <span>
            {{ getJobName(XivJobs[itemInfo.gatherInfo.jobId]) + ' ' + t('common.val_level', itemInfo.gatherInfo.level) + '★'.repeat(itemInfo.gatherInfo?.star || 0) }}
          </span>
        </div>
        <div v-else-if="itemInfo.canReduceFrom?.length" class="flex items-center gap-0.5 reduce">
          <XivFARImage
            src="./ui/reduce.png"
            :size="12"
          />
          <span>{{ t('common.reduce') }}</span>
        </div>
        <div v-else-if="getTradeCost(itemInfo, amount)">
          <ItemSpan
            :item-info="getItemInfo(getTradeCost(itemInfo, amount)!.costItem)"
            :img-size="12"
            :amount="getTradeCost(itemInfo, amount)!.costCount"
            hide-pop-icon hide-name show-amount
            container-style="gap: 0;"
          />
        </div>
        <div v-else-if="itemInfo.isFishingItem" class="flex items-center gap-0.5 fishing">
          <XivFARImage
            :src="XivJobs[18].job_icon_url"
            :size="12"
          />
          <span>{{ getJobName(XivJobs[18]) }}</span>
        </div>
        <div v-else-if="itemInfo.isCrystal" class="flex items-center gap-0.5 crystal">
          <XivFARImage
            src="https://icon.nbbjack.com/060000/060151.png"
            :size="12"
          />
          <span>{{ t('game.crystal') }}</span>
        </div>
        <div v-else>{{ t('common.other') }}</div>
      </div>
    </div>
  </div>
  <ItemSpan
    v-else
    :item-info="itemInfo"
    :container-id="containerId"
    :hide-pop-icon="hidePopIcon"
  />
</template>

<style scoped>
</style>