<script setup lang="ts">
import {
  NButton, NDivider, NTag, // 这些组件在函数中进行了引用，不能依赖自动引入
  type DataTableColumns,
} from 'naive-ui'
import {
  SearchOutlined,
  SettingsSuggestFilled,
  KeyboardArrowDownRound,
  ArchiveSharp, UnarchiveSharp,
  AddTaskOutlined, PlaylistAddCheckOutlined,
  ShareOutlined, EditNoteOutlined, DeleteFilled,
  ChecklistOutlined,
} from '@vicons/material'
import { compress, decompress } from 'xiv-cac-utils'
import ItemSpan from '@/components/custom/item/ItemSpan.vue'
import ModalCraftMacroEdit from '@/components/modals/ModalCraftMacroEdit.vue'
import ModalPreferences from '@/components/modals/ModalPreferences.vue'
import ModalImExportCraftMacro from '@/components/modals/ModalImExportCraftMacro.vue'
import ModalBatchAddCraftMacro from '@/components/modals/ModalBatchAddCraftMacro.vue'
import { XivCraftActions, XivUnpackedItems } from '@/assets/data'
import { useStore } from '@/store'
import {
  _VAR_MACRO_MAXAMOUNT,
  fixWorkState, getDefaultCraftMacro,
  type WorkState, type RecordedCraftMacro, type CraftMacroRow,
} from '@/types/workstate/macromanage'
import { CopyToClipboard, deepCopy } from '@/tools'
import { useDialog } from '@/tools/dialog'
import useUiTools from '@/tools/ui'
import useMacroHelper from '@/tools/macro-helper'

const t = inject<(message: string, args?: any) => string>('t')!
const isMobile = inject<Ref<boolean>>('isMobile') ?? ref(false)

const store = useStore()
const route = useRoute()
const router = useRouter()
const { confirmWarning } = useDialog(t)
const NAIVE_UI_MESSAGE = useMessage()
const { renderIcon } = useUiTools(isMobile)
const {
  exportCraftMacroText, unarchiveMacroRow,
} = useMacroHelper()

const workState = ref<WorkState>(fixWorkState())
const showModalCraftMacroEdit = ref(false)
const showModalImExport = ref(false)
const showModalBatchAdd = ref(false)
const imexportMode = ref<"import" | "export">('import')
const macroEditTarget = ref(getDefaultCraftMacro(-1))
const macroEditAction = ref<"add" | "edit">('add')

const cachedWorkState = store.userConfig.macromanage_cache_work_state
if (cachedWorkState && JSON.stringify(cachedWorkState).length > 2) {
  workState.value = fixWorkState(cachedWorkState)
  // Compatible with older version caching
}
workState.value.recordIndex = Math.max(0, ...workState.value.recordedCraftMacros.map(macro => macro.id)) + 1

// todo - 留意性能：深度侦听需要遍历被侦听对象中的所有嵌套的属性，当用于大型数据结构时，开销很大
watch(workState, async () => {
  if (workState.value) {
    try {
      await Promise.resolve()
      store.userConfig.macromanage_cache_work_state = workState.value
      store.setUserConfig(store.userConfig)
    } catch (error) {
      console.error('Error handling workState change:', error)
    }
  } else {
    console.warn('workState or userConfig is not defined')
  }
}, { deep: true })

const tableHeight = ref(300)
const updateHeights = () => {
  tableHeight.value = window.innerHeight - 285
}
const handleUrlParamsImport = () => {
  const importCode = route.query.import as string
  const itemId = Number(route.query.item) || 0
  const nameParam = route.query.name as string

  if (!importCode) return

  try {
    const actions = decompress(importCode)
    if (!actions || !actions.length) {
      throw new Error('Invalid macro content')
    }

    if (workState.value.recordedCraftMacros.length >= _VAR_MACRO_MAXAMOUNT) {
      NAIVE_UI_MESSAGE.error(t('macro_manage.message.macro_amount_limited'))
      return
    }

    const macroid = getMacroId()
    const newMacro = getDefaultCraftMacro(macroid)

    if (itemId && XivUnpackedItems[itemId]) {
      newMacro.relateItems.push(itemId)
    } else if (nameParam) {
      newMacro.relateItems.push(nameParam)
    }

    newMacro.craftActions = actions.map(a => a.ids[0])

    macroEditTarget.value = newMacro
    macroEditAction.value = 'add'
    showModalCraftMacroEdit.value = true

    function getMacroId() {
      let macroid = workState.value.recordIndex
      while (workState.value.recordedCraftMacros.find(macro => macro.id === macroid)) {
        macroid++
      }
      if (workState.value.recordIndex !== macroid) {
        workState.value.recordIndex = macroid
      }
      return macroid
    }
  } catch (e: any) {
    NAIVE_UI_MESSAGE.error(t('common.message.import_failed') + ':\n' + e.message)
    console.error('Import failed:', e)
  }
}

onMounted(() => {
  updateHeights()
  window.addEventListener('resize', updateHeights)
  handleUrlParamsImport()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeights)
})

const macroItemLanguageOptions = computed(() => {
  return [
    { label: t('common.lang_zh'), value: 'zh' },
    { label: t('common.lang_en'), value: 'en' },
    { label: t('common.lang_ja'), value: 'ja' },
  ]
})
const multiOperateDropdownOptions = computed(() => {
  return [
    {
      label: t('macro_manage.text.batch_add'),
      key: 'batch-add',
      icon: renderIcon(PlaylistAddCheckOutlined),
    },
    {
      label: t('macro_manage.text.enable_select_mode'),
      key: 'select',
      icon: renderIcon(ChecklistOutlined),
    },
    {
      label: t('macro_manage.text.delete_all_macros'),
      key: 'delete',
      props: { style: 'color: var(--color-error);' },
      icon: renderIcon(DeleteFilled, { color: 'var(--color-error)' }),
    },
  ]
})
const mainCardExtraButtons = computed(() => {
  return [
    {
      text: t('common.setting'),
      icon: SettingsSuggestFilled,
      onClick: handleSettingButtonClick,
    }
  ]
})

const tableData = computed(() => {
  return workState.value.recordedCraftMacros.map(macro => unarchiveMacroRow(macro)).filter(macro => {
    if (workState.value.searchKeyword) {
      const keyword = workState.value.searchKeyword
      const keywordIsDigit = /^\d+$/.test(keyword)
      return (
        macro.name.includes(keyword) ||
        macro.remark.includes(keyword) ||
        macro.tags.some(tag => tag.includes(keyword)) ||
        macro.relateItems.some(item => {
          if (typeof item === 'string') {
            return item.includes(keyword)
          } else {
            return (
              item.name_zh.includes(keyword) ||
              item.name_en.includes(keyword) ||
              item.name_ja.includes(keyword) ||
              item.patch === keyword
            ) || (keywordIsDigit && (
              item.id.toString() === keyword ||
              item.itemLevel.toString() === keyword
            ))
          }
        })
      )
    }
    return true
  })
})
const tableColumns = computed(() => {
  const columns: DataTableColumns<CraftMacroRow> = [
    {
      title: t('common.number'),
      key: 'id',
      className: '',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('macro_manage.text.macro_name'),
      key: 'name',
      className: '',
      width: 350,
      render(row) {
        return h(
          'div',
          { class: 'macro-name-container' },
          [
            h('div', { class: 'macro-name' }, row.name),
            h(
              'div',
              { class: 'macro-tags-container' },
              [
                t('macro_manage.text.tag_with_colon'),
                row.tags.length ? row.tags.map(tag => h(NTag, {
                  size: 'small',
                }, () => tag)) : t('common.nothing'),
              ]
            ),
            h(
              'div',
              { class: 'macro-remark' },
              row.remark.split('\n').map(line => {
                return h('div', { class: 'macro-remark-line' }, line)
              })
            ),
          ],
        )
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('macro_manage.text.relate_item'),
      key: 'itemId',
      className: '',
      width: 200,
      render(row) {
        return h(
          'div',
          { class: 'flex flex-col' },
          row.relateItems.slice(0, 3).map(item => {
            if (typeof item === 'string') {
              return h(NTag, {
                size: 'small',
                style: 'width: fit-content;',
              }, () => item)
            } else {
              return h(ItemSpan, {
                itemInfo: item
              }, () => [])
            }
          })
        )
      }
    },
    {
      title: t('common.craft_requirements'),
      key: 'requirements',
      className: '',
      align: 'center',
      width: 120,
      render(row) {
        const children : VNode[] = []
        if (row.requirements.craftsmanship) {
          children.push(h('div', null, t('common.val_craftsmanship', row.requirements.craftsmanship)))
        }
        if (row.requirements.control) {
          children.push(h('div', null, t('common.val_control', row.requirements.control)))
        }
        if (row.requirements.cp) {
          children.push(h('div', null, row.requirements.cp + 'CP'))
        }
        return h(
          'div',
          { class: 'leading-[1.2] font-small' },
          children
        )
      }
    },
    {
      title: t('common.content'),
      key: 'content',
      render(row) {
        const macros = exportCraftMacroText(row.craftActions)[`macros_${workState.value.macroItemLanguage}`]
        return h(
          'div',
          { style: 'width: fit-content;' },
          [
            h(
              'div',
              null,
              t('common.step_and_sec', {
                step_count: row.craftActions.length,
                time_count: row.craftActions.reduce((total, action) => {
                  return total + (XivCraftActions[action.id]?.wait_time ?? 0)
                }, 0)
              })
            ),
            h(
              NDivider,
              { style: 'margin: -3px 0 2px 0;' },
              ''
            ),
            h(
              'div',
              {
                class: 'flex items-center gap-0.5',
                style: selectMode.value ? 'visibility: hidden;' : ''
              },
              macros.map((macro, index) => {
                return h(
                  NButton,
                  {
                    tertiary: true,
                    size: 'tiny',
                    title: t('common.click_to_copy'),
                    onClick: () => handleCopyMacro(macro)
                  },
                  {
                    default: () => t('common.macro_with_index', index + 1)
                  }
                )
              })
            ),
          ]
        )
      }
    },
    {
      title: t('common.manage'),
      key: 'manage',
      width: 270,
      render(row) {
        return h(
          'div',
          {
            class: 'flex gap-1',
            style: selectMode.value ? 'visibility: hidden;' : ''
          },
          [
            h(
              NButton,
              {
                strong: true,
                tertiary: true,
                size: 'small',
                style: 'width: fit-content;',
                onClick: () => handleEditRow(row)
              },
              {
                icon: renderIcon(EditNoteOutlined),
                default: () => t('common.edit')
              }
            ),
            h(
              NButton,
              {
                strong: true,
                tertiary: true,
                size: 'small',
                style: 'width: fit-content;',
                onClick: () => handleShareRow(row)
              },
              {
                icon: renderIcon(ShareOutlined),
                default: () => t('common.share')
              }
            ),
            h(
              NButton,
              {
                strong: true,
                tertiary: true,
                type: 'error',
                size: 'small',
                style: 'width: fit-content;',
                onClick: () => handleDeleteRow(row)
              },
              {
                icon: renderIcon(DeleteFilled),
                default: () => t('common.delete')
              }
            ),
          ]
        )
      },
    }
  ]
  return columns
})

const handleReportDataMissing = (macro: RecordedCraftMacro | number) => {
  NAIVE_UI_MESSAGE.error(t('common.data_missing'))
  console.error(
    'edited macro not found! \nmacro:',
    macro,
    '\nrecordedCraftMacros:',
    workState.value.recordedCraftMacros
  )
}
const handleMultiOperateDropdownSelect = async (key: string | number) => {
  if (key === 'batch-add') {
    showModalBatchAdd.value = true
  } else if (key === 'delete') {
    if (!workState.value.recordedCraftMacros.length) {
      NAIVE_UI_MESSAGE.info(t('macro_manage.message.no_macro_added'))
      return
    }
    if (!await confirmWarning(t('macro_manage.message.confirm_delete_all') + '\n' + t('common.message.operation_irreversible'))) {
      return
    }
    workState.value.recordedCraftMacros = []
    NAIVE_UI_MESSAGE.success(t('common.message.deleted'))
  } else if (key === 'select') {
    handleSelectModeEnter()
  } else {
    console.warn('unexpected multi operate dropdown key:', key)
  }
}

const selectMode = ref(false)
const checkedRowKeys = ref<number[]>([])

const handleSelectModeEnter = () => {
  selectMode.value = true
  checkedRowKeys.value = []
}

const handleSelectModeExit = () => {
  selectMode.value = false
  checkedRowKeys.value = []
}

const handleSelectAll = () => {
  checkedRowKeys.value = tableData.value.map(row => row.id)
}

const handleInvertSelection = () => {
  const allIds = tableData.value.map(row => row.id)
  checkedRowKeys.value = allIds.filter(id => !checkedRowKeys.value.includes(id))
}

const handleShareSelected = async () => {
  if (!checkedRowKeys.value.length) {
    NAIVE_UI_MESSAGE.warning('请先选择要分享的宏')
    return
  }
  const lines = checkedRowKeys.value.map(id => {
    const macro = workState.value.recordedCraftMacros.find(m => m.id === id)
    if (!macro) return ''
    const row = unarchiveMacroRow(macro)
    const cac = compress({
      type: 'id',
      actions: macro.craftActions,
    })
    return `${cac} ${row.name} ${row.requirements.craftsmanship || 0} ${row.requirements.control || 0} ${row.requirements.cp || 0}`
  }).filter(Boolean)

  const text = lines.join('\n')
  const response = await CopyToClipboard(text)
  if (response) {
    NAIVE_UI_MESSAGE.error(t('common.message.copy_failed_unexpected_error'))
  } else {
    NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
  }
}

const handleDeleteSelected = async () => {
  if (!checkedRowKeys.value.length) {
    NAIVE_UI_MESSAGE.warning('请先选择要删除的宏')
    return
  }
  if (!await confirmWarning(`确定要删除选中的 ${checkedRowKeys.value.length} 个项目吗？\n${t('common.message.operation_irreversible')}`)) {
    return
  }
  workState.value.recordedCraftMacros = workState.value.recordedCraftMacros.filter(
    macro => !checkedRowKeys.value.includes(macro.id)
  )
  NAIVE_UI_MESSAGE.success(t('common.message.deleted'))
}

const rowProps = (row: CraftMacroRow) => {
  return {
    style: selectMode.value ? 'cursor: pointer;' : '',
    onClick: () => {
      if (selectMode.value) {
        const index = checkedRowKeys.value.indexOf(row.id)
        if (index > -1) {
          checkedRowKeys.value.splice(index, 1)
        } else {
          checkedRowKeys.value.push(row.id)
        }
      }
    }
  }
}

const rowClassName = (row: CraftMacroRow) => {
  if (selectMode.value && checkedRowKeys.value.includes(row.id)) {
    return 'selected-row'
  }
  return ''
}

const handleImportButtonClick = () => {
  imexportMode.value = 'import'
  showModalImExport.value = true
}
const handleExportButtonClick = () => {
  imexportMode.value = 'export'
  showModalImExport.value = true
}

const handleAddRow = () => {
  if (workState.value.recordedCraftMacros.length >= _VAR_MACRO_MAXAMOUNT) {
    NAIVE_UI_MESSAGE.error(t('macro_manage.message.macro_amount_limited'))
    return
  }
  const macroid = getMacroId()
  macroEditTarget.value = getDefaultCraftMacro(macroid)
  macroEditAction.value = 'add'
  showModalCraftMacroEdit.value = true

  function getMacroId() {
    let macroid = workState.value.recordIndex
    while (workState.value.recordedCraftMacros.find(macro => macro.id === macroid)) {
      macroid++
    }
    if (workState.value.recordIndex !== macroid) {
      workState.value.recordIndex = macroid
    }
    return macroid
  }
}
const handleShareRow = async (row: CraftMacroRow) => {
  const index = workState.value.recordedCraftMacros.findIndex(macro => macro.id === row.id)
  if (index !== -1) {
    try {
      const macro = workState.value.recordedCraftMacros[index]
      const cac = compress({
        type: 'id',
        actions: macro.craftActions,
      })
      const response = await CopyToClipboard(`https://cac.nbb.fan/?s=${cac}`)
      if (response) {
        NAIVE_UI_MESSAGE.error(t('common.message.copy_failed_unexpected_error'))
      } else {
        NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
      }
    } catch (e: any) {
      NAIVE_UI_MESSAGE.error(t('common.message.operation_failed') + ':\n' + e.message)
      console.error('Share failed:', e)
    }
  } else {
    handleReportDataMissing(row.id)
  }
}
const handleEditRow = (row: CraftMacroRow) => {
  const index = workState.value.recordedCraftMacros.findIndex(macro => macro.id === row.id)
  if (index !== -1) {
    macroEditTarget.value = workState.value.recordedCraftMacros[index]
    macroEditAction.value = 'edit'
    showModalCraftMacroEdit.value = true
  } else {
    handleReportDataMissing(row.id)
  }
}
const handleDeleteRow = async (row: CraftMacroRow) => {
  if (!await confirmWarning(t('common.message.confirm_delete_with_name', row.name) + '\n' + t('common.message.operation_irreversible'))) {
    return
  }
  const index = workState.value.recordedCraftMacros.findIndex(macro => macro.id === row.id)
  if (index !== -1) {
    workState.value.recordedCraftMacros.splice(index, 1)
    NAIVE_UI_MESSAGE.success(t('common.message.deleted'))
  } else {
    handleReportDataMissing(row.id)
  }
}
const handleCopyMacro = async (macro: string) => {
  const response = await CopyToClipboard(macro)
  if (response) {
    NAIVE_UI_MESSAGE.error(t('common.message.copy_failed_unexpected_error'))
  } else {
    NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
  }
}

const handleMacroEditSubmit = (macro: RecordedCraftMacro) => {
  const macroid = macro.id
  const newWorkState = fixWorkState(deepCopy(store.userConfig.macromanage_cache_work_state))
  if (macroEditAction.value === 'edit') {
    const index = newWorkState.recordedCraftMacros.findIndex(macro => macro.id === macroid)
    if (index !== -1) {
      newWorkState.recordedCraftMacros[index] = macro
      workState.value = newWorkState
      NAIVE_UI_MESSAGE.success(t('common.message.changes_saved'))
    } else {
      handleReportDataMissing(macro)
    }
  } else if (macroEditAction.value === 'add') {
    newWorkState.recordedCraftMacros.push(macro)
    newWorkState.recordIndex = Math.max(0, ...newWorkState.recordedCraftMacros.map(m => m.id)) + 1
    workState.value = newWorkState
    NAIVE_UI_MESSAGE.success(t('common.message.dataname_saved', macro.name))
  } else {
    console.warn('unexpected action')
  }
  showModalCraftMacroEdit.value = false

  // Clear URL params if macro was imported via URL
  if (route.query.import) {
    const query = { ...route.query }
    delete query.import
    delete query.item
    delete query.name
    router.replace({ query })
  }
}
const handleBatchAddSubmit = (macros: RecordedCraftMacro[]) => {
  const newWorkState = fixWorkState(deepCopy(store.userConfig.macromanage_cache_work_state))
  for (const macro of macros) {
    newWorkState.recordedCraftMacros.push(macro)
  }
  newWorkState.recordIndex = Math.max(0, ...newWorkState.recordedCraftMacros.map(m => m.id)) + 1
  workState.value = newWorkState
  NAIVE_UI_MESSAGE.success(t('macro_manage.message.batch_add_success', { count: macros.length }))
}

const showPreferencesModal = ref(false)
const handleSettingButtonClick = () => {
  showPreferencesModal.value = true
}
</script>

<template>
  <div id="main-container">
    <FoldableCard card-key="macromanage-main" unfoldable :extra-header-buttons="mainCardExtraButtons">
      <template #header>
        <i class="xiv e0ba"></i>
        <span class="card-title-text">{{ t('macro_manage.title') }}</span>
      </template>
      <div class="main-content">
        <div class="query-options">
          <n-input-group id="querier-search">
            <n-input-group-label>{{ t('macro_manage.text.filter_or_search') }}</n-input-group-label>
            <n-input
              v-model:value="workState.searchKeyword"
              :placeholder="t('common.item_search_input_placeholder_2')"
              
            >
              <template #suffix>
                <n-icon :component="SearchOutlined" />
              </template>
            </n-input>
          </n-input-group>
          <n-input-group id="querier-itemlang">
            <n-input-group-label>{{ t('macro_manage.text.macro_lang') }}</n-input-group-label>
            <n-select
              v-model:value="workState.macroItemLanguage"
              :options="macroItemLanguageOptions"
            />
          </n-input-group>
          <div id="querier-actions">
            <template v-if="!selectMode">
              <n-dropdown
                placement="bottom-end"
                :options="multiOperateDropdownOptions"
                @select="handleMultiOperateDropdownSelect"
              >
                <n-button ghost icon-placement="right">
                  <template #icon>
                    <n-icon :component="KeyboardArrowDownRound" />
                  </template>
                  {{ t('macro_manage.text.batch_operate') }}
                </n-button>
              </n-dropdown>
              <n-button-group>
                <n-button ghost @click="handleExportButtonClick">
                  <template #icon>
                    <n-icon :component="UnarchiveSharp" />
                  </template>
                  {{ t('common.export') }}
                </n-button>
                <n-button ghost @click="handleImportButtonClick">
                  <template #icon>
                    <n-icon :component="ArchiveSharp" />
                  </template>
                  {{ t('common.import') }}
                </n-button>
              </n-button-group>
              <n-button type="primary" @click="handleAddRow">
                <template #icon>
                  <n-icon :component="AddTaskOutlined" />
                </template>
                {{ t('common.add2') }}
              </n-button>
            </template>
            <template v-else>
              <n-button-group>
                <n-button ghost @click="handleSelectAll">{{ t('common.select_all') }}</n-button>
                <n-button ghost @click="handleInvertSelection">{{ t('common.select_invert') }}</n-button>
              </n-button-group>
              <n-button-group>
                <n-button ghost @click="handleShareSelected">
                  <template #icon><n-icon :component="ShareOutlined" /></template>
                  {{ t('common.share') }}
                </n-button>
                <n-button ghost type="error" @click="handleDeleteSelected">
                  <template #icon><n-icon :component="DeleteFilled" /></template>
                  {{ t('common.delete') }}
                </n-button>
              </n-button-group>
              <n-button ghost @click="handleSelectModeExit">
                {{ t('common.exit_selection_mode') }}
              </n-button>
            </template>
          </div>
        </div>
        <n-data-table
          bordered
          scroll-x="100%"
          :columns="tableColumns"
          :data="tableData"
          :row-props="rowProps"
          :row-class-name="rowClassName"
          :pagination="false"
          :max-height="tableHeight"
          :virtual-scroll="tableData.length > 200"
        >
          <template #empty>
            <n-empty
              :description="workState.searchKeyword ? t('common.no_content_matched') : t('common.no_data')"
            />
          </template>
        </n-data-table>
      </div>
    </FoldableCard>

    <n-back-top />

    <ModalCraftMacroEdit
      v-model:show="showModalCraftMacroEdit"
      v-model:macro="macroEditTarget"
      :action="macroEditAction"
      @on-submit="handleMacroEditSubmit"
    />
    <ModalPreferences
      v-model:show="showPreferencesModal"
      setting-group="craft_macro"
      app-show-fp
    />
    <ModalImExportCraftMacro
      v-model:show="showModalImExport"
      v-model:recorded-macros="workState.recordedCraftMacros"
      :mode="imexportMode"
    />
    <ModalBatchAddCraftMacro
      v-model:show="showModalBatchAdd"
      :current-macro-count="workState.recordedCraftMacros.length"
      :next-record-index="workState.recordIndex"
      @on-submit="handleBatchAddSubmit"
    />
  </div>
</template>

<style scoped>
:deep(.selected-row > td) {
  background-color: var(--n-td-color-hover) !important;
}
#main-container {
  max-width: 100%;
  gap: 0.6rem;
  display: flex;
  flex-direction: column;

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .query-options {
      display: flex;
      gap: 4px;

      #querier-actions {
        margin-left: auto;
        display: flex;
        gap: 4px;
      }
    }
  }
}
.query-form {
  padding: 0 0.8em;
  gap: 4px;
  display: flex;

  .form-item {
    border-radius: 5px;
    padding: 0.5rem 0.6rem;
    border: 1px solid transparent;

    .form-title {
      padding: 0 0 6px 2px;
    }
  }
}

/* Desktop */
@media screen and (min-width: 768px) {
  .query-options {
    #querier-search {
      max-width: 560px;
    }
    #querier-itemlang {
      max-width: 200px;
    }
  }
  .lang-ja #querier-search {
    max-width: 775px;
  }
  .lang-en #querier-itemlang {
    max-width: 240px;
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .query-options {
    flex-direction: column;

    #querier-search {
      width: 100%;
    }
    #querier-itemlang {
      width: 100%;
    }
    #querier-actions {
      flex-wrap: wrap;
      justify-content: end;
    }
  }
}
</style>