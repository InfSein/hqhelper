<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  AddSharp,
  AllInclusiveSharp,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  DeleteSweepRound,
  OpenInNewOutlined,
  QueryStatsFilled,
  SettingsSharp,
  TableViewOutlined,
  UnfoldLessSharp,
  UnfoldMoreSharp,
} from '@vicons/material'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import ItemSelector from '@/components/item/ItemSelector.vue'
import ItemSelectTable from '@/components/item/ItemSelectTable.vue'
import CraftStatements from '@/components/craft/CraftStatements.vue'
import CraftStatistics from '@/components/craft/CraftStatistics.vue'
import ModalPreferences from '@/components/modals/ModalPreferences.vue'
import CraftRecommProcess from '@/components/craft/CraftRecommProcess.vue'
import CraftStatementsPro from '@/components/craft/CraftStatementsPro.vue'
import ModalCostAndBenefit from '@/components/modals/ModalCostAndBenefit.vue'
import NotebookPanel from '@/views/workflow/components/NotebookPanel.vue'
import { useRoute, useRouter } from 'vue-router'
import ModalShareWorkflow from '@/views/workflow/components/ModalShareWorkflow.vue'
import ImportItemListPop from '@/views/workflow/components/ImportItemListPop.vue'
import ModalWorkflowsManage from '@/views/workflow/components/ModalWorkflowsManage.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useResponsive } from '@/composables/useResponsive'
import { useAppModals } from '@/composables/useAppModals'
import { useWorkflowState } from '@/composables/useWorkflowState'
import { useCostAndBenefit } from '@/composables/useCostAndBenefit'
import { useWorkflowStatistics } from '@/composables/useWorkflowStatistics'
import { type SettingGroupKey } from '@/types'
import { getDefaultWorkflow, _VAR_MAX_WORKFLOW } from '@/types/workstate/workflow'
import { getItemInfo } from '@/tools/item'
import { decodeShareCode } from '@/tools/shareCode'

const store = useStore()
const { t } = useLocale()
const { isMobile } = useResponsive()
const NAIVE_UI_MESSAGE = useMessage()

// #region workflow state & statistics
const { workState, currentWorkflow } = useWorkflowState()
const {
  craftTargetsArray,
  statementData,
  proStatementData,
  recommProcessGroups,
} = useWorkflowStatistics(currentWorkflow)
// #endregion

// #region UI state & heights
const showPreferencesModal = ref(false)
const preferenceSettingGroup = ref<SettingGroupKey | undefined>(undefined)
const preferenceAppShowUP = ref(false)
const preferenceAppShowFP = ref(false)
const selectedAnaTab = ref('statistics')
const showShareModal = ref(false)

const route = useRoute()
const router = useRouter()
const { joinItemsToWorkflow } = useAppModals()

const checkRouteShareCode = () => {
  const code = route.query.code as string | undefined
  if (code) {
    const decoded = decodeShareCode(code)
    if (decoded && Object.keys(decoded).length > 0) {
      const validItems: Record<number, number> = {}
      for (const [idStr, amount] of Object.entries(decoded)) {
        const itemId = Number(idStr)
        const itemInfo = getItemInfo(itemId)
        if (itemInfo.craftInfo?.recipeId) {
          validItems[itemId] = amount
        }
      }
      if (Object.keys(validItems).length > 0) {
        joinItemsToWorkflow(validItems)
      } else {
        NAIVE_UI_MESSAGE.error(t('workflow.share.import_by_code_failed'))
      }
    } else {
      NAIVE_UI_MESSAGE.error(t('workflow.share.import_by_code_failed'))
    }
    router.replace({ path: '/workflow' })
  } else if (route.path === '/share') {
    router.replace({ path: '/workflow' })
  }
}

const headerBlock = ref<HTMLElement>()
const proStatementInstace = ref<InstanceType<typeof CraftStatementsPro>>()
const windowHeight = ref(window.innerHeight)
const headerHeight = ref(0)
const updateHeights = () => {
  windowHeight.value = window.innerHeight
  if (headerBlock.value?.offsetHeight) {
    headerHeight.value = headerBlock.value.offsetHeight + 20 // 考虑padding
  } else {
    headerHeight.value = 0
  }
}
import { onInventoryChange, offInventoryChange } from '@/composables/useInventoryPlugin'

const handleWorkflowInventoryChange = (changedItemIds: number[]) => {
  if (selectedAnaTab.value === 'statements' && store.userConfig.receive_third_party_data && store.funcConfig.inventory_use_plugin_data) {
    proStatementInstace.value?.applyInventoryChanges(changedItemIds)
  }
}

onMounted(() => {
  updateHeights()
  window.addEventListener('resize', updateHeights)
  onInventoryChange(handleWorkflowInventoryChange)
  checkRouteShareCode()
})
watch(() => route.query.code, () => {
  checkRouteShareCode()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeights)
  offInventoryChange(handleWorkflowInventoryChange)
})
const pageHeightVals = computed(() => {
  const pageHeight = windowHeight.value - 272
  const contentHeight = pageHeight - headerHeight.value
  if (isMobile.value) {
    return {
      notebookMenu: 'auto',
      itemSelectTable: 'auto',
      statisticsBlock: undefined,
      statementsBlock: 'auto',
      recommProcess: 'auto',
      recommProcessContainer: '60px',
    }
  } else {
    return {
      notebookMenu: (contentHeight - 0) + 'px',
      itemSelectTable: (contentHeight - 65) + 'px',
      statisticsBlock: (contentHeight / 2 - 45),
      statementsBlock: (contentHeight - 50) + 'px',
      recommProcess: contentHeight + 'px',
      recommProcessContainer: (contentHeight + 12) + 'px', // tabpane 有 12px 的 padding-top
    }
  }
})
// #endregion

// #region header
const handleAddWorkflow = () => {
  if (workState.value.workflows.length >= _VAR_MAX_WORKFLOW) {
    NAIVE_UI_MESSAGE.warning(t('workflow.message.max_len', _VAR_MAX_WORKFLOW))
    return
  }
  workState.value.workflows.push(getDefaultWorkflow())
}
const showWorkflowsManageModal = ref(false)
const handleManageWorkflows = () => {
  showWorkflowsManageModal.value = true
}
const handleFixWorkStateAfterWorkflowsManaged = () => {
  if (workState.value.currentWorkflow >= workState.value.workflows.length) {
    workState.value.currentWorkflow = workState.value.workflows.length - 1
  }
}
// #endregion

// #region content(block swap)
const isSwitchingView = ref(false)

watch(() => workState.value.pageView, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    isSwitchingView.value = true
    setTimeout(() => {
      isSwitchingView.value = false
    }, 300)
  }
})

let wheelLock = false
const handleWheel = (e: WheelEvent) => {
  if (isMobile.value || wheelLock) return
  
  const isHorizontalScroll = Math.abs(e.deltaX) > 40 && Math.abs(e.deltaX) > Math.abs(e.deltaY)
  const isShiftVerticalScroll = e.shiftKey && Math.abs(e.deltaY) > 40 && Math.abs(e.deltaY) > Math.abs(e.deltaX)
  
  if (isHorizontalScroll || isShiftVerticalScroll) {
    const delta = isHorizontalScroll ? e.deltaX : e.deltaY

    let target = e.target as HTMLElement | null
    while (target && target !== e.currentTarget) {
      if (target.scrollWidth > target.clientWidth) {
        const style = window.getComputedStyle(target)
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
          return 
        }
      }
      target = target.parentElement
    }

    wheelLock = true
    if (delta > 0 && workState.value.pageView === 'AB') {
      workState.value.pageView = 'BC'
    } else if (delta < 0 && workState.value.pageView === 'BC') {
      workState.value.pageView = 'AB'
    }
    setTimeout(() => { wheelLock = false }, 400)
  }
}

const sliderStyle = computed(() => {
  if (isMobile.value) return {}
  const baseTranslate = workState.value.pageView === 'BC' ? `calc(-100% + var(--select-card-width))` : `0px`
  return {
    transform: `translateX(${baseTranslate})`,
    transition: isSwitchingView.value ? 'transform 0.3s ease-in-out' : 'none'
  }
})
// #endregion

// #region notebook actions
const handleAddNotebookItem = (itemId: number) => {
  if (!itemId) {
    NAIVE_UI_MESSAGE.error('ITEM NOT FOUND'); return
  }
  currentWorkflow.value.targetItems[itemId] ??= 0
  currentWorkflow.value.targetItems[itemId]++
  currentWorkflow.value.preparedItems.craftTarget[itemId] ??= 0
}
// #endregion

// #region content-items
const handleItemInputValueUpdate = (value: number) => {
  if (!value) return
  if (currentWorkflow.value.targetItems[value]) {
    NAIVE_UI_MESSAGE.info(t('common.message.item_already_have'))
  } else {
    currentWorkflow.value.targetItems[value] = 1
    currentWorkflow.value.preparedItems.craftTarget[value] = 0
  }
}
const handleClearCurrentWorkflow = () => {
  currentWorkflow.value.targetItems = {}
  currentWorkflow.value.preparedItems = {
    craftTarget: {},
    materialsLv1: {},
    materialsLvBase: {},
  }
  NAIVE_UI_MESSAGE.success(t('common.cleared'))
}
const selectCardFolded = ref(false)
const selectCardWidth = ref('450px')
const handleSelectCardFoldStatusChanged = (folded: boolean) => {
  selectCardFolded.value = folded
  if (folded) {
    selectCardWidth.value = '200px'
  } else {
    selectCardWidth.value = '450px'
  }
  setTimeout(() => {
    if (proStatementInstace?.value?.updateSize) {
      proStatementInstace.value.updateSize()
    }
  }, 10)
}
// #endregion

// #region content-statistics actions
const recommGroupAllCollapsed = computed(() => {
  let allCollapsed = true
  for (let i = 0; i < recommProcessGroups.value.length; i++) {
    if (currentWorkflow.value.recommData.expandedBlocks[i] && currentWorkflow.value.recommData.expandedBlocks[i].length > 0) {
      allCollapsed = false
    }
  }
  return allCollapsed
})

const canUseNewWindow = computed(() => {
  return !!window.electronAPI && !!window.$syncStore
})
const handleOpenProcessInNewWindow = () => {
  const pageTitle = t('workflow.recomm_process')
  const pageUrl = document.location.origin + document.location.pathname + `#/workflow_process?mode=overlay`
  const width = 400; const height = 350
  if (window.electronAPI?.createNewWindow) {
    window.electronAPI.createNewWindow(
      'workflow-process',
      pageUrl,
      width,
      height,
      pageTitle
    )
  } else {
    window.open(
      pageUrl,
      pageTitle,
      `height=${height}, width=${width}, top=200, left=200`
    )
  }
}
const handleCollapseOrUncollapseAllRecommGroupBlocks = () => {
  const cacheRecommGroupAllCollapsed = recommGroupAllCollapsed.value
  for (let i = 0; i < recommProcessGroups.value.length; i++) {
    currentWorkflow.value.recommData.expandedBlocks[i] = cacheRecommGroupAllCollapsed ? ['1'] : []
  }
}
const handleRecommSettingButtonClick = () => {
  preferenceAppShowUP.value = false
  preferenceAppShowFP.value = true
  preferenceSettingGroup.value = 'recomm_process'
  showPreferencesModal.value = true
}

const {
  showModal: showCostAndBenefitModal,
  updatingPrice,
  openModal: handleAnalysisItemPrices,
} = useCostAndBenefit(statementData)

const handleSetStatementPreparedByInventory = () => {
  if (proStatementInstace?.value?.setPreparedItemsByInventory) {
    proStatementInstace.value.setPreparedItemsByInventory()
    NAIVE_UI_MESSAGE.success(t('common.message.sync_succeed'))
  } else {
    NAIVE_UI_MESSAGE.error('proStatementInstace Ref Notfound')
  }
}
const setInventoryByStatementPrepared = () => {
  if (proStatementInstace?.value?.setInventoryByPreparedItems) {
    proStatementInstace.value.setInventoryByPreparedItems()
    NAIVE_UI_MESSAGE.success(t('common.message.sync_succeed'))
  } else {
    NAIVE_UI_MESSAGE.error('proStatementInstace Ref Notfound')
  }
}
// #endregion
</script>

<template>
  <div id="main-container" class="wrapper">
    <n-card embedded :bordered="false" class="header-block">
      <div class="block" ref="headerBlock">
        <div class="action">
          <p><i class="xiv sync-invert"></i> {{ t('workflow.text.switch_workflows') }}</p>
          <div class="flex flex-wrap gap-1">
            <n-button
              v-for="(flow, flowIndex) in workState.workflows"
              :key="flowIndex"
              size="tiny"
              :type="flowIndex === workState.currentWorkflow ? 'primary' : 'default'"
              @click="workState.currentWorkflow = flowIndex"
            >
              {{ flow.name || t('workflow.text.workflow_with_index', flowIndex + 1) }}
            </n-button>
            <TooltipButton
              size="tiny"
              square
              :icon="AddSharp"
              :icon-size="16"
              :tip="t('workflow.text.add_a_workflow')"
              @click="handleAddWorkflow"
            />
            <TooltipButton
              size="tiny"
              square
              :icon="SettingsSharp"
              :icon-size="14"
              :tip="t('workflow.text.manage_existed_workflows')"
              @click="handleManageWorkflows"
            />
          </div>
        </div>
      </div>
    </n-card>
    <div
      class="content-block"
      :style="{
        '--select-card-width': selectCardWidth,
      }"
      @wheel="handleWheel"
    >
      <div class="slider-container" :style="sliderStyle">
        <NotebookPanel
          v-model:selected-job="workState.selectedJob"
          v-model:selected-menu="workState.selectedMenu"
          v-model:selected-content-group="workState.selectedContentGroup"
          v-model:selected-item="workState.selectedItem"
          v-model:notebook-search-history="workState.notebookSearchHistory"
          :menu-height="pageHeightVals.notebookMenu"
          @add-item="handleAddNotebookItem"
        />
        <FoldableCard
          card-key="workflow-content-items"
          class="items-wrapper block-b"
          :fold-direction="isMobile ? 'vertical' : 'horizontal'"
          @on-card-fold-status-changed="handleSelectCardFoldStatusChanged"
        >
          <template #header>
            <i class="xiv square-1"></i>
            <span class="app-card-title__text">{{ t('common.select_item2') }}</span>
            <ImportItemListPop>
              <a v-show="!selectCardFolded" class="text-sm ml-1 px-0.5 py-px" href="javascript:void(0);">
                [{{ t('common.import') }}]
              </a>
            </ImportItemListPop>
            <a
              v-show="!selectCardFolded"
              class="text-sm px-0.5 py-px"
              href="javascript:void(0);"
              @click="showShareModal = true"
            >
              [{{ t('common.share') }}]
            </a>
          </template>
          <div class="block items-block">
            <div class="top-actions">
              <n-input-group>
                <n-input-group-label>{{ t('common.add_item') }}</n-input-group-label>
                <ItemSelector
                  @on-item-selected="handleItemInputValueUpdate"
                />
              </n-input-group>
            </div>
            <div class="content-table">
              <ItemSelectTable
                v-model:items="currentWorkflow.targetItems"
                show-item-details
                :item-span-max-width="isMobile ? '160px' : '230px'"
                :content-height="pageHeightVals.itemSelectTable"
              />
            </div>
            <div class="bottom-actions">
              <TooltipButton
                :icon="DeleteSweepRound"
                :text="t('common.clear')"
                :tip="t('workflow.text.clear_current_workflow')"
                @click="handleClearCurrentWorkflow"
              />
            </div>
          </div>
        </FoldableCard>
        <FoldableCard
          card-key="workflow-content-statistics"
          class="statistics-wrapper block-c"
          :unfoldable="!isMobile"
        >
          <template #header>
            <i class="xiv square-2"></i>
            <span class="app-card-title__text">{{ t('common.view_analysis') }}</span>
            <a
              class="app-card-title__extra"
              href="javascript:void(0);"
              :disabled="updatingPrice"
              :style="updatingPrice ? 'cursor: not-allowed; color: gray;' : 'cursor: pointer;'"
              @click="handleAnalysisItemPrices"
            >
              [{{ updatingPrice ? t('common.loading') : t('statistics.group.cost_and_benefit.title') }}]
            </a>
            <a
              v-show="!(store.userConfig.receive_third_party_data && store.funcConfig.inventory_use_plugin_data) && store.funcConfig.inventory_workflow_enable_sync && selectedAnaTab === 'statements'"
              class="app-card-title__extra"
              href="javascript:void(0);"
              style="cursor: pointer;"
              :title="t('workflow.tooltip.set_prepared_by_inventory')"
              @click="handleSetStatementPreparedByInventory"
            >
              [{{ t('workflow.text.sync_from_inventory') }}]
            </a>
            <a
              v-show="!(store.userConfig.receive_third_party_data && store.funcConfig.inventory_use_plugin_data) && store.funcConfig.inventory_workflow_enable_sync_reverse && selectedAnaTab === 'statements'"
              class="card-title-extra"
              href="javascript:void(0);"
              style="cursor: pointer;"
              :title="t('workflow.tooltip.set_inventory_by_prepared')"
              @click="setInventoryByStatementPrepared"
            >
              [{{ t('workflow.text.sync_to_inventory') }}]
            </a>
          </template>
          <div class="block">
            <n-tabs v-model:value="selectedAnaTab" type="segment" animated class="h-full">
              <n-tab-pane name="statistics">
                <template #tab>
                  <div class="tab-title">
                    <n-icon :size="16"><QueryStatsFilled /></n-icon>
                    <div>{{ t('common.statistics') }}</div>
                  </div>
                </template>
                <CraftStatistics
                  :item-selected="currentWorkflow.targetItems"
                  :list-height="pageHeightVals.statisticsBlock"
                />
              </n-tab-pane>
              <n-tab-pane name="statements">
                <template #tab>
                  <div class="tab-title">
                    <n-icon :size="16"><TableViewOutlined /></n-icon>
                    <div>{{ t('common.statement') }}</div>
                  </div>
                </template>
                <CraftStatements
                  v-if="store.funcConfig.use_traditional_statement"
                  v-bind="statementData"
                />
                <CraftStatementsPro
                  v-else
                  ref="proStatementInstace"
                  v-model:items-prepared="currentWorkflow.preparedItems"
                  :craft-targets="craftTargetsArray"
                  :statement-blocks="proStatementData.statementBlocks"
                  :content-height="pageHeightVals.statementsBlock"
                />
              </n-tab-pane>
              <n-tab-pane name="processes" :style="{
                transform: 'translate(0)',
                minHeight: pageHeightVals.recommProcessContainer,
              }">
                <template #tab>
                  <div class="tab-title">
                    <n-icon :size="16"><AllInclusiveSharp /></n-icon>
                    <div>{{ t('common.process') }}</div>
                  </div>
                </template>
                <CraftRecommProcess
                  v-model:expanded-blocks="currentWorkflow.recommData.expandedBlocks"
                  v-model:completed-items="currentWorkflow.recommData.completedItems"
                  :item-groups="recommProcessGroups"
                  :content-max-height="pageHeightVals.recommProcess"
                  content-max-width="1080px"
                />

                <n-float-button-group v-if="!isMobile" right="20px" bottom="5px">
                  <n-tooltip v-if="canUseNewWindow" :trigger="isMobile ? 'manual' : 'hover'" placement="left">
                    <template #trigger>
                      <n-float-button @click="handleOpenProcessInNewWindow">
                        <n-icon>
                          <OpenInNewOutlined />
                        </n-icon>
                      </n-float-button>
                    </template>
                    {{ t('common.open_in_new_window') }}
                  </n-tooltip>
                  <n-tooltip v-if="recommProcessGroups.length" :trigger="isMobile ? 'manual' : 'hover'" placement="left">
                    <template #trigger>
                      <n-float-button @click="handleCollapseOrUncollapseAllRecommGroupBlocks">
                        <n-icon>
                          <UnfoldMoreSharp v-if="recommGroupAllCollapsed" />
                          <UnfoldLessSharp v-else />
                        </n-icon>
                      </n-float-button>
                    </template>
                    {{ recommGroupAllCollapsed ? t('common.expand_all') : t('common.fold_all') }}
                  </n-tooltip>
                  <n-tooltip :trigger="isMobile ? 'manual' : 'hover'" placement="left">
                    <template #trigger>
                      <n-float-button @click="handleRecommSettingButtonClick">
                        <n-icon>
                          <SettingsSharp />
                        </n-icon>
                      </n-float-button>
                    </template>
                    {{ t('common.setting') }}
                  </n-tooltip>
                </n-float-button-group>
              </n-tab-pane>
            </n-tabs>
          </div>
        </FoldableCard>
      </div>
    </div>

    <ModalWorkflowsManage
      v-model:show="showWorkflowsManageModal"
      v-model:workflows="workState.workflows"
      @after-save="handleFixWorkStateAfterWorkflowsManaged"
    />
    <ModalShareWorkflow
      v-model:show="showShareModal"
      :items="currentWorkflow.targetItems"
    />
    <ModalCostAndBenefit
      v-model:show="showCostAndBenefitModal"
      :cost-items="statementData.materialsLvBase"
      :benefit-items="statementData.craftTargets"
    />
    <ModalPreferences
      v-model:show="showPreferencesModal"
      :setting-group="preferenceSettingGroup"
      :app-show-up="preferenceAppShowUP"
      :app-show-fp="preferenceAppShowFP"
    />

    <n-back-top />

    <n-float-button
      v-if="!isMobile && workState.pageView === 'BC'"
      position="absolute"
      style="left: 4px; top: calc(50% + 58px); transform: translateY(-50%); z-index: 10;"
      @click="workState.pageView = 'AB'"
    >
      <n-icon><ChevronLeftOutlined /></n-icon>
    </n-float-button>

    <n-float-button
      v-if="!isMobile && workState.pageView === 'AB'"
      position="absolute"
      style="right: 4px; top: calc(50% + 58px); transform: translateY(-50%); z-index: 10;"
      @click="workState.pageView = 'BC'"
    >
      <n-icon><ChevronRightOutlined /></n-icon>
    </n-float-button>
  </div>
</template>

<style scoped>
.tab-title {
  display: flex;
  line-height: 1;
  align-items: center;
  gap: 3px;
}
.wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .header-block {
    height: auto;
    .action {
      display: flex;
      align-items: center;
    }
  }

  .content-block {
    flex: 1;
    position: relative;
    overflow: hidden;

    .slider-container {
      display: flex;
      height: 100%;
      width: 100%;
      gap: 8px;
    }

    .block {
      padding: 0 4px;
      height: 100%;
    }
    .items-block {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 5px;

      .top-actions {
        display: flex;
        align-items: center;
        gap: 5px;

        .label {
          font-size: 16px;
        }
        .n-select {
          flex: 1;
        }
      }
      .content-table {
        flex: 1;
      }
      .bottom-actions {
        display: flex;
        justify-content: end;
      }
    }
  }
}

/* Desktop */
@media screen and (min-width: 768px) {
  .wrapper {
    .content-block {
      .block-a, .block-c {
        width: calc(100% - var(--select-card-width) - 8px);
        flex-shrink: 0;
      }
      .block-b {
        width: var(--select-card-width);
        flex-shrink: 0;
      }
    }
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .wrapper {
    .header-block .action {
      flex-direction: column;
      align-items: flex-start;
      justify-content: start;
      gap: 5px;
    }
    .content-block {
      display: flex;
      flex-direction: column;
      overflow: visible;
      
      .slider-container {
        flex-direction: column;
        transform: none !important;
        height: auto;
      }
      .block-a, .block-b, .block-c {
        width: 100%;
      }
    }
  }
}
</style>