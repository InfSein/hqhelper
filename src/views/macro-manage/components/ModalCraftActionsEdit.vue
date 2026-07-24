<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import {
  CloseRound,
  DoneOutlined,
  EditRound,
} from '@vicons/material'
import FoldableCard from '@/components/templates/FoldableCard.vue'
import CraftActionButton from '@/components/craft/CraftActionButton.vue'
import { useLocale } from '@/composables/useLocale'
import UseConfig from '@/composables/useConfig.ts'
import { useResponsive } from '@/composables/useResponsive'
import { XivCraftActions, XivCraftActionGroups, type XivCraftActionGroupKey } from '@/assets/data'
import { deepCopy } from '@/tools'

const { t } = useLocale()
const { isMobile } = useResponsive()

const {
  itemLanguage,
} = UseConfig()

const showModal = defineModel<boolean>('show', { required: true })

interface ModalCraftActionsEditProps {
  craftActions: { id: number; val: number }[]
}
const props = defineProps<ModalCraftActionsEditProps>()
const emits = defineEmits(['update:craftActions'])

// Local working copy - changes only committed on save
const localActions = ref<{ id: number; val: number }[]>([])
const localIdCounter = ref(0)

const onLoad = () => {
  localActions.value = deepCopy(props.craftActions)
  // Set ID counter to max existing ID + 1
  localIdCounter.value = localActions.value.reduce(
    (max, item) => Math.max(max, item.id),
    0
  ) + 1
}

const groupKeys = Object.keys(XivCraftActionGroups) as XivCraftActionGroupKey[]

const getGroupName = (key: XivCraftActionGroupKey) => {
  const group = XivCraftActionGroups[key]
  return group[`name_${itemLanguage.value}`]
}

const handleAddAction = (actionId: number) => {
  localActions.value.push({
    id: localIdCounter.value++,
    val: actionId,
  })
}

const handleRemoveAction = (index: number) => {
  localActions.value.splice(index, 1)
}

const handleSave = () => {
  emits('update:craftActions', deepCopy(localActions.value))
  showModal.value = false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="EditRound"
    :title="t('macro_manage.text.edit_actions')"
    max-width="850px"
    @on-load="onLoad"
  >
    <div class="edit-actions-wrapper" :class="{ 'is-mobile': isMobile }">
      <!-- Current actions -->
      <div class="edit-actions-panel current-panel">
        <FoldableCard
          unexpandable
          unfoldable
          card-key="modal_craft_actions_edit:current_panel"
          size="small"
          :title="t('common.current')"
          class="h-full"
        >
          <n-scrollbar trigger="none">
            <VueDraggable
              v-if="localActions.length"
              v-model="localActions"
              :animation="150"
              class="actions-grid"
            >
              <div
                v-for="(item, index) in localActions"
                :key="item.id"
                class="action-item-wrapper"
              >
                <CraftActionButton
                  :craft-action="XivCraftActions[item.val]"
                  :btn-size="42"
                  pop-trigger="manual"
                />
                <n-button
                  class="remove-btn"
                  circle
                  size="tiny"
                  type="error"
                  :title="t('macro_manage.text.remove_action')"
                  @click.stop="handleRemoveAction(index)"
                >
                  <template #icon>
                    <n-icon :size="12"><CloseRound /></n-icon>
                  </template>
                </n-button>
              </div>
            </VueDraggable>
            <n-empty
              v-else
              size="small"
              :show-icon="false"
              :description="t('macro_manage.text.no_macro_content_set')"
              class="flex justify-center"
              style="height: 46px;"
            />
          </n-scrollbar>
        </FoldableCard>
      </div>

      <!-- Skill palette grouped -->
      <div class="edit-actions-panel palette-panel">
        <FoldableCard
          unexpandable
          unfoldable
          card-key="modal_craft_actions_edit:palette_panel"
          size="small"
          :title="t('macro_manage.text.add_action')"
          class="h-full flex"
        >
          <n-scrollbar trigger="none">
            <div class="action-groups-wrapper">
              <GroupBox v-for="groupKey in groupKeys" :key="groupKey" tiny :title="getGroupName(groupKey)">
                <div class="actions-grid palette-grid">
                  <div
                    v-for="actionId in XivCraftActionGroups[groupKey].actions"
                    :key="actionId"
                    style="line-height: 1;"
                  >
                    <CraftActionButton
                      :craft-action="XivCraftActions[actionId]"
                      :btn-size="42"
                      @click="handleAddAction(actionId)"
                    />
                  </div>
                </div>
              </GroupBox>
            </div>
          </n-scrollbar>
        </FoldableCard>
      </div>
    </div>

    <template #action>
      <div class="modal-submit-container">
        <n-button type="primary" @click="handleSave">
          <template #icon>
            <n-icon><DoneOutlined /></n-icon>
          </template>
          {{ t('common.confirm') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
.edit-actions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;

  .edit-actions-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .panel-header {
      margin-bottom: 6px;

      .panel-title {
        font-weight: bold;
        margin-right: 6px;
      }
      .panel-tip {
        font-size: calc(var(--n-font-size) - 2px);
        opacity: 0.7;
      }
    }
  }
  .action-groups-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 6px;
    margin-top: 8px;
  }
}

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.action-item-wrapper {
  position: relative;
  line-height: 1;

  .remove-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    z-index: 1;
    width: 18px !important;
    height: 18px !important;
    min-width: 18px;
    padding: 0;
  }
}

.palette-grid {
  padding: 2px 0;
}
</style>
