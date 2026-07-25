<script setup lang="ts">
import {
  type UploadFileInfo,
} from 'naive-ui'
import {
  ArchiveOutlined,
  ArchiveSharp,
  DoneOutlined,
  ImportExportOutlined,
  UnarchiveSharp,
} from '@vicons/material'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/composables/useLocale'
import useMacroHelper from '@/views/macro-manage/composables/useMacroHelper'
import { type RecordedCraftMacro } from '@/types/workstate/macromanage'

const { t } = useLocale()
const { confirm } = useDialog()
const NAIVE_UI_MESSAGE = useMessage()
const {
  exportRecordedMacros, importRecordedMacros,
} = useMacroHelper()

const showModal = defineModel<boolean>('show', { required: true })
const recordedMacros = defineModel<RecordedCraftMacro[]>('recordedMacros', { required: true })

const onLoad = () => {
  currTab.value = props.mode
}

interface ModalImExportCraftMacroProps {
  mode: "export" | "import"
}
const props = defineProps<ModalImExportCraftMacroProps>()

const currTab = ref('export')
const fileName = ref('')
const exporting = ref(false)
const fileList = ref<UploadFileInfo[]>([])

const handleExport = async () => {
  exporting.value = true
  try {
    exportRecordedMacros(
      recordedMacros.value,
      fileName.value ? fileName.value + '.json' : undefined
    )
  } catch (err) {
    NAIVE_UI_MESSAGE.error(t('common.message.export_failed_with_error', err))
  }
  exporting.value = false
}

const handleImport = async (file: File) => {
  try {
    const response = await importRecordedMacros(file)

    const confirmTips = [
      t('macro_manage.message.readed_num_macros_from_file', response.length),
      t('macro_manage.message.confirm_import'),
    ]
    if (recordedMacros.value.length) {
      confirmTips.push(t('macro_manage.message.warn_saved_macros_would_be_dropped', recordedMacros.value.length))
    }

    if (await confirm(confirmTips.join('\n'))) {
      recordedMacros.value = response
      showModal.value = false
    }
  } catch (err: any) {
    console.error('import failed:\n', err)
    NAIVE_UI_MESSAGE.error(t('common.message.import_failed_with_error', err.message))
  }
}

const handleBeforeUpload = async ({ file }: { file: UploadFileInfo }) => {
  if (!file.name.endsWith('.json')) {
    NAIVE_UI_MESSAGE.error(t('macro_manage.message.only_json_can_be_imported'))
    return false
  }
  if (file.file) {
    await handleImport(file.file)
  } else {
    NAIVE_UI_MESSAGE.error(t('main.imexport.no_file_received'))
  }
  fileList.value = [] // 清空文件列表，允许再次上传
  return false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="ImportExportOutlined"
    :title="t('macro_manage.imexport.title')"
    max-width="500px"
    @on-load="onLoad"
  >
    <n-tabs type="segment" animated v-model:value="currTab">
      <n-tab-pane name="export">
        <template #tab>
          <n-icon><UnarchiveSharp /></n-icon>
          {{ t('common.export') }}
        </template>
        <div class="pane-container export-panel">
          <GroupBox id="gbx-file-name" :title="t('common.file_name')">
            <n-input v-model:value="fileName" maxlength="100" :placeholder="t('common.will_be_named_with_time_when_empty')">
              <template #suffix>.json</template>
            </n-input>
          </GroupBox>
          <GroupBox id="gbx-cautions" :title="t('common.cautions')">
            <ul>
              <li>{{ t('macro_manage.imexport.desc.desc_1') }}</li>
              <li>{{ t('macro_manage.imexport.desc.desc_2') }}</li>
            </ul>
          </GroupBox>
          <div class="submit-bar">
            <n-button type="primary" :disabled="exporting" :loading="exporting" @click="handleExport">
              <template #icon>
                <n-icon><DoneOutlined /></n-icon>
              </template>
              {{ t('common.confirm') }}
            </n-button>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="import">
        <template #tab>
          <n-icon><ArchiveSharp /></n-icon>
          {{ t('common.import') }}
        </template>
        <div class="pane-container import-panel">
          <n-upload
            accept=".json"
            :max="1"
            :show-file-list="true"
            :file-list="fileList"
            @before-upload="handleBeforeUpload"
          >
            <n-upload-dragger>
              <div style="margin-bottom: 12px">
                <n-icon size="48" :depth="3">
                  <ArchiveOutlined />
                </n-icon>
              </div>
              <n-text style="font-size: 16px">
                {{ t('common.click_or_drag_to_upload') }}
              </n-text>
              <n-p depth="3" style="margin: 8px 0 0">
                {{ t('macro_manage.imexport.desc.desc_3') }}
              </n-p>
            </n-upload-dragger>
          </n-upload>
        </div>
      </n-tab-pane>
    </n-tabs>

  </MyModal>
</template>

<style scoped>
:deep(.n-checkbox__label) {
  padding: 0 4px;
}
.pane-container {
  padding: 0 5px;
  height: 250px;

  ul {
    padding-left: 1.5em;
  }
}
.export-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;

  .submit-bar {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .pane-container {
    height: 250px;
  }
}
</style>