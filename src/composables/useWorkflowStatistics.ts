import { computed, watch, type ComputedRef } from 'vue'
import { getItemInfo } from '@/tools/item'
import type { ItemInfo } from '@/types/item'
import { useAppCore } from '@/composables/useAppCore'
import type { Workflow } from '@/types/workstate/workflow'

export function useWorkflowStatistics(currentWorkflow: ComputedRef<Workflow>) {
  const {
    calItems,
    getProStatementData,
    calRecommProcessData,
    calRecommProcessGroups,
  } = useAppCore()

  const craftTargetsArray = computed(() => {
    const items: ItemInfo[] = []
    for (const _id in currentWorkflow.value.targetItems) {
      const id = Number(_id)
      const count = currentWorkflow.value.targetItems[id]
      if (count > 0) {
        const itemInfo = getItemInfo(id)
        itemInfo.amount = count
        items.push(itemInfo)
      }
    }
    return items
  })

  const statistics = computed(() => {
    return calItems(currentWorkflow.value.targetItems)
  })

  const statementData = computed(() => {
    return statistics.value
  })

  const proStatementData = computed(() => {
    return getProStatementData(craftTargetsArray.value, currentWorkflow.value.preparedItems)
  })

  const recommProcessData = computed(() => {
    return calRecommProcessData(
      proStatementData.value.targetItemsForCal,
      proStatementData.value.lv1ItemsForCal,
      proStatementData.value.baseItemsForCal
    )
  })

  const recommProcessGroups = computed(() => {
    const {
      craftTargets,
      lv1Items,
      lv2Items,
      lv3Items,
      lvBaseItems,
    } = recommProcessData.value
    return calRecommProcessGroups(
      craftTargets,
      lv1Items,
      lv2Items,
      lv3Items,
      lvBaseItems,
    )
  })

  const fixPreparedItems = () => {
    const { craftTargets, materialsLv1, materialsLvBase } = statementData.value
    craftTargets.forEach(item => {
      const val = currentWorkflow.value.preparedItems.craftTarget[item.id]
      if (!val) {
        currentWorkflow.value.preparedItems.craftTarget[item.id] = 0
      } else if (val > item.amount) {
        currentWorkflow.value.preparedItems.craftTarget[item.id] = item.amount
      }
    })
    materialsLv1.forEach(item => {
      const val = currentWorkflow.value.preparedItems.materialsLv1[item.id]
      if (!val) {
        currentWorkflow.value.preparedItems.materialsLv1[item.id] = 0
      } else if (val > item.amount) {
        currentWorkflow.value.preparedItems.materialsLv1[item.id] = item.amount
      }
    })
    materialsLvBase.forEach(item => {
      const val = currentWorkflow.value.preparedItems.materialsLvBase[item.id]
      if (!val) {
        currentWorkflow.value.preparedItems.materialsLvBase[item.id] = 0
      } else if (val > item.amount) {
        currentWorkflow.value.preparedItems.materialsLvBase[item.id] = item.amount
      }
    })
  }

  const fixRecommMaps = () => {
    for (let i = 0; i < recommProcessGroups.value.length; i++) {
      if (!currentWorkflow.value.recommData.expandedBlocks[i]) {
        currentWorkflow.value.recommData.expandedBlocks[i] = ['1']
      }
      if (!currentWorkflow.value.recommData.completedItems[i]) {
        currentWorkflow.value.recommData.completedItems[i] = {}
      }
      recommProcessGroups.value[i].items.forEach(item => {
        if (!currentWorkflow.value.recommData.completedItems[i][item.id]) {
          currentWorkflow.value.recommData.completedItems[i][item.id] = false
        }
      })
    }
  }

  watch(recommProcessGroups, async () => {
    fixRecommMaps()
    fixPreparedItems()
  })

  fixRecommMaps()
  fixPreparedItems()

  return {
    craftTargetsArray,
    statistics,
    statementData,
    proStatementData,
    recommProcessData,
    recommProcessGroups
  }
}
