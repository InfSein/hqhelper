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
import UseConfig from '@/composables/useConfig.ts'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs, type XivJob } from '@/assets/data'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import type { ItemGroup } from '@/types/item/index.ts'
import type { AlarmMacroOptions } from '@/types/workstate/gatherclock.ts'

const { t } = useLocale()
const { isMobile } = useResponsive()

const {
  uiLanguage, itemLanguage,
} = UseConfig()

const showModal = defineModel<boolean>('show', { required: true })
const alarmMacroOptions = defineModel<AlarmMacroOptions>('options', { required: true })
const modalId = 'modal-alarm-macro-export'

interface ModalAlarmMacroExportProps {
  itemGroups: ItemGroup[]
}
const props = defineProps<ModalAlarmMacroExportProps>()

const wrapper = ref<HTMLElement>()

const itemTreeCheckedKeys = ref<number[]>([])
const handleItemTreeSelectedKeysUpdate = (keys: Array<string | number>) => {
  itemTreeCheckedKeys.value = []
  keys.forEach(key => {
    const itemId = parseInt(key as string)
    if (itemId && !itemTreeCheckedKeys.value.includes(itemId)) {
      itemTreeCheckedKeys.value.push(itemId)
    }
  })
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

  const autoExpandKeys = treeData.slice(-2).map(element => element.key!)

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
      alarmName = alarmName.slice(0, 20);  // 截取前20个字符
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
    :icon="CodeSharp"
    :title="t('gather_clock.export_alarm_macro.title')"
    max-width="730px"
  >
    <div class="wrapper" ref="wrapper">
      <GroupBox id="select-items">
        <template #title>
          <span class="title">{{ t('common.select_item') }}</span>
        </template>
        <n-tree
          block-line
          cascade
          checkable
          :selectable="false"
          :data="itemTreeData.treeData"
          :default-expanded-keys="itemTreeData.autoExpandKeys"
          :default-checked-keys="[]"
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