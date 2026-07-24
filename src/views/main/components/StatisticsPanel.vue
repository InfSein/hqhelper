<script setup lang='ts'>
import ItemButton from '@/components/item/ItemButton.vue'
import ItemList from '@/components/item/ItemList.vue'
import TomeScriptButton from '@/components/TomeScriptButton.vue'
import ModalCraftStatements from '@/components/modals/ModalCraftStatements.vue'
import ModalProStatements from '@/components/modals/ModalProStatements.vue'
import ModalCostAndBenefit from '@/components/modals/ModalCostAndBenefit.vue'
import ModalImExportMain from '@/views/main/components/ModalImExportMain.vue'
import { useCostAndBenefit } from '@/composables/useCostAndBenefit'
import { XivUnpackedTradeMap, type XivPatchVer } from '@/assets/data'
import type { GearSelections } from '@/types/game/gear'
import { useFufuCal } from '@/tools/use-fufu-cal'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import { useStore } from '@/store'

import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'

const { t } = useLocale()
const { isMobile } = useResponsive()

const store = useStore()
const { getStatementData } = useFufuCal()

interface StatisticsPanelProps {
  patchSelected: XivPatchVer | undefined,
  statistics: any,
  aethersandGatherings: number[] | undefined,
  alkahests: number[] | undefined,
  gearSelections: GearSelections
}
const props = defineProps<StatisticsPanelProps>()

const showBiColorItemsInTomeScriptButton = computed(() => {
  return store.userConfig?.tomescript_show_bicolor_items ?? false
})

const lvBaseItems = computed(() => {
  const items = []
  for (const id in props.statistics.lvBase) {
    try {
      const item = getItemInfo(props.statistics.lvBase[id])
      items.push(item)
    } catch (error) {
      console.warn('[compute.lvBaseItems] Error processing item ' + id + ':', error)
    }
  }
  return items
})

/** 
 * 要高亮显示的素材组。
 * 
 * 在战斗职业HQ版本用于展示炼金术士的秘籍星级半成品-炼金幻水，顺序为`刚巧耐智意`。
 * 在生产采集HQ版本用于展示相较于前一战职版本新增的星级半成品，一般在[1,3]号index填写。
 */
const reagents = computed(() => {
  const placeHolder = getItemInfo(0)
  if (!props.alkahests?.length) {
    return [placeHolder,placeHolder,placeHolder,placeHolder]
  }
  const crafts = []
  props.alkahests.forEach(alkahest => {
    const item = props.statistics.lv1[alkahest.toString()] ?? alkahest
    crafts.push(getItemInfo(item))
  })
  while (crafts.length < 5) {
    crafts.push(placeHolder);
  }
  if (crafts[4].id === 0) crafts.pop()
  return crafts
})

const tomeScriptItems = computed(() => {
  const items = {} as Record<number, ItemInfo[]>
  for (const id in props.statistics.lvBase) {
    try {
      const _id = parseInt(id)
      if (props.aethersandGatherings?.length && props.aethersandGatherings.includes(_id)) continue
      const itemTradeInfo = XivUnpackedTradeMap[_id]
      if (itemTradeInfo) {
        const costId = itemTradeInfo.costId
        if (!showBiColorItemsInTomeScriptButton.value && costId === 26807) continue // 处理双色宝石
        if (!items[costId]) items[costId] = []
        const item = props.statistics.lvBase[id]
        items[costId].push(getItemInfo(item))
      }
    } catch (error) {
      console.warn('[compute.tomeScriptItems] Error processing item ' + id + ':', error)
    }
  }
  // 根据道具商店兑换顺序重组排序
  for (const costId in items) {
    const _costId = Number(costId)
    items[_costId] = items[_costId].sort((a, b) => 
      (a.uiTypeOrder - b.uiTypeOrder) ||
      (a.sortOrder - b.sortOrder) ||
      (a.id - b.id)
    )
  }
  return items
})

const precrafts = computed(() => {
  const common = []; const master = []
  for (const id in props.statistics.lv1) {
    try {
      const itemCalculated = props.statistics.lv1[id]
      const item = getItemInfo(itemCalculated)
      if (item.craftInfo?.recipeId) {
        if (item.craftInfo.masterRecipeId) {
          if (props.alkahests?.includes(item.id)) continue
          master.push(item)
        } else {
          common.push(item)
        }
      }
    } catch (error) {
      console.warn('[compute.commonPrecrafts] Error processing item ' + id + ':', error)
    }
  }
  return {
    commonPrecrafts: common,
    masterPrecrafts: master,
  }
})

/**
 * 表示独立统计出的灵砂。
 * 展示时应注意说明此灵砂已计入其他半成品所需的数量。
 */
const aethersands = computed(() => {
  if (!props.aethersandGatherings?.length) {
    return [] as ItemInfo[]
  }
  const aethersands : ItemInfo[] = []
  props.aethersandGatherings.forEach(ag => {
    if (props.alkahests?.includes(ag)) return // 忽略特殊秘籍半成品：炼金幻水
    const item = props.statistics.lvBase[ag.toString()] ?? ag
    aethersands.push(getItemInfo(item))
  })
  return aethersands
})

/**
 * 表示限时采集品统计。
 */
const gatheringsTimed = computed(() => {
  const gathers : ItemInfo[] = []
  lvBaseItems.value.forEach(item => {
    if (item.gatherInfo?.timeLimitInfo?.length) {
      gathers.push(item)
    }
  })
  return gathers
})

/**
 * 表示非限时(常规)采集品统计。
 */
const gatheringsCommon = computed(() => {
  const gathers : ItemInfo[] = []
  lvBaseItems.value.forEach(item => {
    if (item.gatherInfo?.placeID && !item.gatherInfo.timeLimitInfo?.length) {
      gathers.push(item)
    }
  })
  return gathers
})

/**
 * 表示碎晶/水晶/晶簇统计。
 */
const crystals = computed(() => {
  const _crystals = []
  for (const id in props.statistics.lvBase) {
    const item = props.statistics.lvBase[id]
    if (item?.uc === 59) { // * 参见src\assets\data\xiv-item-types.json
      _crystals.push(getItemInfo(item))
    }
  }
  return _crystals
})

const reagentsBtnColors = ['#FF8080', '#8080FF', '#FFC080', '#00BFFF', '#40E0D0'] // 刚巧耐智意

const showStatementModal = ref(false)
const showProStatementModal = ref(false)
const showStatement = () => {
  if (store.funcConfig.use_traditional_statement) {
    showStatementModal.value = true
  } else {
    showProStatementModal.value = true
  }
}
const statementData = computed(() => {
  return getStatementData(props.statistics)
})

const importExportData = computed(() => {
  return {
    gearSelections: props.gearSelections,
    statistics: props.statistics,
    tomeScriptItems: tomeScriptItems.value,
    normalGathering: gatheringsCommon.value,
    limitedGathering: gatheringsTimed.value,
    aethersands: aethersands.value,
    crystals: crystals.value,
    ui_lang: store.userConfig.language_ui,
    item_lang: store.userConfig.language_item === 'auto'
      ? store.userConfig.language_ui
      : store.userConfig.language_item,
    patchSelected: props.patchSelected
  }
})
const handleDisplayImportExportModal = () => {
  showImportExportModal.value = true
}
const showImportExportModal = ref(false)

const {
  showModal: showCostAndBenefitModal,
  updatingPrice,
  costAndBenefit,
  updateItemPrices,
  openModal: handleAnalysisItemPrices,
} = useCostAndBenefit(statementData)
provide('updateItemPrices', updateItemPrices)
</script>

<template>
  <FoldableCard card-key="main-statistics">
    <template #header>
      <i class="xiv square-4"></i>
      <span class="card-title-text">{{ t('statistics.view_statistics') }}</span>
      <a class="card-title-extra" href="javascript:void(0);" @click="showStatement">{{ t('common.mquoted_view_statement') }}</a>
      <a class="card-title-extra" href="javascript:void(0);" @click="handleDisplayImportExportModal">[{{ t('common.imexport') }}]</a>
    </template>
    <div class="wrapper">
      <GroupBox
        id="reagents-group" class="group" title-max-width="200px"
        :title="t('common.special')"
        :descriptions="[
          t('statistics.group_tooltip.special')
        ]"
      >
        <div class="container">
          <ItemButton
            v-for="(item, index) in reagents"
            :key="'reagent-' + index"
            :item-info="item"
            show-icon show-name show-amount
            :btn-color="reagentsBtnColors[index]"
            pop-use-custom-width
            :pop-custom-width="isMobile ? 300 : undefined"
          >
          </ItemButton>
          <TomeScriptButton
            :items="tomeScriptItems"
            :btn-style="reagents.length === 4 ? 'grid-column-start: span 2;' : ''"
          />
        </div>
      </GroupBox>
      <GroupBox
        id="aethersands-group" class="group"
        :title="t('statistics.group.aethersands')"
        :descriptions="[
          t('statistics.group_tooltip.common_material_lvbase')
        ]"
      >
        <div class="container">
          <ItemList
            :items="aethersands"
            :list-height="isMobile ? undefined : 120"
            :display-style="aethersands.length > 1 ? 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));' : ''"
            scroll-style="overflow-y: auto;"
            btn-pop-use-custom-width
            :btn-pop-custom-width="isMobile ? 300 : undefined"
          />
        </div>
      </GroupBox>
      <GroupBox
        id="master-precrafts-group" class="group"
        :title="t('statistics.group.common_master_precrafts')"
        :descriptions="[
          t('statistics.group_tooltip.common_master_precrafts')
        ]"
      >
        <div class="container">
          <ItemList
            :items="precrafts.masterPrecrafts"
            :list-height="isMobile ? undefined : 320"
            :show-collector-icon="!store.userConfig.hide_collector_icons"
            :btn-info-max-width="isMobile ? undefined : '192px'"
          />
        </div>
      </GroupBox>
      <GroupBox
        id="common-precrafts-group" class="group"
        :title="t('statistics.group.common_precrafts')"
        :descriptions="[
          t('statistics.group_tooltip.common_material_lv1')
        ]"
      >
        <div class="container">
          <ItemList
            :items="precrafts.commonPrecrafts"
            :list-height="isMobile ? undefined : 320"
            :show-collector-icon="!store.userConfig.hide_collector_icons"
            :btn-info-max-width="isMobile ? undefined : '192px'"
          />
        </div>
      </GroupBox>
      <div id="statistics-footer">
        <GroupBox
          id="gatherings-group" class="group"
          :title="t('statistics.group.gatherings.title')"
          :descriptions="[
            t('statistics.group_tooltip.common_material_lvbase')
          ]"
        >
          <div class="container">
            <n-collapse :accordion="!isMobile" :default-expanded-names="['crystals']">
              <n-collapse-item :title="t('statistics.group.gatherings.common')" name="gatheringsCommon">
                <div class="item-collapsed-container">
                  <ItemList
                    :items="gatheringsCommon"
                    :list-height="isMobile ? undefined : 320"
                    :show-collector-icon="!store.userConfig.hide_collector_icons"
                  />
                </div>
              </n-collapse-item>
              <n-collapse-item :title="t('statistics.group.gatherings.time_limited')" name="gatheringsTimed">
                <div class="item-collapsed-container">
                  <ItemList
                    :items="gatheringsTimed"
                    :list-height="isMobile ? undefined : 320"
                    :show-collector-icon="!store.userConfig.hide_collector_icons"
                  />
                </div>
              </n-collapse-item>
              <n-collapse-item :title="t('game.crystal')" name="crystals">
                <div class="item-collapsed-container">
                  <ItemList
                    :items="crystals"
                    :list-height="isMobile ? undefined : 320"
                  />
                </div>
              </n-collapse-item>
            </n-collapse>
          </div>
        </GroupBox>
        <GroupBox
          id="price-analysis-group" class="group"
          :title="t('statistics.group.cost_and_benefit.title')"
          :descriptions="[
            t('statistics.group.cost_and_benefit.button.tooltip.tooltip_1'),
            t('statistics.group.cost_and_benefit.button.tooltip.tooltip_2')
          ]"
        >
          <n-button
            style="width: 100%; height: 55px;"
            @click="handleAnalysisItemPrices"
            :loading="updatingPrice"
            :disabled="updatingPrice"
          >
            <div style="line-height: 1.2; text-align: left;">
              <p>{{ t('statistics.group.cost_and_benefit.button.text.text_1', costAndBenefit.costInfo) }}</p>
              <p>{{ t('statistics.group.cost_and_benefit.button.text.text_2', costAndBenefit.benefitInfo) }}</p>
            </div>
          </n-button>
        </GroupBox>
      </div>
    </div>

    <ModalCraftStatements
      v-model:show="showStatementModal"
      v-bind="statementData"
    />
    <ModalProStatements
      v-model:show="showProStatementModal"
      v-bind="statementData"
    />
    <ModalImExportMain
      v-model:show="showImportExportModal"
      v-bind="importExportData"
    />
    <ModalCostAndBenefit
      v-model:show="showCostAndBenefitModal"
      :cost-items="statementData.materialsLvBase"
      :benefit-items="statementData.craftTargets"
    />
  </FoldableCard>
</template>
  
<style scoped>
:deep(.n-collapse-item__content-inner) {
  padding-top: 2px !important;
}
:deep(.n-collapse-item__header) {
  padding-top: 4px !important;
}
:deep(.n-collapse-item) {
  margin-top: 4px !important;
}
:deep(.n-collapse-item:first-child) {
  margin-top: 0 !important;
}
.group .container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
}
#reagents-group .container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}
#gatherings-group .container {
  padding: 4px 0;
}
.item-collapsed-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
}
#statistics-footer {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Desktop only */
@media screen and (min-width: 768px) {
  div.wrapper {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 15px;
    column-gap: 10px;
  }
  #statistics-footer {
    grid-row: 1 / 3;
    grid-column: 3;
  }
}

/* Mobile only */
@media screen and (max-width: 767px) {
  div.wrapper, #statistics-footer {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
}
</style>