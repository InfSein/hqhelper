<script setup lang="ts">
import {
  ArchiveSharp,
  ContentCopyRound,
  FileDownloadOutlined,
  UnarchiveSharp,
} from '@vicons/material'
import { useLocale } from '@/composables/useLocale'
import { CopyToClipboard, deepCopy } from '@/tools'
import { exportPreferences, importPreferences } from '@/tools/preferences'
import { fixFuncConfig, type FuncConfigModel } from '@/types/config/func'
import { fixUserConfig, type UserConfigModel } from '@/types/config/user'

const NAIVE_UI_MESSAGE = useMessage()


const { t } = useLocale()

const showModal = defineModel<boolean>('show', { required: true })
const userConfigModel = defineModel<UserConfigModel>('userConfig', { required: true })
const funcConfigModel = defineModel<FuncConfigModel>('funcConfig', { required: true })
interface ModalPreferencesImportExportProps {
  action: "import" | "export"
}
const props = defineProps<ModalPreferencesImportExportProps>()

const wrapper = ref<HTMLElement>()
const importContent = ref('')

const onLoad = () => {
}

const modalTitle = computed(() => {
  let icon = ArchiveSharp
  let text = t('preference.import.title')
  if (props.action === 'export') {
    icon = UnarchiveSharp
    text = t('preference.export.title')
  }
  return { icon, text }
})
const exportContent = computed(() => {
  return exportPreferences(userConfigModel.value, funcConfigModel.value)
})

const handleClose = () => {
  showModal.value = false
}
const handleCopy = async () => {
  const errored = await CopyToClipboard(exportContent.value, wrapper.value)
  if (errored) {
    NAIVE_UI_MESSAGE.error(t('copy_macro.message.failed'))
    return
  }
  handleClose()
  NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
}
const handleImport = () => {
  if (!importContent.value.length) {
    NAIVE_UI_MESSAGE.error(t('preference.import.message.input_empty')); return
  }
  try {
    const { u, f } = importPreferences(importContent.value)
    const oldu = deepCopy(userConfigModel.value)
    const oldf = deepCopy(funcConfigModel.value)
    // 处理一些导入不会有的缓存，这些仍旧使用旧设置
    u.hqwb_cache_work_state = oldu.hqwb_cache_work_state
    u.mmhelper_cache_work_state = oldu.mmhelper_cache_work_state
    u.gatherclock_cache_work_state = oldu.gatherclock_cache_work_state
    if (f.universalis_server === oldf.universalis_server) {
      f.cache_item_prices = oldf.cache_item_prices
    }
    userConfigModel.value = fixUserConfig(u)
    funcConfigModel.value = fixFuncConfig(f)
    handleClose()
    NAIVE_UI_MESSAGE.success(t('common.message.import_succeed'))
  } catch (e) {
    console.error(e)
    NAIVE_UI_MESSAGE.error(t('common.message.import_failed'))
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="modalTitle.icon"
    :title="modalTitle.text"
    max-width="400px"
    @on-load="onLoad"
  >
    <div class="wrapper" ref="wrapper">
      <div class="desc">
        <p v-if="action === 'export'">{{ t('preference.export.desc.desc_1') }}</p>
        <p v-if="action === 'export'">{{ t('preference.export.desc.desc_2') }}</p>
        <p v-if="action === 'import'">{{ t('preference.import.desc.desc_1') }}</p>
        <p v-if="action === 'import'">{{ t('preference.import.desc.desc_2') }}</p>
      </div>
      <div class="content">
        <n-input
          v-if="action === 'export'"
          :value="exportContent"
          type="textarea"
          readonly
        />
        <n-input
          v-if="action === 'import'"
          v-model:value="importContent"
          type="textarea"
          :placeholder="t('preference.import.placeholder')"
        />
      </div>
    </div>

    <template #action>
      <div class="modal-submit-container">
        <n-button v-if="action === 'export'" type="primary" @click="handleCopy">
          <template #icon>
            <n-icon><ContentCopyRound /></n-icon>
          </template>
          {{ t('common.copy') }}
        </n-button>
        <n-button v-if="action === 'import'" type="primary" @click="handleImport">
          <template #icon>
            <n-icon><FileDownloadOutlined /></n-icon>
          </template>
          {{ t('common.import') }}
        </n-button>
      </div>
    </template>
  </MyModal>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;
  user-select: text;

  .desc {
    line-height: 1.2;
  }
}
</style>