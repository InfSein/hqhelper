<script setup lang="ts">
import {
  DeleteSweepRound,
  JoinLeftOutlined,
} from '@vicons/material'
import XivFARImage from '@/components/ui/XivFARImage.vue'
import ItemStepper from '@/components/item/ItemStepper.vue'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { XivUnpackedFashionClothes } from '@/assets/data'
import { getItemInfo } from '@/tools/item'

const store = useStore()
const { t } = useLocale()

const patchModel = defineModel<string>('patch', { required: true })
const itemSelected = defineModel<Record<number, number>>('itemSelected', { required: true })

const emits = defineEmits(['joinWorkflow'])

const handleClearSelections = () => {
  for (const id in itemSelected.value) {
    itemSelected.value[id] = 0
  }
}

const handleJoinWorkflow = () => {
  emits('joinWorkflow')
}
</script>

<template>
  <div>
    <FoldableCard card-key="ft-item-selection">
      <template #header>
        <i class="xiv square-1"></i>
        <span class="card-title__text">{{ t('fchelper.select_fashion_cloth') }}</span>
      </template>

      <n-tabs v-model:value="patchModel" type="line" animated>
        <n-tab-pane
          v-for="(items, patch) in XivUnpackedFashionClothes"
          :key="'FashionClothes-' + patch"
          :name="patch"
          :tab="t('common.patch_x', patch)"
          :disabled="!items.length"
        >
          <div class="item-selection-container">
            <n-card size="small" :class="store.userConfig.custom_background ? 'glasscard smallcard' : ''">
              <template #header>
                <div class="card-title">
                  <XivFARImage
                    :size="16"
                    src="./image/game-job/companion/weaver.png"
                  />
                  <span class="title">{{ t('common.fashion_cloth') }}</span>
                </div>
              </template>
              
              <div class="item-btn-container">
                <ItemStepper
                  class="item"
                  v-for="(item, index) in items"
                  :key="`item-${patch}-${index}`"
                  :item-info="getItemInfo(item)"
                  v-model:value="itemSelected[item]"
                />
              </div>
            </n-card>
          </div>
        </n-tab-pane>
      </n-tabs>

      <div class="actions">
        <TooltipButton
          :icon="JoinLeftOutlined"
          :text="t('workflow.text.join_in_workflow')"
          :tip="t('workflow.text.join_selected_fashion_clothes_in_workflow')"
          @click="handleJoinWorkflow"
        />
        <TooltipButton
          :icon="DeleteSweepRound"
          :text="t('common.clear')"
          :tip="t('fc_helper.tooltip.clear_selected')"
          @click="handleClearSelections"
        />
      </div>
      
    </FoldableCard>
  </div>
</template>

<style scoped>
/* All */
.item-selection-container {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .item-btn-container {
    display: flex;
    flex-direction: column;
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