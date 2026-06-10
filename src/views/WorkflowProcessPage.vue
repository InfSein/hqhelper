<script setup lang="ts">
// import {
//   SettingsSharp,
//   VisibilitySharp, VisibilityOffSharp,
//   UnfoldMoreSharp, UnfoldLessSharp,
// } from '@vicons/material'
import { useStore } from '@/store'
import { useElectronSync } from '@/composables/electron-sync'
import { fixWorkState } from '@/types/workstate/workflow'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import { useNbbCal } from '@/tools/use-nbb-cal'
import { useFufuCal } from '@/tools/use-fufu-cal'
import CraftRecommProcess from '@/components/custom/general/CraftRecommProcess.vue'
import { deepCopy } from '@/tools'
import type { UserConfigModel } from '@/types/config/user'

const t = inject<(message: string, args?: any) => string>('t')!
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()
// const NAIVE_UI_MESSAGE = useMessage()
const { emitSync, onSync } = useElectronSync()
const { calItems } = useNbbCal()
const { getStatementData, getProStatementData, calRecommProcessData, calRecommProcessGroups } = useFufuCal()

const workState = ref(fixWorkState())

const currentWorkflow = computed(() => {
  return workState.value.workflows[workState.value.currentWorkflow]
})

const ignoreNextUpdate = ref(false)
const disable_workstate_cache = store.userConfig.disable_workstate_cache ?? false
if (!disable_workstate_cache) {
  const cachedWorkState = store.userConfig.workflow_cache_work_state
  if (cachedWorkState && JSON.stringify(cachedWorkState).length > 2) {
    workState.value = fixWorkState(cachedWorkState)
    // Compatible with older version caching
  }

  // todo - 留意性能：深度侦听需要遍历被侦听对象中的所有嵌套的属性，当用于大型数据结构时，开销很大
  watch(workState, async () => {
    if (workState.value) {
      try {
        await Promise.resolve()
        if (ignoreNextUpdate.value) {
          ignoreNextUpdate.value = false
          return
        }
        store.userConfig.workflow_cache_work_state = workState.value
        store.setUserConfig(store.userConfig)
        emitSync('workflowStateChanged', deepCopy(store.userConfig))
      } catch (error) {
        console.error('Error handling workState change:', error)
      }
    } else {
      console.warn('workState or userConfig is not defined')
    }
  }, {deep: true})
}
onSync('workflowStateChanged', (userConfig: UserConfigModel) => {
  ignoreNextUpdate.value = true
  workState.value = userConfig.workflow_cache_work_state
})

// #region content-statistics
const craftTargetsArray = computed(() => {
  const items : ItemInfo[] = []
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
  const value = calItems(currentWorkflow.value.targetItems)
  return value
})
const statementData = computed(() => {
  return getStatementData(statistics.value)
})
const proStatementData = computed(() => {
  return getProStatementData(craftTargetsArray.value, currentWorkflow.value.preparedItems)
})
const recommProcessData = computed(() => {
  return calRecommProcessData(proStatementData.value.targetItemsForCal, proStatementData.value.lv1ItemsForCal, proStatementData.value.baseItemsForCal)
})
const recommProcessGroups = computed(() => {
  const {
    craftTargets,
    lv1Items, lv2Items, lv3Items,
    lvBaseItems
  } = recommProcessData.value
  return calRecommProcessGroups(
    craftTargets,
    lv1Items,
    lv2Items,
    lv3Items,
    lvBaseItems,
    store.funcConfig.processes_craftable_item_sortby,
    store.funcConfig.processes_merge_gatherings,
    store.userConfig.language_ui,
    t
  )
})

const fixPreparedItems = () => {
  const {
    craftTargets, materialsLv1, materialsLvBase
  } = statementData.value
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
    if (!currentWorkflow.value.recommData.expandedBlocks[i]) currentWorkflow.value.recommData.expandedBlocks[i] = ['1']
    if (!currentWorkflow.value.recommData.completedItems[i]) currentWorkflow.value.recommData.completedItems[i] = {}
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
// #endregion
</script>

<template>
  <div id="main-container" class="wrapper">
    <CraftRecommProcess
      v-model:expanded-blocks="currentWorkflow.recommData.expandedBlocks"
      v-model:completed-items="currentWorkflow.recommData.completedItems"
      :item-groups="recommProcessGroups"
      content-max-height="auto"
      content-max-width="auto"
    />

    <n-back-top />
  </div>
</template>

<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>