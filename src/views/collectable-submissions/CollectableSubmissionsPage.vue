<script setup lang="ts" name="Collectable Submissions">
import {
  TaskAltOutlined
} from '@vicons/material'
import RouterCard from '@/components/ui/RouterCard.vue'
import ItemSelectionPanel from '@/views/collectable-submissions/components/ItemSelectionPanel.vue'
import StatisticsPanelShared from '@/components/StatisticsPanelShared.vue'
import ModalJoinInWorkflow from '@/components/modals/ModalJoinInWorkflow.vue'
import { useStore } from '@/store'
import { XivUnpackedCollectableSubmissions } from '@/assets/data'
import { useNbbCal } from '@/tools/use-nbb-cal'
import { fixWorkState } from '@/types/workstate/cshelper'

import { useLocale } from '@/composables/useLocale'
import { useAppMode } from '@/composables/useAppMode'

const { t } = useLocale()
const { appMode } = useAppMode()

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const { calItems } = useNbbCal()

const workState = ref(fixWorkState())

const disable_workstate_cache = store.userConfig.disable_workstate_cache ?? false
if (!disable_workstate_cache) {
  const cachedWorkState = store.userConfig.cshelper_cache_work_state
  if (cachedWorkState && JSON.stringify(cachedWorkState).length > 2) {
    workState.value = fixWorkState(cachedWorkState)
  }

  // todo - 留意性能：深度侦听需要遍历被侦听对象中的所有嵌套的属性，当用于大型数据结构时，开销很大
  watch(workState, async () => {
    if (workState.value) {
      try {
        await Promise.resolve()
        store.userConfig.cshelper_cache_work_state = workState.value
        store.updateUserConfig()
      } catch (error) {
        console.error('Error handling workState change:', error)
      }
    } else {
      console.warn('workState or userConfig is not defined')
    }
  }, {deep: true})
}

const fixItemSelections = () => {
  Object.keys(XivUnpackedCollectableSubmissions).forEach(item => {
    workState.value.free.itemSelected[Number(item)] ??= 0
  })
}
fixItemSelections()

const targetData = computed(() => {
  let targetEachGreater = 0, targetEachLesser = 0
  if (workState.value.target.greater.item) {
    targetEachGreater = XivUnpackedCollectableSubmissions[workState.value.target.greater.item].rewards[2][1]
  }
  if (workState.value.target.lesser.item) {
    targetEachLesser = XivUnpackedCollectableSubmissions[workState.value.target.lesser.item].rewards[2][1]
  }

  let requireGreater : number | '???' = 0, requireLesser : number | '???' = 0
  if (workState.value.target.greater.scrip) {
    if (targetEachGreater) {
      requireGreater = Math.ceil(workState.value.target.greater.scrip / targetEachGreater)
    } else {
      requireGreater = '???'
    }
  }
  if (workState.value.target.lesser.scrip) {
    if (targetEachLesser) {
      requireLesser = Math.ceil(workState.value.target.lesser.scrip / targetEachLesser)
    } else {
      requireLesser = '???'
    }
  }

  return {
    requireGreater, requireLesser
  }
})
const currSelectedItems = computed(() => {
  if (workState.value.mode === 'target') {
    const selected : Record<number, number> = {}
    if (workState.value.target.greater.item && targetData.value.requireGreater && targetData.value.requireGreater !== '???') {
      selected[workState.value.target.greater.item] = targetData.value.requireGreater
    }
    if (workState.value.target.lesser.item && targetData.value.requireLesser && targetData.value.requireLesser !== '???') {
      selected[workState.value.target.lesser.item] = targetData.value.requireLesser
    }
    return selected
  } else if (workState.value.mode === 'free') {
    return workState.value.free.itemSelected
  } else {
    console.warn('unset mode!')
    return {}
  }
})
const statistics = computed(() => {
  const value = calItems(currSelectedItems.value)
  return value
})

const showModalJoinInWorkflow = ref(false)
const workflowItems = computed(() => {
  const items : Record<number, number> = {}
  Object.values(statistics.value.ls).forEach((stat: any) => {
    items[stat.id] = stat.need
  })
  return items
})
const handleJoinWorkflow = () => {
  if (!Object.values(workflowItems.value).length) {
    NAIVE_UI_MESSAGE.error(t('workflow.join_in_workflow.message.no_colleactable_submission')); return
  }
  showModalJoinInWorkflow.value = true
}
</script>

<template>
  <div id="main-container">
    <RouterCard
      id="router-card"
      v-show="appMode !== 'overlay'"
      :page-name="t('common.appfunc.cshelper')"
      :page-icon="TaskAltOutlined"
    />
    <div id="left-layout">
      <ItemSelectionPanel
        v-model:work-state="workState"
        :target-data="targetData"
        @join-workflow="handleJoinWorkflow"
      />
    </div>
    <div id="right-layout">
      <StatisticsPanelShared
        v-model:hide-precraft-materials="workState.hidePrecraftMaterials"
        :statistics="statistics"
        :item-selected="currSelectedItems"
      />
    </div>
    
    <ModalJoinInWorkflow
      v-model:show="showModalJoinInWorkflow"
      :items="workflowItems"
    />

    <n-back-top />
  </div>
</template>

<style scoped>
/* All */
#main-container {
  max-width: 100%;
  gap: 0.6rem;
}

/* Desktop */
@media screen and (min-width: 768px) {
  #main-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    max-height: 100%;
    overflow: auto;

    #router-card {
      grid-row: 1;
      grid-column: 1 / 3;
    }
    #left-layout {
      grid-row: 2;
      grid-column: 1;
    }
    #right-layout {
      grid-row: 2 / 4;
      grid-column: 2;
    }
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  #main-container {
    display: flex;
    flex-direction: column;

    #left-layout {
      width: 100%;
      display: flex;
      flex-direction: column;

      .job-panel {
        width: 100%;
      }
      .gear-panel {
        width: 100%;
      }
    }
    #right-layout {
      width: 100%;

      .statistics-panel {
        width: 100%;
      }
    }
  }
}
</style>