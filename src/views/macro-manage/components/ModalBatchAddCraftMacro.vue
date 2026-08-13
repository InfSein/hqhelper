<script setup lang="ts">
import {
  type DataTableColumns,
} from 'naive-ui'
import {
  CodeSharp,
  ContentPasteSearchOutlined,
  DoneOutlined,
} from '@vicons/material'
import HelpButton from '@/components/ui/HelpButton.vue'
import CraftActionButton from '@/components/craft/CraftActionButton.vue'
import { decompress } from 'xiv-cac-utils'
import { useLocale } from '@/composables/useLocale'
import { useDialog } from '@/composables/useDialog'
import { XivCraftActions } from '@/assets/data'
import {
  _VAR_MACRO_MAXAMOUNT,
  getDefaultCraftMacro, prepareMacroForSave,
  type RecordedCraftMacro
} from '@/types/workstate/macromanage'

const { t } = useLocale()
const { alertError } = useDialog()

const showModal = defineModel<boolean>('show', { required: true })

interface ModalBatchAddProps {
  currentMacroCount: number
  nextRecordIndex: number
}
const props = defineProps<ModalBatchAddProps>()
const emits = defineEmits(['onSubmit'])

const NAIVE_UI_MESSAGE = useMessage()

const inputText = ref('')
const showPreviewModal = ref(false)

interface ParsedMacroEntry {
  id: number
  name: string
  craftActions: number[]
  requirements: {
    craftsmanship: number
    control: number
    cp: number
  }
}
const parsedMacros = ref<ParsedMacroEntry[]>([])

/**
 * 解析三维要求字符串。
 * 格式：制作精度/加工精度/制作力，允许省略没有要求的部分。
 * 示例：
 *   1256/425/956 → { craftsmanship: 1256, control: 425, cp: 956 }
 *   1256/425     → { craftsmanship: 1256, control: 425, cp: 0 }
 *   /2655        → { craftsmanship: 0, control: 2655, cp: 0 }
 *   //956        → { craftsmanship: 0, control: 0, cp: 956 }
 */
const parseRequirements = (reqStr: string) => {
  const parts = reqStr.split('/')
  return {
    craftsmanship: parseInt(parts[0]) || 0,
    control: parseInt(parts[1]) || 0,
    cp: parseInt(parts[2]) || 0,
  }
}

const handleRecognize = () => {
  const text = inputText.value.trim()
  if (!text) {
    NAIVE_UI_MESSAGE.error(t('macro_manage.text.please_input_content_to_import'))
    return
  }

  const lines = text.split('\n')
  const results: ParsedMacroEntry[] = []
  const errors: string[] = []
  let idCounter = props.nextRecordIndex

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // 跳过空白行

    const lineNum = i + 1
    try {
      // 按空格分割：CAC工序码 [宏名称] [三维要求]
      const parts = line.split(/\s+/)
      const cacCode = parts[0]

      // 解析 CAC 工序码
      const actions = decompress(cacCode)
      if (!actions || !actions.length) {
        throw new Error(t('macro_manage.message.no_actions_recognized'))
      }

      let requirements = { craftsmanship: 0, control: 0, cp: 0 }
      if (parts.length >= 3 && parts[2].includes('/')) {
        requirements = parseRequirements(parts[2])
      }

      results.push({
        id: idCounter++,
        name: parts[1] || '',
        craftActions: actions.map(a => a.ids[0]),
        requirements,
      })
    } catch (e: any) {
      errors.push(t('macro_manage.message.batch_add_line_error', {
        line: lineNum,
        error: e.message || String(e),
      }))
    }
  }

  if (errors.length) {
    alertError(errors.join('\n'))
    return
  }

  if (!results.length) {
    NAIVE_UI_MESSAGE.error(t('macro_manage.text.please_input_content_to_import'))
    return
  }

  // 检查数量限制
  const totalCount = props.currentMacroCount + results.length
  if (totalCount > _VAR_MACRO_MAXAMOUNT) {
    NAIVE_UI_MESSAGE.error(t('macro_manage.message.batch_add_will_exceed_limit', {
      count: results.length,
      limit: _VAR_MACRO_MAXAMOUNT,
      current: props.currentMacroCount,
    }))
    return
  }

  parsedMacros.value = results
  showPreviewModal.value = true
}

const previewColumns = computed((): DataTableColumns<ParsedMacroEntry> => {
  return [
    {
      title: t('macro_manage.text.macro_name'),
      key: 'name',
      width: 150,
      render(row) {
        return h(NInput, {
          value: row.name,
          maxlength: 20,
          placeholder: t('common.id_macro', row.id),
          onUpdateValue: (val: string) => { row.name = val },
        })
      },
    },
    {
      title: t('common.content'),
      key: 'content',
      width: 60,
      render(row) {
        return h('div', { class: 'flex items-center gap-0.5' }, [
          h('span', null, getActionsSummary(row.craftActions)),
          h(HelpButton, {
            popType: 'popover',
            placement: 'right-start',
            size: 18,
          }, {
            default: () => h(NScrollbar, { style: 'max-height: 400px;' }, {
              default: () => h('div', { class: 'flex flex-wrap gap-0.5 max-w-62.5' }, 
                row.craftActions.map((actionId, index) => {
                  const action = XivCraftActions[actionId]
                  return h(CraftActionButton, {
                    key: index,
                    craftAction: action,
                    btnSize: 34,
                  })
                })
              )
            })
          })
        ])
      },
    },
    {
      title: t('macro_manage.text.batch_add_creqs'),
      key: 'requirements',
      width: 180,
      align: 'center',
      render(row) {
        return h(NInputGroup, null, {
          default: () => [
            h(NInputNumber, {
              value: row.requirements.craftsmanship,
              precision: 0,
              min: 0,
              max: 9999,
              placeholder: t('common.craft.craftsmanship'),
              onUpdateValue: (val: number | null) => { row.requirements.craftsmanship = val ?? 0 },
            }),
            h(NInputNumber, {
              value: row.requirements.control,
              precision: 0,
              min: 0,
              max: 9999,
              placeholder: t('common.craft.control'),
              onUpdateValue: (val: number | null) => { row.requirements.control = val ?? 0 },
            }),
            h(NInputNumber, {
              value: row.requirements.cp,
              precision: 0,
              min: 0,
              max: 999,
              placeholder: t('common.craft.cp'),
              onUpdateValue: (val: number | null) => { row.requirements.cp = val ?? 0 },
            }),
          ]
        })
      },
    },
  ]
})

const handleConfirm = () => {
  const macros: RecordedCraftMacro[] = parsedMacros.value.map(entry => {
    const macro = getDefaultCraftMacro(entry.id)
    macro.name = entry.name
    macro.craftActions = entry.craftActions
    macro.requirements = {
      craftsmanship: entry.requirements.craftsmanship || undefined,
      control: entry.requirements.control || undefined,
      cp: entry.requirements.cp || undefined,
    }
    prepareMacroForSave(macro, t('common.id_macro', macro.id))
    return macro
  })

  emits('onSubmit', macros)
  showPreviewModal.value = false
  showModal.value = false
}

const getActionsSummary = (craftActions: number[]) => {
  const stepCount = craftActions.length
  const timeCount = craftActions.reduce((total, actionId) => {
    return total + (XivCraftActions[actionId]?.wait_time ?? 0)
  }, 0)
  return t('common.step_and_sec', { step_count: stepCount, time_count: timeCount })
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :icon="CodeSharp"
    :title="t('macro_manage.text.batch_add_macros')"
    max-width="600px"
  >
    <div class="batch-add-wrapper">
      <div class="form-block">
        <div class="font-bold mb-1">{{ t('macro_manage.text.batch_add_macros_desc_1') }}</div>
        <div>
          {{ t('macro_manage.text.batch_add_macros_format_pre') }}
          {{ t('macro_manage.text.batch_add_macros_format_cac') }}
          {{ t('macro_manage.text.batch_add_macros_format_name') }}
          {{ t('macro_manage.text.batch_add_macros_format_req') }}
        </div>
        <div>
          {{ t('common.example_pre') }}
          1v5byIh97nMsYho4 MyMacro1 5614/5570/649
        </div>
        <div class="flex items-center gap-px">
          <span>
            {{ t('macro_manage.text.batch_add_macros_req_pre') }}
            {{ t('macro_manage.text.batch_add_macros_req_craft') }}/{{ t('macro_manage.text.batch_add_macros_req_control') }}/{{ t('macro_manage.text.batch_add_macros_req_cp') }}
            {{ t('macro_manage.text.batch_add_macros_req_post') }}
          </span>
          <HelpButton
            pop-type="tooltip"
            placement="top"
            :size="17"
            :descriptions="t('macro_manage.text.batch_add_macros_examples').split('\n')"
          />
        </div>
      </div>
      <div class="form-block">
        <n-input
          v-model:value="inputText"
          type="textarea"
          :autosize="{ minRows: 5, maxRows: 12 }"
          :placeholder="t('macro_manage.text.batch_add_macros_placeholder')"
        />
      </div>
    </div>

    <template #action>
      <div class="app-modal-footer">
        <n-button type="primary" @click="handleRecognize">
          <template #icon>
            <n-icon><ContentPasteSearchOutlined /></n-icon>
          </template>
          {{ t('macro_manage.text.batch_add_recognize') }}
        </n-button>
      </div>
    </template>

    <MyModal
      v-model:show="showPreviewModal"
      :icon="DoneOutlined"
      :title="t('macro_manage.text.batch_add_preview')"
      max-width="850px"
    >
      <div class="preview-wrapper">
        <div class="leading-normal">{{ t('macro_manage.text.batch_add_preview_desc') }}</div>
        <n-data-table
          bordered
          size="small"
          :columns="previewColumns"
          :data="parsedMacros"
          :max-height="450"
          :pagination="false"
        />
      </div>

      <template #action>
        <div class="app-modal-footer">
          <n-button type="primary" @click="handleConfirm">
            <template #icon>
              <n-icon><DoneOutlined /></n-icon>
            </template>
            {{ t('common.confirm') }}
          </n-button>
        </div>
      </template>
    </MyModal>
  </MyModal>
</template>

<style scoped>
.batch-add-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 0.5em;
}
.preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
