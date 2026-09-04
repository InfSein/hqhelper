<script setup lang="ts">
import { computed } from 'vue'
import { CurrencyExchangeOutlined } from '@vicons/material'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { getPatchTradeItems } from '@/tools/game/patch-guide'

interface TradeItemsSectionProps {
  patchVer: string
}
const props = defineProps<TradeItemsSectionProps>()

const store = useStore()
const { t } = useLocale()

const tradeGroups = computed(() => {
  return getPatchTradeItems(props.patchVer)
})
</script>

<template>
  <FoldableCard card-key="patch-guide-trade">
    <template #header>
      <div class="card-title">
        <n-icon :component="CurrencyExchangeOutlined" />
        <span class="card-title__text">{{ t('patch_guide.section.trade_items') }}</span>
      </div>
    </template>

    <n-empty v-if="!tradeGroups.length" :description="t('patch_guide.empty')" class="my-4" />

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
      <n-card
        v-for="group in tradeGroups"
        :key="group.costItem.id"
        size="small"
        embedded
        :bordered="false"
        :class="store.userConfig.custom_background ? 'glasscard' : ''"
        class="border border-border"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <ItemSpan :item-info="group.costItem" :img-size="20" class="font-bold" />
          </div>
        </template>

        <div class="divide-y divide-border">
          <div
            v-for="item in group.items"
            :key="item.targetItem.id"
            class="flex items-center justify-between py-2 px-1 transition-colors duration-150 hover:bg-bg-hover"
          >
            <ItemSpan :item-info="item.targetItem" :img-size="20" />
            <ItemSpan
              :item-info="group.costItem"
              :amount="item.costCount"
              show-amount
              hide-name
              :img-size="16"
            />
          </div>
        </div>
      </n-card>
    </div>
  </FoldableCard>
</template>

<style scoped>
</style>
