<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AccessAlarmsOutlined } from '@vicons/material'
import GatherItemCard from '@/views/gatherclock/components/GatherItemCard.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { type ItemInfo } from '@/tools/item'
import { getPatchLegendaryGatherings } from '@/tools/game/patch-guide'
import { fixWorkState, type WorkState } from '@/types/workstate/gatherclock'

interface LegendaryGatheringSectionProps {
  patchVer: string
}
const props = defineProps<LegendaryGatheringSectionProps>()

const store = useStore()
const { t } = useLocale()

const gatherings = computed(() => {
  return getPatchLegendaryGatherings(props.patchVer)
})

const workState = ref<WorkState>(fixWorkState())

const disable_workstate_cache = store.userConfig.disable_workstate_cache ?? false
if (!disable_workstate_cache) {
  const cachedWorkState = store.userConfig.gatherclock_cache_work_state
  if (cachedWorkState && JSON.stringify(cachedWorkState).length > 2) {
    workState.value = fixWorkState(cachedWorkState)
  }

  watch(workState, async () => {
    if (workState.value) {
      try {
        await Promise.resolve()
        store.userConfig.gatherclock_cache_work_state = workState.value
        store.updateUserConfig()
      } catch (error) {
        console.error('Error handling workState change in LegendaryGatheringSection:', error)
      }
    }
  }, { deep: true })
}

const handleSubscribeButtonClick = (itemInfo: ItemInfo) => {
  if (workState.value.subscribedItems.includes(itemInfo.id)) {
    workState.value.subscribedItems = workState.value.subscribedItems.filter(id => id !== itemInfo.id)
  } else {
    workState.value.subscribedItems.push(itemInfo.id)
  }
}

const handleStarButtonClick = (itemInfo: ItemInfo) => {
  if (workState.value.starItems.includes(itemInfo.id)) {
    workState.value.starItems = workState.value.starItems.filter(id => id !== itemInfo.id)
  } else {
    workState.value.starItems.push(itemInfo.id)
  }
}
</script>

<template>
  <FoldableCard card-key="patch-guide-gathering">
    <template #header>
      <div class="card-title">
        <n-icon :component="AccessAlarmsOutlined" />
        <span class="card-title__text">{{ t('patch_guide.section.legendary_gathering') }}</span>
      </div>
    </template>

    <n-empty v-if="!gatherings.length" :description="t('common.nothing')" class="my-4" />

    <n-el v-else>
      <n-grid
        cols="1 600:2 900:3 1200:4 1500:5 1900:6"
        item-responsive
        :x-gap="5"
        :y-gap="5"
      >
        <n-grid-item
          v-for="item in gatherings"
          :key="item.id"
        >
          <GatherItemCard
            :ban-item-pop="workState.banItemPop"
            :show-map="workState.showMap"
            :item="item"
            :subscribed-items="workState.subscribedItems"
            :star-items="workState.starItems"
            @on-star-button-click="handleStarButtonClick"
            @on-subscribe-button-click="handleSubscribeButtonClick"
          />
        </n-grid-item>
      </n-grid>
    </n-el>
  </FoldableCard>
</template>

<style scoped>
:deep(.item-card) {
  --primary-color: var(--n-primary-color, var(--app-color-primary, #18a058));
}
</style>
