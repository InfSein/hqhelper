<script setup lang="ts">
import {
  type TreeOption,
} from 'naive-ui'
import {
  CodeSharp,
  HelpOutlineRound,
} from '@vicons/material'
import ItemSpan from '@/components/item/ItemSpan.vue'
import MacroViewer from '@/components/craft/MacroViewer.vue'
import { useLocale } from '@/composables/useLocale'
import useConfig from '@/composables/useConfig'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs, type XivJob } from '@/assets/data'
import { getItemInfo } from '@/tools/item'
import type { ItemInfo, ItemGroup } from '@/types/item'
import {
  type AlarmMacroOptions,
  _VAR_GATHERCLOCK_MAX_ALARM_MACRO,
} from '@/types/workstate/gatherclock'

const { t } = useLocale()
const { isMobile } = useResponsive()
const {
  uiLanguage, itemLanguage,
} = useConfig()
const NAIVE_UI_MESSAGE = useMessage()

const showModal = defineModel<boolean>('show', { required: true })
const alarmMacroOptions = defineModel<AlarmMacroOptions>('options', { required: true })
const modalId = 'modal-alarm-macro-export'

interface ModalAlarmMacroExportProps {
  itemGroups: ItemGroup[]
}
const props = defineProps<ModalAlarmMacroExportProps>()

const wrapper = ref<HTMLElement>()

const treeCheckedKeys = ref<Array<string | number>>([])
const itemTreeCheckedKeys = ref<number[]>([])

const handleClearSelection = () => {
  treeCheckedKeys.value = []
  itemTreeCheckedKeys.value = []
  NAIVE_UI_MESSAGE.success(t('common.cleared'))
}

const getItemAlarmCount = (itemId: number) => {
  const item = getItemInfo(itemId)
  return item.gatherInfo?.timeLimitInfo?.length || 0
}

const handleItemTreeSelectedKeysUpdate = (keys: Array<string | number>) => {
  const itemIds: number[] = []
  keys.forEach(key => {
    const itemId = parseInt(key as string)
    if (itemId && !itemIds.includes(itemId)) {
      itemIds.push(itemId)
    }
  })

  // 优先保留原先已勾选的物品，仅对新加入的物品做容量限制
  const existing = itemTreeCheckedKeys.value.filter(id => itemIds.includes(id))
  const newlyAdded = itemIds.filter(id => !itemTreeCheckedKeys.value.includes(id))

  const resultItemIds: number[] = []
  let totalAlarms = 0
  let hasExceeded = false

  for (const id of existing) {
    const count = getItemAlarmCount(id)
    if (totalAlarms + count <= _VAR_GATHERCLOCK_MAX_ALARM_MACRO) {
      resultItemIds.push(id)
      totalAlarms += count
    } else {
      hasExceeded = true
    }
  }

  for (const id of newlyAdded) {
    const count = getItemAlarmCount(id)
    if (totalAlarms + count <= _VAR_GATHERCLOCK_MAX_ALARM_MACRO) {
      resultItemIds.push(id)
      totalAlarms += count
    } else {
      hasExceeded = true
    }
  }

  if (hasExceeded) {
    NAIVE_UI_MESSAGE.warning(t('gather_clock.message.alarm_macro_limit_reached', { max: _VAR_GATHERCLOCK_MAX_ALARM_MACRO }))
    itemTreeCheckedKeys.value = resultItemIds
    treeCheckedKeys.value = resultItemIds
    return
  }

  itemTreeCheckedKeys.value = resultItemIds
  treeCheckedKeys.value = keys
}
const itemTreeData = computed(() => {
  const treeData : TreeOption[] = []
  const keys : string[] = []

  props.itemGroups.forEach(group => {
    if (['stars', 'subscribed'].includes(group.key)) {
      return // 重复的key会导致组件出问题，所以先把收藏/订阅给过滤掉
    }
    const groupKey = 'group-' + group.key
    const subTreeOption : TreeOption[] = []
    group.items.forEach(item => {
      const itemKey = item.id
      const itemSpan = () => h(ItemSpan, {
        itemInfo: item,
        containerId: modalId,
        spanMaxWidth: '160px',
      })
      subTreeOption.push({
        key: itemKey,
        label: '',
        prefix: itemSpan
      })
    })
    treeData.push({
      key: groupKey,
      label: group.title,
      children: subTreeOption
    })
    keys.push(groupKey)
  })

  // 最后 x 个分组（对应最新的几个版本）默认展开
  const autoExpandKeys = treeData.slice(-1).map(element => element.key!)

  return {
    treeData,
    keys, autoExpandKeys,
  }
})
const macro = computed(() => {
  const result : string[] = []
  if (alarmMacroOptions.value.clearOldAlarms) {
    result.push('/alarm clear')
  }
  let repeat = ' repeat'
  if (alarmMacroOptions.value.noRepeat) repeat = ''
  itemTreeCheckedKeys.value.forEach(itemId => {
    const item = getItemInfo(itemId)
    let alarmName = getItemName(item)

    if (alarmMacroOptions.value.containsMapName) {
      alarmName = `${getPlaceName(item)}-${alarmName}`
    }
    if (alarmMacroOptions.value.containsAetheryteName) {
      alarmName = `${item.gatherInfo.recommAetheryte![`name_${itemLanguage.value}`]}-${alarmName}`
    }
    if (alarmMacroOptions.value.containsJobName) {
      alarmName = `${getJobName(XivJobs[item.gatherInfo.jobId])}-${alarmName}`
    }

    if (alarmName.length > 20) {
      alarmName = alarmName.slice(0, 20) // 截取前20个字符
    }

    item.gatherInfo.timeLimitInfo.forEach(timeLimit => {
      const startET = timeLimit.start.replace(':', '')
      result.push(`/alarm "${alarmName}" et${repeat} ${startET} 0`)
    })
  })
  return result
})

const getItemName = (itemInfo: ItemInfo) => {
  switch (itemLanguage.value) {
    case 'zh':
      return itemInfo.name_zh || '未翻译的物品'
    default:
      return itemInfo[`name_${itemLanguage.value}`]
  }
}
const getJobName = (jobInfo: XivJob) => {
  switch (uiLanguage.value) {
    case 'ja':
      return jobInfo?.job_name_ja || t('common.unknown')
    case 'en':
      return jobInfo?.job_name_en || t('common.unknown')
    case 'zh':
    default:
      return jobInfo?.job_name_zh || t('common.unknown')
  }
}
const getPlaceName = (itemInfo : ItemInfo) => {
  switch (itemLanguage.value) {
    case 'ja':
      return itemInfo.gatherInfo?.placeNameJA
    case 'en':
      return itemInfo.gatherInfo?.placeNameEN
    case 'zh':
    default:
      return itemInfo.gatherInfo?.placeNameZH
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    :id="modalId"
    max-width="730px"
  >
    <template #header>
      <div class="card-title select-none">
        <n-icon><CodeSharp /></n-icon>
        <span class="title">
          {{ t('gather_clock.export_alarm_macro.title') }}
        </span>
        <div class="card-title__actions">
          <a href="javascript:void(0);" @click="handleClearSelection">[{{ t('common.clear_selected') }}]</a>
        </div>
      </div>
    </template>
    <div class="wrapper" ref="wrapper">
      <GroupBox id="select-items">
        <template #title>
          <div class="flex items-center gap-1">
            <span class="title">{{ t('common.select_item') }}</span>
            <n-popover :trigger="isMobile ? 'click' : 'hover'">
              <template #trigger>
                <div style="min-width: fit-content; display: flex; align-items: center; cursor: pointer;">
                  <n-icon :size="14" style="display: flex;">
                    <HelpOutlineRound />
                  </n-icon>
                </div>
              </template>
              <div>
                {{ t('gather_clock.export_alarm_macro.tooltip.max_alarms_limit', { max: _VAR_GATHERCLOCK_MAX_ALARM_MACRO }) }}
              </div>
            </n-popover>
          </div>
        </template>
        <n-tree
          block-line
          cascade
          checkable
          :selectable="false"
          :data="itemTreeData.treeData"
          :default-expanded-keys="itemTreeData.autoExpandKeys"
          :checked-keys="treeCheckedKeys"
          @update:checked-keys="handleItemTreeSelectedKeysUpdate"
          :style="{
            maxHeight: isMobile ? 'unset' : '365px',
            overflowY: 'auto',
          }"
        />
      </GroupBox>
      <div id="right-container">
        <GroupBox id="export-settings">
          <template #title>
            <span class="title">{{ t('common.options') }}</span>
          </template>
          <div class="settings-container">
            <n-checkbox v-model:checked="alarmMacroOptions.clearOldAlarms">
              {{ t('gather_clock.export_alarm_macro.preference.clean_old_alarms') }}
            </n-checkbox>
            <div class="flex">
              <div style="min-width: fit-content;">{{ t('gather_clock.export_alarm_macro.preference.alarm_name_includes') }}</div>
              <div class="flex flex-wrap">
                <n-checkbox v-model:checked="alarmMacroOptions.containsJobName">
                  {{ t('common.job') }}
                </n-checkbox>
                <n-checkbox v-model:checked="alarmMacroOptions.containsMapName">
                  {{ t('common.map') }}
                </n-checkbox>
                <n-checkbox v-model:checked="alarmMacroOptions.containsAetheryteName">
                  {{ t('map.text.recomm_aetheryte') }}
                </n-checkbox>
                <n-popover :trigger="isMobile ? 'click' : 'hover'">
                  <template #trigger>
                    <div style="min-width: fit-content; display: flex; align-items: center;">
                      <n-icon :size="14" style="display: flex;">
                        <HelpOutlineRound />
                      </n-icon>
                    </div>
                  </template>
                  <div>
                    {{ t('gather_clock.export_alarm_macro.tooltip.alarm_name_length') }}
                  </div>
                </n-popover>
              </div>
            </div>
            <n-checkbox v-model:checked="alarmMacroOptions.noRepeat">
              {{ t('gather_clock.export_alarm_macro.preference.no_repeat') }}
            </n-checkbox>
          </div>
        </GroupBox>
        <GroupBox id="macro-preview">
          <template #title>
            <span class="title">{{ t('common.preview') }}</span>
          </template>

          <MacroViewer
            class="preview-container"
            :macro-lines="macro"
            :content-height="isMobile ? '240px' : '190px'"
            :container-id="modalId"
          />
        </GroupBox>
      </div>
    </div>
  </MyModal>
</template>

<style scoped>
:deep(.n-tree-node-wrapper) {
  padding: 0;
}
:deep(.n-tree-node-switcher--hide) {
  width: auto !important;
}
:deep(.n-checkbox__label) {
  padding: 0 4px;
}

/* All */
.wrapper {
  display: grid;
  grid-template-columns: 265px 1fr;
  gap: 10px;
  user-select: text;

  #right-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 15px;

    #export-settings {
      height: fit-content;
    }
    #macro-preview {
      flex: 1;
      .preview-container {
        margin: 0.6em;
        padding-right: 0.6em;
      }
    }
  }

  .settings-container {
    display: flex;
    flex-direction: column;
    margin-left: 0.6em;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .card-title__actions {
    flex-basis: 100%;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-top: 15px;
    max-height: 500px;
    overflow-y: auto;
  }
}
</style>