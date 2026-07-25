<script setup lang="ts">
import CraftStatistics from '@/components/craft/CraftStatistics.vue'
import ModalProStatements from '@/components/modals/ModalProStatements.vue'
import ModalCostAndBenefit from '@/components/modals/ModalCostAndBenefit.vue'
import ModalCraftStatements from '@/components/modals/ModalCraftStatements.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { useCostAndBenefit } from '@/composables/useCostAndBenefit'
import { useFufuCal } from '@/tools/use-fufu-cal'

const store = useStore()
const { t } = useLocale()
const { getStatementData } = useFufuCal()

interface StatisticsPanelProps {
  itemSelected: Record<number, number>
  statistics: any
}
const props = defineProps<StatisticsPanelProps>()

const hidePrecraftMaterials = defineModel<boolean | undefined>('hidePrecraftMaterials', { required: true })

const showStatementModal = ref(false)
const showProStatementModal = ref(false)
const showStatement = () => {
  if (store.funcConfig.use_traditional_statement) {
    showStatementModal.value = true
  } else {
    showProStatementModal.value = true
  }
}
const statementData = computed(() => {
  return getStatementData(props.statistics)
})

const {
  showModal: showCostAndBenefitModal,
  updatingPrice,
  openModal: handleAnalysisItemPrices,
} = useCostAndBenefit(statementData)
</script>

<template>
  <div>
    <FoldableCard card-key="ft-statistics">
      <template #header>
        <i class="xiv square-2"></i>
        <span class="card-title-text">{{ t('statistics.view_statistics') }}</span>
        <a class="card-title-extra" href="javascript:void(0);" @click="showStatement">{{ t('common.mquoted_view_statement') }}</a>
        <a class="card-title-extra" href="javascript:void(0);" :disabled="updatingPrice" :style="updatingPrice ? 'cursor: not-allowed; color: gray;' : 'cursor: pointer;'" @click="handleAnalysisItemPrices">[{{ updatingPrice ? t('common.loading') : t('statistics.group.cost_and_benefit.title') }}]</a>
      </template>

      <div class="pre">
        <div class="preset-item">
          <n-switch v-model:value="hidePrecraftMaterials" :round="false" size="small" />
          <div>{{ t('statistics.preference.show_direct_materials_only') }}</div>
        </div>
      </div>
      <CraftStatistics
        :item-selected="itemSelected"
        :hide-precraft-materials="hidePrecraftMaterials"
      />
      
      <ModalCraftStatements
        v-model:show="showStatementModal"
        v-bind="statementData"
      />
      <ModalProStatements
        v-model:show="showProStatementModal"
        v-bind="statementData"
      />
      <ModalCostAndBenefit
        v-model:show="showCostAndBenefitModal"
        :cost-items="statementData.materialsLvBase"
        :benefit-items="statementData.craftTargets"
      />
    </FoldableCard>
  </div>
</template>

<style scoped>
.pre {
  margin-bottom: 15px;

  .preset-item {
    width: fit-content;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px;
    border: 1px solid var(--n-color-target);
    border-radius: var(--n-border-radius);
  }
}
</style>