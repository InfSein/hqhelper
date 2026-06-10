<script setup lang="ts">
import { 
  TableViewOutlined
} from '@vicons/material'
import ModalRecommProcesses from './ModalRecommProcesses.vue'
import ModalPreferences from './ModalPreferences.vue'
import { type ItemInfo } from '@/tools/item'
import { useFufuCal } from '@/tools/use-fufu-cal'
import CraftStatementsPro from '../custom/general/CraftStatementsPro.vue'
import { useStore } from '@/store'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
// const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const store = useStore()
const { getProStatementData, calRecommProcessData } = useFufuCal()

const showModal = defineModel<boolean>('show', { required: true })
const showRecommendedProcessesModal = ref(false)
const proStatementInstace = ref<InstanceType<typeof CraftStatementsPro>>()

interface ModalProStatementsProps {
  craftTargets: ItemInfo[]
}
const props = defineProps<ModalProStatementsProps>()

const onLoad = async () => {
  itemsPrepared.value.craftTarget = fixMap(itemsPrepared.value.craftTarget, proStatementData.value.targetItems)
  itemsPrepared.value.materialsLv1 = fixMap(itemsPrepared.value.materialsLv1, proStatementData.value.lv1Items)
  itemsPrepared.value.materialsLvBase = fixMap(itemsPrepared.value.materialsLvBase, proStatementData.value.baseItems)
}

/** 记录已经准备了的物品 */
const itemsPrepared = ref({
  craftTarget: {} as Record<number, number>,
  materialsLv1: {} as Record<number, number>,
  materialsLvBase: {} as Record<number, number>
})
/** 根据旧的准备map和计算后更新的列表，修正准备map */
const fixMap = (oldprepared: Record<number, number>, newlist: Record<number, number>) => {
  const newMap : Record<number, number> = {}
  for (const itemID in newlist) {
    const id = Number(itemID)
    if (oldprepared[id]) {
      newMap[id] = Math.min(oldprepared[id], newlist[id])
    } else {
      newMap[id] = 0
    }
  }
  return newMap
}

const proStatementData = computed(() => {
  return getProStatementData(props.craftTargets, itemsPrepared.value)
})

const recommProcessData = computed(() => {
  return calRecommProcessData(proStatementData.value.targetItemsForCal, proStatementData.value.lv1ItemsForCal, proStatementData.value.baseItemsForCal)
})

const handleResetPreparedItems = () => {
  itemsPrepared.value.craftTarget = fixMap({}, proStatementData.value.targetItems)
  itemsPrepared.value.materialsLv1 = fixMap({}, proStatementData.value.lv1Items)
  itemsPrepared.value.materialsLvBase = fixMap({}, proStatementData.value.baseItems)
}
const handleShowRecommendedProcesses = () => {
  showRecommendedProcessesModal.value = true
}

const handleStatementLoaded = () => {
  if (store.funcConfig.inventory_statement_enable_sync) {
    if (proStatementInstace?.value?.setPreparedItemsByInventory) {
      proStatementInstace.value.setPreparedItemsByInventory()
    } else {
      console.error('proStatementInstace not found')
    }
  }
}

const showPreferencesModal = ref(false)
const handleSettingButtonClick = () => {
  showPreferencesModal.value = true
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    id="modal-pro-statements"
    max-width="1500px"
    :height="isMobile ? '650px' : '600px'"
    @on-load="onLoad"
    show-setting
    @on-setting-button-clicked="handleSettingButtonClick"
  >
    <template #header>
      <div class="card-title select-none">
        <n-icon><TableViewOutlined /></n-icon>
        <span class="title">
          {{ t('common.appfunc.craft_statement') }}
        </span>
        <span class="card-title-extra">
          <n-tag type="info" size="small" round>PRO</n-tag>
        </span>
        <div class="card-title-actions">
          <a href="javascript:void(0);" @click="handleResetPreparedItems">[{{ t('statement.text.reset_prepared') }}]</a>
          <a href="javascript:void(0);" @click="handleShowRecommendedProcesses">[{{ t('common.appfunc.recomm_process') }}]</a>
        </div>
      </div>
    </template>

    <CraftStatementsPro
      ref="proStatementInstace"
      v-model:items-prepared="itemsPrepared"
      inside-modal
      container-id="modal-pro-statements"
      :craft-targets="props.craftTargets"
      :statement-blocks="proStatementData.statementBlocks"
      @loaded="handleStatementLoaded"
    />

    <ModalRecommProcesses
      v-model:show="showRecommendedProcessesModal"
      v-bind="recommProcessData"
    />
    <ModalPreferences
      v-model:show="showPreferencesModal"
      setting-group="craft_statement"
      app-show-fp
    />
  </MyModal>
</template>

<style scoped>
/* All */
.wrapper {
  user-select: text;
}
.wrapper.desktop {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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