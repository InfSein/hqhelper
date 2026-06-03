<script setup lang="ts">
import {
  TableViewFilled,
} from '@vicons/material'
import ItemPriceLogCell from '../custom/item/ItemPriceLogCell.vue'
import ItemSelector from '../custom/item/ItemSelector.vue'
import { useStore } from '@/store'
import { fixFuncConfig, type FuncConfigModel } from '@/models/config-func'
import { useDialog } from '@/tools/dialog'
import { handleGetPriceError } from '@/tools/error'
import { getItemInfo, getItemPriceInfo, ItemPriceApiVersion, type ItemInfo } from '@/tools/item'
import GroupBox from '../templates/GroupBox.vue'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const funcConfig = inject<Ref<FuncConfigModel>>('funcConfig')!

const store = useStore()
const { alertError } = useDialog(t)

const showModal = defineModel<boolean>('show', { required: true })

const tableShowTypes = ['all', 'hq', 'nq'] as const
type tableShowType = typeof tableShowTypes[number]

interface ModalItemPriceDetailProps {
  items: ItemInfo[]
}
const props = defineProps<ModalItemPriceDetailProps>()

const loading = ref(false)
const selectedItems = ref<ItemInfo[]>([])
const currItem = ref(0)
const pageConfig = reactive({
  marketShowType: 'all' as tableShowType,
  purchaseShowType: 'all' as tableShowType,
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
    const newConfig = funcConfig.value
    Object.keys(itemPrices).forEach(id => {
      const itemID = Number(id)
      newConfig.cache_item_prices[itemID] = itemPrices[itemID]
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
  pageConfig.desktopScrollHeight = window.innerHeight * 0.6 - 110
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
// #endregion

// #region 表格
const getTableShowTypeName = (type: tableShowType) => {
  if (type === 'all') {
    return t('item.price.detail_table.show_all')
  } else if (type === 'hq') {
    return t('item.price.detail_table.show_hq')
  } else if (type === 'nq') {
    return t('item.price.detail_table.show_nq')
  }
  return '???'
}
const tableEmptyInfo = computed(() => {
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
  if (!itemPriceInfo?.purchaseHistory) return []
  return itemPriceInfo.purchaseHistory.filter(ph => {
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
        <GroupBox title="选择道具">
          <div class="actions-wrapper">
            <ItemSelector
              v-model:model-value="currItem"
              dont-clean-after-select
              options-preset="custom"
              :options="itemsForSelect"
            />
          </div>
        </GroupBox>
        <div class="tables-wrapper">
          <GroupBox :title="' ' + t('item.price.detail_table.group_marketboard')">
            <n-empty v-if="tableEmptyInfo" :description="tableEmptyInfo" />
            <div v-else class="flex-col gap-2">
              <div class="flex-vac gap-2" style="margin-left: 0.5em;">
                <div>显示：</div>
                <n-button
                  v-for="showType in tableShowTypes"
                  :key="showType"
                  size="tiny"
                  :disabled="showType === 'hq' && !getItemInfo(currItem).hqable"
                  :type="pageConfig.marketShowType === showType ? 'primary' : 'default'"
                  @click="pageConfig.marketShowType = showType"
                >
                  {{ getTableShowTypeName(showType) }}
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
            <n-empty v-if="tableEmptyInfo" :description="tableEmptyInfo" />
            <div v-else class="flex-col gap-2">
              <div class="flex-vac gap-2" style="margin-left: 0.5em;">
                <div>显示：</div>
                <n-button
                  v-for="showType in tableShowTypes"
                  :key="showType"
                  size="tiny"
                  :disabled="showType === 'hq' && !getItemInfo(currItem).hqable"
                  :type="pageConfig.purchaseShowType === showType ? 'primary' : 'default'"
                  @click="pageConfig.purchaseShowType = showType"
                >
                  {{ getTableShowTypeName(showType) }}
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
  .tables-wrapper {
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

    .tables-wrapper {
      grid-template-columns: 1fr;
    }
  }
}
</style>