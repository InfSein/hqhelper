<script setup lang="ts">
import { 
  WaterDropOutlined,
  DoneOutlined,
} from '@vicons/material'
import { deepCopy } from '@/tools'
import useUiTools from '@/tools/ui'
import { useStore } from '@/store'
import { _VAR_MAX_WORKFLOW, getDefaultWorkflow } from '@/models/workflow'
import ItemSelectTable from '../custom/item/ItemSelectTable.vue'
import { fixUserConfig } from '@/types/config/user.ts'
import { fixFuncConfig, type WorkflowJoinMode } from '@/types/config/func.ts'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const { optionsRenderer } = useUiTools(isMobile)

const modalId = 'modal-join-in-workflow'

const showModal = defineModel<boolean>('show', { required: true })

interface ModalAddToWorkflowProps {
  items: Record<number, number>
}
const props = defineProps<ModalAddToWorkflowProps>()

const joinMode = ref<WorkflowJoinMode>('accumulation')
const itemsToAdd = ref<Record<number, number>>({})

const onLoad = () => {
  joinMode.value = store.funcConfig.workflow_default_join_mode
  itemsToAdd.value = deepCopy(props.items)
  targetWorkflow.value = workflowOptions.value[0].value
  workflowOptions.value.forEach(option => {
    if (option.value === store.funcConfig.workflow_default_join_target) {
      targetWorkflow.value = option.value
    }
  })
}

const targetWorkflow = ref<number | "add">(0)
const workflowOptions = computed(() => {
  const existedWorkflows : {
      label: string;
      value: number | "add";
      disabled?: boolean;
  }[] = store.userConfig.workflow_cache_work_state.workflows.map((workflow, flowIndex) => {
    return {
      label: workflow.name || t('workflow.text.workflow_with_index', flowIndex + 1),
      value: flowIndex
    }
  })
  existedWorkflows.push({
    label: t('workflow.shared.new_a_workflow'),
    value: 'add',
    disabled: existedWorkflows.length >= _VAR_MAX_WORKFLOW
  })
  return existedWorkflows
})
const joinModeMap = computed(() => {
  return {
    accumulation: {
      label: t('common.summation'),
      value: 'accumulation',
      description: t('workflow.join_in_workflow.desc.desc_3')
    },
    cover: {
      label: t('common.cover'),
      value: 'cover',
      description: t('workflow.join_in_workflow.desc.desc_4')
    },
    overwrite: {
      label: t('common.overwrite'),
      value: 'overwrite',
      description: t('workflow.join_in_workflow.desc.desc_5')
    },
  }
})
const joinModeOptions = computed(() => {
  return Object.values(joinModeMap.value)
})

const handleSubmit = () => {
  const newUserConfig = fixUserConfig(store.userConfig)
  const newFuncConfig = fixFuncConfig(store.funcConfig)
  if (targetWorkflow.value === 'add') {
    if (newUserConfig.workflow_cache_work_state.workflows.length >= _VAR_MAX_WORKFLOW) {
      NAIVE_UI_MESSAGE.warning(t('workflow.message.max_len', _VAR_MAX_WORKFLOW))
      return
    }
    const workflow = getDefaultWorkflow()
    workflow.targetItems = itemsToAdd.value
    newUserConfig.workflow_cache_work_state.workflows.push(workflow)
    newFuncConfig.workflow_default_join_target = newUserConfig.workflow_cache_work_state.workflows.length - 1
  } else {
    let workflow = newUserConfig.workflow_cache_work_state.workflows[targetWorkflow.value]
    if (joinMode.value === 'overwrite') {
      const name = workflow.name
      workflow = getDefaultWorkflow()
      workflow.name = name
      workflow.targetItems = itemsToAdd.value
    } else {
      for (const _id in itemsToAdd.value) {
        const id = Number(_id); const amount = itemsToAdd.value[id]
        if (joinMode.value === 'accumulation' && workflow.targetItems[id]) {
          workflow.targetItems[id] += amount
        } else {
          workflow.targetItems[id] = amount
        }
      }
    }
    newUserConfig.workflow_cache_work_state.workflows[targetWorkflow.value] = workflow
    newFuncConfig.workflow_default_join_target = targetWorkflow.value
  }
  store.setUserConfig(newUserConfig)
  if (joinMode.value !== store.funcConfig.workflow_default_join_mode) {
    newFuncConfig.workflow_default_join_mode = joinMode.value
  }
  store.setFuncConfig(newFuncConfig)
  NAIVE_UI_MESSAGE.success(t('workflow.join_in_workflow.message.join_succeed'))
  showModal.value = false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :id="modalId"
    :icon="WaterDropOutlined"
    :title="t('workflow.join_in_workflow.title')"
    max-width="500px"
    @on-load="onLoad"
  >
    <div class="wrapper" ref="wrapper">
      <GroupBox id="atw-header">
        <template #title>
          <span class="title">{{ t('common.options') }}</span>
        </template>
        <div class="options-container">
          <CompactForm>
            <CompactFormItem :label="t('common.target')">
              <n-select v-model:value="targetWorkflow" :options="workflowOptions" :placeholder="t('workflow.join_in_workflow.desc.desc_1')" />
            </CompactFormItem>
            <CompactFormItem :label="t('common.mode')">
              <n-select v-model:value="joinMode" :options="joinModeOptions" :render-option="optionsRenderer" />
            </CompactFormItem>
          </CompactForm>
        </div>
      </GroupBox>
      <GroupBox id="atw-content">
        <template #title>
          <span class="title">{{ t('common.preview') }}</span>
        </template>
        <p>{{ t('workflow.join_in_workflow.desc.desc_2') }}</p>
        <p v-show="targetWorkflow !== 'add'">{{ joinModeMap[joinMode].description }}</p>
        <ItemSelectTable
          v-model:items="itemsToAdd"
          :show-item-details="false"
          content-height="300px"
          :container-id="modalId"
        />
      </GroupBox>
    </div>

    <template #action>
      <div class="modal-submit-container">
        <n-button type="primary" @click="handleSubmit">
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
/* All */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
  user-select: text;

  .options-container {
    display: flex;
    flex-direction: column;
  }
}

.theme-dark .options-container {
  gap: 1px;
}
</style>