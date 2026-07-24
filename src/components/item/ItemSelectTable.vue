<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ScrollbarInst } from 'naive-ui'
import ItemCell from './ItemCell.vue'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { getItemInfo, type ItemInfo } from '@/tools/item'

const { t } = useLocale()
const { isMobile } = useResponsive()

const items = defineModel<Record<number, number>>('items', { required: true })
interface ItemSelectTableProps {
  showItemDetails: boolean
  filterStr?: string
  itemSpanMaxWidth?: string
  containerId?: string
  contentHeight?: string
}
const props = defineProps<ItemSelectTableProps>()

const tableContainer = ref<HTMLElement>()
const scrollbarRef = useTemplateRef<ScrollbarInst>('scrollbarRef')
const highlightedItemId = ref<number | null>(null)
let highlightTimer: number | null = null

interface ItemSelectRow {
  show: boolean
  info: ItemInfo
  amount: number
}

const rows = computed(() => {
  const rowsAll : ItemSelectRow[] = []
  for (const itemId in items.value) {
    const id = Number(itemId)
    const itemInfo = getItemInfo(id)

    let show = true
    if (props.filterStr) {
      show = filterItem(props.filterStr, itemInfo)
    }

    const amount = items.value[id]
    itemInfo.amount = amount
    const item : ItemSelectRow = {
      show: show,
      info: itemInfo,
      amount: amount
    }
    rowsAll.push(item)
  }
  return rowsAll

  function filterItem(filterStr: string, itemInfo: ItemInfo) {
    const filter = filterStr.toLowerCase()
      let itemMatched = false
      const availableKeywords = [
        itemInfo.name_zh, itemInfo.name_en, itemInfo.name_ja
      ]
      availableKeywords.forEach(keyword => {
        if (keyword?.toLowerCase().includes(filter.toLowerCase())) {
          itemMatched = true
        }
      })
      if (itemMatched) return true

      if (itemInfo.id.toString() === filter) return true
      if (itemInfo.itemLevel.toString() === filter) return true
      if (itemInfo.patch === filter) return true

      return false
  }
})

const handleDealNumInputEdge = (row: ItemSelectRow) => {
  const itemId = row.info.id
  if (items.value[itemId] <= 0) {
    delete items.value[itemId]
  }
}

const scrollToItem = (itemId: number) => {
  const el = document.getElementById(`item-row-${itemId}`)
  if (el && scrollbarRef.value) {
    scrollbarRef.value.scrollTo({
      top: el.offsetTop,
      behavior: 'smooth'
    })
    highlightedItemId.value = itemId
    if (highlightTimer) clearTimeout(highlightTimer)
    highlightTimer = setTimeout(() => {
      highlightedItemId.value = null
      highlightTimer = null
    }, 1500)
  }
}

defineExpose({
  scrollToItem
})
</script>

<template>
  <div class="table-container" ref="tableContainer">
    <n-table class="table" size="small" :single-line="false">
      <thead>
        <tr>
          <th>{{ t('common.item') }}</th>
          <th>{{ t('common.amount') }}</th>
        </tr>
      </thead>
    </n-table>
    <n-scrollbar ref="scrollbarRef" trigger="none" :style="{ height: contentHeight ?? '450px', 'margin-top': '-2px' }">
      <n-table class="table" size="small" :single-line="false">
        <tbody>
          <tr 
            v-for="item in rows" 
            :key="'item-' + item.info.id" 
            v-show="item.show"
            :id="'item-row-' + item.info.id"
            :class="{ 'highlighted-row': highlightedItemId === item.info.id }"
          >
            <td>
              <ItemCell
                :item-info="item.info"
                :amount="item.amount"
                :show-item-details="showItemDetails"
                :item-span-max-width="itemSpanMaxWidth"
                :container-id="containerId"
              />
            </td>
            <td>
              <n-input-number
                v-model:value="items[item.info.id]"
                :min="0"
                :max="99999"
                :precision="0"
                :size="showItemDetails ? 'small' : 'tiny'"
                button-placement="both"
                :show-button="!isMobile"
                placeholder="0"
                @update:value="handleDealNumInputEdge(item)"
              />
            </td>
          </tr>
        </tbody>
      </n-table>
    </n-scrollbar>
  </div>
</template>

<style scoped>
/* All */
:deep(.n-scrollbar-container) {
  padding: inherit !important;
}
.table {
  width: 100%;

  th {
    font-weight: bold;
  }
  th:first-child, td:first-child {
    width: 70%;
  }
  th:nth-child(2), td:nth-child(2) {
    width: 30%;
    text-align: center;
    .n-input-number {
      display: flex;
    }
  }
}


/* Desktop */
@media screen and (min-width: 768px) {
}

/* Mobile */
@media screen and (max-width: 767px) {
  .table {
    th:first-child, td:first-child {
      width: 70%;
    }
    th:nth-child(2), td:nth-child(2) {
      width: 30%;
      text-align: center;
    }
  }
}

.highlighted-row td {
  transition: background-color 0.5s ease;
  color: white;
  background-color: #3364C7;
}
</style>