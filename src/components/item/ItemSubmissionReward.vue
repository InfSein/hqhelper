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
  <div v-if="itemInfo.collectInfo" class="ml-[1em] w-fit grid grid-cols-2 gap-x-1">
    <div class="text-left">{{ t('common.collectability') }}</div>
    <div class="text-right">{{ t('common.reward') }}</div>
    <template v-for="(reward, rewardIndex) in itemInfo.collectInfo.rewards" :key="`collect-reward-${rewardIndex}`">
      <div class="text-left">
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
</style>