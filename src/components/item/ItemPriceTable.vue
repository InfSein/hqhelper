<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import ItemCell from './ItemCell.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import type { ItemInfo } from '@/tools/item'

const { t } = useLocale()
const { isMobile } = useResponsive()

const store = useStore()

interface ItemPriceTableProps {
  items: ItemInfo[],
  showItemDetails: boolean,
  priceType: 'NQ' | 'HQ',
  containerId?: string,
}
const props = defineProps<ItemPriceTableProps>()

interface TableRow {
  key: number
  itemInfo: ItemInfo
  amount: number | string
  price: {
    price: string
    total: string
    tooltip: string
    style: any
    rawPrice: number
    rawTotal: number
  }
}
type SortOrder = 'ascend' | 'descend' | false

const priceSortOrder = ref<SortOrder>(false)
const subTotalSortOrder = ref<SortOrder>(false)

onMounted(() => {
  const sortBy = store.funcConfig.costandbenefit_item_sort_by
  if (sortBy === 'priceAsc') priceSortOrder.value = 'ascend'
  else if (sortBy === 'priceDesc') priceSortOrder.value = 'descend'
  else if (sortBy === 'subTotalAsc') subTotalSortOrder.value = 'ascend'
  else if (sortBy === 'subTotalDesc') subTotalSortOrder.value = 'descend'
})

const tableData = computed<TableRow[]>(() => {
  const rawData = props.items.map(item => {
    const priceInfo = getItemPrice(item, props.priceType)
    return {
      key: item.id,
      itemInfo: item,
      amount: getItemAmount(item.amount),
      price: priceInfo
    }
  })

  // 默认按照 itemId 排序，如果 table 没有其他排序状态的话
  return rawData.sort((a, b) => a.itemInfo.id - b.itemInfo.id)
})

const columns = computed<DataTableColumns<TableRow>>(() => [
  {
    title: t('common.item'),
    key: 'item',
    width: isMobile.value ? '49%' : '46%',
    render(row) {
      return h(ItemCell, {
        itemInfo: row.itemInfo,
        amount: row.itemInfo.amount,
        showItemDetails: props.showItemDetails,
        itemSpanMaxWidth: isMobile.value ? `${window.innerWidth - 285}px` : '210px',
        containerId: props.containerId
      })
    }
  },
  {
    title: t('common.amount'),
    key: 'amount',
    width: isMobile.value ? '17%' : '18%',
    align: 'center'
  },
  {
    title: t('common.unit_price'),
    key: 'price',
    width: isMobile.value ? '17%' : '18%',
    align: 'center',
    sorter: (rowA, rowB) => rowA.price.rawPrice - rowB.price.rawPrice,
    sortOrder: priceSortOrder.value,
    render(row) {
      return h('span', {
        style: row.price.style,
        title: row.price.tooltip
      }, row.price.price)
    }
  },
  {
    title: t('common.subtotal'),
    key: 'subTotal',
    width: isMobile.value ? '17%' : '18%',
    align: 'center',
    sorter: (rowA, rowB) => rowA.price.rawTotal - rowB.price.rawTotal,
    sortOrder: subTotalSortOrder.value,
    render(row) {
      return h('span', {
        style: row.price.style,
        title: row.price.tooltip
      }, row.price.total)
    }
  }
])

const handleSorterChange = (sorter: any) => {
  priceSortOrder.value = (sorter && sorter.columnKey === 'price') ? sorter.order : false
  subTotalSortOrder.value = (sorter && sorter.columnKey === 'subTotal') ? sorter.order : false
}

const getItemPriceDecimal = (item: ItemInfo, type: 'NQ' | 'HQ') => {
  return store.funcConfig.cache_item_prices[item.id]?.[`${store.funcConfig.universalis_priceType}${type}`]
}
const getItemPrice = (item: ItemInfo, type: 'NQ' | 'HQ') => {
  const price = getItemPriceDecimal(item, type)
  if (price === undefined) {
    const text = item.tradable ? t('common.unknown') : t('common.untradable')
    return {
      price: text,
      total: text,
      tooltip: '',
      style: '',
      rawPrice: -1,
      rawTotal: -1
    }
  } else {
    const p = Math.floor(price)
    const tooltipForNoPrice = t('item.price.no_price_received') + '\n' + t('item.price.no_price_received_reason')
    const styleForNoPrice = 'cursor: help; text-decoration: underline dashed gray;'
    return {
      price: p ? p.toLocaleString() : '???',
      total: p ? (p * item.amount).toLocaleString() : '???',
      tooltip: p ? '' : tooltipForNoPrice,
      style: p ? '' : styleForNoPrice,
      rawPrice: p,
      rawTotal: p * item.amount
    }
  }
}

const getItemAmount = (amount: number) => {
  return store.userConfig.item_amount_use_comma
    ? amount.toLocaleString()
    : amount
}
</script>

<template>
  <div class="table-container">
    <n-data-table
      class="table"
      size="small"
      :columns="columns"
      :data="tableData"
      :min-height="450"
      :max-height="450"
      :single-line="false"
      @update:sorter="handleSorterChange"
    />
  </div>
</template>

<style scoped>
/* All */
:deep(.table) {
  width: 100%;

  th {
    font-weight: bold;
  }
  .n-data-table-td {
    padding: 6px;
  }
  .n-data-table-tbody {
    /* naive-ui对末行样式进行修正，使其不显示底部边框，但是对这里的固定高度表格来说不适用，因此回滚 */
    .n-data-table-td.n-data-table-td--last-row {
      border-bottom: 1px solid var(--n-merged-border-color);
    }
  }
}

/* Desktop */
@media screen and (min-width: 768px) {
}

/* Mobile */
@media screen and (max-width: 767px) {
  :deep(.table) {
    th:first-child, td:first-child {
      width: 46% !important;
    }
    th:nth-child(2), td:nth-child(2),
    th:nth-child(3), td:nth-child(3),
    th:nth-child(4), td:nth-child(4) {
      width: 18% !important;
      text-align: center;
    }
  }
}
</style>