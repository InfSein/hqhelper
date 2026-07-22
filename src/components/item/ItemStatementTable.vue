<script setup lang="ts">
import ItemCell from './ItemCell.vue'
import StatementListPop from './StatementListPop.vue'
import { getItemInfo, type ItemInfo, type StatementRow } from '@/tools/item'
import { objectEqual } from '@/tools'
import { useStore } from '@/store'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()

const itemsPrepared = defineModel<Record<number, number>>('itemsPrepared', { required: true })
const selectedItem = defineModel<ItemInfo | undefined>('selectedItem', { required: true })
interface ItemStatementTableProps {
  itemsTotal: Record<number, number>,
  highlightedItems: number[],
  showItemDetails: boolean,
  containerId?: string
  contentHeight?: string
  itemSpanMaxWidth?: string
}
const props = defineProps<ItemStatementTableProps>()

const tableContainer = ref<HTMLElement>()

const rows = computed(() => {
  const rowsRemaining: StatementRow[] = []
  const rowsCleaned : StatementRow[] = []
  const rowsAll : StatementRow[] = []
  for (const itemId in props.itemsTotal) {
    const id = Number(itemId)
    const itemInfo = getItemInfo(id)
    const _total = props.itemsTotal[id], _prepared = itemsPrepared.value[id] ?? 0
    if (!_total || _total <= 0) continue
    const item : StatementRow = {
      info: itemInfo,
      amount: {
        total: _total,
        prepared: _prepared,
        remain: _total - _prepared
      }
    }
    if (item.amount.remain > 0) {
      rowsRemaining.push(item)
    } else {
      rowsCleaned.push(item)
    }
    rowsAll.push(item)
  }
  return {
    remaining: rowsRemaining,
    cleaned: rowsCleaned,
    all: rowsAll
  }
})

const getItemAmount = (amount: number) => {
  return store.userConfig.item_amount_use_comma
    ? amount.toLocaleString()
    : amount
}

const handleNumInputLoop = (row: StatementRow) => {
  const itemId = row.info.id
  if (itemsPrepared.value[itemId] < 0) {
    itemsPrepared.value[itemId] = row.amount.total
  }
}

const handleRowClick = (row: StatementRow) => {
  if (objectEqual(selectedItem.value, row.info)) selectedItem.value = undefined
  else selectedItem.value = row.info
}
</script>

<template>
  <div class="table-container" ref="tableContainer">
    <n-table class="table" size="small" :single-line="false">
      <thead>
        <tr @click="selectedItem = undefined">
          <th>
            {{ t('common.item') }}
            <span class="font-small">
              <StatementListPop
                :rows="rows.all"
                :container="tableContainer"
              >
                <a href="javascript:void(0)">[{{ t('common.list') }}]</a>
              </StatementListPop>
            </span>
          </th>
          <th>{{ t('statement.table.total') }}</th>
          <th>{{ t('statement.table.prepared') }}</th>
          <th>{{ t('statement.table.requires') }}</th>
        </tr>
      </thead>
    </n-table>
    <n-scrollbar trigger="none" :style="{ height: contentHeight ?? '450px', 'margin-top': '-2px' }">
      <div class="table-container">
        <div
          class="container-back"
          :style="{ height: contentHeight ?? '450px' }"
          @click="selectedItem = undefined"
        />
        <n-table class="table" size="small" :single-line="false">
          <tbody>
            <tr
              v-for="item in rows.remaining"
              :key="'item-remaining-' + item.info.id"
              :class="highlightedItems.includes(item.info.id) ? 'highlight' : ''"
              @click="handleRowClick(item)"
            >
              <td>
                <ItemCell
                  :item-info="item.info"
                  :amount="item.amount.remain"
                  :show-item-details="showItemDetails"
                  :item-span-max-width="itemSpanMaxWidth"
                  :container-id="containerId"
                />
              </td>
              <td>
                {{ getItemAmount(item.amount.total) }}
              </td>
              <td>
                <n-input-number
                  v-model:value="itemsPrepared[item.info.id]"
                  :min="-1"
                  :max="item.amount.total"
                  :precision="0"
                  :size="showItemDetails ? 'small' : 'tiny'"
                  button-placement="both"
                  :show-button="!isMobile"
                  placeholder="0"
                  @update:value="handleNumInputLoop(item)"
                  @click.stop @mousedown.stop @focus.stop
                />
              </td>
              <td>
                {{ getItemAmount(item.amount.remain) }}
              </td>
            </tr>
            <tr
              v-if="rows.cleaned?.length"
              class="prepared"
              @click="selectedItem = undefined"
            >
              <td colspan="4" class="font-bold">
                <i class="xiv e05e"></i>
                {{ t('statement.text.all_prepared_items') }}
              </td>
            </tr>
            <tr
              v-for="item in rows.cleaned"
              :key="'item-cleaned-' + item.info.id"
              class="prepared"
              :class="highlightedItems.includes(item.info.id) ? 'highlight' : ''"
              @click="handleRowClick(item)"
            >
              <td>
                <ItemCell
                  :item-info="item.info"
                  :amount="item.amount.remain"
                  :show-item-details="showItemDetails"
                  :item-span-max-width="itemSpanMaxWidth"
                  :container-id="containerId"
                />
              </td>
              <td>
                {{ getItemAmount(item.amount.total) }}
              </td>
              <td>
                <n-input-number
                  v-model:value="itemsPrepared[item.info.id]"
                  :min="0"
                  :max="item.amount.total"
                  :precision="0"
                  :size="showItemDetails ? 'small' : 'tiny'"
                  button-placement="both"
                  @click.stop @mousedown.stop @focus.stop
                />
              </td>
              <td>
                {{ getItemAmount(item.amount.remain) }}
              </td>
            </tr>
          </tbody>
        </n-table>
      </div>
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
    width: 40%;
  }
  th:nth-child(2), td:nth-child(2),
  th:nth-child(4), td:nth-child(4) {
    width: 18%;
    text-align: center;
  }
  th:nth-child(3), td:nth-child(3) {
    width: 24%;
    text-align: center;
    .n-input-number {
      display: flex;
    }
  }
  tr.prepared td {
    background-color: var(--n-th-color-popover);
  }
  tr.prepared:hover td {
    background-color: var(--n-td-color-modal);
  }
  tr.highlight td,
  tr.highlight:hover td {
    color: white;
    background-color: #3364C7;
  }
}
.table-container {
  position: relative;
  z-index: 0;

  .container-back {
    position: absolute;
    top: 0; left: 0; right: 0;
    z-index: 1;
    background: transparent;
  }
  .table {
    z-index: 2;
    position: relative;
  }
}

/* Desktop */
@media screen and (min-width: 768px) {
}

/* Mobile */
@media screen and (max-width: 767px) {
  .table {
    th:first-child, td:first-child {
      width: 46%;
    }
    th:nth-child(2), td:nth-child(2),
    th:nth-child(3), td:nth-child(3),
    th:nth-child(4), td:nth-child(4) {
      width: 18%;
      text-align: center;
    }
  }
}
</style>