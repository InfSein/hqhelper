<script setup lang="ts">
import ItemSpan from './ItemSpan.vue'
import { useLocale } from '@/composables/useLocale'
import { getItemInfo, type ItemInfo } from '@/tools/item'

const { t } = useLocale()

interface ItemSubmissionRewardProps {
  itemInfo: ItemInfo
}
defineProps<ItemSubmissionRewardProps>()
</script>

<template>
  <div v-if="itemInfo.collectInfo" class="isr-container">
    <div style="text-align: left;">{{ t('common.collectability') }}</div>
    <div style="text-align: right;">{{ t('common.reward') }}</div>
    <template v-for="(reward, rewardIndex) in itemInfo.collectInfo.rewards" :key="`collect-reward-${rewardIndex}`">
      <div style="text-align: left;">
        {{ reward.collectabilityMin }}～{{ reward.collectabilityMax ?? '' }}
      </div>
      <div class="flex items-center justify-end">
        <div>{{ reward.scripAmount }}</div>
        <ItemSpan :item-info="getItemInfo(itemInfo.collectInfo.rewardScrip)" hide-name hide-pop-icon />
      </div>
    </template>
  </div>
  <div v-else></div>
</template>

<style scoped>
.isr-container {
  margin-left: 1em;
  width: fit-content;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 4px;
}
</style>