<script setup lang="ts">
// import { 
//   TableViewOutlined
// } from '@vicons/material'
import ItemStatementTable from '@/components/custom/item/ItemStatementTable.vue'
import { useStore } from '@/store'
import { deepCopy } from '@/tools'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import type { ProStatementBlock } from '@/tools/use-fufu-cal'

// const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const store = useStore()

const itemsPrepared = defineModel<{
  craftTarget: Record<number, number>;
  materialsLv1: Record<number, number>;
  materialsLvBase: Record<number, number>;
}>('itemsPrepared', { required: true })

const itemSpanMaxWidth = ref('inherit')
const cspWrapper = ref<HTMLElement>()
const selectedItem = ref<ItemInfo | undefined>(undefined)

interface CraftStatementsProProps {
  /** 是否处于模态框内。此参数会影响一些UI效果。 */
  insideModal?: boolean,
  craftTargets: ItemInfo[],
  statementBlocks: ProStatementBlock[],
  contentHeight?: string
  containerId?: string
}
const props = defineProps<CraftStatementsProProps>()
const emit = defineEmits(['loaded'])

const updateSize = () => {
  if (cspWrapper.value?.offsetWidth) {
    const eachBlockWidth = (cspWrapper.value.offsetWidth - 20) / 3
    itemSpanMaxWidth.value = ((eachBlockWidth - 16) * 0.4 - 48) + 'px'
  } else if (isMobile.value) {
    const width = props.insideModal
      ? window.innerWidth * 0.98 - 280
      : window.innerWidth - 300
    itemSpanMaxWidth.value = width + 'px'
  } else {
    itemSpanMaxWidth.value = 'inherit'
  }
}
onMounted(() => {
  updateSize()
  window.addEventListener('resize', updateSize)
  emit('loaded')
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSize)
})

const showItemDetails = computed(() => {
  return !store.funcConfig.prostate_concise_mode
})
const highlightedItems = computed(() : number[] => {
  if (!selectedItem.value || store.funcConfig.statement_no_highlights) return []
  if (!selectedItem.value.craftRequires.length) return [selectedItem.value.id]
  const recipeSearch = [selectedItem.value.id]
  const recipeResult = [selectedItem.value.id]
  while (recipeSearch.length) {
    const itemId = recipeSearch.pop()!
    recipeResult.push(itemId)
    const itemInfo = getItemInfo(itemId)
    if (itemInfo.craftRequires?.length) {
      recipeSearch.push(...itemInfo.craftRequires.map(item => item.id))
    }
  }
  return recipeResult
})

const setPreparedItemsByInventory = () => {
  const inventory = deepCopy(store.funcConfig.inventory_data)
  dealPrepared(itemsPrepared.value.materialsLv1, props.statementBlocks[1].items)
  dealPrepared(itemsPrepared.value.materialsLvBase, props.statementBlocks[2].items)

  function dealPrepared(pmap: Record<number, number>, tmap: Record<number, number>) {
    Object.keys(pmap).forEach(_id => {
      const id = Number(_id)
      if (inventory[id]) {
        // 物品在库存中
        const inventAmount = inventory[id]
        const needAmount = tmap[id] || 0
        const reduceAmount = Math.min(inventAmount, needAmount)
        pmap[id] = reduceAmount
        inventory[id] -= reduceAmount
      } else {
        // 不在库存，按照用户设置处理
        if (store.funcConfig.inventory_other_items_way === 'clear') {
          pmap[id] = 0
        }
      }
    })
  }
}
const setInventoryByPreparedItems = () => {
  const statementItems : Record<number, number> = {}
  dealPrepared(itemsPrepared.value.materialsLv1)
  dealPrepared(itemsPrepared.value.materialsLvBase)

  const mode = store.funcConfig.inventory_sync_reverse_mode
  const inventory = mode === 'overwrite' ? {} : deepCopy(store.funcConfig.inventory_data)

  Object.entries(statementItems).forEach(([_id, amount]) => {
    const id = Number(_id)
    if (!amount) {
      if (mode === 'strict' && inventory[id]) {
        delete inventory[id]
      }
    } else {
      inventory[id] = amount
    }
  })

  if (JSON.stringify(inventory) !== JSON.stringify(store.funcConfig.inventory_data)) {
    const newFuncConfig = deepCopy(store.funcConfig)
    newFuncConfig.inventory_data = inventory
    store.setFuncConfig(newFuncConfig)
    appForceUpdate()
  }

  function dealPrepared(pmap: Record<number, number>) {
    Object.keys(pmap).forEach(_id => {
      const id = Number(_id)
      statementItems[id] ??= 0
      statementItems[id] += pmap[id]
    })
  }
}

defineExpose({
  updateSize,
  setPreparedItemsByInventory,
  setInventoryByPreparedItems,
})
</script>

<template>
  <n-tabs v-if="isMobile" type="line" animated>
    <n-tab-pane
      v-for="block in statementBlocks"
      :key="block.id"
      :name="block.id"
      :tab="block.name"
    >
      <div class="container">
        <ItemStatementTable
          v-model:items-prepared="itemsPrepared[block.preparedKey]"
          v-model:selected-item="selectedItem"
          :items-total="block.items"
          :show-item-details="showItemDetails"
          :container-id="containerId"
          :content-height="contentHeight"
          :item-span-max-width="itemSpanMaxWidth"
          :highlighted-items="highlightedItems"
        />
      </div>
    </n-tab-pane>
  </n-tabs>
  <div v-else ref="cspWrapper" class="csp-wrapper desktop" :style="`grid-template-columns: repeat(${statementBlocks.length}, minmax(0, 1fr));`">
    <GroupBox
      v-for="block in statementBlocks"
      :key="block.id"
      :id="block.id"
      class="group"
    >
      <template #title>{{ block.name }}</template>
      <div class="container">
        <ItemStatementTable
          v-model:items-prepared="itemsPrepared[block.preparedKey]"
          v-model:selected-item="selectedItem"
          :items-total="block.items"
          :show-item-details="showItemDetails"
          :container-id="containerId"
          :content-height="contentHeight"
          :item-span-max-width="itemSpanMaxWidth"
          :highlighted-items="highlightedItems"
        />
      </div>
    </GroupBox>
  </div>
</template>

<style scoped>
/* All */
.csp-wrapper {
  user-select: text;
}
.csp-wrapper.desktop {
  display: grid;
  gap: 10px;
}
.group .container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
  user-select: text;
}

/* Desktop */
@media screen and (min-width: 768px) {
}

/* Mobile */
@media screen and (max-width: 767px) {
  .card-title-actions {
    flex-basis: 100%;
  }
}
</style>