<script setup lang="ts">
import { computed, h, type VNode } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NDivider,
  NTag,
  type DataTableColumns,
} from 'naive-ui'
import {
  AutoFixHighRound,
  OpenInNewFilled,
} from '@vicons/material'
import MyModal from '@/components/templates/MyModal.vue'
import ItemSpan from '@/components/item/ItemSpan.vue'
import { XivCraftActions } from '@/assets/data'
import { useStore } from '@/store'
import { useLocale } from '@/composables/useLocale'
import useMacroHelper from '@/views/macro-manage/composables/useMacroHelper'
import type { CraftMacroRow } from '@/types/workstate/macromanage'
import type { MatchedMacrosModalData } from '@/composables/useAppModals'
import { CopyToClipboard } from '@/tools'

const modalId = 'modal-matched-macros'

const store = useStore()
const router = useRouter()
const { t } = useLocale()
const NAIVE_UI_MESSAGE = useMessage()
const { unarchiveMacroRow, exportCraftMacroText } = useMacroHelper()

const showModal = defineModel<boolean>('show', { required: true })

interface Props {
  data: MatchedMacrosModalData
}
const props = defineProps<Props>()

const macroItemLanguage = computed(() => {
  return store.userConfig.macromanage_cache_work_state?.macroItemLanguage ?? 'zh'
})

const itemInfo = computed(() => props.data?.itemInfo)
const difficulty = computed(() => {
  if (props.data?.targetDifficulty) {
    return props.data.targetDifficulty
  }
  const craftInfo = props.data?.itemInfo?.craftInfo
  if (craftInfo) {
    return {
      durability: craftInfo.durability,
      progress: craftInfo.progress,
      quality: craftInfo.quality,
    }
  }
  return undefined
})

const tableData = computed((): CraftMacroRow[] => {
  return (props.data?.matchedMacros ?? []).map(macro => unarchiveMacroRow(macro))
})

/** 复制宏文本 */
const handleCopyMacro = async (macro: string) => {
  const container = document.getElementById(modalId)
  const response = await CopyToClipboard(macro, container)
  if (response) {
    NAIVE_UI_MESSAGE.error(t('common.message.copy_failed_unexpected_error'))
  } else {
    NAIVE_UI_MESSAGE.success(t('common.message.copy_succeed'))
  }
}

const tableColumns = computed((): DataTableColumns<CraftMacroRow> => {
  return [
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
      title: t('common.craft_requirements'),
      key: 'requirements',
      className: '',
      align: 'center',
      width: 120,
      render(row) {
        const children: VNode[] = []
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
          { class: 'leading-[1.2] text-app-xs' },
          children
        )
      },
    },
    {
      title: t('common.content'),
      key: 'content',
      render(row) {
        const macros = exportCraftMacroText(row.craftActions)[`macros_${macroItemLanguage.value}`]
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
              { class: 'flex items-center gap-0.5' },
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
      },
    },
  ]
})

/** 前往宏管理页面 */
const goToMacroManage = () => {
  showModal.value = false
  router.push('/macromanage')
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :id="modalId"
    :icon="AutoFixHighRound"
    :title="t('macro_manage.modal_matched_macros.title')"
    max-width="850px"
  >
    <div class="flex flex-col gap-3">
      <!-- 目标配方难度信息栏 -->
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-bg-hover border border-border">
        <div class="flex items-center gap-2">
          <ItemSpan
            v-if="itemInfo"
            :item-info="itemInfo"
            :img-size="28"
            show-item-name
          />
          <div v-if="difficulty" class="text-app-xs text-sub flex items-center gap-2">
            <span>{{ t('item.text.recipe_detail', { dur: difficulty.durability, pro: difficulty.progress, qua: difficulty.quality }) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <n-tag size="small" :bordered="false" type="info">
            {{ t('macro_manage.modal_matched_macros.count_badge', { count: tableData.length }) }}
          </n-tag>
          <n-button
            size="tiny"
            quaternary
            @click="goToMacroManage"
          >
            <template #icon>
              <n-icon><OpenInNewFilled /></n-icon>
            </template>
            {{ t('macro_manage.modal_matched_macros.jump_to_macro_manage') }}
          </n-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <n-data-table
        bordered
        :columns="tableColumns"
        :data="tableData"
        :pagination="false"
        :max-height="450"
      >
        <template #empty>
          <n-empty :description="t('macro_manage.modal_matched_macros.no_macros')" />
        </template>
      </n-data-table>
    </div>
  </MyModal>
</template>
