<script setup lang="ts">
import {
  AccessAlarmsOutlined,
} from '@vicons/material'
import RouterCard from '@/components/ui/RouterCard.vue'
import GatherItemCard from '@/views/gatherclock/components/GatherItemCard.vue'
import ModalAudioConfig from '@/views/gatherclock/components/ModalAudioConfig.vue'
import ModalAlarmMacroExport from '@/views/gatherclock/components/ModalAlarmMacroExport.vue'
import { useStore } from '@/store'
import useConfig from '@/composables/useConfig'
import { useDialog } from '@/composables/useDialog'
import { useLocale } from '@/composables/useLocale'
import useUiTools from '@/composables/useUiTools'
import { useAppMode } from '@/composables/useAppMode'
import { useEorzeaTime } from '@/composables/useEorzeaTime'
import { useResponsive } from '@/composables/useResponsive'
import { XivJobs, type XivJob } from '@/assets/data'
import { playAudio } from '@/tools'
import { getItemInfo, type ItemInfo } from '@/tools/item'
import { useNbbCal } from '@/tools/use-nbb-cal'
import type { ItemGroup } from '@/types/item'
import { fixWorkState, type WorkState } from '@/types/workstate/gatherclock'
import useIdb from '@/utils/app.idb'
import EorzeaTime from '@/utils/game.et'

const store = useStore()
const { t } = useLocale()
const { appMode } = useAppMode()
const { alertError } = useDialog()
const { isMobile } = useResponsive()
const { currentET } = useEorzeaTime()
const { optionsRenderer } = useUiTools()
const { getLimitedGatherings } = useNbbCal()
const {
  uiLanguage, itemLanguage,
} = useConfig()

const gatherData = computed(() => {
  const limitedGatherings = getLimitedGatherings()
  const allItems : Record<number, ItemInfo> = {}
  for (const patch in limitedGatherings) {
    limitedGatherings[patch].forEach(itemInfo => {
      allItems[itemInfo.id] = itemInfo
    })
  }

  const data : ItemGroup[] = []

  // 收藏的物品
  const stars : ItemInfo[] = []
  workState.value.starItems.forEach(itemID => {
    if (allItems[itemID]) {
      stars.push(allItems[itemID])
    } else {
      console.warn(`物品 ${itemID} 在采集时钟数据集中不存在`)
    }
  })
  data.push({
    title: t('common.favorited'),
    key: 'stars',
    items: stars
  })

  // 订阅的物品
  const subscribed : ItemInfo[] = []
  workState.value.subscribedItems.forEach(itemID => {
    if (allItems[itemID]) {
      subscribed.push(allItems[itemID])
    } else {
      console.warn(`物品 ${itemID} 在采集时钟数据集中不存在`)
    }
  })
  data.push({
    title: t('gather_clock.text.subscribed'),
    key: 'subscribed',
    items: subscribed
  })

  for (const key in limitedGatherings) {
    const [patch, il] = key.split('-')
    let title = ''
    if (il) {
      title = t('gather_clock.grouptitle_with_patch_and_il', {
        patch: patch,
        il: il
      })
    } else {
      title = t('gather_clock.grouptitle_with_patch', {
        patch: patch
      })
    }
    data.push({
      title: title,
      key: key,
      items: limitedGatherings[key]
    })
  }

  return data
})
const isVerticalOverlay = computed(() => {
  return isMobile.value && appMode.value === 'overlay'
})
const canPinWindow = computed(() => {
  return appMode.value === 'overlay' && !!window.electronAPI?.toggleAlwaysOnTop
})

const workState = ref<WorkState>(fixWorkState())
const showAlarmMacroExportModal = ref(false)
const showAudioConfigModal = ref(false)
const idb = useIdb()
const customAudioUrl = ref<string>('')

const notifyModeOptions = computed(() => {
  return [
    {
      label: t('common.disable'),
      value: 'none'
    },
    {
      label: t('gather_clock.preference.mention_way.option.system_notice'),
      value: 'system_noti'
    },
    {
      label: t('gather_clock.preference.mention_way.option.sound'),
      value: 'audio'
    },
  ]
})
const itemSortOptions = computed(() => {
  return [
    {
      label: t('game.item_id'),
      value: 'itemId'
    },
    {
      label: t('gather_clock.preference.sort_by.option.gather_start_time'),
      value: 'gatherStartTimeAsc'
    },
    {
      label: t('common.remain_time'),
      value: 'remainingTimeAsc',
      description: t('gather_clock.remain_time.tooltip')
    },
  ]
})

watch(
  () => workState.value.pinWindow,
  (newVal, oldVal) => {
    if (canPinWindow.value) {
      if ((!oldVal && newVal) || (oldVal && !newVal)) {
        window.electronAPI!.toggleAlwaysOnTop()
      }
    }
  }
)

const alarmedET = ref<number>(0)
const alarmInterval = ref<number | undefined>(undefined)
onMounted(() => {
  if (alarmInterval.value === undefined) {
    alarmInterval.value = setInterval(() => {
      // 根据当前ET判断是否需要提醒
      // 浏览器性能限制，最小化之后执行间隔会变长，所以按ET的小时数来判断是否需要提醒
      const _CurrentET = currentET.value.hour
      if (
        _CurrentET !== alarmedET.value
        && workState.value.subscribedItems?.length
        && workState.value.notifyMode !== 'none'
      ) {
        const itemsNeedAlarm : ItemInfo[] = []
        workState.value.subscribedItems.forEach(itemId => {
          const itemInfo = getItemInfo(itemId)
          let needAlarm = false
          if (itemInfo.gatherInfo?.timeLimitInfo?.length) {
            itemInfo.gatherInfo.timeLimitInfo.forEach(timeLimitInfo => {
              needAlarm = needAlarm || Number(timeLimitInfo.start.split(':')[0]) === _CurrentET
            })
          }
          if (needAlarm) {
            itemsNeedAlarm.push(itemInfo)
          }
        })
        handleNotify(itemsNeedAlarm)
      }
      alarmedET.value = _CurrentET
    }, 500) // 页面最小化时，浏览器会把1s以上的间隔延长，导致错过ET更新
  }
})
onBeforeUnmount(() => {
  if (alarmInterval.value !== undefined) {
    clearInterval(alarmInterval.value)
  }
  if (customAudioUrl.value) {
    URL.revokeObjectURL(customAudioUrl.value)
  }
})

const handleCheckNotificationPermission = async () => {
  if (workState.value.notifyMode === 'system_noti') {
    if (!("Notification" in window)) {
      await alertError(t('gather_clock.message.system_notice_not_supported'))
    } else if (Notification.permission === 'denied') {
      await alertError(t('gather_clock.message.system_notice_denied'))
    } else if (Notification.permission !== 'granted') {
      await Notification.requestPermission()
    }
  }
}
const handleNotify = (itemsNeedAlarm: ItemInfo[]) => {
  if (!itemsNeedAlarm.length) return
  if (workState.value.notifyMode === 'system_noti') {
    new Notification(t('gather_clock.message.following_items_can_be_gathered'), {
      body: itemsNeedAlarm.map(item => {
        let text = `${getItemName(item)}: ${getJobName(XivJobs[item.gatherInfo.jobId])} | ${getPlaceName(item)} ${getItemGatherLocation(item)}`
        if (item.gatherInfo.recommAetheryte) {
          text += ' | ' + t('map.text.recomm_aetheryte') + ' - ' + item.gatherInfo.recommAetheryte?.[`name_${itemLanguage.value}`]
        }
        return text
      }).join('\n'),
      icon: itemsNeedAlarm[0].iconUrl
    })
  } else if (workState.value.notifyMode === 'audio') {
    playClockAudio()
  }

  async function playClockAudio() {
    if (workState.value.soundSelect === 'custom') {
      const audioBlob = await idb.gatherClockAudio.get()
      if (audioBlob) {
        if (customAudioUrl.value) {
          URL.revokeObjectURL(customAudioUrl.value)
        }
        customAudioUrl.value = URL.createObjectURL(audioBlob)
        playAudio(customAudioUrl.value)
        return
      }
    }
    playAudio('./audio/FFXIV_Incoming_Tell_2.mp3')
  }
}

const disable_workstate_cache = store.userConfig.disable_workstate_cache ?? false
if (!disable_workstate_cache) {
  const cachedWorkState = store.userConfig.gatherclock_cache_work_state
  if (cachedWorkState && JSON.stringify(cachedWorkState).length > 2) {
    workState.value = fixWorkState(cachedWorkState)
  }

  // todo - 留意性能：深度侦听需要遍历被侦听对象中的所有嵌套的属性，当用于大型数据结构时，开销很大
  watch(workState, async () => {
    if (workState.value) {
      try {
        await Promise.resolve()
        store.userConfig.gatherclock_cache_work_state = workState.value
        store.updateUserConfig()
      } catch (error) {
        console.error('Error handling workState change:', error)
      }
    } else {
      console.warn('workState or userConfig is not defined')
    }
  }, {deep: true})
}

const dealTimeLimit = (start: string, end: string) => {
  let progressStatus : 'info' | 'warning' | 'error' = 'info'
  let progressPercentage = 0
  let canGather = false
  let remainET = 99999
  let remainLT : string | undefined = undefined
  let ltClass = 'text-app-xs'
  let ltTitle = ''
  try {
    const parseTime = (time: string) => time.split(':').reduce((acc, val, idx) => acc + parseInt(val) * [60, 1][idx], 0)
    const s = parseTime(start)
    const e = parseTime(end)
    const c = currentET.value.hour * 60 + currentET.value.minute
    let ls = 0
    if (c >= s && c < e) {
      canGather = true
      progressPercentage = (c - s) / (e - s) * 100
      remainET = e - c
      ls = Math.floor(EorzeaTime.EorzeaMinute2LocalSecond(remainET))
      if (ls < 30) {
        ltClass += ' text-error'
      } else if (ls < 60) {
        ltClass += ' text-warning'
      }
      ltTitle = '剩余可采集时间'
    } else {
      progressPercentage = 0
      remainET = s - c
      if (remainET < 0) {
        remainET += 1440
      }
      ls = Math.floor(EorzeaTime.EorzeaMinute2LocalSecond(remainET))
      ltClass += ' text-sub'
      ltTitle = '距离变得可采集的剩余时间'
    }
    remainLT = t('common.remain_with_colon')
    if (ls >= 60) {
      remainLT += t('common.val_minutes', Math.floor(ls / 60))
    }
    remainLT += t('common.val_seconds', ls % 60)
  } catch (err) {
    console.error(err)
    progressStatus = 'error'; progressPercentage = 100
  }
  return {
    canGather: canGather,
    status: progressStatus,
    percentage: progressPercentage,
    remainLT, ltClass, ltTitle,
    remainET
  }
}

const handleSubscribeButtonClick = (itemInfo : ItemInfo) => {
  if (workState.value.subscribedItems.includes(itemInfo.id)) {
    workState.value.subscribedItems = workState.value.subscribedItems.filter(id => id !== itemInfo.id)
  } else {
    workState.value.subscribedItems.push(itemInfo.id)
  }
}
const handleStarButtonClick = (itemInfo : ItemInfo) => {
  if (workState.value.starItems.includes(itemInfo.id)) {
    workState.value.starItems = workState.value.starItems.filter(id => id !== itemInfo.id)
  } else {
    workState.value.starItems.push(itemInfo.id)
  }
}

const getQuickOperateOptions = () => {
  const starOptions = gatherData.value.filter(
    item => item.key !== 'stars' && item.items.length
  ).map(data => {
    const itemsAllStared = data.items.every(item => workState.value.starItems.includes(item.id))
    return {
      label: itemsAllStared ? t('gather_clock.text.un_star_with_item', data.title) : t('gather_clock.text.star_with_item', data.title),
      key: 'star-option-' + data.key,
      click: () => {
        if (itemsAllStared) {
          workState.value.starItems = workState.value.starItems.filter(id => !data.items.map(item => item.id).includes(id))
        } else {
          data.items.forEach(item => {
            if (!workState.value.starItems.includes(item.id)) {
              workState.value.starItems.push(item.id)
            }
          })
        }
      }
    }
  })
  const subscribeOptions = gatherData.value.filter(
    item => item.key !== 'subscribed' && item.items.length
  ).map(data => {
    const itemsAllAlarmed = data.items.every(item => workState.value.subscribedItems.includes(item.id))
    return {
      label: itemsAllAlarmed ? t('gather_clock.text.unsubscribe_with_item', data.title) : t('gather_clock.text.subscribe_with_item', data.title),
      key: 'subscribe-option-' + data.key,
      click: () => {
        if (itemsAllAlarmed) {
          workState.value.subscribedItems = workState.value.subscribedItems.filter(id => !data.items.map(item => item.id).includes(id))
        } else {
          data.items.forEach(item => {
            if (!workState.value.subscribedItems.includes(item.id)) {
              workState.value.subscribedItems.push(item.id)
            }
          })
        }
      }
    }
  })

  const optionUnstarAll = {
    label: t('gather_clock.text.un_star_all'),
    key: 'star-removeAll',
    disabled: workState.value.starItems.length === 0,
    click: () => {
      workState.value.starItems = []
    }
  }
  const optionUnsubscribeAll = {
    label: t('gather_clock.text.unsubscribe_all'),
    key: 'subscribe-removeAll',
    disabled: workState.value.subscribedItems.length === 0,
    click: () => {
      workState.value.subscribedItems = []
    }
  }

  const divider = {
    type: 'divider'
  }

  if (isMobile.value) {
    return [
      ...starOptions,
      optionUnstarAll,
      divider,
      ...subscribeOptions,
      optionUnsubscribeAll
    ]
  } else {
    return [
      {
        label: t('common.favorite.title'),
        key: 'group-star',
        children: [
          ...starOptions
        ]
      },
      optionUnstarAll,
      divider,
      {
        label: t('gather_clock.text.subscribe'),
        key: 'group-subscribe',
        children: [
          ...subscribeOptions
        ]
      },
      optionUnsubscribeAll
    ]
  }
}
const handleQuickOperateOptionSelect = (key: string | number, option: any) => {
  if (option?.click) {
    option.click()
  } else {
    console.warn(`Unknown key: ${key}`)
  }
}

const getSortedItems = (items: ItemInfo[]) => {
  switch (workState.value.orderBy) {
    case 'gatherStartTimeAsc': // 根据最小的开始时间增序排序
      return items.sort((a, b) => {
        let startA = 99, startB = 99
        a.gatherInfo.timeLimitInfo.forEach(limit => {
          startA = Math.min(startA, Number(limit.start.split(':')[0]))
        })
        b.gatherInfo.timeLimitInfo.forEach(limit => {
          startB = Math.min(startB, Number(limit.start.split(':')[0]))
        })
        if (workState.value.pinGatherableItems) {
          if (isItemGatherable(a)) startA -= 999
          if (isItemGatherable(b)) startB -= 999
        }
        return startA - startB
      })
    case 'remainingTimeAsc': // 根据剩余时间增序排序
      return items.sort((a, b) => {
        let aGatherable = false, bGatherable = false
        let aRemain = 99999, bRemain = 99999
        a.gatherInfo.timeLimitInfo.forEach(limit => {
          const dtResult = dealTimeLimit(limit.start, limit.end)
          if (dtResult.canGather) {
            aGatherable = true
            aRemain = dtResult.remainET
            return // 道具可采集时置顶
          } else {
            aRemain = Math.min(aRemain, dtResult.remainET)
          }
        })
        b.gatherInfo.timeLimitInfo.forEach(limit => {
          const dtResult = dealTimeLimit(limit.start, limit.end)
          if (dtResult.canGather) {
            bGatherable = true
            bRemain = dtResult.remainET
            return // 道具可采集时置顶
          } else {
            bRemain = Math.min(bRemain, dtResult.remainET)
          }
        })
        if (aGatherable) aRemain -= 99999
        if (bGatherable) bRemain -= 99999
        return aRemain - bRemain
      })
    default: // 默认为itemID增序排序
      return items.sort((a, b) => {
        if (workState.value.pinGatherableItems) {
          let _a = a.id, _b = b.id
          if (isItemGatherable(a)) _a -= 999
          if (isItemGatherable(b)) _b -= 999
          return _a - _b
        } else {
          return a.id - b.id
        }
      })
  }
  function isItemGatherable(item: ItemInfo) {
    let gatherable = false
    item.gatherInfo.timeLimitInfo.forEach(limit => {
      gatherable ||= dealTimeLimit(limit.start, limit.end).canGather
    })
    return gatherable
  }
}

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
const getItemGatherLocation = (itemInfo: ItemInfo) => {
  return t('item.text.quoted_position', { x: itemInfo.gatherInfo.posX.toFixed(1), y: itemInfo.gatherInfo.posY.toFixed(1) })
}

const handleShowAlarmMacroExportModal = () => {
  showAlarmMacroExportModal.value = true
}
</script>

<template>
  <div id="main-container">
    <RouterCard
      v-if="appMode !== 'overlay'"
      id="router-card"
      :page-name="t('common.appfunc.gather_clock')"
      :page-icon="AccessAlarmsOutlined"
    />
    <FoldableCard card-key="gatherclock-filter">
      <template #header>
        <i class="xiv sync-invert"></i>	
        <span class="card-title__text">{{ t('gather_clock.preference.title') }}</span>
      </template>

      <div class="query-form">
        <n-form
          :inline="!isMobile"
          :label-placement="isMobile ? 'left' : 'top'"
          :show-feedback="false"
          :style="{
            maxWidth: isMobile ? '100%' : 'fit-content'
          }"
        >
          <n-form-item :label="t('gather_clock.preference.pin_window')" v-show="canPinWindow">
            <n-switch v-model:value="workState.pinWindow" />
          </n-form-item>
          <n-form-item :label="t('gather_clock.preference.mention_way.title')" style="min-width: 150px;">
            <n-select v-model:value="workState.notifyMode" :options="notifyModeOptions" @update:value="handleCheckNotificationPermission" />
          </n-form-item>
          <n-form-item v-if="workState.notifyMode === 'audio'" :label="t('gather_clock.preference.custom_audio.title')">
            <n-button @click="showAudioConfigModal = true">{{ t('common.click_here') }}</n-button>
          </n-form-item>
          <n-form-item :label="t('gather_clock.preference.sort_by.title')" style="min-width: 200px;">
            <n-select v-model:value="workState.orderBy" :options="itemSortOptions" :render-option="optionsRenderer" />
          </n-form-item>
          <n-form-item :label="t('gather_clock.preference.pin_gatherable_items')">
            <n-switch v-model:value="workState.pinGatherableItems" />
          </n-form-item>
          <n-form-item :label="t('gather_clock.preference.disable_item_pop')">
            <n-switch v-model:value="workState.banItemPop" />
          </n-form-item>
          <n-form-item :label="t('gather_clock.preference.show_map')">
            <n-switch v-model:value="workState.showMap" />
          </n-form-item>
          <n-form-item :label="t('main.select_gear.quick_operate.title')">
            <n-dropdown
              placement="bottom-start"
              :options="getQuickOperateOptions()"
              @select="handleQuickOperateOptionSelect"
            >
              <n-button>{{ t('common.click_here_show_menu') }}</n-button>
            </n-dropdown>
          </n-form-item>
          <n-form-item :label="t('gather_clock.export_alarm_macro.title')">
            <n-button @click="handleShowAlarmMacroExportModal">{{ t('common.click_here') }}</n-button>
          </n-form-item>
        </n-form>
      </div>
    </FoldableCard>
    <n-card embedded :bordered="false" :class="store.userConfig.custom_background ? 'glasscard' : ''" :content-style="isVerticalOverlay ? 'padding: 1em 0.5em;' : undefined">
      <div class="title-actions">
        <n-button
          v-for="patch in gatherData"
          :key="patch.key"
          :type="workState.patch === patch.key ? 'primary' : undefined"
          :size="isVerticalOverlay ? 'tiny' : undefined"
          @click="workState.patch = patch.key"
        >
          <div class="tab-title">
            <span v-if="patch.key === 'stars'">
              <i class="xiv e05d"></i>
            </span>
            <span v-else-if="patch.key === 'subscribed'">
              <i class="xiv e05f"></i>
            </span>
            <span v-else-if="patch.key.includes('~690')">
              <i class="xiv collectables"></i>
            </span>
            <span v-else>
              <i class="xiv timer"></i>
            </span>
            <span>{{ patch.title }}</span>
          </div>
        </n-button>
      </div>
      <n-divider style="margin-top: 3px; margin-bottom: 12px;" :style="{
        marginTop: '3px',
        marginBottom: isVerticalOverlay ? '5px' : '12px'
      }" />
      <template
        v-for="patch in gatherData"
        :key="patch.key"
      >
        <n-el v-if="workState.patch === patch.key">
          <div v-if="!patch.items?.length" class="flex items-center justify-center w-full" :style="isMobile ? 'min-height: 300px;' : ''">
            <n-empty size="large" :description="t('gather_clock.text.no_items')" />
          </div>
          <n-grid cols="1 600:2 900:3 1200:4 1500:5 1900:6" :x-gap="5" :y-gap="5">
            <n-grid-item
              v-for="item in getSortedItems(patch.items)"
              :key="item.id"
            >
              <GatherItemCard
                :ban-item-pop="workState.banItemPop"
                :show-map="workState.showMap"
                :item="item"
                :subscribed-items="workState.subscribedItems"
                :star-items="workState.starItems"
                @on-star-button-click="handleStarButtonClick"
                @on-subscribe-button-click="handleSubscribeButtonClick"
              />
            </n-grid-item>
          </n-grid>
        </n-el>
      </template>
    </n-card>

    <ModalAlarmMacroExport
      v-model:show="showAlarmMacroExportModal"
      v-model:options="workState.alarmMacroOptions"
      :item-groups="gatherData"
    />

    <ModalAudioConfig
      v-model:show="showAudioConfigModal"
      v-model:sound-select="workState.soundSelect"
      v-model:custom-audio-name="workState.customAudioName"
    />

    <n-back-top />
  </div>
</template>

<style scoped>
/* All */
#main-container {
  max-width: 100%;
  gap: 0.6rem;
  display: flex;
  flex-direction: column;
}
.query-form {
  width: fit-content;
  border-radius: 5px;
  margin-bottom: 1rem;

  .n-form-item {
    border-radius: 5px;
    padding: 0.5rem 0.6rem;
    border: 1px solid transparent;
  }
}
.tab-title > *:not(:first-child) {
  margin-left: 3px;
}
.title-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 5px;
}

/* Desktop */
@media screen and (min-width: 768px) {
  .query-form .n-form-item:hover {
    border: 1px solid var(--n-color-target);
  }
}

/* Mobile */
@media screen and (max-width: 767px) {
  .query-form {
    width: 100%;
  }
}
</style>