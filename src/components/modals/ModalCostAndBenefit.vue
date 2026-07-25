<script setup lang='ts'>
import {
  AttachMoneyOutlined,
} from '@vicons/material'
import ModalPreferences from './ModalPreferences.vue'
import HelpButton from '@/components/ui/HelpButton.vue'
import TooltipText from '@/components/ui/TooltipText.vue'
import ItemPriceTable from '@/components/item/ItemPriceTable.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useAppModals } from '@/composables/useAppModals'
import { useResponsive } from '@/composables/useResponsive'
import useItemPrice from '@/composables/useItemPrice.ts'
import type { ItemInfo } from '@/tools/item'

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()
const { calCostAndBenefit } = useItemPrice()
const { showItemPriceDetail } = useAppModals()

const modalId = 'modal-cost-and-benefits'

const showModal = defineModel<boolean>('show', { required: true })

interface ModalCostAndBenefitProps {
  costItems: ItemInfo[],
  benefitItems: ItemInfo[],
}
const props = defineProps<ModalCostAndBenefitProps>()

const costAndBenefit = computed(() => {
  return calCostAndBenefit(props.costItems, props.benefitItems)
})
const costInfo = computed(() => costAndBenefit.value.costInfo)
const benefitInfo = computed(() => costAndBenefit.value.benefitInfo)
const isCostPartial = computed(() => costAndBenefit.value.isCostPartial)
const isBenefitPartial = computed(() => costAndBenefit.value.isBenefitPartial)

const showItemDetails = computed(() => {
  return store.funcConfig.costandbenefit_show_item_details
})

const showPreferencesModal = ref(false)
const handleSettingButtonClick = () => {
  showPreferencesModal.value = true
}

const handleShowItemPriceDetail = () => {
  showItemPriceDetail([
    ...props.costItems,
    ...props.benefitItems,
  ])
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :id="modalId"
    max-width="1200px"
    :height="isMobile ? '700px' : '600px'"
    show-setting
    @on-setting-button-clicked="handleSettingButtonClick"
  >
    <template #header>
      <div class="card-title select-none">
        <n-icon><AttachMoneyOutlined /></n-icon>
        <span class="title">
          {{ t('statistics.group.cost_and_benefit.title') }}
        </span>
        <div class="card-title-actions">
          <a href="javascript:void(0);" @click="handleShowItemPriceDetail">[{{ t('item.price.detail_table.intro') }}]</a>
        </div>
      </div>
    </template>

    <n-tabs v-if="isMobile" type="segment" animated>
      <n-tab-pane
        name="cost"
        :tab="t('common.cost')"
      >
        <div class="container">
          <div class="text-right">
            <span>{{ t('statistics.group.cost_and_benefit.button.text.text_1', { val: costInfo }) }}</span>
            <i class="xiv gil"></i>
            <TooltipText
              v-if="isCostPartial"
              :text="t('common.or_more')"
              :tooltip="t('statistics.group.cost_and_benefit.tooltip.benefit_is_partial')"
            />
          </div>
          <ItemPriceTable
            price-type="NQ"
            :items="costItems"
            :show-item-details="showItemDetails"
            :container-id="modalId"
          />
        </div>
      </n-tab-pane>
      <n-tab-pane
        name="benefit"
        :tab="t('common.benefit')"
      >
        <div class="container">
          <div class="text-right">
            <span>{{ t('statistics.group.cost_and_benefit.button.text.text_2', { val: benefitInfo }) }}</span>
            <i class="xiv gil"></i>
            <TooltipText
              v-if="isBenefitPartial"
              :text="t('common.or_more')"
              :tooltip="t('statistics.group.cost_and_benefit.tooltip.benefit_is_partial')"
            />
          </div>
          <ItemPriceTable
            price-type="HQ"
            :items="benefitItems"
            :show-item-details="showItemDetails"
            :container-id="modalId"
          />
        </div>
      </n-tab-pane>
    </n-tabs>
    <div v-else class="wrapper">
      <GroupBox
        :descriptions="[t('cost_and_benefit.tooltip.cal_nq_price_here')]"
      >
        <template #title>
          <div class="group-title">
            <span>{{ t('statistics.group.cost_and_benefit.button.text.text_1', { val: costInfo }) }}</span>
            <i class="xiv gil"></i>
            <TooltipText
              v-if="isCostPartial"
              :text="t('common.or_more')"
              :tooltip="t('statistics.group.cost_and_benefit.tooltip.benefit_is_partial')"
            />
            <HelpButton icon="info" :size="18" :descriptions="[t('cost_and_benefit.tooltip.cal_nq_price_here')]" />
          </div>
        </template>
        <ItemPriceTable
          price-type="NQ"
          :items="costItems"
          :show-item-details="showItemDetails"
          :container-id="modalId"
        />
      </GroupBox>
      <GroupBox>
        <template #title>
          <div class="group-title">
            <span>{{ t('statistics.group.cost_and_benefit.button.text.text_2', { val: benefitInfo }) }}</span>
            <i class="xiv gil"></i>
            <TooltipText
              v-if="isBenefitPartial"
              :text="t('common.or_more')"
              :tooltip="t('statistics.group.cost_and_benefit.tooltip.benefit_is_partial')"
            />
            <HelpButton icon="info" :size="18" :descriptions="[t('cost_and_benefit.tooltip.cal_hq_price_here')]" />
          </div>
        </template>
        <ItemPriceTable
          price-type="HQ"
          :items="benefitItems"
          :show-item-details="showItemDetails"
          :container-id="modalId"
        />
      </GroupBox>
    </div>

    <ModalPreferences
      v-model:show="showPreferencesModal"
      setting-group="cost_benefit"
      app-show-fp
    />
  </MyModal>
</template>

<style scoped>
.wrapper {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  .group-title {
    display: flex;
    align-items: center;
    gap: 1px;
  }
}
</style>