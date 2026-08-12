<script setup lang="ts">
import {
  SaveOutlined,
  SettingsSharp,
} from '@vicons/material'
import HelpButton from '@/components/ui/HelpButton.vue'
import DraggableTable from '@/components/ui/DraggableTable.vue'
import { useLocale } from '@/composables/useLocale'
import { _VAR_MAX_WORKFLOW, getDefaultWorkflow, type Workflow } from '@/types/workstate/workflow.ts'

const { t } = useLocale()
const NAIVE_UI_MESSAGE = useMessage()

const showModal = defineModel<boolean>('show', { required: true })
const workflows = defineModel<Workflow[]>('workflows', { required: true })
const emits = defineEmits(['afterSave'])

const workflowsTable = ref<any>()

const handleSave = () => {
  if (!workflowsTable.value?.handleSave) {
    NAIVE_UI_MESSAGE.error('Unexpected error: workflowsTable not defined')
    return
  }
  const saveSuccess = workflowsTable.value.handleSave()
  if (!saveSuccess) {
    return
  }
  showModal.value = false
  NAIVE_UI_MESSAGE.success(t('common.save_succeed'))
  emits('afterSave')
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="SettingsSharp"
    :title="t('workflow.text.manage_workflows')"
    max-width="600px"
  >
    <div class="wrapper">
      <p>{{ t('workflow.text.manage_workflows_desc') }}</p>
      <DraggableTable
        v-model:data="workflows"
        ref="workflowsTable"
        can-add
        :min="1"
        :min-tip="t('workflow.text.min_len')"
        :max="_VAR_MAX_WORKFLOW"
        :max-tip="t('workflow.message.max_len', _VAR_MAX_WORKFLOW)"
        :get-default-data-row="getDefaultWorkflow"
      >
        <template #tableTitle>
          <div class="flex items-center">
            <div class="font-bold">{{ t('workflow.text.workflow_name') }}</div>
            <div>
              <HelpButton
                icon="question"
                :descriptions="[
                  t('workflow.text.workflow_name_default_info', _VAR_MAX_WORKFLOW),
                  t('workflow.text.workflow_name_reorder_on_deleted')
                ]"
              />
            </div>
          </div>
        </template>

        <template #default="{ row, rowIndex }">
          <n-input v-model:value="row.name" type="text" :placeholder="t('workflow.text.workflow_with_index', rowIndex + 1)" />
        </template>
      </DraggableTable>
      <p>{{ t('common.all_changes_effects_after_save') }}</p>
    </div>

    <template #action>
      <div class="app-modal-footer">
        <n-button type="primary" size="large" @click="handleSave">
          <template #icon>
            <n-icon><SaveOutlined /></n-icon>
          </template>
          {{ t('common.save') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
.wrapper {
  line-height: 1.2;
}
</style>