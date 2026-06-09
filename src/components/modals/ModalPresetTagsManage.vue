<script setup lang="ts">
import { 
  SettingsSharp,
  SaveOutlined
} from '@vicons/material'
import DraggableTable from '../custom/general/DraggableTable.vue'
import { useStore } from '@/store'
import { _VAR_PRESET_TAG_MAXAMOUNT } from '@/models/macromanage'
import type { UserConfigModel } from '@/models/config-user'
import { deepCopy } from '@/tools'

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()

const t = inject<(message: string, args?: any) => string>('t')!
// const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)
const userConfig = inject<Ref<UserConfigModel>>('userConfig')!
const appForceUpdate = inject<() => {}>('appForceUpdate') ?? (() => {})

const showModal = defineModel<boolean>('show', { required: true })

const tags = ref<string[]>([])
const dataTable = ref<any>()

const onLoad = () => {
  tags.value = userConfig.value.macromanage_cache_work_state.presetTags ?? []
}

const handleCheck = (new_data: string[]) => {
  if (new_data.some(dr => !dr)) {
    return t('macro_manage.message.cannot_set_empty_tag')
  }
  return ''
}
const handleSave = () => {
  if (!dataTable.value?.handleSave) {
    NAIVE_UI_MESSAGE.error('Unexpected error: dataTable not defined')
    return
  }
  const saveSuccess = dataTable.value.handleSave()
  if (!saveSuccess) {
    return
  }
  const newUserConfig = deepCopy(userConfig.value)
  newUserConfig.macromanage_cache_work_state.presetTags = tags.value
  store.setUserConfig(newUserConfig)
  appForceUpdate()
  showModal.value = false
  NAIVE_UI_MESSAGE.success(t('common.save_succeed'))
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="SettingsSharp"
    :title="t('macro_manage.text.preset_tags_manage')"
    max-width="600px"
    @on-load="onLoad"
  >
    <div class="wrapper">
      <DraggableTable
        v-model:data="tags"
        ref="dataTable"
        can-add
        :max="_VAR_PRESET_TAG_MAXAMOUNT"
        :max-tip="t('macro_manage.message.preset_tag_max_len', _VAR_PRESET_TAG_MAXAMOUNT)"
        :get-default-data-row="() => ''"
        :check-rows-before-save="handleCheck"
      >
        <template #tableTitle>
          <div class="font-bold">{{ t('macro_manage.text.tag_name') }}</div>
        </template>
      </DraggableTable>
      <p>{{ t('common.all_changes_effects_after_save') }}</p>
    </div>

    <template #action>
      <div class="modal-submit-container">
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