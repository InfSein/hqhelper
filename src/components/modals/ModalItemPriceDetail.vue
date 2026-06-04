<script setup lang="ts">
import {
  TableViewFilled,
} from '@vicons/material'
import ItemPriceLogCell from '../custom/item/ItemPriceLogCell.vue'
import ItemSelector from '../custom/item/ItemSelector.vue'
import { useStore } from '@/store'
import { fixFuncConfig, itemPriceTypes, type FuncConfigModel, type ItemPriceType } from '@/models/config-func'
import { useDialog } from '@/tools/dialog'
import { handleGetPriceError } from '@/tools/error'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import GroupBox from '../templates/GroupBox.vue'
import { ItemPriceApiVersion } from '@/types/item.price.ts'
import { getItemPriceHistory, getItemPriceInfo } from '@/tools/item.price.ts'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const funcConfig = inject<Ref<FuncConfigModel>>('funcConfig')!

const store = useStore()
const { alertError } = useDialog(t)

const showModal = defineModel<boolean>('show', { required: true })

const tableShowTypes = ['all', 'hq', 'nq'] as const
type logShowType = typeof tableShowTypes[number]

interface ModalItemPriceDetailProps {
  items: ItemInfo[]
}
const props = defineProps<ModalItemPriceDetailProps>()

const loading = ref(false)
const selectedItems = ref<ItemInfo[]>([])
const currItem = ref(0)
const pageConfig = reactive({
  marketShowType: 'all' as logShowType,
  purchaseShowType: 'all' as logShowType,
  desktopScrollHeight: 600,
  mobileScrollHeight: 600,
})

// #region 加载
const onLoad = async () => {
  updateUi()
  selectedItems.value = props.items
  currItem.value = selectedItems.value[0]?.id ?? 0
  await loadItemPrices()
}
const loadItemPrices = async (forceUpdate = false) => {
  loading.value = true
  try {
    const itemsToLoad = props.items.filter(item => {
      if (forceUpdate) return true
      const expiresAfter = Date.now() - funcConfig.value.universalis_expireTime
      const priceInfo = funcConfig.value.cache_item_prices[item.id]
      return !(priceInfo && priceInfo.listAll && priceInfo.updateTime > expiresAfter
        && priceInfo.v && priceInfo.v >= ItemPriceApiVersion)
    }).map(item => item.id)
    const itemPrices = await getItemPriceInfo(
      [...new Set(itemsToLoad)],
      funcConfig.value.universalis_server,
      true,
    )
    const itemPriceHistory = await getItemPriceHistory(
      [...new Set(itemsToLoad)],
      funcConfig.value.universalis_server,
    )
    const newConfig = funcConfig.value
    Object.keys(itemPrices).forEach(id => {
      const itemID = Number(id)
      newConfig.cache_item_prices[itemID] = itemPrices[itemID]
    })
    Object.keys(itemPriceHistory).forEach(id => {
      const itemID = Number(id)
      newConfig.cache_item_price_histories[itemID] = itemPriceHistory[itemID]
    })
    await store.setFuncConfig(fixFuncConfig(newConfig, store.userConfig))
  } catch (error: any) {
    const errMsg = handleGetPriceError(error, t)
    await alertError(t('common.message.get_price_failed') + '\n' + errMsg)
  } finally {
    loading.value = false
  }
}
const updateUi = () => {
  pageConfig.desktopScrollHeight = window.innerHeight * 0.6 - 310
  pageConfig.mobileScrollHeight = window.innerHeight * 0.4 - 85
}
const scrollBarHeight = computed(() => {
  if (isMobile.value) {
    return `${pageConfig.mobileScrollHeight}px`
  } else {
    return `${pageConfig.desktopScrollHeight}px`
  }
})
// #endregion

// #region 物品选择
const itemsForSelect = computed(() => selectedItems.value.map(item => item.id))
const currItemInfo = computed(() => getItemInfo(currItem.value))
// #endregion

// #region 价格总表
const itemPriceInfo = computed(() => {
  const priceInfo = funcConfig.value.cache_item_prices[currItem.value]
  const prices = itemPriceTypes.map(priceType => {
    const priceNq = Math.floor(priceInfo?.[`${priceType}NQ`] ?? 0)
    const priceHq = Math.floor(priceInfo?.[`${priceType}HQ`] ?? 0)
    const tooltipForNoPrice = t('item.price.no_price') + '\n' + t('item.price.no_price_reason')
    const styleForNoPrice = 'cursor: help; text-decoration: underline dashed gray;'
    let priceStrNq = priceNq.toLocaleString(), priceStrHq = priceHq.toLocaleString()
    let tipNq = '', tipHq = '', styleNq = '', styleHq = ''
    if (!priceNq) {
      priceStrNq = '???'
      tipNq = tooltipForNoPrice; styleNq = styleForNoPrice
    }
    if (!priceHq) {
      priceStrHq = '???'
      tipHq = tooltipForNoPrice; styleHq = styleForNoPrice
    }
    return {
      name: getPriceTypeName(priceType),
      priceStrNq, priceStrHq,
      priceNq, tipNq, styleNq,
      priceHq, tipHq, styleHq
    }
    function getPriceTypeName(ptype: ItemPriceType) {
      switch (ptype) {
        case 'averagePrice': return t('preference.universalis_price_type.option.average')
        case 'currentAveragePrice': return t('preference.universalis_price_type.option.curr_average')
        case 'minPrice': return t('preference.universalis_price_type.option.min')
        case 'maxPrice': return t('preference.universalis_price_type.option.max')
        case 'purchasePrice': return t('preference.universalis_price_type.option.purchase_average.title')
        case 'marketLowestPrice': return t('preference.universalis_price_type.option.market_min.title')
        case 'marketPrice': return t('preference.universalis_price_type.option.market_average.title')
        default: return t('common.unknown')
      }
    }
  })
  return prices
})
// #endregion

// #region 价格历史
const getLogShowTypeName = (type: logShowType) => {
  if (type === 'all') {
    return t('item.price.detail_table.show_all')
  } else if (type === 'hq') {
    return t('item.price.detail_table.show_hq')
  } else if (type === 'nq') {
    return t('item.price.detail_table.show_nq')
  }
  return '???'
}
const logEmptyInfo = computed(() => {
  if (!currItem.value) {
    return t('item.price.detail_table.empty.no_item_selected')
  } else if (!funcConfig.value.cache_item_prices[currItem.value]?.listAll) {
    return t('item.price.detail_table.empty.no_data')
  } else {
    return ''
  }
})
const marketBoardList = computed(() => {
  const itemPriceInfo = funcConfig.value.cache_item_prices[currItem.value]
  if (!itemPriceInfo?.marketListing) return []
  return itemPriceInfo.marketListing.filter(mi => {
    if (pageConfig.marketShowType === 'hq') {
      return mi.hq
    } else if (pageConfig.marketShowType === 'nq') {
      return !mi.hq
    } else {
      return true
    }
  })
})
const purchaseHistoryList = computed(() => {
  const itemPriceInfo = funcConfig.value.cache_item_prices[currItem.value]
  const history = funcConfig.value.cache_item_price_histories[currItem.value].entries || itemPriceInfo?.purchaseHistory
  if (!history) return []
  return history.filter(ph => {
    if (pageConfig.purchaseShowType === 'hq') {
      return ph.hq
    } else if (pageConfig.purchaseShowType === 'nq') {
      return !ph.hq
    } else {
      return true
    }
  })
})
// #endregion
</script>

<template>
  <MyModal
    v-model:show="showModal"
    max-width="800px"
    :icon="TableViewFilled"
    :title="t('item.price.detail_table.title')"
    @on-load="onLoad"
  >
    <n-spin :show="loading" :description="t('item.price.detail_table.loading')">
      <div class="wrapper">
        <GroupBox :title="' ' + t('item.price.detail_table.group_selectitem')">
          <div class="actions-wrapper">
            <ItemSelector
              v-model:model-value="currItem"
              dont-clean-after-select
              options-preset="custom"
              :options="itemsForSelect"
            />
          </div>
        </GroupBox>
        <GroupBox :title="' ' + t('item.price.detail_table.group_totaltable')">
          <div class="pricetable-wrapper">
            <n-table size="small" class="tiny-table w-full">
              <thead>
                <tr>
                  <th></th>
                  <th>NQ</th>
                  <th v-if="currItemInfo.hqable">HQ</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(price, index) in itemPriceInfo"
                  :key="'price-' + index"
                >
                  <td>{{ price.name }}</td>
                  <td>
                    <div :style="price.styleNq" :title="price.tipNq">{{ price.priceStrNq }}</div>
                  </td>
                  <td v-if="currItemInfo.hqable">
                    <div :style="price.styleHq" :title="price.tipHq">{{ price.priceStrHq }}</div>
                  </td>
                </tr>
              </tbody>
            </n-table>
          </div>
        </GroupBox>
        <div class="pricelogs-wrapper">
          <GroupBox :title="' ' + t('item.price.detail_table.group_marketboard')">
            <n-empty v-if="logEmptyInfo" :description="logEmptyInfo" />
            <div v-else class="flex-col gap-2">
              <div class="flex-vac gap-2" style="margin-left: 0.5em;">
                <div>{{ t('item.price.detail_table.table_show_type') }}</div>
                <n-button
                  v-for="showType in tableShowTypes"
                  :key="showType"
                  size="tiny"
                  :disabled="showType === 'hq' && !getItemInfo(currItem).hqable"
                  :type="pageConfig.marketShowType === showType ? 'primary' : 'default'"
                  @click="pageConfig.marketShowType = showType"
                >
                  {{ getLogShowTypeName(showType) }}
                </n-button>
              </div>
              <n-scrollbar trigger="none" :style="{ height: scrollBarHeight }">
                <div class="flex-col gap-2">
                  <ItemPriceLogCell
                    v-for="(mi, miIndex) in marketBoardList"
                    :key="'mi_' + miIndex"
                    :hq="mi.hq"
                    :time="mi.lastReviewTime"
                    :price-per-unit="mi.pricePerUnit"
                    :quantity="mi.quantity"
                    :total="mi.total"
                    :world-name="mi.worldName"
                  />
                </div>
              </n-scrollbar>
            </div>
          </GroupBox>
          <GroupBox :title="' ' + t('item.price.detail_table.group_purchasehistory')">
            <n-empty v-if="logEmptyInfo" :description="logEmptyInfo" />
            <div v-else class="flex-col gap-2">
              <div class="flex-vac gap-2" style="margin-left: 0.5em;">
                <div>{{ t('item.price.detail_table.table_show_type') }}</div>
                <n-button
                  v-for="showType in tableShowTypes"
                  :key="showType"
                  size="tiny"
                  :disabled="showType === 'hq' && !getItemInfo(currItem).hqable"
                  :type="pageConfig.purchaseShowType === showType ? 'primary' : 'default'"
                  @click="pageConfig.purchaseShowType = showType"
                >
                  {{ getLogShowTypeName(showType) }}
                </n-button>
              </div>
              <n-scrollbar trigger="none" :style="{ height: scrollBarHeight }">
                <div class="flex-col gap-2">
                  <ItemPriceLogCell
                    v-for="(ph, phIndex) in purchaseHistoryList"
                    :key="'ph_' + phIndex"
                    :hq="ph.hq"
                    :time="ph.timestamp"
                    :price-per-unit="ph.pricePerUnit"
                    :quantity="ph.quantity"
                    :total="ph.total"
                    :world-name="ph.worldName"
                    :buyer-name="ph.buyerName"
                  />
                </div>
              </n-scrollbar>
            </div>
          </GroupBox>
        </div>
      </div>
    </n-spin>
  </MyModal>
</template>

<style scoped>
.wrapper {
  height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .actions-wrapper {
    width: 100%;
    display: flex;
    gap: 4px;
  }
  .pricelogs-wrapper {
    width: 100%;
    flex: 1;
    display: grid;
    gap: 15px 8px;
    grid-template-columns: repeat(2, minmax(200px, 1fr));

    .tcard-title {
      display: flex;
      align-items: center;
      gap: 3px;
    }
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .wrapper {
    height: 80vh;

    .pricelogs-wrapper {
      grid-template-columns: 1fr;
    }
  }
}
</style>