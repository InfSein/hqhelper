<script setup lang="ts">
import { NInputNumber, type DataTableColumns } from 'naive-ui'
import ItemCell from './ItemCell.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import type { ItemInfo } from '@/tools/item'

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()

interface ItemPriceTableProps {
  items: ItemInfo[],
  showItemDetails: boolean,
  priceType: 'NQ' | 'HQ',
  containerId?: string,
  customPriceMode?: boolean,
  customPrices?: Record<number, number>,
}
const props = defineProps<ItemPriceTableProps>()

const emit = defineEmits<{
  (e: 'update:customPrice', itemId: number, price: number): void
  (e: 'save:customPrice', itemId: number, price: number): void
}>()

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

// 当前正在编辑的临时价格
const editingPrices = reactive<Record<number, number | null>>({})
// 记录初次加载时的价格基准（已持久化的自定义价格或 API 价格），用于离开输入框时判断是否确实发生了修改
const initialPriceMap = ref<Record<number, number | undefined>>({})

const recordInitialPrices = () => {
  props.items.forEach(item => {
    if (initialPriceMap.value[item.id] === undefined) {
      if (props.customPrices?.[item.id] !== undefined) {
        initialPriceMap.value[item.id] = props.customPrices[item.id]
      } else {
        const p = getItemPriceDecimal(item, props.priceType)
        // 物品价格为未知或???时按0来计算
        initialPriceMap.value[item.id] = (p !== undefined && Math.floor(p) > 0) ? Math.floor(p) : 0
      }
    }
  })
}

onMounted(() => {
  const sortBy = store.funcConfig.costandbenefit_item_sort_by
  if (sortBy === 'priceAsc') priceSortOrder.value = 'ascend'
  else if (sortBy === 'priceDesc') priceSortOrder.value = 'descend'
  else if (sortBy === 'subTotalAsc') subTotalSortOrder.value = 'ascend'
  else if (sortBy === 'subTotalDesc') subTotalSortOrder.value = 'descend'
  recordInitialPrices()
})

watch(() => props.items, () => {
  recordInitialPrices()
}, { immediate: true })

watch(() => props.customPriceMode, (newVal) => {
  if (newVal) {
    Object.keys(editingPrices).forEach(key => {
      delete editingPrices[Number(key)]
    })
    recordInitialPrices()
  }
})

const tableData = computed<TableRow[]>(() => {
  const rawData = props.items.map(item => {
    const priceInfo = getItemPrice(item, props.priceType)
    return {
      key: item.id,
      itemInfo: item,
      amount: getItemAmount(item.amount),
      price: priceInfo,
    }
  })

  // 默认按照 itemId 排序，如果 table 没有其他排序状态的话
  return rawData.sort((a, b) => a.itemInfo.id - b.itemInfo.id)
})

const columns = computed<DataTableColumns<TableRow>>(() => [
  {
    title: t('common.item'),
    key: 'item',
    width: isMobile.value ? 150 : '46%',
    render(row) {
      return h(ItemCell, {
        itemInfo: row.itemInfo,
        amount: row.itemInfo.amount,
        showItemDetails: props.showItemDetails,
        itemSpanMaxWidth: isMobile.value ? '140px' : '210px',
        containerId: props.containerId,
      })
    },
    fixed: isMobile.value ? 'left' : undefined,
  },
  {
    title: t('common.amount'),
    key: 'amount',
    width: isMobile.value ? undefined : '18%',
    align: 'center',
  },
  {
    title: t('common.unit_price'),
    key: 'price',
    width: isMobile.value ? undefined : '18%',
    align: 'center',
    sorter: (rowA, rowB) => rowA.price.rawPrice - rowB.price.rawPrice,
    sortOrder: priceSortOrder.value,
    render(row) {
      if (props.customPriceMode) {
        const item = row.itemInfo
        const currentVal = editingPrices[item.id] ?? props.customPrices?.[item.id] ?? (row.price.rawPrice >= 0 ? row.price.rawPrice : 0)
        return h(NInputNumber, {
          size: 'tiny',
          min: 0,
          precision: 0,
          showButton: false,
          placeholder: '0',
          value: currentVal,
          'onUpdate:value': (val: number | null) => {
            const numericVal = val ?? 0
            editingPrices[item.id] = numericVal
            emit('update:customPrice', item.id, numericVal)
          },
          onBlur: () => {
            const baseline = initialPriceMap.value[item.id] ?? 0
            const finalVal = editingPrices[item.id] ?? props.customPrices?.[item.id] ?? (row.price.rawPrice >= 0 ? row.price.rawPrice : 0)
            const numericFinal = finalVal ?? 0

            if (numericFinal !== baseline) {
              emit('save:customPrice', item.id, numericFinal)
              initialPriceMap.value[item.id] = numericFinal
            }
          },
        })
      }

      return h('span', {
        style: row.price.style,
        title: row.price.tooltip,
      }, row.price.price)
    },
  },
  {
    title: t('common.subtotal'),
    key: 'subTotal',
    width: isMobile.value ? undefined : '18%',
    align: 'center',
    sorter: (rowA, rowB) => rowA.price.rawTotal - rowB.price.rawTotal,
    sortOrder: subTotalSortOrder.value,
    render(row) {
      return h('span', {
        style: row.price.style,
        title: row.price.tooltip,
      }, row.price.total)
    },
  },
])

const handleSorterChange = (sorter: any) => {
  priceSortOrder.value = (sorter && sorter.columnKey === 'price') ? sorter.order : false
  subTotalSortOrder.value = (sorter && sorter.columnKey === 'subTotal') ? sorter.order : false
}

const getItemPriceDecimal = (item: ItemInfo, type: 'NQ' | 'HQ') => {
  const actualType = (type === 'HQ' && !item.hqable) ? 'NQ' : type
  return store.funcConfig.cache_item_prices[item.id]?.[`${store.funcConfig.universalis_priceType}${actualType}`]
}
const getItemPrice = (item: ItemInfo, type: 'NQ' | 'HQ') => {
  const price = getItemPriceDecimal(item, type)

  // 如果处于自定义价格模式，优先读取用户自定义价格；未自定义过的物品若价格为未知或???时按0计算
  if (props.customPriceMode) {
    const customVal = editingPrices[item.id] ?? props.customPrices?.[item.id]
    if (customVal !== undefined) {
      const p = customVal
      return {
        price: p.toLocaleString(),
        total: (p * item.amount).toLocaleString(),
        tooltip: '',
        style: '',
        rawPrice: p,
        rawTotal: p * item.amount,
      }
    }

    const p = (price !== undefined && Math.floor(price) > 0) ? Math.floor(price) : 0
    return {
      price: p.toLocaleString(),
      total: (p * item.amount).toLocaleString(),
      tooltip: '',
      style: '',
      rawPrice: p,
      rawTotal: p * item.amount,
    }
  }

  if (price === undefined) {
    const text = item.tradable ? t('common.unknown') : t('common.untradable')
    return {
      price: text,
      total: text,
      tooltip: '',
      style: '',
      rawPrice: -1,
      rawTotal: -1,
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
      rawTotal: p * item.amount,
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
  <n-data-table
      class="item-price-table"
      size="small"
      :columns="columns"
      :data="tableData"
      :min-height="450"
      :max-height="450"
      :single-line="false"
      :scroll-x="isMobile ? 360 : undefined"
      @update:sorter="handleSorterChange"
    />
</template>

<style scoped>
/* All */
:deep(.n-data-table-td) {
  padding: 6px;
}
:deep(.n-data-table-tbody .n-data-table-td.n-data-table-td--last-row) {
  border-bottom: 1px solid var(--n-merged-border-color);
}
:deep(.n-input-number .n-input__input-el) {
  text-align: center;
}

/* Desktop */
@media screen and (min-width: 768px) {
}

/* Mobile */
@media screen and (max-width: 767px) {
}
</style>