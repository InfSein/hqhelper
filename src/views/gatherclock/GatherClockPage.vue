<script setup lang="ts">
import {
  AccessAlarmsOutlined,
  SearchRound,
} from '@vicons/material'
import RouterCard from '@/components/ui/RouterCard.vue'
import GatherItemCard from '@/views/gatherclock/components/GatherItemCard.vue'
import ModalAudioConfig from '@/views/gatherclock/components/ModalAudioConfig.vue'
import ModalAlarmMacroExport from '@/views/gatherclock/components/ModalAlarmMacroExport.vue'
import SearchOverlay from '@/components/app/SearchOverlay.vue'
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
import { useAppCore } from '@/composables/useAppCore'
import type { ItemGroup } from '@/types/item'
import {
  fixWorkState,
  type WorkState,
  _VAR_GATHERCLOCK_MAX_STARRED,
  _VAR_GATHERCLOCK_MAX_SUBSCRIBED,
} from '@/types/workstate/gatherclock'
import useIdb from '@/utils/app.idb'
import { getTimeLimitRemain } from '@/views/gatherclock/utils/dealTimeLimit'
import { sendBarkNotification } from '@/views/gatherclock/utils/bark'

const store = useStore()
const route = useRoute()
const router = useRouter()
const NAIVE_UI_MESSAGE = useMessage()
const { t } = useLocale()
const { appMode } = useAppMode()
const { alertError } = useDialog()
const { isMobile } = useResponsive()
const { currentET } = useEorzeaTime()
const { optionsRenderer } = useUiTools()
const { getLimitedGatherings } = useAppCore()
const {
  uiLanguage, itemLanguage,
} = useConfig()

const workState = ref<WorkState>(fixWorkState())
const starItems = computed(() => workState.value.starItems)
const subscribedItems = computed(() => workState.value.subscribedItems)
const starIdSet = computed(() => new Set(starItems.value))
const subscribedIdSet = computed(() => new Set(subscribedItems.value))

const showSearchOverlay = ref(false)
const highlightItemId = ref<number | null>(null)


const limitedGatheringsMap = computed(() => {
  // 依赖语言配置更新
  void itemLanguage.value
  void uiLanguage.value
  const limitedGatherings = getLimitedGatherings()
  const allItems : Record<number, ItemInfo> = {}
  for (const patch in limitedGatherings) {
    limitedGatherings[patch].forEach(itemInfo => {
      allItems[itemInfo.id] = itemInfo
    })
  }
  return {
    limitedGatherings,
    allItems,
  }
})

const gatherData = computed(() => {
  const { limitedGatherings, allItems } = limitedGatheringsMap.value
  const data : ItemGroup[] = []

  // 收藏的物品
  const stars : ItemInfo[] = []
  starItems.value.forEach(itemID => {
    if (allItems[itemID]) {
      stars.push(allItems[itemID])
    } else {
      console.warn(`物品 ${itemID} 在采集时钟数据集中不存在`)
    }
  })
  data.push({
    title: t('common.favorited'),
    key: 'stars',
    items: stars,
  })

  // 订阅的物品
  const subscribed : ItemInfo[] = []
  subscribedItems.value.forEach(itemID => {
    if (allItems[itemID]) {
      subscribed.push(allItems[itemID])
    } else {
      console.warn(`物品 ${itemID} 在采集时钟数据集中不存在`)
    }
  })
  data.push({
    title: t('gather_clock.text.subscribed'),
    key: 'subscribed',
    items: subscribed,
  })

  for (const key in limitedGatherings) {
    const [patch, il] = key.split('-')
    let title = ''
    if (il) {
      title = t('gather_clock.grouptitle_with_patch_and_il', {
        patch: patch,
        il: il,
      })
    } else {
      title = t('gather_clock.grouptitle_with_patch', {
        patch: patch,
      })
    }
    data.push({
      title: title,
      key: key,
      items: limitedGatherings[key],
    })
  }

  return data
})

const allGatherClockItems = computed(() => {
  return Object.values(limitedGatheringsMap.value.allItems)
})

/**
 * 选中对应选项卡并滚动高亮指定物品
 */
const locateItem = async (target: ItemInfo | number): Promise<boolean> => {
  const item = typeof target === 'number'
    ? limitedGatheringsMap.value.allItems[target]
    : target
  if (!item?.id) return false

  let targetTabKey = ''
  if (currentPatchGroup.value?.items.some(i => i.id === item.id)) {
    targetTabKey = workState.value.patch
  } else {
    const foundGroup = gatherData.value.find(
      g => g.key !== 'stars' && g.key !== 'subscribed' && g.items.some(i => i.id === item.id)
    )
    if (foundGroup) {
      targetTabKey = foundGroup.key
    }
  }

  if (targetTabKey && workState.value.patch !== targetTabKey) {
    workState.value.patch = targetTabKey
  }

  await nextTick()
  setTimeout(() => {
    const el = document.getElementById(`gather-item-card-${item.id}`) || document.querySelector(`[data-item-id="${item.id}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    highlightItemId.value = item.id
    setTimeout(() => {
      if (highlightItemId.value === item.id) {
        highlightItemId.value = null
      }
    }, 2000)
  }, 100)

  return true
}

const handleRouteItem = async () => {
  const itemParam = route.query.item
  if (!itemParam) return
  const itemId = Number(itemParam)
  if (itemId && !isNaN(itemId)) {
    const success = await locateItem(itemId)
    if (success) {
      const restQuery = { ...route.query }
      delete restQuery.item
      router.replace({ query: restQuery })
    }
  }
}

watch(() => route.query.item, handleRouteItem)
const isVerticalOverlay = computed(() => {
  return isMobile.value && appMode.value === 'overlay'
})
const canPinWindow = computed(() => {
  return appMode.value === 'overlay' && !!window.electronAPI?.toggleAlwaysOnTop
})

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
    {
      label: t('gather_clock.preference.mention_way.option.bark'),
      value: 'bark'
    },
  ]
})
const isTestingBark = ref(false)
const handleTestBark = async () => {
  if (!workState.value.barkUrl?.trim()) {
    NAIVE_UI_MESSAGE.warning(t('gather_clock.preference.bark.empty_url'))
    return
  }
  isTestingBark.value = true
  try {
    await sendBarkNotification(workState.value.barkUrl, {
      title: `HqHelper - ${t('common.appfunc.gather_clock')}`,
      body: t('gather_clock.preference.bark.test_message'),
      group: 'HqHelper',
    })
    NAIVE_UI_MESSAGE.success(t('gather_clock.preference.bark.test_success'))
  } catch (err: any) {
    NAIVE_UI_MESSAGE.error(t('gather_clock.preference.bark.test_failed', { err: err?.message || err }))
  } finally {
    isTestingBark.value = false
  }
}
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

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    showSearchOverlay.value = !showSearchOverlay.value
  }
}

const alarmedET = ref<number>(0)
const alarmInterval = ref<number | undefined>(undefined)
onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  handleRouteItem()
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
  window.removeEventListener('keydown', handleGlobalKeydown)
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
  } else if (workState.value.notifyMode === 'bark') {
    pushBarkNotification(itemsNeedAlarm)
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

  async function pushBarkNotification(items: ItemInfo[]) {
    if (!workState.value.barkUrl?.trim()) {
      console.warn('Bark URL is not configured')
      return
    }
    try {
      const bodyText = items.map(item => {
        let text = `${getItemName(item)}: ${getJobName(XivJobs[item.gatherInfo.jobId])} | ${getPlaceName(item)} ${getItemGatherLocation(item)}`
        if (item.gatherInfo.recommAetheryte) {
          text += ' | ' + t('map.text.recomm_aetheryte') + ' - ' + item.gatherInfo.recommAetheryte?.[`name_${itemLanguage.value}`]
        }
        return text
      }).join('\n')

      await sendBarkNotification(workState.value.barkUrl, {
        title: t('gather_clock.message.following_items_can_be_gathered'),
        body: bodyText,
        group: 'HqHelper',
        icon: items[0]?.iconUrl,
      })
    } catch (err) {
      console.error('Failed to send Bark notification:', err)
    }
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

// 响应外部（如右键菜单）对采集时钟收藏/订阅状态的修改
watch(
  () => [
    store.userConfig.gatherclock_cache_work_state?.starItems,
    store.userConfig.gatherclock_cache_work_state?.subscribedItems,
  ],
  () => {
    const storeState = store.userConfig.gatherclock_cache_work_state
    if (storeState) {
      if (storeState.starItems && JSON.stringify(workState.value.starItems) !== JSON.stringify(storeState.starItems)) {
        workState.value.starItems = [...storeState.starItems]
      }
      if (storeState.subscribedItems && JSON.stringify(workState.value.subscribedItems) !== JSON.stringify(storeState.subscribedItems)) {
        workState.value.subscribedItems = [...storeState.subscribedItems]
      }
    }
  },
  { deep: true }
)

const handleSubscribeButtonClick = (itemInfo : ItemInfo) => {
  if (workState.value.subscribedItems.includes(itemInfo.id)) {
    workState.value.subscribedItems = workState.value.subscribedItems.filter(id => id !== itemInfo.id)
  } else {
    if (workState.value.subscribedItems.length >= _VAR_GATHERCLOCK_MAX_SUBSCRIBED) {
      NAIVE_UI_MESSAGE.warning(t('gather_clock.message.subscribe_limit_reached', { max: _VAR_GATHERCLOCK_MAX_SUBSCRIBED }))
      return
    }
    workState.value.subscribedItems.push(itemInfo.id)
  }
}
const handleStarButtonClick = (itemInfo : ItemInfo) => {
  if (workState.value.starItems.includes(itemInfo.id)) {
    workState.value.starItems = workState.value.starItems.filter(id => id !== itemInfo.id)
  } else {
    if (workState.value.starItems.length >= _VAR_GATHERCLOCK_MAX_STARRED) {
      NAIVE_UI_MESSAGE.warning(t('gather_clock.message.star_limit_reached', { max: _VAR_GATHERCLOCK_MAX_STARRED }))
      return
    }
    workState.value.starItems.push(itemInfo.id)
  }
}

const quickOperateOptions = computed(() => {
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
          let hasExceeded = false
          data.items.forEach(item => {
            if (!workState.value.starItems.includes(item.id)) {
              if (workState.value.starItems.length < _VAR_GATHERCLOCK_MAX_STARRED) {
                workState.value.starItems.push(item.id)
              } else {
                hasExceeded = true
              }
            }
          })
          if (hasExceeded) {
            NAIVE_UI_MESSAGE.warning(t('gather_clock.message.star_limit_reached', { max: _VAR_GATHERCLOCK_MAX_STARRED }))
          }
        }
      },
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
          let hasExceeded = false
          data.items.forEach(item => {
            if (!workState.value.subscribedItems.includes(item.id)) {
              if (workState.value.subscribedItems.length < _VAR_GATHERCLOCK_MAX_SUBSCRIBED) {
                workState.value.subscribedItems.push(item.id)
              } else {
                hasExceeded = true
              }
            }
          })
          if (hasExceeded) {
            NAIVE_UI_MESSAGE.warning(t('gather_clock.message.subscribe_limit_reached', { max: _VAR_GATHERCLOCK_MAX_SUBSCRIBED }))
          }
        }
      },
    }
  })

  const optionUnstarAll = {
    label: t('gather_clock.text.un_star_all'),
    key: 'star-removeAll',
    disabled: workState.value.starItems.length === 0,
    click: () => {
      workState.value.starItems = []
    },
  }
  const optionUnsubscribeAll = {
    label: t('gather_clock.text.unsubscribe_all'),
    key: 'subscribe-removeAll',
    disabled: workState.value.subscribedItems.length === 0,
    click: () => {
      workState.value.subscribedItems = []
    },
  }

  const divider = {
    type: 'divider',
  }

  if (isMobile.value) {
    return [
      ...starOptions,
      optionUnstarAll,
      divider,
      ...subscribeOptions,
      optionUnsubscribeAll,
    ]
  } else {
    return [
      {
        label: t('common.favorite.title'),
        key: 'group-star',
        children: [
          ...starOptions,
        ],
      },
      optionUnstarAll,
      divider,
      {
        label: t('gather_clock.text.subscribe'),
        key: 'group-subscribe',
        children: [
          ...subscribeOptions,
        ],
      },
      optionUnsubscribeAll,
    ]
  }
})
const handleQuickOperateOptionSelect = (key: string | number, option: any) => {
  if (option?.click) {
    option.click()
  } else {
    console.warn(`Unknown key: ${key}`)
  }
}

const currentPatchGroup = computed(() => {
  return gatherData.value.find(patch => patch.key === workState.value.patch)
})

const currentETMinutes = computed(() => {
  return currentET.value.hour * 60 + currentET.value.minute
})

const sortedCurrentItems = computed(() => {
  const items = currentPatchGroup.value?.items
  if (!items || !items.length) return []

  const orderBy = workState.value.orderBy
  const pinGatherable = workState.value.pinGatherableItems
  const currentMinutes = currentETMinutes.value

  const isItemGatherable = (item: ItemInfo) => {
    return item.gatherInfo?.timeLimitInfo?.some(limit => {
      return getTimeLimitRemain(limit.start, limit.end, currentMinutes).canGather
    }) ?? false
  }

  // 浅拷贝避免就地修改数据源数组
  const list = items.slice()

  switch (orderBy) {
    case 'gatherStartTimeAsc': // 根据最小的开始时间增序排序
      return list.sort((a, b) => {
        let startA = 99
        let startB = 99
        a.gatherInfo.timeLimitInfo.forEach(limit => {
          startA = Math.min(startA, Number(limit.start.split(':')[0]))
        })
        b.gatherInfo.timeLimitInfo.forEach(limit => {
          startB = Math.min(startB, Number(limit.start.split(':')[0]))
        })
        if (pinGatherable) {
          if (isItemGatherable(a)) startA -= 999
          if (isItemGatherable(b)) startB -= 999
        }
        return startA - startB
      })
    case 'remainingTimeAsc': // 根据剩余时间增序排序
      return list.sort((a, b) => {
        let aGatherable = false
        let bGatherable = false
        let aRemain = 99999
        let bRemain = 99999
        a.gatherInfo.timeLimitInfo.forEach(limit => {
          const res = getTimeLimitRemain(limit.start, limit.end, currentMinutes)
          if (res.canGather) {
            aGatherable = true
            aRemain = res.remainET
            return // 道具可采集时置顶
          } else {
            aRemain = Math.min(aRemain, res.remainET)
          }
        })
        b.gatherInfo.timeLimitInfo.forEach(limit => {
          const res = getTimeLimitRemain(limit.start, limit.end, currentMinutes)
          if (res.canGather) {
            bGatherable = true
            bRemain = res.remainET
            return // 道具可采集时置顶
          } else {
            bRemain = Math.min(bRemain, res.remainET)
          }
        })
        if (aGatherable) aRemain -= 99999
        if (bGatherable) bRemain -= 99999
        return aRemain - bRemain
      })
    default: // 默认为itemID增序排序
      return list.sort((a, b) => {
        if (pinGatherable) {
          let _a = a.id
          let _b = b.id
          if (isItemGatherable(a)) _a -= 999
          if (isItemGatherable(b)) _b -= 999
          return _a - _b
        } else {
          return a.id - b.id
        }
      })
  }
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
          <n-form-item v-if="workState.notifyMode === 'bark'" :label="t('gather_clock.preference.bark.url_title')" style="min-width: 280px;">
            <n-input-group>
              <n-input
                v-model:value="workState.barkUrl"
                :placeholder="t('gather_clock.preference.bark.url_placeholder')"
                clearable
              />
              <n-button :loading="isTestingBark" @click="handleTestBark">
                {{ t('gather_clock.preference.bark.test_btn') }}
              </n-button>
            </n-input-group>
          </n-form-item>
          <n-form-item :label="t('gather_clock.preference.sort_by.title')" style="min-width: 200px;">
            <n-select v-model:value="workState.orderBy" :options="itemSortOptions" :render-option="optionsRenderer" />
          </n-form-item>
          <n-form-item v-if="workState.orderBy !== 'remainingTimeAsc'" :label="t('gather_clock.preference.pin_gatherable_items')">
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
              :options="quickOperateOptions"
              @select="handleQuickOperateOptionSelect"
            >
              <n-button>{{ t('common.click_here_show_menu') }}</n-button>
            </n-dropdown>
          </n-form-item>
          <n-form-item v-if="!isVerticalOverlay" :label="t('gather_clock.export_alarm_macro.title')">
            <n-button @click="handleShowAlarmMacroExportModal">{{ t('common.click_here') }}</n-button>
          </n-form-item>
        </n-form>
      </div>
    </FoldableCard>
    <n-card embedded :bordered="false" :class="store.userConfig.custom_background ? 'glasscard' : ''" :content-style="isVerticalOverlay ? 'padding: 1em 0.5em;' : undefined">
      <div class="flex flex-wrap items-center justify-between gap-2">
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
        <div class="shrink-0">
          <n-button
            :size="isVerticalOverlay ? 'tiny' : undefined"
            @click="showSearchOverlay = true"
          >
            <template #icon>
              <n-icon><SearchRound /></n-icon>
            </template>
            <span>{{ t('common.search') }}</span>
          </n-button>
        </div>
      </div>
      <n-divider style="margin-top: 3px; margin-bottom: 12px;" :style="{
        marginTop: '3px',
        marginBottom: isVerticalOverlay ? '5px' : '12px'
      }" />
      <n-el v-if="currentPatchGroup">
        <div v-if="!sortedCurrentItems.length" class="flex items-center justify-center w-full" :style="isMobile ? 'min-height: 300px;' : ''">
          <n-empty size="large" :description="t('gather_clock.text.no_items')" />
        </div>
        <n-grid cols="1 600:2 900:3 1200:4 1500:5 1900:6" :x-gap="5" :y-gap="5">
          <n-grid-item
            v-for="item in sortedCurrentItems"
            :key="item.id"
          >
            <GatherItemCard
              :ban-item-pop="workState.banItemPop"
              :show-map="workState.showMap"
              :item="item"
              :is-subscribed="subscribedIdSet.has(item.id)"
              :is-starred="starIdSet.has(item.id)"
              :highlight="highlightItemId === item.id"
              @on-star-button-click="handleStarButtonClick"
              @on-subscribe-button-click="handleSubscribeButtonClick"
            />
          </n-grid-item>
        </n-grid>
      </n-el>
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

    <SearchOverlay
      v-model:show="showSearchOverlay"
      :items="allGatherClockItems"
      :placeholder="t('gather_clock.search.placeholder')"
      :input-hint="t('gather_clock.search.input_hint')"
      :no-match-hint="t('gather_clock.search.no_match')"
      @select="locateItem"
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