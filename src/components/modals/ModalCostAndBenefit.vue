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
import useItemPrice from '@/composables/useItemPrice'
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

const customPriceMode = computed(() => store.funcConfig.costandbenefit_custom_price_enabled)

const toggleCustomPriceMode = () => {
  store.funcConfig.costandbenefit_custom_price_enabled = !store.funcConfig.costandbenefit_custom_price_enabled
  store.updateFuncConfig()
}

// 缓存与当前编辑的自定义价格数据
const customPriceMap = reactive<Record<number, number>>({})

watch(
  () => store.funcConfig.cache_custom_item_prices,
  (val) => {
    Object.keys(customPriceMap).forEach(key => delete customPriceMap[Number(key)])
    Object.assign(customPriceMap, val)
  },
  { immediate: true, deep: true }
)

const handlePriceUpdate = (itemId: number, price: number) => {
  customPriceMap[itemId] = price
}

const handlePriceSave = (itemId: number, price: number) => {
  store.funcConfig.cache_custom_item_prices[itemId] = price
  store.updateFuncConfig()
}

const costAndBenefit = computed(() => {
  return calCostAndBenefit(props.costItems, props.benefitItems)
})

const customCostAndBenefit = computed(() => {
  const calcTotal = (items: ItemInfo[], type: 'NQ' | 'HQ') => {
    let total = 0

    items.forEach(item => {
      if (customPriceMap[item.id] !== undefined) {
        total += item.amount * customPriceMap[item.id]
      } else {
        const actualType = (type === 'HQ' && !item.hqable) ? 'NQ' : type
        const p = store.funcConfig.cache_item_prices[item.id]?.[`${store.funcConfig.universalis_priceType}${actualType}`]
        if (p !== undefined && Math.floor(p) > 0) {
          total += item.amount * Math.floor(p)
        }
        // 物品价格为未知或???时按0来计算
      }
    })

    const totalStr = Math.floor(total).toLocaleString()

    return {
      total: totalStr,
      partial: false,
    }
  }

  const costRes = calcTotal(props.costItems, 'NQ')
  const benefitRes = calcTotal(props.benefitItems, 'HQ')

  return {
    costInfo: costRes.total,
    benefitInfo: benefitRes.total,
    isCostPartial: costRes.partial,
    isBenefitPartial: benefitRes.partial,
  }
})

const costInfo = computed(() => {
  return customPriceMode.value
    ? customCostAndBenefit.value.costInfo
    : costAndBenefit.value.costInfo
})
const benefitInfo = computed(() => {
  return customPriceMode.value
    ? customCostAndBenefit.value.benefitInfo
    : costAndBenefit.value.benefitInfo
})
const isCostPartial = computed(() => {
  return customPriceMode.value
    ? customCostAndBenefit.value.isCostPartial
    : costAndBenefit.value.isCostPartial
})
const isBenefitPartial = computed(() => {
  return customPriceMode.value
    ? customCostAndBenefit.value.isBenefitPartial
    : costAndBenefit.value.isBenefitPartial
})

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
        <div class="card-title__actions">
          <a href="javascript:void(0);" @click="handleShowItemPriceDetail">[{{ t('item.price.detail_table.intro') }}]</a>
          <a href="javascript:void(0);" @click="toggleCustomPriceMode">
            [{{ customPriceMode ? t('cost_and_benefit.custom_price_off') : t('cost_and_benefit.custom_price_on') }}]
          </a>
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
            :custom-price-mode="customPriceMode"
            :custom-prices="customPriceMap"
            @update:custom-price="handlePriceUpdate"
            @save:custom-price="handlePriceSave"
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
            :custom-price-mode="customPriceMode"
            :custom-prices="customPriceMap"
            @update:custom-price="handlePriceUpdate"
            @save:custom-price="handlePriceSave"
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
          :custom-price-mode="customPriceMode"
          :custom-prices="customPriceMap"
          @update:custom-price="handlePriceUpdate"
          @save:custom-price="handlePriceSave"
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
          :custom-price-mode="customPriceMode"
          :custom-prices="customPriceMap"
          @update:custom-price="handlePriceUpdate"
          @save:custom-price="handlePriceSave"
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