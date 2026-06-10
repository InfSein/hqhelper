<script lang="ts" setup>
import AppAnnouncements from '@/components/main/AppAnnouncements.vue'
import PatchPanel from '@/components/main/PatchPanel.vue'
import JobPanel from '@/components/main/JobPanel.vue'
import GearSelectionPanel from '@/components/main/GearSelectionPanel.vue'
import StatisticsPanel from '@/components/main/StatisticsPanel.vue'
import ModalJoinInWorkflow from '@/components/modals/ModalJoinInWorkflow.vue'
import { type UserConfigModel } from '@/models/config-user'
import type { AttireAffix, AccessoryAffix, GearSelections } from '@/models/gears'
import { getDefaultGearSelections, fixGearSelections } from '@/models/gears'
import { useStore } from '@/store'
import { useNbbCal } from '@/tools/use-nbb-cal'
import type { XivPatchVer } from '@/assets/data';
import type { WorkState } from '@/types/workstate/hqworkbench'

const t = inject<(message: string, args?: any) => string>('t')!
const userConfig = inject<Ref<UserConfigModel>>('userConfig')!
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const { calGearSelections, getSpecialItems, getPatchData } = useNbbCal()

const workState = ref<WorkState>({
  patch: undefined,
  job: undefined,
  gears: getDefaultGearSelections(),
}) // todo

const gearSelectionPanel = ref<InstanceType<typeof GearSelectionPanel>>()

const disable_workstate_cache = store.userConfig.disable_workstate_cache ?? false
if (!disable_workstate_cache) {
  const cachedWorkState = store.userConfig.hqwb_cache_work_state
  if (cachedWorkState && JSON.stringify(cachedWorkState).length > 2) {
    workState.value = cachedWorkState
    fixGearSelections(workState.value.gears)
    // Compatible with older version caching
  }

  // todo - 留意性能：深度侦听需要遍历被侦听对象中的所有嵌套的属性，当用于大型数据结构时，开销很大
  watch(workState, async () => {
    if (workState.value) {
      try {
        await Promise.resolve()
        store.userConfig.hqwb_cache_work_state = workState.value
        store.updateUserConfig()
      } catch (error) {
        console.error('Error handling workState change:', error)
      }
    } else {
      console.warn('workState or userConfig is not defined')
    }
  }, {deep: true})
}

const handleJobButtonDupliClick = () => {
  if (!store.userConfig.disable_jobbtn_doubleclick) {
    gearSelectionPanel.value?.addCurrMainOffHand()
  }
}

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
    NAIVE_UI_MESSAGE.error(t('workflow.join_in_workflow.message.no_armor')); return
  }
  showModalJoinInWorkflow.value = true
}

const handleImportState = (patch: string, gearSelections?: GearSelections) => {
  workState.value.patch = patch
  workState.value.gears = fixGearSelections(gearSelections)
  NAIVE_UI_MESSAGE.success(t('common.message.import_succeed'))
}
provide('handleImportState', handleImportState)

const patchData = computed(() => {
  return getPatchData(workState.value.patch as XivPatchVer) ?? undefined
})
const statistics = computed(() => {
  return calGearSelections(workState.value.gears, (workState.value.patch || '7.0') as XivPatchVer)
})
const specialItems = computed(() => {
  return getSpecialItems((workState.value.patch || '7.0') as XivPatchVer)
})
</script>

<template>
  <div id="main-container">
    <AppAnnouncements />
    <n-grid cols="4" item-responsive :x-gap="10" :y-gap="10">
      <n-grid-item span="4">
        <PatchPanel
          v-model:patch-selected="workState.patch"
          v-model:gears-selected="workState.gears"
          class="h-full"
        />
      </n-grid-item>
      <n-grid-item span="4 600:2 1340:1">
        <JobPanel
          v-model:job-selected="workState.job"
          v-model:affixes-selected="workState.affixes"
          v-model:gears-selected="workState.gears"
          class="h-full"
          :patch-selected="workState.patch"
          :patch-data="patchData"
          @on-job-button-dupli-click="handleJobButtonDupliClick"
        />
      </n-grid-item>
      <n-grid-item span="4 600:2 1340:1">
        <GearSelectionPanel
          v-model:gear-selections="workState.gears"
          ref="gearSelectionPanel"
          class="h-full"
          :patch-selected="workState.patch"
          :job-id="workState.job"
          :patch-data="patchData"
          :attire-affix="(workState.affixes?.attire as AttireAffix)"
          :accessory-affix="(workState.affixes?.accessory as AccessoryAffix)"
          @join-workflow="handleJoinWorkflow"
        />
      </n-grid-item>
      <n-grid-item span="4 1340:2">
        <StatisticsPanel
          class="h-full"
          :patch-selected="workState.patch"
          :statistics="statistics"
          :aethersand-gatherings="specialItems.aethersands"
          :alkahests="specialItems.alkahests"
          :gear-selections="workState.gears"
        />
      </n-grid-item>
    </n-grid>

    <ModalJoinInWorkflow
      v-model:show="showModalJoinInWorkflow"
      :items="workflowItems"
    />

    <n-back-top />
  </div>
</template>

<style scoped>
</style>