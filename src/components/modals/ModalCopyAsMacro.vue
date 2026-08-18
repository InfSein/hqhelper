<script setup lang="ts">
import {
  CodeSharp,
  ContentCopyRound,
} from '@vicons/material'
import TooltipButton from '@/components/ui/TooltipButton.vue'
import MacroViewer from '@/components/craft/MacroViewer.vue'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import { CopyToClipboard } from '@/tools'
import type { MacroGenerateMode } from '@/types/config/func'

const store = useStore()
const { t } = useLocale()
const NAIVE_UI_MESSAGE = useMessage()

const showModal = defineModel<boolean>('show', { required: true })

interface ModalCopyAsMacroProps {
  macroMap: Record<MacroGenerateMode, string>;
}
const props = defineProps<ModalCopyAsMacroProps>()

const wrapper = ref<HTMLElement>()
const macroPrefix = ref('')
const macroMode = ref<MacroGenerateMode>('singleLine')
const noMoreInquiries = ref(false)

const prefixOptions = computed(() => {
  return [
    { value: '', label: t('preference.macro_copy_prefix.option.none') },
    { value: '/e ', label: t('preference.macro_copy_prefix.option.echo') },
    { value: '/p ', label: t('preference.macro_copy_prefix.option.party') },
    { value: '/fc ', label: t('preference.macro_copy_prefix.option.free_company') },
    { value: '/b ', label: t('preference.macro_copy_prefix.option.beginner') },
  ]
})
const modeOptions = computed(() => {
  return [
    { value: 'singleLine', label: t('preference.macro_generate_mode.option.single_line') },
    { value: 'multiLine', label: t('preference.macro_generate_mode.option.multi_line') },
  ]
})

const onLoad = () => {
  macroPrefix.value = store.funcConfig.macro_copy_prefix
  macroMode.value = store.funcConfig.macro_generate_mode
}

const macroContent = computed(() => {
  return props.macroMap[macroMode.value]
})
const macroLines = computed(() => {
  return macroContent.value.split('\r\n').map(line => macroPrefix.value + line)
})
const macro = computed(() => {
  return macroLines.value.join('\r\n')
})
const macroColor = computed(() => {
  switch (macroPrefix.value) {
    case '/e ': return '#7E7E7E' // 默语
    case '/p ': return '#69E6FF' // 小队
    case '/fc ': return '#ADDCE6' // 部队
    case '/b ': return '#ADD74A' // 新频
    default: return ''
  }
})
const macroContentStyle = computed(() => {
  const styles = [
    'max-height: 200px;',
    'overflow-y: auto;'
  ]
  if (macroColor.value) {
    styles.push(`color: ${macroColor.value};`)
  }

  return styles.join(' ')
})

const copyBtnTooltip = computed(() => {
  if (macroMode.value === 'singleLine') {
    return [
      t('copy_macro.mode.single_line.desc.desc_1'),
      t('copy_macro.mode.single_line.desc.desc_2'),
    ]
  } else {
    return [
      t('copy_macro.mode.multi_line.desc.desc_1'),
      t('copy_macro.mode.multi_line.desc.desc_2'),
    ]
  }
})
const handleCopy = async () => {
  const errored = await CopyToClipboard(macro.value, wrapper.value)
  if (errored) {
    NAIVE_UI_MESSAGE.error(t('copy_macro.message.failed'))
    return
  }
  if (noMoreInquiries.value) {
    store.funcConfig.macro_direct_copy = true
    store.funcConfig.macro_copy_prefix = macroPrefix.value
    store.funcConfig.macro_generate_mode = macroMode.value
    store.updateFuncConfig()
  }
  handleClose()
  NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
}
const handleClose = () => {
  showModal.value = false
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="CodeSharp"
    :title="t('common.appfunc.copy_macro')"
    max-width="350px"
    @on-load="onLoad"
  >
    <div class="wrapper" ref="wrapper">
      <GroupBox id="marco-preview" :content-style="macroContentStyle">
        <template #title>
          <span class="title">{{ t('common.preview') }}</span>
        </template>
        <div v-if="macroMode === 'singleLine'">{{ macro }}</div>
        <MacroViewer
          v-else
          :macro-lines="macroLines"
          hide-tabs
          hide-copy-button
        />
      </GroupBox>
      <GroupBox id="marco-settings">
        <template #title>
          <span class="title">{{ t('common.options') }}</span>
        </template>
        <div class="settings-container">
          <CompactForm size="small">
            <CompactFormItem :label="t('common.prefix')">
              <n-select
                v-model:value="macroPrefix"
                :options="prefixOptions"
                :placeholder="t('copy_macro.text.please_select_macro_prefix')"
              />
            </CompactFormItem>
            <CompactFormItem :label="t('common.mode')">
              <n-select
                v-model:value="macroMode"
                :options="modeOptions"
                :placeholder="t('copy_macro.text.please_select_macro_mode')"
              />
            </CompactFormItem>
          </CompactForm>
          <n-checkbox v-model:checked="noMoreInquiries">
            {{ t('copy_macro.option.macro_direct_copy') }}
          </n-checkbox>
        </div>
      </GroupBox>
    </div>

    <template #action>
      <div class="app-modal-footer">
        <TooltipButton
          type="primary"
          :icon="ContentCopyRound"
          :text="t('common.copy')"
          :tip="copyBtnTooltip"
          placement="bottom"
          @click="handleCopy"
        />
      </div>
    </template>

    <!-- <ModalPreferences
      v-model:show="showPreferencesModal"
      setting-group="copy_macro"
      app-show-fp
    /> -->
  </MyModal>
</template>

<style scoped>
:deep(.n-card-header) {
  padding-bottom: 10px;
}
:deep(.n-card__action) {
  padding-top: 15px;
  padding-bottom: 15px;
}

/* All */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
  user-select: text;

  #marco-preview {
    .group-box-content {
      max-height: 300px;
      overflow-y: auto;
    }
  }
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
}

/* Mobile only */
/* @media (max-width: 768px)*/
</style>