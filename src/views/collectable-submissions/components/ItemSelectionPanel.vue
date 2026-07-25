<script setup lang="ts">
import {
  DeleteSweepRound,
  JoinLeftOutlined,
} from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemStepper from '@/components/item/ItemStepper.vue'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import ItemSelector from '@/components/item/ItemSelector.vue'
import ItemSubmissionReward from '@/components/item/ItemSubmissionReward.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import UseConfig from '@/composables/useConfig.ts'
import { ExpansionSpecialItems } from '@/constants/game'
import { XivJobs, XivUnpackedCollectableSubmissions } from '@/assets/data'
import { getItemInfo } from '@/tools/item'
import { type WorkState } from '@/types/workstate/cshelper.ts'

const store = useStore()
const { t } = useLocale()
const {
  uiLanguage,
  itemLanguage,
} = UseConfig()

const workState = defineModel<WorkState>('workState', { required: true })

interface CsHelperItemSelectionPanelProps {
  targetData: {
    requireGreater: number | "???";
    requireLesser: number | "???";
  }
}
defineProps<CsHelperItemSelectionPanelProps>()

const emits = defineEmits(['joinWorkflow'])

const pageData = computed(() => {
  const greaterOptions : number[] = []
  const lesserOptions : number[] = []
  const itemGroupMap : Record<number, number[]> = {}

  Object.values(XivUnpackedCollectableSubmissions).forEach(item => {
    if (item.rewardScrip === ExpansionSpecialItems.crafterScripGreater) {
      greaterOptions.push(item.id)
    } else if (item.rewardScrip === ExpansionSpecialItems.crafterScripLesser) {
      lesserOptions.push(item.id)
    } else {
      console.warn('unknown item', item)
    }

    const itemInfo = getItemInfo(item.id)
    itemGroupMap[itemInfo.craftInfo.jobId] ??= []
    itemGroupMap[itemInfo.craftInfo.jobId].push(item.id)
  })

  const freeItemGroups = Object.entries(itemGroupMap).map(([_jobId, items]) => {
    const submissions = items.map(item => XivUnpackedCollectableSubmissions[item])
    return {
      job: XivJobs[Number(_jobId)],
      group1Items: submissions.filter(item => levelInside(item.levels, 91, 100)).map(item => item.id),
      group2Items: submissions.filter(item => levelInside(item.levels, 81, 90)).map(item => item.id),
      totalCount: submissions.length,
    }
  })
  freeItemGroups.sort((a, b) => a.job.job_id - b.job.job_id)

  return {
    greaterOptions, lesserOptions,
    scripGreater: getItemInfo(ExpansionSpecialItems.crafterScripGreater),
    scripLesser: getItemInfo(ExpansionSpecialItems.crafterScripLesser),
    freeItemGroups,
  }

  function levelInside(levels: number[], min: number, max: number) {
    let result = true
    levels.forEach(level => {
      if (!(level >= min && level <= max)) result = false
    })
    return result
  }
})

const handleClearSelections = () => {
  for (const id in workState.value.free.itemSelected) {
    workState.value.free.itemSelected[id] = 0
  }
}

const handleJoinWorkflow = () => {
  emits('joinWorkflow')
}
</script>

<template>
  <div class="panel-wrapper">
    <div>
      <FoldableCard card-key="ft-item-selection">
        <template #header>
          <i class="xiv square-1"></i>
          <span class="card-title-text">{{ t('cs_helper.select_collectable_submission') }}</span>
        </template>

        <n-tabs v-model:value="workState.mode" type="segment" animated>
          <n-tab-pane name="target">
            <template #tab>
              <div>
                <i class="xiv e05e"></i>
                {{ t('cs_helper.mode.target') }}
              </div>
            </template>
            <div class="item-selection-container">
              <n-card size="small" :class="store.userConfig.custom_background ? 'glasscard smallcard' : ''">
                <template #header>
                  <div class="card-title">
                    <XivFARImage
                      :size="16"
                      :src="pageData.scripGreater"
                    />
                    <span class="title">{{ pageData.scripGreater[`name_${itemLanguage}`] }}</span>
                  </div>
                </template>
                
                <div class="target-card-container">
                  <div class="item">
                    <i class="xiv e05e"></i>
                    {{ t('cs_helper.action.target_scrip_amount') }}
                    <n-input-number
                      v-model:value="workState.target.greater.scrip"
                      :min="0" :max="9999999"
                    />
                  </div>
                  <div class="item">
                    <i class="xiv collectables"></i>
                    {{ t('cs_helper.action.craft_target') }}
                    <ItemSelector
                      v-model:model-value="workState.target.greater.item"
                      dont-clean-after-select
                      options-preset="custom"
                      :options="pageData.greaterOptions"
                    />
                  </div>
                  <div class="item">
                    <i class="xiv crystal"></i>
                    {{ t('cs_helper.action.reward') }}
                    <div class="submission-reward-container">
                      <ItemSubmissionReward v-if="workState.target.greater.item" :item-info="getItemInfo(workState.target.greater.item)" />
                      <div v-else>{{ t('cs_helper.message.select_craft_target_first') }}</div>
                    </div>
                  </div>
                  <div class="item require-amount-container">
                    <div class="title">
                      <i class="xiv arrow-right"></i>
                      {{ t('cs_helper.action.need_craft') }}
                    </div>
                    <div class="amount">
                      <span class="require-amount">{{ targetData.requireGreater }}</span>
                      {{ t('common.unit.ge') }}
                    </div>
                  </div>
                </div>
              </n-card>
              <n-card size="small" :class="store.userConfig.custom_background ? 'glasscard smallcard' : ''">
                <template #header>
                  <div class="card-title">
                    <XivFARImage
                      :size="16"
                      :src="pageData.scripLesser"
                    />
                    <span class="title">{{ pageData.scripLesser[`name_${itemLanguage}`] }}</span>
                  </div>
                </template>
                
                <div class="target-card-container">
                  <div class="item">
                    <i class="xiv e05e"></i>
                    {{ t('cs_helper.action.target_scrip_amount') }}
                    <n-input-number
                      v-model:value="workState.target.lesser.scrip"
                      :min="0" :max="9999999"
                    />
                  </div>
                  <div class="item">
                    <i class="xiv collectables"></i>
                    {{ t('cs_helper.action.craft_target') }}
                    <ItemSelector
                      v-model:model-value="workState.target.lesser.item"
                      dont-clean-after-select
                      options-preset="custom"
                      :options="pageData.lesserOptions"
                    />
                  </div>
                  <div class="item">
                    <i class="xiv crystal"></i>
                    {{ t('cs_helper.action.reward') }}
                    <div class="submission-reward-container">
                      <ItemSubmissionReward v-if="workState.target.lesser.item" :item-info="getItemInfo(workState.target.lesser.item)" />
                      <div v-else>{{ t('cs_helper.message.select_craft_target_first') }}</div>
                    </div>
                  </div>
                  <div class="item require-amount-container">
                    <div class="title">
                      <i class="xiv arrow-right"></i>
                      {{ t('cs_helper.action.need_craft') }}
                    </div>
                    <div class="amount">
                      <span class="require-amount">{{ targetData.requireLesser }}</span>
                      {{ t('common.unit.ge') }}
                    </div>
                  </div>
                </div>
              </n-card>
            </div>

            <div class="actions">
              <TooltipButton
                :icon="JoinLeftOutlined"
                :text="t('workflow.text.join_in_workflow')"
                :tip="t('workflow.text.join_selected_collectable_submissions_in_workflow')"
                @click="handleJoinWorkflow"
              />
            </div>
          </n-tab-pane>
          <n-tab-pane name="free">
            <template #tab>
              <div>
                <i class="xiv ilv"></i>
                {{ t('cs_helper.mode.free') }}
              </div>
            </template>
            <div>
              <n-tabs v-model:value="workState.free.job" type="line" animated style="--n-tab-gap: 24px;">
                <n-tab-pane
                  v-for="group in pageData.freeItemGroups"
                  :key="'cshelper-group-job-' + group.job.job_id"
                  :name="group.job.job_id"
                  :disabled="!group.totalCount"
                >
                  <template #tab>
                    <div class="flex items-center gap-0.5">
                      <XivFARImage
                        :size="14"
                        :src="group.job.job_icon_url"
                      />
                      <div>{{ group.job[`job_name_${uiLanguage}`] }}</div>
                    </div>
                  </template>

                  <div class="item-selection-container">
                    <n-card size="small" :class="store.userConfig.custom_background ? 'glasscard smallcard' : ''">
                      <template #header>
                        <div class="card-title">
                          <span class="title">{{ t('cs_helper.group.lv91_100') }}</span>
                        </div>
                      </template>
                      
                      <div class="item-btn-container">
                        <ItemStepper
                          class="item"
                          v-for="(item, index) in group.group1Items"
                          :key="`item-${index}`"
                          :item-info="getItemInfo(item)"
                          v-model:value="workState.free.itemSelected[item]"
                        />
                      </div>
                    </n-card>
                    <n-card size="small" :class="store.userConfig.custom_background ? 'glasscard smallcard' : ''">
                      <template #header>
                        <div class="card-title">
                          <span class="title">{{ t('cs_helper.group.lv81_90') }}</span>
                        </div>
                      </template>
                      
                      <div class="item-btn-container">
                        <ItemStepper
                          class="item"
                          v-for="(item, index) in group.group2Items"
                          :key="`item-${index}`"
                          :item-info="getItemInfo(item)"
                          v-model:value="workState.free.itemSelected[item]"
                        />
                      </div>
                    </n-card>
                  </div>

                  <div class="actions">
                    <TooltipButton
                      :icon="JoinLeftOutlined"
                      :text="t('workflow.text.join_in_workflow')"
                      :tip="t('workflow.text.join_selected_collectable_submissions_in_workflow')"
                      @click="handleJoinWorkflow"
                    />
                    <TooltipButton
                      :icon="DeleteSweepRound"
                      :text="t('common.clear')"
                      :tip="t('cs_helper.tooltip.clear_selected')"
                      @click="handleClearSelections"
                    />
                  </div>
                </n-tab-pane>
              </n-tabs>
            </div>
          </n-tab-pane>
        </n-tabs>

        
      </FoldableCard>
    </div>
  </div>
</template>

<style scoped>
/* All */
.panel-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.item-selection-container {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .target-card-container,
  .item-btn-container {
    display: flex;
    flex-direction: column;
  }
  .target-card-container {
    padding: 0 18px 12px;

    .item {
      padding: 4px 6px;
      border-radius: 4px;
      transition: background-color 0.5s ease;
    }
    .item:hover {
      background-color: var(--color-background-hover);
    }
    .submission-reward-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 4lh;
    }
    .require-amount-container {
      position: relative;
      padding-top: 10px;
      .title {
        position: absolute;
        top: 4px; left: 4px;
      }
      .amount {
        text-align: right;
        .require-amount {
          font-size: 26px;
        }
      }
    }
  }
}
.actions {
  display: flex;
  justify-content: end;
  margin-top: 1em;
  gap: 5px;
}

/* PC only */
@media screen and (min-width: 768px) {
  .item-selection-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .item-btn-container {
      gap: 5px;
    }
  }
}

/* Mobile only */
@media screen and (max-width: 767px) {
  .item-selection-container {
    display: flex;
    flex-direction: column;

    .item-btn-container {
      gap: 10px;
    }
  }
}
</style>