<script setup lang="ts">
import {
  type UploadFileInfo,
} from 'naive-ui'
import { 
  ImportExportOutlined,
  ArchiveSharp, UnarchiveSharp,
  DoneOutlined,
  ArchiveOutlined,
} from '@vicons/material'
import HelpButton from '@/components/ui/HelpButton.vue'
import ModalConfirmImportMain from './ModalConfirmImportMain.vue'
import { useStore } from '@/store'
import type { GearSelections } from '@/types/game/gear'
import { useFufuCal } from '@/tools/use-fufu-cal'
import { export2Excel, importExcel } from '@/tools/excel'
import type { ItemInfo } from '@/tools/item'
import type { ItemPriceInfo } from '@/types/item/price.ts'
import { XivPatchVers, type XivPatchVer } from '@/assets/data'

import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()
const updateItemPrices = inject<() => Promise<void>>('updateItemPrices')!

const store = useStore()
const NAIVE_UI_MESSAGE = useMessage()
const { getStatementData } = useFufuCal()

const showModal = defineModel<boolean>('show', { required: true })
const onLoad = () => {
  exportItemPrices.value = store.funcConfig.export_item_price
}

interface ModalImportExportMainProps {
  gearSelections: GearSelections | undefined,
  statistics: any,
  tomeScriptItems: Record<number, ItemInfo[]>,
  normalGathering: ItemInfo[],
  limitedGathering: ItemInfo[],
  aethersands: ItemInfo[],
  crystals: ItemInfo[],
  ui_lang: 'zh' | 'ja' | 'en',
  item_lang: 'zh' | 'ja' | 'en',
  patchSelected: XivPatchVer | undefined
}
const props = defineProps<ModalImportExportMainProps>()

const fileName = ref('')
const exportItemPrices = ref(false)
const exporting = ref(false)
const fileList = ref<UploadFileInfo[]>([])
const showConfirmImportModal = ref(false)
const importGearSelections = ref<GearSelections>()

watch(exportItemPrices, async(newVal, oldVal) => {
  if (newVal !== oldVal) {
    store.funcConfig.export_item_price = newVal
    store.updateFuncConfig()
  }
})

const defaultPatch = computed(() => {
  if (props.patchSelected) {
    return props.patchSelected
  }
  return XivPatchVers[0]
})

const handleExportExcel = async () => {
  if (!props.gearSelections) {
    NAIVE_UI_MESSAGE.error(t('statistics.message.select_patch_and_job_first'))
    return
  }
  exporting.value = true
  let item_price_map : Record<number, ItemPriceInfo> | undefined = undefined
  if (exportItemPrices.value) {
    await updateItemPrices()
    item_price_map = store.funcConfig.cache_item_prices
  }
  export2Excel(
    props.gearSelections,
    props.statistics,
    props.tomeScriptItems,
    props.normalGathering,
    props.limitedGathering,
    props.aethersands,
    props.crystals,
    props.ui_lang,
    props.item_lang,
    t,
    getStatementData,
    fileName.value ? fileName.value + '.xlsx' : undefined,
    item_price_map,
    store.funcConfig.universalis_priceType
  )
  exporting.value = false
}

const handleExcel = async (file: File) => {
  const response = await importExcel(file)
  importGearSelections.value = response
  showConfirmImportModal.value = true
}

const handleBeforeUpload = async ({ file }: { file: UploadFileInfo }) => {
  if (!file.name.endsWith('.xlsx')) {
    NAIVE_UI_MESSAGE.error(t('main.imexport.only_xlsx_can_be_imported'))
    return false
  }
  if (file.file) {
    await handleExcel(file.file)
  } else {
    NAIVE_UI_MESSAGE.error(t('main.imexport.no_file_received'))
  }
  fileList.value = [] // 清空文件列表，允许再次上传
  return false
}

const onImportConfirmed = () => {
  showConfirmImportModal.value = false
  showModal.value = false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="ImportExportOutlined"
    :title="t('common.imexport')"
    max-width="500px"
    @on-load="onLoad"
  >
    <n-tabs type="segment" animated>
      <n-tab-pane name="export">
        <template #tab>
          <n-icon><UnarchiveSharp /></n-icon>
          {{ t('common.export_to_excel') }}
        </template>
        <div class="pane-container export-panel">
          <GroupBox id="gbx-file-name" :title="t('common.file_name')">
            <n-input v-model:value="fileName" maxlength="100" :placeholder="t('common.will_be_named_with_time_when_empty')">
              <template #suffix>.xlsx</template>
            </n-input>
          </GroupBox>
          <GroupBox :title="t('common.options')">
            <n-checkbox v-model:checked="exportItemPrices">
              <div class="flex items-center justify-center">
                <div>{{ t('main.imexport.export_cost_and_benefit') }}</div>
                <HelpButton
                  icon="question"
                  :descriptions="[
                    t('common.follow_preference_of_item_price'),
                    t('preference.export_item_price.desc.desc_1')
                  ]"
                />
              </div>
            </n-checkbox>
            <n-checkbox v-show="false">
              {{ t('main.imexport.open_folder_after_export') }}
            </n-checkbox>
          </GroupBox>
          <div class="submit-bar">
            <n-button type="primary" :disabled="exporting" :loading="exporting" @click="handleExportExcel">
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
          {{ t('common.import_from_excel') }}
        </template>
        <div class="pane-container import-panel">
          <n-upload
            accept=".xlsx"
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
                {{ t('main.imexport.need_to_ensure_first_worksheet') }}
              </n-p>
            </n-upload-dragger>
          </n-upload>
        </div>
      </n-tab-pane>
    </n-tabs>

    <ModalConfirmImportMain
      v-model:show="showConfirmImportModal"
      :gear-selections="importGearSelections"
      :default-patch="defaultPatch"
      @on-import-confirmed="onImportConfirmed"
    />
  </MyModal>
</template>

<style scoped>
:deep(.n-checkbox__label) {
  padding: 0 4px;
}
.pane-container {
  padding: 0 5px;
  height: 205px;
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
    height: 225px;
  }
}
</style>